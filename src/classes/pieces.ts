import whitePawn from '../assets/white/pawn.svg'
import whiteKing from '../assets/white/king.svg'
import whiteQueen from '../assets/white/queen.svg'
import whiteBishop from '../assets/white/bishop.svg'
import whiteKnight from '../assets/white/knight.svg'
import whiteRook from '../assets/white/rook.svg'
import blackPawn from '../assets/black/pawn.svg'
import blackKing from '../assets/black/king.svg'
import blackQueen from '../assets/black/queen.svg'
import blackBishop from '../assets/black/bishop.svg'
import blackKnight from '../assets/black/knight.svg'
import blackRook from '../assets/black/rook.svg'

import { around, diagonal, horizontal, vertical } from '../functions/moves'
import { captureMoves, removeImpossibles } from '../functions/utils'
import {
    diagonalCollision,
    horizontalCollision,
    verticalCollision,
} from '../functions/collisions'
import { Board, columns } from '../constants/board'

interface PieceImage {
    src: string
    alt: string
}

export interface PieceCoords {
    col: string
    idx: number
}

abstract class ChessPiece {
    public player: boolean
    public color: 'White' | 'Black'
    public id: number

    constructor(player: boolean, id: number) {
        this.player = player
        this.color = player ? 'White' : 'Black'
        this.id = id
    }
}

export class Pawn extends ChessPiece {
    public name = 'Pawn'
    public value = 1
    public image: PieceImage

    constructor(player: boolean, id: number) {
        super(player, id)
        this.image = {
            src: player ? whitePawn : blackPawn,
            alt: this.color + this.name,
        }
    }

    moves = (col: string, idx: number) => {
        return this.player
            ? idx === 1
                ? removeImpossibles([col + (idx + 1), col + (idx + 2)])
                : removeImpossibles([col + (idx + 1)])
            : idx === 6
              ? removeImpossibles([col + (idx - 1), col + (idx - 2)])
              : removeImpossibles([col + (idx - 1)])
    }

    isClogged = (board: Board, current: PieceCoords, next: PieceCoords) => {
        // const currentPosition = board[current.col][current.idx]
        const nextPosition = board[next.col][next.idx]

        if ('player' in nextPosition && nextPosition.player === this.player)
            return true
        else if (next.col === current.col && 'id' in nextPosition) return true
        return this.player
            ? current.idx === next.idx - 2 &&
                  'id' in board[next.col][next.idx - 1]
            : current.idx === next.idx + 2 &&
                  'id' in board[next.col][next.idx + 1]
    }

    getCaptureMoves = (board: Board, col: string, idx: number) => {
        const cm = []
        const colIdx = columns.indexOf(col)

        const left = this.player
            ? board[columns[colIdx - 1]]?.[idx + 1]
            : board[columns[colIdx - 1]]?.[idx - 1]

        const right = this.player
            ? board[columns[colIdx + 1]]?.[idx + 1]
            : board[columns[colIdx + 1]]?.[idx - 1]

        if (left)
            'id' in left &&
                cm.push(
                    this.player
                        ? columns[colIdx - 1] + [idx + 1]
                        : columns[colIdx - 1] + [idx - 1]
                )
        if (right)
            'id' in right &&
                cm.push(
                    this.player
                        ? columns[colIdx + 1] + [idx + 1]
                        : columns[colIdx + 1] + [idx - 1]
                )

        return cm
    }
}

export class Queen extends ChessPiece {
    public name = 'Queen'
    public value = 10
    public image: PieceImage

    constructor(player: boolean, id: number) {
        super(player, id)
        this.image = {
            src: player ? whiteQueen : blackQueen,
            alt: this.color + this.name,
        }
    }

    moves = (col: string, idx: number) => {
        return [...vertical(col), ...horizontal(idx), ...diagonal(col, idx)]
    }

    isClogged = (board: Board, current: PieceCoords, next: PieceCoords) => {
        // const currentPosition = board[current.col][current.idx]
        const nextPosition = board[next.col][next.idx]

        return (
            verticalCollision(board, current, next) ||
            horizontalCollision(board, current, next) ||
            diagonalCollision(board, current, next) ||
            ('player' in nextPosition && nextPosition.player === this.player)
        )
    }

    getCaptureMoves = (board: Board, col: string, idx: number, piece = this) =>
        captureMoves(board, col, idx, piece)
}

export class King extends ChessPiece {
    public name = 'King'
    public value = 1000
    public image: PieceImage

    constructor(player: boolean, id: number) {
        super(player, id)
        this.image = {
            src: player ? whiteKing : blackKing,
            alt: this.color + this.name,
        }
    }

    moves = (col: string, idx: number) => {
        return around(col, idx)
    }

    isClogged = (board: Board, _current: PieceCoords, next: PieceCoords) => {
        // const currentPosition = board[current.col][current.idx]
        const nextPosition = board[next.col][next.idx]

        return 'player' in nextPosition && nextPosition.player === this.player
    }

    getCaptureMoves = (
        board: Board,
        col: string,
        idx: number,
        piece = this
    ) => {
        return captureMoves(board, col, idx, piece)
    }
}

export class Bishop extends ChessPiece {
    public name = 'Bishop'
    public value = 4
    public image: PieceImage

    constructor(player: boolean, id: number) {
        super(player, id)
        this.image = {
            src: player ? whiteBishop : blackBishop,
            alt: this.color + this.name,
        }
    }

    moves = (col: string, idx: number) => {
        return diagonal(col, idx)
    }

    isClogged = (board: Board, current: PieceCoords, next: PieceCoords) => {
        // const currentPosition = board[current.col][current.idx]
        const nextPosition = board[next.col][next.idx]

        return (
            diagonalCollision(board, current, next) ||
            ('player' in nextPosition && nextPosition.player === this.player)
        )
    }

    getCaptureMoves = (
        board: Board,
        col: string,
        idx: number,
        piece = this
    ) => {
        return captureMoves(board, col, idx, piece)
    }
}

export class Knight extends ChessPiece {
    public name = 'Knight'
    public value = 3
    public image: PieceImage

    constructor(player: boolean, id: number) {
        super(player, id)
        this.image = {
            src: player ? whiteKnight : blackKnight,
            alt: this.color + this.name,
        }
    }

    moves = (col: string, idx: number) => {
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

    isClogged = (board: Board, _current: PieceCoords, next: PieceCoords) => {
        // const currentPosition = board[current.col][current.idx]
        const nextPosition = board[next.col][next.idx]

        return 'player' in nextPosition && nextPosition.player === this.player
    }

    getCaptureMoves = (
        board: Board,
        col: string,
        idx: number,
        piece = this
    ) => {
        return captureMoves(board, col, idx, piece)
    }
}

export class Rook extends ChessPiece {
    public name = 'Rook'
    public value = 5
    public image: PieceImage

    constructor(player: boolean, id: number) {
        super(player, id)
        this.image = {
            src: player ? whiteRook : blackRook,
            alt: this.color + this.name,
        }
    }

    moves = (col: string, idx: number) => {
        return [...vertical(col), ...horizontal(idx)]
    }

    isClogged = (board: Board, current: PieceCoords, next: PieceCoords) => {
        // const currentPosition = board[current.col][current.idx]
        const nextPosition = board[next.col][next.idx]

        return (
            verticalCollision(board, current, next) ||
            horizontalCollision(board, current, next) ||
            ('player' in nextPosition && nextPosition.player === this.player)
        )
    }

    getCaptureMoves = (
        board: Board,
        col: string,
        idx: number,
        piece = this
    ) => {
        return captureMoves(board, col, idx, piece)
    }
}

export type ChessPieceType = Pawn | King | Queen | Bishop | Knight | Rook
