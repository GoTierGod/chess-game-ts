import { SelectedPiece } from '../classes/AI'
import {
    ChessPieceType,
    King,
    Knight,
    PieceCoords,
    Queen,
} from '../classes/pieces'
import { Board, columns } from '../constants/board'

// Create an array of x null elements
export const range = (limit = 8): null[] => Array(limit).fill(null)

// Identify column in a move string
export const getMoveCol = (move: string) => {
    const col = move.match(/[a-z]/)

    if (!col) throw new Error(`Invalid move, no column match!`)
    return col[0]
}

// Identify index in a move string
export const getMoveIdx = (move: string) => {
    const idx = move.match(/\d/)

    if (!idx) throw new Error(`Invalid move, no index match!`)
    return Number(idx[0])
}

// Remove impossible moves (out of range indexes or NaN values)
export const removeImpossibles = (moves: string[]) =>
    moves
        .filter((m) => Boolean(m))
        .filter((m) => {
            const idx = m.match(/\d+/g)

            if (!idx) return false
            return 7 >= Number(idx[0])
        })

// Identify and return capture moves for a specific piece
export const captureMoves = (
    board: Board,
    col: string,
    idx: number,
    piece: ChessPieceType
): string[] => {
    const cm = piece
        .moves(col, idx)
        .filter(
            (move) =>
                !piece?.isClogged(
                    board,
                    { col: col, idx: idx },
                    {
                        col: getMoveCol(move),
                        idx: getMoveIdx(move),
                    }
                )
        )
        .filter((move) => {
            const col = getMoveCol(move)
            const idx = getMoveIdx(move)

            const thisPosition = board[col][idx]

            return (
                'player' in thisPosition && thisPosition.player !== piece.player
            )
        })

    return cm as string[]
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

export const isExposed = (
    board: Board,
    current: SelectedPiece,
    next: PieceCoords,
    player: boolean
) => {
    const fantasyBoard = (() => {
        const mirrorBoard = deepCopy(board)

        mirrorBoard[current.col][current.idx] = {}
        mirrorBoard[next.col][next.idx] = current.piece

        return mirrorBoard
    })()

    // Use a queen for convenience to identify all around enemies
    const queen = new Queen(player, 100)
    // All around enemy positions
    const allAround = queen.getCaptureMoves(fantasyBoard, next.col, next.idx)

    // Locate enemy knights
    for (const column of columns) {
        for (const cell of board[column]) {
            if (cell instanceof Knight && cell?.player !== player) {
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
        const captureMoves = piece.getCaptureMoves(
            fantasyBoard,
            thisCol,
            thisIdx
        )

        // If this enemy can capture at this coords, return true
        if (captureMoves.includes(next.col + next.idx)) return true
    }

    return false
}

export const exposedKing = (
    board: Board,
    player: boolean
): null | {
    king: SelectedPiece
    captures: SelectedPiece[]
    safes: string[]
} => {
    // Locate the player king
    const kingPosition = (() => {
        for (const column of columns) {
            for (const cell of board[column]) {
                if (cell instanceof King && cell.player === player) {
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
        const allAround = queenAI.getCaptureMoves(board, col, idx, queenAI)

        // Locate enemy knights
        for (const column of columns) {
            for (const cell of board[column]) {
                if (cell instanceof Knight && cell.player !== player) {
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
            const captureMoves = piece.getCaptureMoves(board, thisCol, thisIdx)

            // If this enemy can capture the AI piece
            // Add the current enemy position and his capture move
            if (captureMoves.includes(col + idx))
                captures.push({ col: thisCol, idx: thisIdx, piece: piece })
        }

        // King safe moves
        const king = board[col][idx] as ChessPieceType
        const kingMoves = king.moves(col, idx)
        const safeMoves = kingMoves
            .filter(
                (move) =>
                    !isExposed(
                        board,
                        { col: col, idx: idx, piece: king },
                        { col: getMoveCol(move), idx: getMoveIdx(move) },
                        player
                    )
            )
            .filter((move) => {
                const movePosition = board[getMoveCol(move)][getMoveIdx(move)]

                return (
                    ('player' in movePosition &&
                        movePosition.player !== player) ||
                    !('player' in movePosition)
                )
            })

        // Return necessary data
        if (captures.length)
            return {
                king: { col, idx, piece: king },
                captures,
                safes: safeMoves,
            }
    }

    return null
}
