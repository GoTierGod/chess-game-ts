import { SelectedPiece } from '../classes/AI'
import { ChessPieceType, PieceCoords, Queen } from '../classes/pieces'
import { Board, columns } from '../constants/board'

// Create an array of x null elements
export const range = (limit = 8): null[] => Array(limit).fill(null)

// Identify column in a move string
export const getMoveCol = (move: string) => {
    const col = move.match(/[a-z]/)

    if (!col) throw new Error(`Invalid move: No column match found!`)
    return col[0]
}

export const getMoveIdx = (move: string) => {
    const idx = move.match(/\d/)

    if (!idx) throw new Error(`Invalid move: No index match found!`)
    return Number(idx[0])
}

// Remove impossible moves (out of range indexes or NaN values)
export const removeImpossibles = (moves: string[]) =>
    moves.filter(Boolean).filter((m) => {
        const validMove = m.match(/[a-z]\d/i)
        const idx = m.match(/\d+/)

        if (!idx || !validMove || validMove[0] !== m) return false

        const numericIdx = Number(idx[0])
        return numericIdx >= 0 && numericIdx <= 7
    })

// Identify and return capture moves for a specific piece
export const captureMoves = (
    board: Board,
    current: PieceCoords,
    piece: ChessPieceType
): string[] => {
    const cm = piece
        .moves(current.col, current.idx)
        .filter(
            (move) =>
                !piece?.isClogged(board, current, {
                    col: getMoveCol(move),
                    idx: getMoveIdx(move),
                })
        )
        .filter((move) => {
            const col = getMoveCol(move)
            const idx = getMoveIdx(move)

            const thisPosition = board[col][idx]

            return thisPosition && thisPosition.player !== piece.player
        })

    return removeImpossibles(cm) as string[]
}

// Deep copy an array/object
export const deepCopy = <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') {
        return obj as T
    }

    if (Array.isArray(obj)) {
        return obj.map(deepCopy) as T
    }

    const copy = {} as T
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            copy[key] = deepCopy(obj[key])
        }
    }

    return copy
}

export const getAllPlayerMoves = (
    board: Board,
    player: boolean
): { piece: SelectedPiece; moves: string[] }[] => {
    const pieces: SelectedPiece[] = []

    for (const col of columns) {
        for (const cell of board[col]) {
            if (cell && cell.player === player) {
                pieces.push({
                    piece: cell,
                    col: col,
                    idx: board[col].indexOf(cell),
                })
            }
        }
    }

    const allMoves: { piece: SelectedPiece; moves: string[] }[] = []
    for (const piece of pieces) {
        const moves = [
            ...piece.piece.moves(piece.col, piece.idx),
            ...piece.piece.getCaptureMoves(board, {
                col: piece.col,
                idx: piece.idx,
            }),
        ]

        allMoves.push({
            piece: piece,
            moves: moves,
        })
    }

    return allMoves
}

// Detect if the next position will expose the a piece
export const isExposed = (
    board: Board,
    current: SelectedPiece,
    next: PieceCoords,
    player: boolean
) => {
    // Simulate the move of this piece
    const fantasyBoard = (() => {
        const mirrorBoard = deepCopy(board)

        mirrorBoard[current.col][current.idx] = null
        mirrorBoard[next.col][next.idx] = current.piece

        return mirrorBoard
    })()

    // Use a queen for convenience to identify all around enemies
    const queen = new Queen(player, 100)
    // All around enemy positions
    const allAround = queen.getCaptureMoves(fantasyBoard, {
        col: next.col,
        idx: next.idx,
    })

    // Locate enemy knights
    for (const column of columns) {
        for (const cell of board[column]) {
            if (cell && cell.player !== player && cell.name === 'Knight') {
                allAround.push(column + board[column].indexOf(cell))
            }
        }
    }
    // Loop through enemy positions
    for (const position of allAround) {
        const thisCol = getMoveCol(position)
        const thisIdx = getMoveIdx(position)

        // Identify capture moves for the enemy in this position
        const piece = fantasyBoard[thisCol][thisIdx] as ChessPieceType
        const captureMoves = piece.getCaptureMoves(fantasyBoard, {
            col: thisCol,
            idx: thisIdx,
        })

        // If this enemy can capture at this coords, return true
        if (captureMoves.includes(next.col + next.idx)) return true
    }

    return false
}

// Detect if a king is currently exposed
export const isKingExposed = (board: Board, player: boolean): boolean => {
    // Locate the player king
    const kingPosition = (() => {
        for (const column of columns) {
            for (const cell of board[column]) {
                if (cell && cell.player === player && cell.name === 'King') {
                    return { col: column, idx: board[column].indexOf(cell) }
                }
            }
        }
        return false
    })()

    if (kingPosition) {
        const [col, idx] = [kingPosition.col, kingPosition.idx]
        // Use a queen for convenience to identify all around enemies
        const queenAI = new Queen(player, 100)
        // All around enemy positions
        const allAround = queenAI.getCaptureMoves(board, { col, idx }, queenAI)

        // Locate enemy knights
        for (const column of columns) {
            for (const cell of board[column]) {
                if (cell && cell.player !== player && cell.name === 'Knight') {
                    allAround.push(column + board[column].indexOf(cell))
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
            const piece = board[thisCol][thisIdx] as ChessPieceType
            const captureMoves = piece.getCaptureMoves(board, {
                col: thisCol,
                idx: thisIdx,
            })

            // If this enemy can capture the AI piece
            // Add the current enemy position and his capture move
            if (captureMoves.includes(col + idx))
                captures.push({ col: thisCol, idx: thisIdx, piece: piece })
        }

        // Return necessary data
        if (captures.length) return true
    }

    return false
}

// Determine if the next move will expose your own king
export const isAutoExposing = (
    board: Board,
    current: SelectedPiece,
    next: PieceCoords
): boolean => {
    // Simulate the move of this piece
    const fantasyBoard = (() => {
        const mirrorBoard = deepCopy(board)

        mirrorBoard[current.col][current.idx] = null
        mirrorBoard[next.col][next.idx] = current.piece

        return mirrorBoard
    })()

    return isKingExposed(fantasyBoard, current.piece.player)
}

// Detect an exposed king and safes moves to escape
export const exposingData = (
    board: Board,
    player: boolean
): null | {
    king: SelectedPiece
    safes: { piece: SelectedPiece; moves: string[] }[]
} => {
    if (isKingExposed(board, player)) {
        const availables: { piece: SelectedPiece; moves: string[] }[] =
            getAllPlayerMoves(board, player)
        let king: SelectedPiece | null = null

        for (const col of columns) {
            for (const cell of board[col]) {
                if (cell && cell.player === player) {
                    if (cell.name === 'King')
                        king = {
                            piece: cell,
                            col: col,
                            idx: board[col].indexOf(cell),
                        }
                }
            }
        }

        const safes: { piece: SelectedPiece; moves: string[] }[] = []
        for (const available of availables) {
            safes.push({
                piece: available.piece,
                moves: available.moves
                    .filter(
                        (move) =>
                            !isAutoExposing(board, available.piece, {
                                col: getMoveCol(move),
                                idx: getMoveIdx(move),
                            })
                    )
                    .filter(
                        (move) =>
                            !available.piece.piece.isClogged(
                                board,
                                {
                                    col: available.piece.col,
                                    idx: available.piece.idx,
                                },
                                { col: getMoveCol(move), idx: getMoveIdx(move) }
                            )
                    ),
            })
        }

        if (king) return { king, safes }
        else throw new Error('King not found')
    }

    return null
}

// Detect a tie
export const isTied = (
    board: Board,
    player: boolean
): null | { piece: ChessPieceType; reason: string } => {
    let tied = true

    const pieces: SelectedPiece[] = []
    for (const col of columns) {
        for (let idx = 0; idx < board[col].length; idx++) {
            const cell = board[col][idx]
            if (cell && cell.player === player)
                pieces.push({ col, idx, piece: cell })
        }
    }

    for (const piece of pieces) {
        let moves = piece.piece
            .moves(piece.col, piece.idx)
            .filter(
                (move) =>
                    !piece.piece.isClogged(
                        board,
                        { col: piece.col, idx: piece.idx },
                        { col: getMoveCol(move), idx: getMoveIdx(move) }
                    )
            )

        if (piece.piece.name === 'King')
            moves = moves.filter((move) =>
                isExposed(
                    board,
                    piece,
                    { col: getMoveCol(move), idx: getMoveIdx(move) },
                    player
                )
            )

        if (moves.length) tied = false
    }

    if (tied)
        return {
            piece: pieces[pieces.length - 1].piece,
            reason: `The ${player ? 'Player' : 'AI'} has no legal moves`,
        }
    return null
}

// Count how many times a string is repeated in a list of strings
export const countIn = (arr: string[], target: string) => {
    let ct = 0

    arr.forEach((item) => item === target && ct++)

    return ct
}
