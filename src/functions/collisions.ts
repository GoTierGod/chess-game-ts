import { PieceCoords } from '../classes/pieces'
import { Board, columns } from '../constants/board'
import { range } from './utils'

// Given the board, current position and next position
// This function returns true if the next move is vertically obstructed, and false otherwise
export const verticalCollision = (
    board: Board,
    current: PieceCoords,
    next: PieceCoords
) => {
    const currentIdx = Number(current.idx)
    const nextIdx = Number(next.idx)

    if (current.col === next.col && currentIdx !== nextIdx) {
        const lowerIdx = currentIdx < nextIdx ? currentIdx : nextIdx
        const higherIdx = currentIdx > nextIdx ? currentIdx : nextIdx

        const verticalRange = range()
            .slice(lowerIdx + 1, higherIdx)
            .map((_v, i) => i + lowerIdx + 1)

        for (const idx of verticalRange) {
            if ('id' in board[next.col][idx]) {
                // console.log('vertical')
                return true
            }
        }
        return false
    }
}

// Given the board, current position and next position
// This function returns true if the next move is horizontally obstructed, and false otherwise
export const horizontalCollision = (
    board: Board,
    current: PieceCoords,
    next: PieceCoords
) => {
    const currentIdx = Number(current.idx)
    const nextIdx = Number(next.idx)

    if (currentIdx === nextIdx && current.col !== next.col) {
        const currentColIdx = columns.indexOf(current.col)
        const nextColIdx = columns.indexOf(next.col)

        const horizontalRange =
            currentColIdx < nextColIdx
                ? columns.slice(currentColIdx + 1, nextColIdx)
                : columns.slice(nextColIdx + 1, currentColIdx)

        for (const col of horizontalRange) {
            if ('id' in board[col][next.idx]) {
                // console.log('horizontal')
                return true
            }
        }
        return false
    }
}

// Given the board, current position and next position
// This function returns true if the next move is obstructed diagonally, and false otherwise
export const diagonalCollision = (
    board: Board,
    current: PieceCoords,
    next: PieceCoords
) => {
    const currentIdx = Number(current.idx)
    const nextIdx = Number(next.idx)

    if (current.col !== next.col && currentIdx !== nextIdx) {
        const lowerIdx = currentIdx < nextIdx ? currentIdx : nextIdx
        const higherIdx = currentIdx > nextIdx ? currentIdx : nextIdx

        const verticalRange = range()
            .slice(lowerIdx + 1, higherIdx)
            .map((_v, i) => i + lowerIdx + 1)
            .sort((a, b) => (currentIdx < nextIdx ? a - b : b - a))

        const currentColIdx = columns.indexOf(current.col)
        const nextColIdx = columns.indexOf(next.col)

        const horizontalRange =
            currentColIdx < nextColIdx
                ? columns
                      .slice(currentColIdx + 1, nextColIdx)
                      .sort((a, b) =>
                          currentColIdx < nextColIdx
                              ? Number(a) - Number(b)
                              : b.localeCompare(a)
                      )
                : columns
                      .slice(nextColIdx + 1, currentColIdx)
                      .sort((a, b) =>
                          currentColIdx < nextColIdx
                              ? Number(a) - Number(b)
                              : b.localeCompare(a)
                      )

        for (let i = 0; i < verticalRange.length; i++) {
            if ('id' in board[horizontalRange[i]][verticalRange[i]]) {
                return true
            }
        }
        return false
    }
}
