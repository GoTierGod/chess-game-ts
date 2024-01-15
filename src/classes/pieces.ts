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
    public name: 'King' | 'Queen' | 'Bishop' | 'Knight' | 'Rook' | 'Pawn' =
        'Pawn'
    public value = 1
    public image: PieceImage

    constructor(player: boolean, id: number) {
        super(player, id)
        this.image = {
            src: player ? whitePawn : blackPawn,
            alt: this.color + this.name,
        }
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
        // const currentPosition = board[current.col][current.idx]
        const nextPosition = board[next.col][next.idx]

        if (nextPosition && nextPosition.player === this.player) return true
        else if (next.col === current.col && nextPosition) return true
        return this.player
            ? current.idx === next.idx - 2 &&
                  Boolean(board[next.col][next.idx - 1])
            : current.idx === next.idx + 2 &&
                  Boolean(board[next.col][next.idx + 1])
    }

    getCaptureMoves = (board: Board, col: string, idx: number): string[] => {
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

        return removeImpossibles(
            cm.filter(
                (move) =>
                    !this.isClogged(
                        board,
                        { col, idx },
                        { col: getMoveCol(move), idx: getMoveIdx(move) }
                    )
            )
        )
    }
}

export class Queen extends ChessPiece {
    public name: 'King' | 'Queen' | 'Bishop' | 'Knight' | 'Rook' | 'Pawn' =
        'Queen'
    public value = 50
    public image: PieceImage

    constructor(player: boolean, id: number) {
        super(player, id)
        this.image = {
            src: player ? whiteQueen : blackQueen,
            alt: this.color + this.name,
        }
    }

    moves = (col: string, idx: number): string[] => {
        return [...vertical(col), ...horizontal(idx), ...diagonal(col, idx)]
    }

    isClogged = (
        board: Board,
        current: PieceCoords,
        next: PieceCoords
    ): boolean => {
        // const currentPosition = board[current.col][current.idx]
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
        col: string,
        idx: number,
        piece = this
    ): string[] => captureMoves(board, col, idx, piece)
}

export class King extends ChessPiece {
    public name: 'King' | 'Queen' | 'Bishop' | 'Knight' | 'Rook' | 'Pawn' =
        'King'
    public value = 1000
    public image: PieceImage

    constructor(player: boolean, id: number) {
        super(player, id)
        this.image = {
            src: player ? whiteKing : blackKing,
            alt: this.color + this.name,
        }
    }

    moves = (col: string, idx: number): string[] => {
        return around(col, idx)
    }

    isClogged = (
        board: Board,
        _current: PieceCoords,
        next: PieceCoords
    ): boolean => {
        // const currentPosition = board[current.col][current.idx]
        const nextPosition = board[next.col][next.idx]

        return Boolean(nextPosition && nextPosition.player === this.player)
    }

    getCaptureMoves = (
        board: Board,
        col: string,
        idx: number,
        piece = this
    ): string[] => {
        return captureMoves(board, col, idx, piece)
    }
}

export class Bishop extends ChessPiece {
    public name: 'King' | 'Queen' | 'Bishop' | 'Knight' | 'Rook' | 'Pawn' =
        'Bishop'
    public value = 4
    public image: PieceImage

    constructor(player: boolean, id: number) {
        super(player, id)
        this.image = {
            src: player ? whiteBishop : blackBishop,
            alt: this.color + this.name,
        }
    }

    moves = (col: string, idx: number): string[] => {
        return diagonal(col, idx)
    }

    isClogged = (
        board: Board,
        current: PieceCoords,
        next: PieceCoords
    ): boolean => {
        // const currentPosition = board[current.col][current.idx]
        const nextPosition = board[next.col][next.idx]

        return (
            diagonalCollision(board, current, next) ||
            Boolean(nextPosition && nextPosition.player === this.player)
        )
    }

    getCaptureMoves = (
        board: Board,
        col: string,
        idx: number,
        piece = this
    ): string[] => {
        return captureMoves(board, col, idx, piece)
    }
}

export class Knight extends ChessPiece {
    public name: 'King' | 'Queen' | 'Bishop' | 'Knight' | 'Rook' | 'Pawn' =
        'Knight'
    public value = 3
    public image: PieceImage

    constructor(player: boolean, id: number) {
        super(player, id)
        this.image = {
            src: player ? whiteKnight : blackKnight,
            alt: this.color + this.name,
        }
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
        // const currentPosition = board[current.col][current.idx]
        const nextPosition = board[next.col][next.idx]

        return Boolean(nextPosition && nextPosition.player === this.player)
    }

    getCaptureMoves = (
        board: Board,
        col: string,
        idx: number,
        piece = this
    ): string[] => {
        return captureMoves(board, col, idx, piece)
    }
}

export class Rook extends ChessPiece {
    public name: 'King' | 'Queen' | 'Bishop' | 'Knight' | 'Rook' | 'Pawn' =
        'Rook'
    public value = 5
    public image: PieceImage

    constructor(player: boolean, id: number) {
        super(player, id)
        this.image = {
            src: player ? whiteRook : blackRook,
            alt: this.color + this.name,
        }
    }

    moves = (col: string, idx: number): string[] => {
        return [...vertical(col), ...horizontal(idx)]
    }

    isClogged = (
        board: Board,
        current: PieceCoords,
        next: PieceCoords
    ): boolean => {
        // const currentPosition = board[current.col][current.idx]
        const nextPosition = board[next.col][next.idx]

        return (
            verticalCollision(board, current, next) ||
            horizontalCollision(board, current, next) ||
            Boolean(nextPosition && nextPosition.player === this.player)
        )
    }

    getCaptureMoves = (
        board: Board,
        col: string,
        idx: number,
        piece = this
    ): string[] => {
        return captureMoves(board, col, idx, piece)
    }
}

export type ChessPieceType = Pawn | King | Queen | Bishop | Knight | Rook
