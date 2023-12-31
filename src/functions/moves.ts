import { columns } from '../constants/board'
import { range, removeImpossibles } from './utils'

// Given the current position
// Returns an array of possible diagonal moves
export const diagonal = (col: string, idx: number) =>
    removeImpossibles([
        ...range().map(
            (_v, i) => columns[columns.indexOf(col) + (i + 1)] + (idx + (i + 1))
        ),
        ...range().map(
            (_v, i) => columns[columns.indexOf(col) + (i + 1)] + (idx - (i + 1))
        ),
        ...range().map(
            (_v, i) => columns[columns.indexOf(col) - (i + 1)] + (idx + (i + 1))
        ),
        ...range().map(
            (_v, i) => columns[columns.indexOf(col) - (i + 1)] + (idx - (i + 1))
        ),
    ])

// Given the current position
// Returns an array of possible vertical moves
export const vertical = (col: string) =>
    removeImpossibles(range().map((_v, i) => col + (0 + i)))

// Given the current position
// Returns an array of possible horizontal moves
export const horizontal = (idx: number) =>
    removeImpossibles(range().map((_v, i) => columns[i] + idx))

// Given the current position
// Returns an array of possible around moves
export const around = (col: string, idx: number) =>
    removeImpossibles([
        col + (idx + 1),
        col + (idx - 1),
        columns[columns.indexOf(col) - 1] + idx,
        columns[columns.indexOf(col) + 1] + idx,
        columns[columns.indexOf(col) + 1] + (idx + 1),
        columns[columns.indexOf(col) - 1] + (idx + 1),
        columns[columns.indexOf(col) + 1] + (idx - 1),
        columns[columns.indexOf(col) - 1] + (idx - 1),
    ])
