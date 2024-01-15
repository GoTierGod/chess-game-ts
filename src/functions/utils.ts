import { SelectedPiece } from '../classes/AI'
import { ChessPieceType, PieceCoords, Queen } from '../classes/pieces'
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
            const validMove = m.match(/[a-z]\d/i)
            const idx = m.match(/\d+/)

            if (!idx || (validMove && validMove[0] !== m)) return false
            return 7 >= Number(idx[0]) && validMove && validMove[0] === m
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

export const isExposed = (
    board: Board,
    current: SelectedPiece,
    next: PieceCoords,
    player: boolean
) => {
    const fantasyBoard = (() => {
        const mirrorBoard = deepCopy(board)

        mirrorBoard[current.col][current.idx] = null
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
        const allAround = queenAI.getCaptureMoves(board, col, idx, queenAI)

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
                    (movePosition && movePosition.player !== player) ||
                    !movePosition
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
            piece: pieces[0].piece,
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
