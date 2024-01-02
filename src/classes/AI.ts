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
}

export class PlayerAI {
    pieces = players.black

    // Defensive move prediction
    #defPredict = (
        board: Board,
        col: string,
        idx: number,
        current: SelectedPiece
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
        const allAround = queenAI
            .getCaptureMoves(fantasyBoard, col, idx, queenAI)
            .filter(
                (move) =>
                    !queenAI?.isClogged(
                        fantasyBoard,
                        { col, idx },
                        {
                            col: getMoveCol(move),
                            idx: getMoveIdx(move),
                        }
                    )
            )

        // Locate enemy knights
        for (const column of columns) {
            for (const cell of fantasyBoard[column]) {
                if (cell instanceof Knight && cell?.id && cell?.player) {
                    allAround.push(column + fantasyBoard[column].indexOf(cell))
                }
            }
        }

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
            // Add the current enemy position and his capture move
            if (captureMoves.includes(col + idx))
                captures.push({
                    from: { col: thisCol, idx: thisIdx, piece: piece },
                    to: { col, idx, piece: current.piece },
                })
        }

        // Return enemies and their capture move
        return captures
    }

    // Ofensive move prediction
    #ofPredict = (
        board: Board,
        col: string,
        idx: number,
        current: SelectedPiece,
        enemy: SelectedPiece
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
        const allAround = queenAI
            .getCaptureMoves(fantasyBoard, col, idx, queenAI)
            .filter(
                (move) =>
                    !queenAI?.isClogged(
                        fantasyBoard,
                        { col, idx },
                        {
                            col: getMoveCol(move),
                            idx: getMoveIdx(move),
                        }
                    ) &&
                    // Exlude the current ally piece
                    move !== current.col + current.idx
            )

        // Locate ally knights
        for (const column of columns) {
            for (const cell of fantasyBoard[column]) {
                if (
                    cell instanceof Knight &&
                    cell?.id &&
                    !cell?.player &&
                    // Exlude the current ally piece if it is a knight
                    cell?.id !== current.piece.id
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
            if (captureMoves.includes(col + idx))
                captures.push({
                    from: { col: thisCol, idx: thisIdx, piece: piece },
                    to: { col, idx, piece: enemy.piece },
                })
        }

        // Return allies and their capture move
        return captures
    }

    // Qualify a move by the ally and enemy values
    #qualify = (a: number, b: number) => {
        // return a > b ? a / b : b / a
        return a * b
    }

    // Get prediction score
    #getPredictScore = (arr: Predict[]) => {
        return arr.length
            ? arr
                  .map(
                      (predict) =>
                          this.#qualify(
                              predict.from.piece.value,
                              predict.to.piece.value
                          ),
                      []
                  )
                  .reduce((a, b) => a + b, 0)
            : 0
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

                        const defPredict = this.#defPredict(
                            board,
                            col,
                            idx,
                            selected
                        ).sort(
                            (a, b) => a.from.piece.value - b.from.piece.value
                        )

                        const ofPredict = defPredict.length
                            ? this.#ofPredict(
                                  board,
                                  col,
                                  idx,
                                  selected,
                                  defPredict[0].from
                              )
                            : []

                        ranking.push({
                            selected,
                            move,
                            score: defPredict.length
                                ? -this.#getPredictScore(defPredict) +
                                  this.#getPredictScore(ofPredict)
                                : this.#qualify(
                                      (
                                          board[selected.col][
                                              selected.idx
                                          ] as ChessPieceType
                                      ).value,
                                      (board[col][idx] as ChessPieceType).value
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
                        .filter(
                            (move) =>
                                !selected.piece?.isClogged(board, selected, {
                                    col: getMoveCol(move),
                                    idx: getMoveIdx(move),
                                })
                        )
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

                            const defPredict = this.#defPredict(
                                board,
                                col,
                                idx,
                                selected
                            ).sort(
                                (a, b) =>
                                    a.from.piece.value - b.from.piece.value
                            )

                            const ofPredict = defPredict.length
                                ? this.#ofPredict(
                                      board,
                                      col,
                                      idx,
                                      selected,
                                      defPredict[0].from
                                  )
                                : []

                            ranking.push({
                                selected,
                                move,
                                score: defPredict.length
                                    ? -this.#getPredictScore(defPredict) +
                                      this.#getPredictScore(ofPredict)
                                    : this.#qualify(
                                          (
                                              board[selected.col][
                                                  selected.idx
                                              ] as ChessPieceType
                                          ).value,
                                          (board[col][idx] as ChessPieceType)
                                              .value
                                      ),
                            })
                        }
                    }
                    // Normal moves
                    if (moves.length) {
                        for (const move of moves) {
                            const col = getMoveCol(move)
                            const idx = getMoveIdx(move)

                            const defPredict = this.#defPredict(
                                board,
                                col,
                                idx,
                                selected
                            ).sort(
                                (a, b) =>
                                    a.from.piece.value - b.from.piece.value
                            )

                            ranking.push({
                                selected,
                                move,
                                score: defPredict.length
                                    ? -this.#getPredictScore(defPredict)
                                    : -1,
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
            console.log('SAFE MOVE')
            safeMoveAction()
        } else {
            console.log('MOVE')
            moveAction()
        }
    }
}
