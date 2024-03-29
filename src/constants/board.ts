import {
    Bishop,
    Queen,
    Knight,
    Pawn,
    King,
    Rook,
    ChessPieceType,
} from '../classes/pieces'

// Board columns
export const columns: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

// Player pieces
export const players = {
    white: {
        king: new King(true, 1),
        queen: new Queen(true, 2),
        Bishop1: new Bishop(true, 3),
        Bishop2: new Bishop(true, 4),
        knight1: new Knight(true, 5),
        knight2: new Knight(true, 6),
        Rook1: new Rook(true, 7),
        Rook2: new Rook(true, 8),
        pawn1: new Pawn(true, 9),
        pawn2: new Pawn(true, 10),
        pawn3: new Pawn(true, 11),
        pawn4: new Pawn(true, 12),
        pawn5: new Pawn(true, 13),
        pawn6: new Pawn(true, 14),
        pawn7: new Pawn(true, 15),
        pawn8: new Pawn(true, 16),
    },
    black: {
        king: new King(false, 17),
        queen: new Queen(false, 18),
        Bishop1: new Bishop(false, 19),
        Bishop2: new Bishop(false, 20),
        knight1: new Knight(false, 21),
        knight2: new Knight(false, 22),
        Rook1: new Rook(false, 23),
        Rook2: new Rook(false, 24),
        pawn1: new Pawn(false, 25),
        pawn2: new Pawn(false, 26),
        pawn3: new Pawn(false, 27),
        pawn4: new Pawn(false, 28),
        pawn5: new Pawn(false, 29),
        pawn6: new Pawn(false, 30),
        pawn7: new Pawn(false, 31),
        pawn8: new Pawn(false, 32),
    },
}

// Initial board
export const initialBoard: Board = {
    a: [
        players.white.Rook1,
        players.white.pawn1,
        null,
        null,
        null,
        null,
        players.black.pawn1,
        players.black.Rook1,
    ],
    b: [
        players.white.knight1,
        players.white.pawn2,
        null,
        null,
        null,
        null,
        players.black.pawn2,
        players.black.knight1,
    ],
    c: [
        players.white.Bishop1,
        players.white.pawn3,
        null,
        null,
        null,
        null,
        players.black.pawn3,
        players.black.Bishop1,
    ],
    d: [
        players.white.queen,
        players.white.pawn4,
        null,
        null,
        null,
        null,
        players.black.pawn4,
        players.black.queen,
    ],
    e: [
        players.white.king,
        players.white.pawn5,
        null,
        null,
        null,
        null,
        players.black.pawn5,
        players.black.king,
    ],
    f: [
        players.white.Bishop2,
        players.white.pawn6,
        null,
        null,
        null,
        null,
        players.black.pawn6,
        players.black.Bishop2,
    ],
    g: [
        players.white.knight2,
        players.white.pawn7,
        null,
        null,
        null,
        null,
        players.black.pawn7,
        players.black.knight2,
    ],
    h: [
        players.white.Rook2,
        players.white.pawn8,
        null,
        null,
        null,
        null,
        players.black.pawn8,
        players.black.Rook2,
    ],
}

export interface Board {
    [key: string]: (ChessPieceType | null)[]
}

// Modified board to check for certain conditions
// export const modifiedBoard: Board = {
//     a: [null, null, null, null, null, null, null, players.black.king],
//     b: [null, null, null, null, players.white.Rook1, null, null, null],
//     c: [null, null, null, null, null, null, null, players.white.king],
//     d: [null, null, null, null, null, null, players.white.pawn1, null],
//     e: [null, null, null, null, null, null, null, null],
//     f: [null, null, null, null, null, null, null, null],
//     g: [null, null, null, null, null, null, null, null],
//     h: [null, players.black.pawn1, null, null, null, null, null, null],
// }
