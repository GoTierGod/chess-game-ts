import { players, columns, Board } from '../constants/board'
import { deepCopy, getMoveCol, getMoveIdx, isExposed } from '../functions/utils'
import { ChessPieceType, King, Knight, Queen } from './pieces'

export interface SelectedPiece {
    col: string
    idx: number
    piece: ChessPieceType
}

interface Predict {
    from: SelectedPiece
    to: SelectedPiece
    score: number
}

export class PlayerAI {
    pieces = players.black

    // Defensive move prediction
    #defPredict = (
        board: Board,
        col: string,
        idx: number,
        current: SelectedPiece,
        eaten: null | ChessPieceType
    ): Predict[] => {
        const fantasyBoard = (() => {
            const mirrorBoard = deepCopy(board)

            mirrorBoard[current.col][current.idx] = {}
            mirrorBoard[col][idx] = current.piece

            return mirrorBoard
        })()

        // Use a queen for convenience to identify all around enemies
        const queenAI = new Queen(false, 100)
        // All around enemy positions
        const allAround = queenAI.getCaptureMoves(
            fantasyBoard,
            col,
            idx,
            queenAI
        )

        // Enemies and their capture move
        const captures = []
        // Loop through enemy positions
        for (const position of allAround) {
            const thisCol = getMoveCol(position)
            const thisIdx = getMoveIdx(position)

            // Identify capture moves for the enemy in this position
            const piece = fantasyBoard[thisCol][thisIdx] as ChessPieceType
            const captureMoves = piece.getCaptureMoves(
                fantasyBoard,
                thisCol,
                thisIdx
            )

            // If this enemy can capture the AI piece
            if (captureMoves.includes(col + idx)) {
                // Defensive exposing predict
                const isExposing = this.#expPredict(fantasyBoard, col, idx, {
                    col: thisCol,
                    idx: thisIdx,
                    piece,
                })

                const eatenValue = eaten?.value || 0

                captures.push({
                    from: { col: thisCol, idx: thisIdx, piece: piece },
                    to: { col, idx, piece: current.piece },
                    score:
                        isExposing.exposing && !isExposing.exposed
                            ? -1000 + eatenValue
                            : eatenValue - current.piece.value,
                })
            }
        }

        // Return enemies and their capture move
        return captures
    }

    // Ofensive prediction
    #ofPredict = (
        board: Board,
        col: string,
        idx: number,
        current: SelectedPiece,
        eater: ChessPieceType
    ): Predict[] => {
        const fantasyBoard = (() => {
            const mirrorBoard = deepCopy(board)

            mirrorBoard[current.col][current.idx] = {}
            mirrorBoard[col][idx] = current.piece

            return mirrorBoard
        })()

        // Use a queen for convenience to identify all around allies
        const queenAI = new Queen(true, 100)
        // All around ally positions
        const allAround = queenAI.getCaptureMoves(
            fantasyBoard,
            col,
            idx,
            queenAI
        )

        // Locate ally knights
        for (const column of columns) {
            for (const cell of fantasyBoard[column]) {
                if (
                    cell instanceof Knight &&
                    !cell.player &&
                    cell.id !== current.piece.id
                ) {
                    allAround.push(column + fantasyBoard[column].indexOf(cell))
                }
            }
        }

        // Allies and their capture move
        const captures = []
        // Loop through ally positions
        for (const position of allAround) {
            const thisCol = getMoveCol(position)
            const thisIdx = getMoveIdx(position)

            // Identify capture moves for the ally in this position
            const piece = fantasyBoard[thisCol][thisIdx] as ChessPieceType
            let captureMoves = piece.getCaptureMoves(
                fantasyBoard,
                thisCol,
                thisIdx
            )

            if (piece instanceof King) {
                captureMoves = captureMoves.filter(
                    (move) =>
                        !isExposed(
                            board,
                            {
                                col: thisCol,
                                idx: thisIdx,
                                piece: piece,
                            },
                            {
                                col: getMoveCol(move),
                                idx: getMoveIdx(move),
                            },
                            false
                        )
                )
            }

            // If this ally can capture the AI piece
            // Add the current ally position and his capture move
            if (captureMoves.includes(col + idx)) {
                // Defensive exposing predict
                const isExposing = this.#expPredict(
                    fantasyBoard,
                    col,
                    idx,
                    current
                )

                const eaterValue = eater?.value || 0

                captures.push({
                    from: { col: thisCol, idx: thisIdx, piece: piece },
                    to: { col, idx, piece: eater },
                    score:
                        isExposing.exposing && !isExposing.exposed
                            ? 1000 - eaterValue
                            : -eaterValue + current.piece.value,
                })
            }
        }

        // Return allies and their capture move
        return captures
    }

    // Exposing predict
    // Detect if a piece will have an exposing move after its next move
    #expPredict = (
        board: Board,
        col: string,
        idx: number,
        current: SelectedPiece
    ): { exposing: boolean; exposed: boolean } => {
        const fantasyBoard = (() => {
            const mirrorBoard = deepCopy(board)

            mirrorBoard[current.col][current.idx] = {}
            mirrorBoard[col][idx] = current.piece

            return mirrorBoard
        })()

        const captureMoves = current.piece.getCaptureMoves(
            fantasyBoard,
            col,
            idx
        )

        for (const move of captureMoves) {
            const thisCol = getMoveCol(move)
            const thisIdx = getMoveIdx(move)

            const thisPosition = fantasyBoard[thisCol][thisIdx]
            if (
                'player' &&
                'name' in thisPosition &&
                thisPosition.player !== current.piece.player &&
                thisPosition.name === 'King'
            ) {
                const kingMoves = thisPosition.moves(thisCol, thisIdx).filter(
                    (move) =>
                        !isExposed(
                            fantasyBoard,
                            {
                                col: thisCol,
                                idx: thisIdx,
                                piece: thisPosition,
                            },
                            { col: getMoveCol(move), idx: getMoveIdx(move) },
                            thisPosition.player
                        )
                )

                return {
                    exposing: true,
                    exposed: kingMoves.includes(col + idx),
                }
            }
        }

        return { exposing: false, exposed: false }
    }

    #depthPredict = (
        board: Board,
        col: string,
        idx: number,
        selected: SelectedPiece,
        prevScore: null | number = null
    ) => {
        let score = prevScore || 0
        const eaten = board[col][idx]

        const defPredict = this.#defPredict(
            board,
            col,
            idx,
            selected,
            'id' in eaten ? eaten : null
        )
            // From lower to higher
            .sort((a, b) => a.from.piece.value - b.from.piece.value)

        const ofPredict = defPredict.length
            ? this.#ofPredict(
                  board,
                  col,
                  idx,
                  selected,
                  defPredict[0].from.piece
              )
                  // From higher to lower
                  .sort((a, b) => b.from.piece.value - a.from.piece.value)
            : []

        const scores = defPredict[0]?.score || 0 + ofPredict[0]?.score || 0
        const isExposing = this.#expPredict(board, col, idx, selected)
        if (isExposing.exposing && !isExposing.exposed) {
            score += 1000
            console.log('Exposing! ' + isExposing)
        }

        if (scores === 0) score += 'value' in eaten ? eaten.value : -1
        else score += scores

        const lastPredict = ofPredict[0]
        if (ofPredict[0])
            this.#depthPredict(
                board,
                lastPredict.to.col,
                lastPredict.to.idx,
                lastPredict.from,
                score
            )

        return score
    }

    // Perform a random action (move)
    randomAction = (
        safe: boolean,
        board: Board,
        exposed: null | {
            king: SelectedPiece
            captures: SelectedPiece[]
            safes: string[]
        },
        setBoard: React.Dispatch<React.SetStateAction<Board>>,
        setSelected: React.Dispatch<
            React.SetStateAction<{
                ele: HTMLDivElement
                col: string
                idx: number
                piece: ChessPieceType
            } | null>
        >,
        setTurn: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
        // Remaining AI (enemy) pieces on the board
        const remaining = columns
            .map((col) => {
                let ct = 0
                for (const square of board[col]) {
                    if ('player' in square && !square.player) ct++
                }
                return ct
            })
            .reduce((a, b) => a + b)
        // Moves ranking from best to worst
        const ranking: {
            selected: SelectedPiece
            move: string
            score: number
        }[] = []
        // List of blacklisted pieces IDs (pieces already checked by the algorithm)
        const blacklist: number[] = []

        // Safe move action
        const safeMoveAction = () => {
            if (exposed) {
                const selected = exposed.king
                const safeMoves = exposed.safes.sort((a, b) => {
                    const [colA, idxA] = [getMoveCol(a), getMoveIdx(a)]
                    const [colB, idxB] = [getMoveCol(b), getMoveIdx(b)]

                    const positionA = board[colA][idxA] as ChessPieceType
                    const positionB = board[colB][idxB] as ChessPieceType

                    if (positionA.value > positionB.value) return -1
                    else if (positionA.value < positionB.value) return 1
                    return 0
                })

                if (safeMoves.length) {
                    for (const move of safeMoves) {
                        const col = getMoveCol(move)
                        const idx = getMoveIdx(move)

                        ranking.push({
                            selected,
                            move,
                            score: this.#depthPredict(
                                board,
                                col,
                                idx,
                                selected
                            ),
                        })
                    }
                }

                if (ranking.length) {
                    ranking.sort((a, b) => b.score - a.score)

                    const bestRanked = ranking[0]
                    const col = getMoveCol(bestRanked.move)
                    const idx = getMoveIdx(bestRanked.move)

                    setBoard((prevBoard) => {
                        prevBoard[bestRanked.selected.col][
                            bestRanked.selected.idx
                        ] = {}
                        prevBoard[col][idx] = bestRanked.selected.piece
                        return prevBoard
                    })

                    setSelected(null)
                    setTurn(true)
                }
            }
        }

        // Move function
        const moveAction = () => {
            if (blacklist.length !== remaining) {
                // 1. Choose a piece
                const selectRandomPiece = (): SelectedPiece => {
                    const col =
                        columns[
                            Math.round(Math.random() * (columns.length - 1))
                        ]
                    const idx = Math.round(Math.random() * 7)
                    const current = board[col][idx]

                    if (
                        'player' in current &&
                        !current.player &&
                        !blacklist.includes(current?.id)
                    ) {
                        return {
                            col: col,
                            idx: idx,
                            piece: current,
                        }
                    } else return selectRandomPiece()
                }
                const selected: SelectedPiece = selectRandomPiece()

                if (selected) {
                    // 2. Identify valid standard moves
                    let moves = selected.piece
                        .moves(selected.col, selected.idx)
                        .filter(
                            (move) =>
                                !selected.piece?.isClogged(board, selected, {
                                    col: getMoveCol(move),
                                    idx: getMoveIdx(move),
                                })
                        )

                    if (selected.piece instanceof King) {
                        moves = moves.filter(
                            (move) =>
                                !isExposed(
                                    board,
                                    selected,
                                    {
                                        col: getMoveCol(move),
                                        idx: getMoveIdx(move),
                                    },
                                    false
                                )
                        )
                    }

                    //3. Identify capture moves
                    let capMoves = selected.piece
                        .getCaptureMoves(board, selected.col, selected.idx)
                        .sort((a, b) => {
                            const [colA, idxA] = [getMoveCol(a), getMoveIdx(a)]
                            const [colB, idxB] = [getMoveCol(b), getMoveIdx(b)]

                            const positionA = board[colA][
                                idxA
                            ] as ChessPieceType
                            const positionB = board[colB][
                                idxB
                            ] as ChessPieceType

                            if (positionA.value > positionB.value) return -1
                            else if (positionA.value < positionB.value) return 1
                            return 0
                        })

                    if (selected.piece instanceof King) {
                        capMoves = capMoves.filter(
                            (move) =>
                                !isExposed(
                                    board,
                                    selected,
                                    {
                                        col: getMoveCol(move),
                                        idx: getMoveIdx(move),
                                    },
                                    false
                                )
                        )
                    }

                    // 4. Rank moves
                    // Capture moves
                    if (capMoves.length) {
                        for (const move of capMoves) {
                            const col = getMoveCol(move)
                            const idx = getMoveIdx(move)

                            ranking.push({
                                selected,
                                move,
                                score: this.#depthPredict(
                                    board,
                                    col,
                                    idx,
                                    selected
                                ),
                            })
                        }
                    }
                    // Normal moves
                    if (moves.length) {
                        for (const move of moves) {
                            const col = getMoveCol(move)
                            const idx = getMoveIdx(move)

                            ranking.push({
                                selected,
                                move,
                                score: this.#depthPredict(
                                    board,
                                    col,
                                    idx,
                                    selected
                                ),
                            })
                        }
                    }

                    // 5. Blacklist the piece and try a different one
                    blacklist.push(selected.piece.id)
                    moveAction()
                }
            } else {
                // 6. Make the move with the highest score
                if (ranking.length) {
                    ranking.sort((a, b) => b.score - a.score)
                    console.log(ranking[0].score)
                    console.log(ranking)

                    const bestRanked = ranking[0]
                    const col = getMoveCol(bestRanked.move)
                    const idx = getMoveIdx(bestRanked.move)

                    setBoard((prevBoard) => {
                        prevBoard[bestRanked.selected.col][
                            bestRanked.selected.idx
                        ] = {}
                        prevBoard[col][idx] = bestRanked.selected.piece
                        return prevBoard
                    })

                    setSelected(null)
                    setTurn(true)
                }
            }
        }

        // Invoke the correct function
        if (safe) {
            safeMoveAction()
        } else {
            moveAction()
        }
    }
}
