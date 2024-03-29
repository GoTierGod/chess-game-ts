import style from './App.module.css'

import { useEffect, useRef, useState } from 'react'
import { Board, columns, initialBoard } from './constants/board'
import { PlayerAI, SelectedPiece } from './classes/AI'
import {
    deepCopy,
    getMoveCol,
    getMoveIdx,
    isAutoExposing,
    isExposed,
    isTied,
    exposingData,
    countIn,
    formatTime,
    countRemainingPieces,
} from './functions/utils'
import { Bishop, ChessPieceType, Knight, Queen, Rook } from './classes/pieces'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faBrain,
    faChessBishop,
    faChessKnight,
    faChessPawn,
    faChessQueen,
    faChessRook,
    faDiamond,
    faHandshake,
    faTrophy,
} from '@fortawesome/free-solid-svg-icons'

export interface repetition {
    piece: ChessPieceType | null
    moves: string[]
}

const loserIcon = <FontAwesomeIcon icon={faBrain} className={style.endIcon} />
const tiedIcon = (
    <FontAwesomeIcon icon={faHandshake} className={style.endIcon} />
)
const winnerIcon = <FontAwesomeIcon icon={faTrophy} className={style.endIcon} />

const playerAI = new PlayerAI()

export default function PvAI() {
    // Time of the current match
    const [chronometer, setChronometer] = useState(0)
    // State that represents consecutive moves of a piece to detect position repetitions
    const [repetition, setRepetition] = useState({
        ai: { piece: null, moves: [] },
        player: { piece: null, moves: [] },
    } as { ai: repetition; player: repetition })
    // State that represents the current board state, initially set to "initialBoard"
    const [board, setBoard] = useState(initialBoard as Board)
    // State that determines if is the player turn (true) or AI turn (false)
    const [turn, setTurn] = useState(true)
    // Counter that determines the current number of turns
    const [turnCount, setTurnCount] = useState(1)
    // State that stores a player pawn available for coronation
    const [coronation, setCoronation] = useState(null as null | SelectedPiece)
    // State that determines if player (true) or AI (false) won the game, otherwise it's set to "null"
    const [winner, setWinner] = useState(null as null | boolean)
    // State that determines if there's a tie
    const [tie, setTie] = useState(
        null as null | { piece: ChessPieceType; reason: string }
    )
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
            safes: { piece: SelectedPiece; moves: string[] }[]
        }
    )
    // Player king ref
    const playerKingRef = useRef(null as null | HTMLDivElement)

    const endBoard = (
        <div className={style.endBoard}>
            {columns.map((col) => (
                <div key={col} className={style.endCol}>
                    {board[col].map((cell, idx) => (
                        <div
                            key={idx}
                            className={style.endCell}
                            style={{ position: 'relative' }}
                        >
                            <div className={style.cellDecoration}>
                                {cell &&
                                cell.name === 'King' &&
                                !tie &&
                                exposed &&
                                exposed.king.piece.id === cell.id ? (
                                    <FontAwesomeIcon
                                        className={style.exposedKing}
                                        icon={faDiamond}
                                    />
                                ) : (
                                    cell &&
                                    tie &&
                                    tie.piece.id == cell.id && (
                                        <FontAwesomeIcon
                                            className={style.exposedKing}
                                            icon={faDiamond}
                                        />
                                    )
                                )}
                            </div>
                            {cell && (
                                <FontAwesomeIcon
                                    icon={cell.icon}
                                    color={
                                        cell.player
                                            ? 'var(--white)'
                                            : 'var(--darkgray)'
                                    }
                                />
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )

    // Method - Main function for player actions
    const playerAction = (
        element: HTMLDivElement,
        col: string,
        idx: number,
        piece: null | ChessPieceType
    ) => {
        // Standard player turn
        if (turn && winner === null) {
            // Standard player piece selection
            if (piece && piece.player) {
                setValidMoves([])
                const safeSelection: null | {
                    piece: SelectedPiece
                    moves: string[]
                } = exposed
                    ? (() => {
                          const found = exposed?.safes.find(
                              (selection) =>
                                  selection.piece.piece.id === piece.id
                          )
                          return found || null
                      })()
                    : null

                // Update the selected piece
                if (exposed && safeSelection) {
                    setSelected((prevSelected) => {
                        if (prevSelected !== null) {
                            prevSelected.ele.style.border = ''
                            prevSelected.ele.style.backgroundColor = ''
                        }

                        element.style.border = '2px solid var(--dark)'
                        element.style.backgroundColor = 'var(--gray)'

                        return {
                            ele: element,
                            col: safeSelection.piece.col,
                            idx: safeSelection.piece.idx,
                            piece: safeSelection.piece.piece,
                        }
                    })
                } else if (!exposed) {
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
                }

                const availableMoves: string[] = (() =>
                    // For king
                    piece.name === 'King'
                        ? [
                              ...piece.moves(col, idx),
                              ...piece.getCaptureMoves(board, { col, idx }),
                          ].filter(
                              (move) =>
                                  !isExposed(
                                      board,
                                      { col, idx, piece },
                                      {
                                          col: getMoveCol(move),
                                          idx: getMoveIdx(move),
                                      },
                                      true
                                  ) &&
                                  !(
                                      board[getMoveCol(move)][
                                          getMoveIdx(move)
                                      ] as ChessPieceType
                                  )?.player
                          )
                        : // For other pieces
                          [
                              ...piece.moves(col, idx),
                              ...piece.getCaptureMoves(board, { col, idx }),
                          ].filter(
                              (move) =>
                                  !piece.isClogged(
                                      board,
                                      { col, idx },
                                      {
                                          col: getMoveCol(move),
                                          idx: getMoveIdx(move),
                                      }
                                  ) &&
                                  !isAutoExposing(
                                      board,
                                      { col, idx, piece },
                                      {
                                          col: getMoveCol(move),
                                          idx: getMoveIdx(move),
                                      }
                                  )
                          ))()

                exposed && safeSelection
                    ? setValidMoves(safeSelection.moves)
                    : setValidMoves(availableMoves)
            }
            // Standard player piece move
            else {
                if (
                    selected &&
                    winner === null &&
                    validMoves.includes(col + idx)
                ) {
                    setBoard((prevBoard) => {
                        const newBoard = deepCopy(board)

                        newBoard[selected.col] = [...prevBoard[selected.col]]
                        newBoard[selected.col][selected.idx] = null
                        newBoard[col][idx] = selected.piece

                        return newBoard
                    })

                    selected.ele.style.border = ''
                    selected.ele.style.backgroundColor = ''

                    addRepetition(selected.piece, col + idx, true)
                    setTurnCount((prevTurnCount) => prevTurnCount + 1)
                    if (idx === 7 && selected.piece.name === 'Pawn')
                        setCoronation({ piece: selected.piece, col, idx })
                }
            }
        }
    }

    // Method - Execute the AI actions
    const executeAI = (
        exposed: null | {
            king: SelectedPiece
            safes: { piece: SelectedPiece; moves: string[] }[]
        }
    ) => {
        if (!turn && !selected && winner === null && !tie) {
            setTimeout(() => {
                playerAI.randomAction(
                    board,
                    repetition,
                    exposed,
                    setBoard,
                    setTurnCount,
                    toCrown,
                    addRepetition
                )
            }, 150)
        }
    }

    // Method - Crown a pawn
    const toCrown = (
        piece: 'Queen' | 'Bishop' | 'Knight' | 'Rook',
        selected: SelectedPiece | null = coronation
    ) => {
        if (selected && piece) {
            let newPiece: null | ChessPieceType = null

            switch (piece) {
                case 'Queen':
                    newPiece = new Queen(
                        selected.piece.player,
                        selected.piece.id
                    )
                    break

                case 'Bishop':
                    newPiece = new Bishop(
                        selected.piece.player,
                        selected.piece.id
                    )
                    break

                case 'Knight':
                    newPiece = new Knight(
                        selected.piece.player,
                        selected.piece.id
                    )
                    break

                case 'Rook':
                    newPiece = new Rook(
                        selected.piece.player,
                        selected.piece.id
                    )
                    break

                default:
                    break
            }

            if (newPiece) {
                setBoard((prevBoard) => {
                    const newBoard = deepCopy(prevBoard)

                    newBoard[selected.col] = [...prevBoard[selected.col]]
                    newBoard[selected.col][selected.idx] =
                        newPiece as ChessPieceType

                    return newBoard
                })
            }
        }

        setCoronation(null)
    }

    // Method - Add a move repetition
    const addRepetition = (
        piece: ChessPieceType,
        move: string,
        player: boolean
    ) => {
        if (player) {
            if (repetition.player.piece?.id === piece.id)
                setRepetition((prevRepetition) => {
                    return {
                        ...prevRepetition,
                        player: {
                            ...prevRepetition.player,
                            moves: [...prevRepetition.player.moves, move],
                        },
                    }
                })
            else
                setRepetition((prevRepetition) => {
                    return {
                        ...prevRepetition,
                        player: {
                            piece: piece,
                            moves: [move],
                        },
                    }
                })
        } else {
            if (repetition.ai.piece?.id === piece.id)
                setRepetition((prevRepetition) => {
                    return {
                        ...prevRepetition,
                        ai: {
                            ...prevRepetition.ai,
                            moves: [...prevRepetition.ai.moves, move],
                        },
                    }
                })
            else
                setRepetition((prevRepetition) => {
                    return {
                        ...prevRepetition,
                        ai: {
                            piece: piece,
                            moves: [move],
                        },
                    }
                })
        }
    }

    // Change turn and reset valid moves, selected and exposed
    useEffect(() => {
        if (turnCount !== 1 && !coronation) {
            setTurn((prevTurn) => !prevTurn)

            setValidMoves([])
            setSelected(null)
            setExposed(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [board])

    // Detect a exposed king and execute the AI turn
    useEffect(() => {
        const ekPlayer = exposingData(board, true)
        const ekAi = exposingData(board, false)

        if (ekPlayer) {
            setExposed(ekPlayer)
            executeAI(ekPlayer)
        } else if (ekAi) {
            setExposed(ekAi)
            executeAI(ekAi)
        } else {
            setExposed(null)
            executeAI(ekPlayer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [turn])

    // Detect a tie
    useEffect(() => {
        if (turnCount !== 1) {
            const playerTied = isTied(board, true)
            const aiTied = isTied(board, false)

            if (playerTied) setTie(playerTied)
            else if (aiTied) setTie(aiTied)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [turn])

    // Check if there's a winner
    useEffect(() => {
        if (exposed)
            if (!exposed.safes.length) setWinner(!exposed.king.piece.player)
    }, [exposed])

    // Detect ties due to repetitions
    useEffect(() => {
        const counters: { [key: string]: { player: boolean; ct: number } } = {}

        repetition.player.moves.forEach((move) => {
            counters['player-' + move] = {
                player: true,
                ct: (counters['player-' + move]?.ct || 0) + 1,
            }
        })

        repetition.ai.moves.forEach((move) => {
            counters['ai-' + move] = {
                player: false,
                ct: (counters['ai-' + move]?.ct || 0) + 1,
            }
        })

        for (const move of Object.keys(counters)) {
            if (counters[move].ct >= 3) {
                const piece = counters[move].player
                    ? repetition.player.piece
                    : repetition.ai.piece

                const playerName = counters[move].player ? 'Player' : 'AI'

                setTie({
                    piece: piece as ChessPieceType,
                    reason: `${playerName} ${piece?.name} repeated a specific position too many times`,
                })
            }
        }
    }, [
        repetition.ai,
        repetition.ai.piece,
        repetition.ai.moves,
        repetition.player,
        repetition.player.piece,
        repetition.player.moves,
    ])

    // Initialize the chronometer
    useEffect(() => {
        const invertal = setInterval(() => {
            setChronometer((prevChronometer) => prevChronometer + 1)
        }, 1000)

        return () => clearInterval(invertal)
    }, [])

    // Method - Reset the game
    const resetBoard = () => {
        setBoard(initialBoard)
        setChronometer(0)
        setTurn(true)
        setTurnCount(1)
        setCoronation(null)
        setWinner(null)
        setTie(null)
        setSelected(null)
        setValidMoves([])
        setExposed(null)
        setRepetition({
            ai: { piece: null, moves: [] },
            player: { piece: null, moves: [] },
        })

        const element = playerKingRef.current
        if (element) {
            element.style.border = ''
            element.style.backgroundColor = ''
        }
    }

    // useEffect(() => {
    //     console.log(repetition)
    // }, [repetition])

    // useEffect(() => {
    //     console.log(exposed)
    // }, [exposed])

    // // Log winner
    // useEffect(() => {
    //     if (winner === true) console.log(`Player wins!`)
    //     else if (winner === false) console.log('AI wins!')
    // }, [winner])

    // useEffect(() => console.log('BOARD'), [board])
    // useEffect(() => console.log('EXPOSED'), [exposed])
    // useEffect(() => console.log('- - - - - - - - - -'), [turn])
    // useEffect(() => console.log('TURN COUNT'), [turnCount])
    // useEffect(() => console.log('SELECTED'), [selected])
    // useEffect(() => console.log('REPETITION'), [repetition])
    // useEffect(() => console.log('VALID MOVES'), [validMoves])
    // useEffect(() => console.log('WINNER'), [winner])
    // useEffect(() => console.log('TIE'), [tie])
    // useEffect(() => console.log('CORONATION'), [coronation])

    return (
        <div className={style.wrapper}>
            <div className={style.header}>
                <div className={style.playerPieces}>
                    <div>
                        <FontAwesomeIcon
                            icon={faChessPawn}
                            style={{ height: 20 }}
                        />
                        <span>{countRemainingPieces(board, false)}</span>
                    </div>
                    <span>AI</span>
                </div>
                <div className={style.chronometer}>
                    <span>{formatTime(chronometer)}</span>
                    <span>CHRONOMETER</span>
                </div>
                <div className={style.playerPieces}>
                    <div>
                        <FontAwesomeIcon
                            icon={faChessPawn}
                            style={{ height: 20 }}
                        />
                        <span>{countRemainingPieces(board, true)}</span>
                    </div>
                    <span>PLAYER</span>
                </div>
            </div>
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
                                    cell && cell.player && cell.name === 'King'
                                        ? playerKingRef
                                        : null
                                }
                            >
                                <div className={style.cellDecoration}>
                                    {cell &&
                                        cell.player &&
                                        exposed &&
                                        cell.id === exposed.king.piece.id && (
                                            <FontAwesomeIcon
                                                className={style.exposedKing}
                                                icon={faDiamond}
                                            />
                                        )}
                                    {cell &&
                                        cell.player &&
                                        exposed &&
                                        cell.id !== exposed.king.piece.id &&
                                        exposed.safes.find(
                                            (selection) =>
                                                selection.piece.piece.id ===
                                                cell.id
                                        ) && (
                                            <FontAwesomeIcon
                                                className={style.availablePiece}
                                                icon={faDiamond}
                                            />
                                        )}
                                    {!cell &&
                                        validMoves.includes(col + idx) &&
                                        countIn(
                                            repetition.player.moves,
                                            col + idx
                                        ) < 2 && (
                                            <FontAwesomeIcon
                                                className={style.standardMove}
                                                icon={faDiamond}
                                            />
                                        )}
                                    {cell &&
                                        validMoves.includes(col + idx) &&
                                        countIn(
                                            repetition.player.moves,
                                            col + idx
                                        ) < 2 && (
                                            <FontAwesomeIcon
                                                className={style.captureMove}
                                                icon={faDiamond}
                                            />
                                        )}
                                    {validMoves.includes(col + idx) &&
                                        countIn(
                                            repetition.player.moves,
                                            col + idx
                                        ) === 2 && (
                                            <FontAwesomeIcon
                                                className={style.repeatedMove}
                                                icon={faDiamond}
                                            />
                                        )}
                                </div>
                                {cell && (
                                    <FontAwesomeIcon
                                        icon={cell.icon}
                                        color={
                                            cell.player
                                                ? 'var(--white)'
                                                : 'var(--darkgray)'
                                        }
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            {((coronation && coronation.piece.player) ||
                winner !== null ||
                tie) && (
                <div className={style.modal}>
                    {(winner !== null || tie) && (
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
                            <p>
                                {winner
                                    ? `The player captured the AI king`
                                    : winner === false
                                      ? `The AI captued the player's king`
                                      : tie && tie.reason}
                            </p>
                            {endBoard}
                            <button onClick={resetBoard}>Try Again</button>
                        </article>
                    )}
                    {coronation && coronation.piece.player && (
                        <article className={style.coronation}>
                            <header>
                                <h4>Coronation</h4>
                                <p>Change your pawn for any of these</p>
                            </header>
                            <div>
                                <button onClick={() => toCrown('Queen')}>
                                    <FontAwesomeIcon icon={faChessQueen} />
                                </button>
                                <button onClick={() => toCrown('Bishop')}>
                                    <FontAwesomeIcon icon={faChessBishop} />
                                </button>
                                <button onClick={() => toCrown('Knight')}>
                                    <FontAwesomeIcon icon={faChessKnight} />
                                </button>
                                <button onClick={() => toCrown('Rook')}>
                                    <FontAwesomeIcon icon={faChessRook} />
                                </button>
                            </div>
                        </article>
                    )}
                </div>
            )}
        </div>
    )
}
