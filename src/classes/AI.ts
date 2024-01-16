import { repetition } from '../App'
import { players, columns, Board } from '../constants/board'
import { deepCopy, getMoveCol, getMoveIdx, isExposed } from '../functions/utils'
import { ChessPieceType, PieceCoords, Queen } from './pieces'

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

    // Exposing predict
    // Detect if a piece will have an exposing move after its next move
    #expPredict = (
        board: Board,
        next: PieceCoords,
        current: SelectedPiece
    ): { exposing: boolean; exposed: boolean } => {
        const fantasyBoard = (() => {
            const mirrorBoard = deepCopy(board)

            mirrorBoard[current.col][current.idx] = null
            mirrorBoard[next.col][next.idx] = current.piece

            return mirrorBoard
        })()

        // Piece capture moves
        const captureMoves = current.piece.getCaptureMoves(fantasyBoard, next)

        // Loop through capture moves
        for (const move of captureMoves) {
            const thisCol = getMoveCol(move)
            const thisIdx = getMoveIdx(move)

            const thisPosition = fantasyBoard[thisCol][thisIdx]

            // If from this position the piece can expose the enemy king
            if (
                thisPosition &&
                thisPosition.player !== current.piece.player &&
                thisPosition.name === 'King'
            ) {
                // Enemy king moves
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
                    // The enemy king is exposed
                    exposing: true,
                    // Detect if the piece is exposed
                    exposed: kingMoves.includes(next.col + next.idx),
                }
            }
        }

        return {
            // The enemy king is not exposed
            exposing: false,
            // The piece is not exposed
            exposed: false,
        }
    }

    // Defensive move prediction
    #defPredict = (
        board: Board,
        next: PieceCoords,
        current: SelectedPiece,
        eaten: null | ChessPieceType
    ): Predict[] => {
        const fantasyBoard = (() => {
            const mirrorBoard = deepCopy(board)

            mirrorBoard[current.col][current.idx] = null
            mirrorBoard[next.col][next.idx] = current.piece

            return mirrorBoard
        })()

        // Use a queen for convenience to identify all around enemies
        const queenAI = new Queen(false, 100)
        // All around enemy positions
        const allAroundEnemies = queenAI.getCaptureMoves(
            fantasyBoard,
            next,
            queenAI
        )

        // Locate enemy knights
        for (const column of columns) {
            for (const cell of fantasyBoard[column]) {
                if (
                    cell &&
                    cell.player &&
                    cell.id !== eaten?.id &&
                    cell.name === 'Knight'
                ) {
                    allAroundEnemies.push(
                        column + fantasyBoard[column].indexOf(cell)
                    )
                }
            }
        }

        // Enemies and their capture move
        const captures = []
        // Loop through enemy positions
        for (const position of allAroundEnemies) {
            const thisCol = getMoveCol(position)
            const thisIdx = getMoveIdx(position)

            // Identify capture moves for the enemy in this position
            const enemyPiece = fantasyBoard[thisCol][thisIdx] as ChessPieceType
            let captureMoves = enemyPiece.getCaptureMoves(fantasyBoard, {
                col: thisCol,
                idx: thisIdx,
            })

            if (enemyPiece.name === 'King') {
                captureMoves = captureMoves.filter(
                    (move) =>
                        !isExposed(
                            board,
                            {
                                col: thisCol,
                                idx: thisIdx,
                                piece: enemyPiece,
                            },
                            {
                                col: getMoveCol(move),
                                idx: getMoveIdx(move),
                            },
                            true
                        )
                )
            }

            // If this enemy can capture the AI piece
            if (captureMoves.includes(next.col + next.idx)) {
                // Exposing predict
                const isExposing = this.#expPredict(fantasyBoard, next, {
                    col: thisCol,
                    idx: thisIdx,
                    piece: enemyPiece,
                })

                const eatenValue = eaten?.value || 0

                captures.push({
                    from: { col: thisCol, idx: thisIdx, piece: enemyPiece },
                    to: { col: next.col, idx: next.idx, piece: current.piece },
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

    // Offensive prediction
    #ofPredict = (
        board: Board,
        next: PieceCoords,
        current: SelectedPiece,
        eater: SelectedPiece
    ): Predict[] => {
        const fantasyBoard = (() => {
            const mirrorBoard = deepCopy(board)

            mirrorBoard[current.col][current.idx] = null
            mirrorBoard[eater.col][eater.idx] = null

            mirrorBoard[next.col][next.idx] = eater.piece

            return mirrorBoard
        })()

        // Use a queen for convenience to identify all around allies
        const queenAI = new Queen(true, 100)
        // All around ally positions
        const allAroundAllies = queenAI.getCaptureMoves(
            fantasyBoard,
            next,
            queenAI
        )

        // Locate ally knights
        for (const column of columns) {
            for (const cell of fantasyBoard[column]) {
                if (
                    cell &&
                    !cell.player &&
                    cell.id !== current.piece.id &&
                    cell.name === 'Knight'
                ) {
                    allAroundAllies.push(
                        column + fantasyBoard[column].indexOf(cell)
                    )
                }
            }
        }

        // Allies and their capture move
        const captures = []
        // Loop through ally positions
        for (const position of allAroundAllies) {
            const thisCol = getMoveCol(position)
            const thisIdx = getMoveIdx(position)

            // Identify capture moves for the ally in this position
            const allyPiece = fantasyBoard[thisCol][thisIdx] as ChessPieceType
            let captureMoves = allyPiece.getCaptureMoves(fantasyBoard, {
                col: thisCol,
                idx: thisIdx,
            })

            if (allyPiece.name === 'King') {
                captureMoves = captureMoves.filter(
                    (move) =>
                        !isExposed(
                            board,
                            {
                                col: thisCol,
                                idx: thisIdx,
                                piece: allyPiece,
                            },
                            {
                                col: getMoveCol(move),
                                idx: getMoveIdx(move),
                            },
                            false
                        )
                )
            }

            // If this ally can capture the player piece
            if (captureMoves.includes(next.col + next.idx)) {
                // Exposing predict
                const isExposing = this.#expPredict(fantasyBoard, next, current)

                const eaterValue = eater?.piece.value || 0

                captures.push({
                    from: { col: thisCol, idx: thisIdx, piece: allyPiece },
                    to: { col: next.col, idx: next.idx, piece: eater.piece },
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

    // Deep prediction alternating defensive and offensive predictions
    #deepPredict = (
        board: Board,
        next: PieceCoords,
        selected: SelectedPiece,
        prevScore: null | number = null,
        prevDeep: null | number = null
    ) => {
        let score = prevScore || 0
        let deep = prevDeep || 0
        const eaten = board[next.col][next.idx]

        const defPredict = this.#defPredict(board, next, selected, eaten)
            // From lower to higher (pessimistic expectation)
            .sort((a, b) => a.from.piece.value - b.from.piece.value)

        const ofPredict = defPredict.length
            ? this.#ofPredict(board, next, selected, defPredict[0].from)
                  // From higher to lower (optimistic expectation)
                  .sort((a, b) => b.from.piece.value - a.from.piece.value)
            : []
        const scores = (defPredict[0]?.score || 0) + (ofPredict[0]?.score || 0)
        const isExposing = this.#expPredict(board, next, selected)
        if (isExposing.exposing && !isExposing.exposed) score += 1000

        if (scores === 0) score += eaten ? eaten.value : -1
        else score += scores

        deep += 1

        const lastPredict = ofPredict[0]
        if (lastPredict && deep < 64) {
            this.#deepPredict(
                board,
                {
                    col: lastPredict.to.col,
                    idx: lastPredict.to.idx,
                },
                lastPredict.from,
                score,
                deep
            )
        }

        return score
    }

    // Perform a random move
    randomAction = (
        board: Board,
        coronation: SelectedPiece | null,
        repetition: { ai: repetition; player: repetition },
        safe: boolean,
        exposed: null | {
            king: SelectedPiece
            captures: SelectedPiece[]
            safes: string[]
        },
        setBoard: React.Dispatch<React.SetStateAction<Board>>,
        setTurnCount: React.Dispatch<React.SetStateAction<number>>,
        toCrown: (piece: 'Queen' | 'Bishop' | 'Knight' | 'Rook') => void,
        addRepetition: (
            piece: ChessPieceType,
            move: string,
            player: boolean
        ) => void
    ) => {
        // Remaining AI pieces on the board
        const remaining = columns
            .map((col) => {
                let ct = 0
                for (const square of board[col]) {
                    if (square && !square.player) ct++
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

                    const positionA = board[colA][idxA]
                    const positionB = board[colB][idxB]

                    if (positionA && positionB) {
                        if (positionA.value > positionB.value) return -1
                        else if (positionA.value < positionB.value) return 1
                    }
                    return 0
                })

                if (safeMoves.length) {
                    for (const move of safeMoves) {
                        const col = getMoveCol(move)
                        const idx = getMoveIdx(move)

                        ranking.push({
                            selected,
                            move,
                            score: this.#deepPredict(
                                board,
                                { col, idx },
                                selected
                            ),
                        })
                    }
                }

                if (ranking.length) {
                    ranking.sort((a, b) => b.score - a.score)
                    const avoidRepeat: string[] = []

                    if (
                        repetition.ai.piece?.id &&
                        repetition.ai.moves.length >= 2
                    ) {
                        const counters: { [key: string]: number } = {}

                        repetition.ai.moves.forEach(
                            (move) =>
                                (counters[move] = (counters[move] || 0) + 1)
                        )

                        for (const move of Object.keys(counters))
                            if (counters[move] === 2) {
                                avoidRepeat.push(move)
                            }
                    }

                    const avoidRepetition = () => {
                        if (
                            ranking[0].selected.piece.id ===
                                repetition.ai.piece?.id &&
                            avoidRepeat.includes(ranking[0].move)
                        ) {
                            if (ranking.length > 1) {
                                ranking.shift()
                                avoidRepetition()
                            }
                        }

                        return ranking[0]
                    }

                    const bestRanked = avoidRepetition()

                    const col = getMoveCol(bestRanked.move)
                    const idx = getMoveIdx(bestRanked.move)

                    addRepetition(
                        bestRanked.selected.piece,
                        bestRanked.move,
                        false
                    )

                    setBoard((prevBoard) => {
                        const newBoard = deepCopy(board)

                        newBoard[bestRanked.selected.col] = [
                            ...prevBoard[bestRanked.selected.col],
                        ]
                        newBoard[bestRanked.selected.col][
                            bestRanked.selected.idx
                        ] = null
                        newBoard[col][idx] = bestRanked.selected.piece

                        return newBoard
                    })
                }
            }
        }

        // Standard move action
        const moveAction = () => {
            if (blacklist.length < remaining) {
                const selectRandomPiece = (): SelectedPiece => {
                    const col =
                        columns[
                            Math.round(Math.random() * (columns.length - 1))
                        ]
                    const idx = Math.round(Math.random() * 7)
                    const current = board[col][idx]

                    if (
                        current &&
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
                    let moves = selected.piece
                        .moves(selected.col, selected.idx)
                        .filter(
                            (move) =>
                                !selected.piece?.isClogged(board, selected, {
                                    col: getMoveCol(move),
                                    idx: getMoveIdx(move),
                                })
                        )

                    if (selected.piece.name === 'King') {
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

                    let capMoves = selected.piece
                        .getCaptureMoves(board, {
                            col: selected.col,
                            idx: selected.idx,
                        })
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

                    if (selected.piece.name === 'King') {
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

                    if (capMoves.length) {
                        for (const move of capMoves) {
                            const col = getMoveCol(move)
                            const idx = getMoveIdx(move)

                            ranking.push({
                                selected,
                                move,
                                score: this.#deepPredict(
                                    board,
                                    { col, idx },
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
                                score: this.#deepPredict(
                                    board,
                                    { col, idx },
                                    selected
                                ),
                            })
                        }
                    }

                    blacklist.push(selected.piece.id)
                    moveAction()
                }
            } else {
                if (ranking.length) {
                    ranking.sort((a, b) => b.score - a.score)
                    const avoidRepeat: string[] = []

                    if (
                        repetition.ai.piece?.id &&
                        repetition.ai.moves.length >= 2
                    ) {
                        const counters: { [key: string]: number } = {}

                        repetition.ai.moves.forEach(
                            (move) =>
                                (counters[move] = (counters[move] || 0) + 1)
                        )

                        for (const move of Object.keys(counters))
                            if (counters[move] === 2) {
                                avoidRepeat.push(move)
                            }
                    }

                    const avoidRepetition = () => {
                        if (
                            ranking[0].selected.piece.id ===
                                repetition.ai.piece?.id &&
                            avoidRepeat.includes(ranking[0].move)
                        ) {
                            if (ranking.length > 1) {
                                ranking.shift()
                                avoidRepetition()
                            }
                        }

                        return ranking[0]
                    }

                    const bestRanked = avoidRepetition()

                    const col = getMoveCol(bestRanked.move)
                    const idx = getMoveIdx(bestRanked.move)

                    addRepetition(
                        bestRanked.selected.piece,
                        bestRanked.move,
                        false
                    )

                    setBoard((prevBoard) => {
                        const newBoard = deepCopy(board)

                        newBoard[bestRanked.selected.col] = [
                            ...prevBoard[bestRanked.selected.col],
                        ]
                        newBoard[bestRanked.selected.col][
                            bestRanked.selected.idx
                        ] = null
                        newBoard[col][idx] = bestRanked.selected.piece

                        return newBoard
                    })
                }
            }
        }

        if (safe) safeMoveAction()
        else moveAction()

        setTurnCount((prevTurnCount) => prevTurnCount + 1)

        if (coronation && !coronation.piece.player) {
            toCrown('Queen')
        }
    }
}
