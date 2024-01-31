import { around, diagonal, horizontal, vertical } from '../functions/moves'
import {
    captureMoves,
    getMoveCol,
    getMoveIdx,
    removeImpossibles,
} from '../functions/utils'
import {
    diagonalCollision,
    horizontalCollision,
    verticalCollision,
} from '../functions/collisions'
import { Board, columns } from '../constants/board'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
    faChessBishop,
    faChessKing,
    faChessKnight,
    faChessPawn,
    faChessQueen,
    faChessRook,
} from '@fortawesome/free-solid-svg-icons'

type PieceColor = 'White' | 'Black'
type PieceName = 'King' | 'Queen' | 'Bishop' | 'Knight' | 'Rook' | 'Pawn'

export interface PieceCoords {
    col: string
    idx: number
}

abstract class ChessPiece {
    public player: boolean
    public color: PieceColor
    public id: number

    constructor(player: boolean, id: number) {
        this.player = player
        this.color = player ? 'White' : 'Black'
        this.id = id
    }
}

export class Pawn extends ChessPiece {
    public name: PieceName = 'Pawn'
    public value = 1
    public icon: IconDefinition

    constructor(player: boolean, id: number) {
        super(player, id)
        this.icon = faChessPawn
    }

    moves = (col: string, idx: number): string[] => {
        return removeImpossibles(
            this.player
                ? idx === 1
                    ? [col + (idx + 1), col + (idx + 2)]
                    : [col + (idx + 1)]
                : idx === 6
                  ? [col + (idx - 1), col + (idx - 2)]
                  : [col + (idx - 1)]
        )
    }

    isClogged = (
        board: Board,
        current: PieceCoords,
        next: PieceCoords
    ): boolean => {
        const nextPosition = board[next.col][next.idx]

        if (nextPosition && nextPosition.player === this.player) return true
        else if (next.col === current.col && nextPosition) return true
        return this.player
            ? current.idx === next.idx - 2 &&
                  Boolean(board[next.col][next.idx - 1])
            : current.idx === next.idx + 2 &&
                  Boolean(board[next.col][next.idx + 1])
    }

    getCaptureMoves = (board: Board, current: PieceCoords): string[] => {
        const cm = []
        const colIdx = columns.indexOf(current.col)

        const left = this.player
            ? board[columns[colIdx - 1]]?.[current.idx + 1]
            : board[columns[colIdx - 1]]?.[current.idx - 1]

        const right = this.player
            ? board[columns[colIdx + 1]]?.[current.idx + 1]
            : board[columns[colIdx + 1]]?.[current.idx - 1]

        if (left)
            cm.push(
                this.player
                    ? columns[colIdx - 1] + (current.idx + 1)
                    : columns[colIdx - 1] + (current.idx - 1)
            )
        if (right)
            cm.push(
                this.player
                    ? columns[colIdx + 1] + (current.idx + 1)
                    : columns[colIdx + 1] + (current.idx - 1)
            )

        return removeImpossibles(
            cm.filter(
                (move) =>
                    !this.isClogged(board, current, {
                        col: getMoveCol(move),
                        idx: getMoveIdx(move),
                    })
            )
        )
    }
}

export class Queen extends ChessPiece {
    public name: PieceName = 'Queen'
    public value = 50
    public icon: IconDefinition

    constructor(player: boolean, id: number) {
        super(player, id)
        this.icon = faChessQueen
    }

    moves = (col: string, idx: number): string[] => {
        return [...vertical(col), ...horizontal(idx), ...diagonal(col, idx)]
    }

    isClogged = (
        board: Board,
        current: PieceCoords,
        next: PieceCoords
    ): boolean => {
        const nextPosition = board[next.col][next.idx]

        return (
            verticalCollision(board, current, next) ||
            horizontalCollision(board, current, next) ||
            diagonalCollision(board, current, next) ||
            Boolean(nextPosition && nextPosition.player === this.player)
        )
    }

    getCaptureMoves = (
        board: Board,
        current: PieceCoords,
        piece = this
    ): string[] => captureMoves(board, current, piece)
}

export class King extends ChessPiece {
    public name: PieceName = 'King'
    public value = 1000
    public icon: IconDefinition

    constructor(player: boolean, id: number) {
        super(player, id)
        this.icon = faChessKing
    }

    moves = (col: string, idx: number): string[] => {
        return around(col, idx)
    }

    isClogged = (
        board: Board,
        _current: PieceCoords,
        next: PieceCoords
    ): boolean => {
        const nextPosition = board[next.col][next.idx]

        return Boolean(nextPosition && nextPosition.player === this.player)
    }

    getCaptureMoves = (
        board: Board,
        current: PieceCoords,
        piece = this
    ): string[] => {
        return captureMoves(board, current, piece)
    }
}

export class Bishop extends ChessPiece {
    public name: PieceName = 'Bishop'
    public value = 4
    public icon: IconDefinition

    constructor(player: boolean, id: number) {
        super(player, id)
        this.icon = faChessBishop
    }

    moves = (col: string, idx: number): string[] => {
        return diagonal(col, idx)
    }

    isClogged = (
        board: Board,
        current: PieceCoords,
        next: PieceCoords
    ): boolean => {
        const nextPosition = board[next.col][next.idx]

        return (
            diagonalCollision(board, current, next) ||
            Boolean(nextPosition && nextPosition.player === this.player)
        )
    }

    getCaptureMoves = (
        board: Board,
        current: PieceCoords,
        piece = this
    ): string[] => {
        return captureMoves(board, current, piece)
    }
}

export class Knight extends ChessPiece {
    public name: PieceName = 'Knight'
    public value = 3
    public icon: IconDefinition

    constructor(player: boolean, id: number) {
        super(player, id)
        this.icon = faChessKnight
    }

    moves = (col: string, idx: number): string[] => {
        return removeImpossibles([
            columns[columns.indexOf(col) + 1] + (idx + 2),
            columns[columns.indexOf(col) + 1] + (idx - 2),
            columns[columns.indexOf(col) + 2] + (idx + 1),
            columns[columns.indexOf(col) + 2] + (idx - 1),
            columns[columns.indexOf(col) - 1] + (idx + 2),
            columns[columns.indexOf(col) - 1] + (idx - 2),
            columns[columns.indexOf(col) - 2] + (idx + 1),
            columns[columns.indexOf(col) - 2] + (idx - 1),
        ])
    }

    isClogged = (
        board: Board,
        _current: PieceCoords,
        next: PieceCoords
    ): boolean => {
        const nextPosition = board[next.col][next.idx]

        return Boolean(nextPosition && nextPosition.player === this.player)
    }

    getCaptureMoves = (
        board: Board,
        current: PieceCoords,
        piece = this
    ): string[] => {
        return captureMoves(board, current, piece)
    }
}

export class Rook extends ChessPiece {
    public name: PieceName = 'Rook'
    public value = 5
    public icon: IconDefinition

    constructor(player: boolean, id: number) {
        super(player, id)
        this.icon = faChessRook
    }

    moves = (col: string, idx: number): string[] => {
        return [...vertical(col), ...horizontal(idx)]
    }

    isClogged = (
        board: Board,
        current: PieceCoords,
        next: PieceCoords
    ): boolean => {
        const nextPosition = board[next.col][next.idx]

        return (
            verticalCollision(board, current, next) ||
            horizontalCollision(board, current, next) ||
            Boolean(nextPosition && nextPosition.player === this.player)
        )
    }

    getCaptureMoves = (
        board: Board,
        current: PieceCoords,
        piece = this
    ): string[] => {
        return captureMoves(board, current, piece)
    }
}

export type ChessPieceType = Pawn | King | Queen | Bishop | Knight | Rook
