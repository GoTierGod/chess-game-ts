import style from './App.module.css'

import { useEffect, useRef, useState } from 'react'
import { Board, columns, initialBoard } from './constants/board'
import { PlayerAI, SelectedPiece } from './classes/AI'
import {
    exposedKing,
    getMoveCol,
    getMoveIdx,
    isExposed,
} from './functions/utils'
import { ChessPieceType, King } from './classes/pieces'

const playerAI = new PlayerAI()

export default function PvAI() {
    // State that determines if player (true) or AI (false) won the game, otherwise it's set to "null"
    const [winner, setWinner] = useState(null as null | boolean)
    // State that represents the current board state, initially set to "initialBoard"
    const [board, setBoard] = useState(initialBoard as Board)
    // State that determines if is the player turn (true) or AI turn (false)
    const [turn, setTurn] = useState(true)
    // State that represents the chess piece selected by the player "{ele, col, idx, piece}"
    const [selected, setSelected] = useState(
        null as null | {
            ele: HTMLDivElement
            col: string
            idx: number
            piece: ChessPieceType
        }
    )
    // State that stores valid moves for the current selected piece
    const [validMoves, setValidMoves] = useState([] as string[])
    // State that determines if a king is exposed to an enemy capture move
    const [exposed, setExposed] = useState(
        false as
            | false
            | { king: King; captures: SelectedPiece[]; safes: string[] }
    )
    // Player king ref
    const playerKingRef = useRef(null as null | HTMLDivElement)

    // Main function for player actions
    const playerAction = (
        element: HTMLDivElement,
        col: string,
        idx: number,
        piece: object | ChessPieceType
    ) => {
        const nextPosition = board[col][idx]
        // Standard player turn
        if (turn && winner === null && !exposed) {
            // Standard player piece selection
            if ('player' in piece && piece.player) {
                setValidMoves([])

                setSelected((prevSelected) => {
                    if (prevSelected?.ele) {
                        prevSelected.ele.style.border = ''
                        prevSelected.ele.style.backgroundColor = ''
                    }

                    element.style.border = '2px solid var(--dark)'
                    element.style.backgroundColor = 'var(--gray)'

                    return {
                        ele: element,
                        col: col,
                        idx: idx,
                        piece: piece,
                    }
                })

                setValidMoves(
                    piece instanceof King
                        ? [
                              ...piece.moves(col, idx),
                              ...piece.getCaptureMoves(board, col, idx),
                          ]
                              .filter(
                                  (move) =>
                                      !isExposed(
                                          board,
                                          { col, idx, piece },
                                          {
                                              col: getMoveCol(move),
                                              idx: getMoveIdx(move),
                                          },
                                          true
                                      )
                              )
                              .filter(
                                  (move) =>
                                      !(
                                          board[getMoveCol(move)][
                                              getMoveIdx(move)
                                          ] as ChessPieceType
                                      ).player
                              )
                        : [
                              ...piece.moves(col, idx),
                              ...piece.getCaptureMoves(board, col, idx),
                          ].filter(
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
                )
            }
            // Standard player piece move
            else {
                if (
                    selected &&
                    (selected.piece instanceof King
                        ? !isExposed(
                              board,
                              {
                                  col: selected.col,
                                  idx: selected.idx,
                                  piece: selected.piece,
                              },
                              {
                                  col,
                                  idx,
                              },
                              true
                          ) &&
                          ('id' in nextPosition
                              ? nextPosition.player !== true
                              : true)
                        : selected.piece
                              .moves(selected.col, selected.idx)
                              .includes(col + idx) ||
                          selected.piece
                              .getCaptureMoves(
                                  board,
                                  selected.col,
                                  selected.idx
                              )
                              .includes(col + idx)) &&
                    !selected.piece?.isClogged(board, selected, {
                        col: col,
                        idx: idx,
                    })
                ) {
                    setBoard((prevBoard) => {
                        prevBoard[selected.col][selected.idx] = {}
                        prevBoard[col][idx] = selected.piece
                        return prevBoard
                    })

                    selected.ele.style.border = ''
                    selected.ele.style.backgroundColor = ''

                    setValidMoves([])
                    setSelected(null)
                    setTurn(false)
                }
            }
        }
        // Exposed king player turn
        else if (
            turn &&
            selected &&
            winner === null &&
            exposed &&
            exposed.king.player &&
            exposed.safes.length &&
            ('id' in nextPosition ? nextPosition.player !== true : true) &&
            validMoves.includes(col + idx)
        ) {
            setBoard((prevBoard) => {
                prevBoard[selected.col][selected.idx] = {}
                prevBoard[col][idx] = selected.piece
                return prevBoard
            })

            selected.ele.style.border = ''
            selected.ele.style.backgroundColor = ''

            setValidMoves([])
            setSelected(null)
            setTurn(false)
            setExposed(false)
        }
    }

    // Execute the AI turn
    useEffect(() => {
        if (!turn && !selected) {
            setTimeout(() => {
                playerAI.randomAction(board, setBoard, setSelected, setTurn)
            }, 150)
        }
    }, [turn, board, selected])

    // Detect player exposed king
    useEffect(() => {
        if (turn) {
            const ek = exposedKing(board, true)

            if (ek) setExposed(ek)
            else setExposed(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [turn])

    // Check if there's a winner
    useEffect(() => {
        if (exposed) if (!exposed.safes.length) setWinner(!exposed.king.player)
    }, [exposed])
    useEffect(() => {
        const playerKing = (() => {
            for (const column of columns) {
                for (const cell of board[column]) {
                    if (cell instanceof King && cell.id && cell.player) {
                        return true
                    }
                }
            }
            return false
        })()

        const AIKing = (() => {
            for (const column of columns) {
                for (const cell of board[column]) {
                    if (cell instanceof King && cell.id && !cell.player) {
                        return true
                    }
                }
            }
            return false
        })()

        if (!playerKing) setWinner(false)
        if (!AIKing) setWinner(true)
    }, [board])

    // Auto select the exposed king
    useEffect(() => {
        if (turn && exposed && exposed.king.player) {
            const kingPosition = (() => {
                for (const column of columns) {
                    for (const cell of board[column]) {
                        if (cell instanceof King && cell.id && cell.player) {
                            return {
                                col: column,
                                idx: board[column].indexOf(cell),
                            }
                        }
                    }
                }
                return false
            })()

            if (kingPosition) {
                const [col, idx] = [kingPosition.col, kingPosition.idx]
                const element = playerKingRef.current as HTMLDivElement
                const piece = board[col][idx] as ChessPieceType

                if (!selected) {
                    setSelected((prevSelected) => {
                        if (prevSelected?.ele) {
                            prevSelected.ele.style.border = ''
                            prevSelected.ele.style.backgroundColor = ''
                        }

                        element.style.border = '2px solid var(--dark)'
                        element.style.backgroundColor = 'var(--gray)'

                        return {
                            ele: element,
                            col: col,
                            idx: idx,
                            piece: piece,
                        }
                    })

                    setValidMoves(exposed.safes)
                }
            }
        }
    }, [board, turn, selected, exposed])

    // Log winner
    useEffect(() => {
        if (winner === true) console.log(`Player wins!`)
        else if (winner === false) console.log('AI wins!')
    }, [winner])

    return (
        <div className={style.wrapper}>
            <div className={style.board}>
                {Object.keys(board).map((col) => (
                    <div key={col} className={style.col}>
                        {board[col].map((cell, idx) => (
                            <div
                                key={idx}
                                className={style.cell}
                                onClick={(e) =>
                                    playerAction(
                                        e.currentTarget,
                                        col,
                                        idx,
                                        cell
                                    )
                                }
                                style={{ position: 'relative' }}
                                ref={
                                    cell instanceof King ? playerKingRef : null
                                }
                            >
                                <div
                                    style={
                                        exposed &&
                                        cell instanceof King &&
                                        cell.player
                                            ? {
                                                  position: 'absolute',
                                                  display: 'block',
                                                  width: '60%',
                                                  height: '60%',
                                                  backgroundColor:
                                                      'var(--green)',
                                                  border: '1px solid var(--gray)',
                                                  borderRadius: '2px',
                                                  transform: 'rotateZ(45deg)',
                                                  zIndex: '5',
                                              }
                                            : validMoves.includes(col + idx)
                                              ? {
                                                    position: 'absolute',
                                                    display: 'block',
                                                    width:
                                                        'id' in cell
                                                            ? '50%'
                                                            : '0.5rem',
                                                    height:
                                                        'id' in cell
                                                            ? '50%'
                                                            : '0.5rem',
                                                    backgroundColor:
                                                        'transparent',
                                                    border:
                                                        'id' in cell
                                                            ? '3px solid var(--green)'
                                                            : '2px solid var(--gray)',
                                                    borderRadius:
                                                        'id' in cell
                                                            ? '2px'
                                                            : '1px',
                                                    outline:
                                                        'id' in cell
                                                            ? '1px solid var(--gray)'
                                                            : 'none',
                                                    transform: 'rotateZ(45deg)',
                                                    zIndex: '5',
                                                }
                                              : { display: 'none' }
                                    }
                                >
                                    <div
                                        style={
                                            'id' in cell
                                                ? {
                                                      display: 'block',
                                                      height: '100%',
                                                      width: '100%',
                                                      border: '1px solid var(--gray)',
                                                      background: 'transparent',
                                                  }
                                                : { display: 'none' }
                                        }
                                    />
                                </div>
                                {'id' in cell && (
                                    <img
                                        src={cell.image.src}
                                        alt={cell.image.alt}
                                        style={{ zIndex: '10' }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
