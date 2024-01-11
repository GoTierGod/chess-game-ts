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
import {
    Bishop,
    ChessPieceType,
    King,
    Knight,
    Pawn,
    PieceCoords,
    Queen,
    Rook,
} from './classes/pieces'
import {
    availableMoveStyle,
    exposedKingStyle,
    exposedPieceStyle,
    innerAvailableMoveStyle,
} from './constants/styles'

import playerQueenImg from './assets/white/queen.svg'
import playerBishopImg from './assets/white/bishop.svg'
import playerKnightImg from './assets/white/knight.svg'
import playerRookImg from './assets/white/rook.svg'
import winnersCupImg from './assets/others/trophy-svgrepo-com.svg'
import timesImg from './assets/others/times-svgrepo-com.svg'
import handshakeImg from './assets/others/hand-shake-svgrepo-com.svg'

const loserIcon = (
    <div style={{ position: 'relative' }}>
        <img
            src={winnersCupImg}
            alt="Winner's Cup"
            style={{ position: 'relative', left: '-5%', top: '0' }}
        />
        <img
            src={timesImg}
            alt='Denegated'
            style={{
                position: 'absolute',
                left: '15%',
                top: '0',
                height: '3rem',
                width: 'Auto',
            }}
        />
    </div>
)
const tiedIcon = <img src={handshakeImg} alt='Tied' />
const winnerIcon = <img src={winnersCupImg} alt="Winner's Cup" />

const playerAI = new PlayerAI()

export default function PvAI() {
    const [coronation, setCoronation] = useState(null as null | SelectedPiece)
    // State that determines if player (true) or AI (false) won the game, otherwise it's set to "null"
    const [winner, setWinner] = useState(null as null | boolean)
    // State that determines if there's a tie
    const [tie, setTie] = useState(false)
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
        null as null | {
            king: SelectedPiece
            captures: SelectedPiece[]
            safes: string[]
        }
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
        if (
            turn &&
            winner === null &&
            (!exposed || !exposed.king.piece.player)
        ) {
            // Standard player piece selection
            if ('player' in piece && piece.player) {
                setValidMoves([])

                setSelected((prevSelected) => {
                    if (prevSelected !== null) {
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
            exposed.king.piece.player &&
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
            setExposed(null)
        }
    }

    const executeAI = (
        safe: boolean,
        exposed: {
            king: SelectedPiece
            captures: SelectedPiece[]
            safes: string[]
        } | null
    ) => {
        if (!turn && !selected && winner === null) {
            setTimeout(() => {
                playerAI.randomAction(
                    safe,
                    board,
                    exposed,
                    setBoard,
                    setSelected,
                    setTurn,
                    setTie,
                    winner
                )
            }, 150)
        }
    }

    // Detect exposed king
    useEffect(() => {
        const ekPlayer = exposedKing(board, true)
        const ekAi = exposedKing(board, false)

        if (ekPlayer) {
            setExposed(ekPlayer)
            executeAI(false, ekPlayer)
        } else if (ekAi) {
            setExposed(ekAi)
            executeAI(true, ekAi)
        } else {
            setExposed(null)
            executeAI(false, ekPlayer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [turn])

    // Detect player tie
    useEffect(() => {
        let isTied = true

        const playerPieces: SelectedPiece[] = []
        for (const col of columns) {
            for (let idx = 0; idx < col.length; idx++) {
                const cell = board[col][idx]
                if ('player' in cell && cell.player)
                    playerPieces.push({ col, idx, piece: cell })
            }
        }

        for (const piece of playerPieces) {
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
                        true
                    )
                )

            if (moves.length) isTied = false
        }

        isTied && setTie(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [turn])

    // Check if there's a winner
    useEffect(() => {
        if (exposed)
            if (!exposed.safes.length) setWinner(!exposed.king.piece.player)
    }, [exposed])

    // Auto select the player exposed king
    useEffect(() => {
        if (turn && exposed && exposed.king.piece.player) {
            const kingPosition: PieceCoords | null = (() => {
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

                return null
            })()

            if (kingPosition) {
                const [col, idx] = [kingPosition.col, kingPosition.idx]
                const element = playerKingRef.current as HTMLDivElement
                const piece = board[col][idx] as ChessPieceType

                if (!selected) {
                    setSelected((prevSelected) => {
                        if (prevSelected !== null) {
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

    useEffect(() => {
        for (const col of columns) {
            for (let idx = 0; idx < board[col].length; idx++) {
                const current = board[col][idx]
                if (current instanceof Pawn && current.player && idx === 7) {
                    setCoronation({ col, idx, piece: current })
                    console.log('Player coronation')
                }
            }
        }

        for (const col of columns) {
            for (let idx = 0; idx < board[col].length; idx++) {
                const current = board[col][idx]
                if (current instanceof Pawn && !current.player && idx === 0) {
                    setCoronation({ col, idx, piece: current })
                    console.log('AI coronation')
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [turn])

    const toCrown = (piece: 'Queen' | 'Bishop' | 'Knight' | 'Rook') => {
        if (coronation) {
            let newPiece: null | ChessPieceType = null

            switch (piece) {
                case 'Queen':
                    newPiece = new Queen(true, coronation.piece.id)
                    break

                case 'Bishop':
                    newPiece = new Bishop(true, coronation.piece.id)
                    break

                case 'Knight':
                    newPiece = new Knight(true, coronation.piece.id)
                    break

                case 'Rook':
                    newPiece = new Rook(true, coronation.piece.id)
                    break

                default:
                    break
            }

            if (newPiece) {
                setBoard((prevBoard) => {
                    prevBoard[coronation.col][coronation.idx] =
                        newPiece as ChessPieceType
                    return prevBoard
                })
            }
        }

        setCoronation(null)
    }

    const resetBoard = () => location.reload()

    // Log winner
    // useEffect(() => {
    //     if (winner === true) console.log(`Player wins!`)
    //     else if (winner === false) console.log('AI wins!')
    // }, [winner])

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
                                    cell instanceof King && cell.player
                                        ? playerKingRef
                                        : null
                                }
                            >
                                <div
                                    style={
                                        exposed &&
                                        exposed.king.piece.player &&
                                        cell instanceof King &&
                                        cell.player
                                            ? exposedKingStyle
                                            : validMoves.includes(col + idx)
                                              ? 'id' in cell
                                                  ? exposedPieceStyle
                                                  : availableMoveStyle
                                              : { display: 'none' }
                                    }
                                >
                                    <div
                                        style={
                                            'id' in cell
                                                ? innerAvailableMoveStyle
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
            {(coronation || winner || tie) && (
                <div className={style.modal}>
                    {(winner || tie) && (
                        <article className={style.winning}>
                            <header>
                                <h4>
                                    {winner
                                        ? 'Player Wins!'
                                        : winner === false
                                          ? 'AI wins!'
                                          : tie && 'AI and Player tied!'}
                                </h4>
                            </header>
                            {winner
                                ? winnerIcon
                                : winner === false
                                  ? loserIcon
                                  : tie && tiedIcon}
                            <button onClick={resetBoard}>Try Again</button>
                        </article>
                    )}
                    {coronation && (
                        <article className={style.coronation}>
                            <header>
                                <h4>Coronation</h4>
                                <p>Change your pawn for any of these</p>
                            </header>
                            <div>
                                <button onClick={() => toCrown('Queen')}>
                                    <img src={playerQueenImg} alt='Queen' />
                                </button>
                                <button onClick={() => toCrown('Bishop')}>
                                    <img src={playerBishopImg} alt='Bishop' />
                                </button>
                                <button onClick={() => toCrown('Knight')}>
                                    <img src={playerKnightImg} alt='Knight' />
                                </button>
                                <button onClick={() => toCrown('Rook')}>
                                    <img src={playerRookImg} alt='Rook' />
                                </button>
                            </div>
                        </article>
                    )}
                </div>
            )}
        </div>
    )
}
