import { CSSProperties } from 'react'

export const exposedKingStyle: CSSProperties = {
    position: 'absolute',
    display: 'block',
    width: '60%',
    height: '60%',
    backgroundColor: 'var(--green)',
    border: '1px solid var(--gray)',
    borderRadius: '2px',
    transform: 'rotateZ(45deg)',
    zIndex: '5',
}

export const exposedPieceStyle: CSSProperties = {
    position: 'absolute',
    display: 'block',
    width: '50%',
    height: '50%',
    backgroundColor: 'transparent',
    border: '3px solid var(--green)',
    borderRadius: '2px',
    outline: '1px solid var(--gray)',
    transform: 'rotateZ(45deg)',
    zIndex: '5',
}

export const repeatedMoveStyle: CSSProperties = {
    position: 'absolute',
    display: 'block',
    width: '0.5rem',
    height: '0.5rem',
    backgroundColor: 'var(--dark)',
    border: '2px solid var(--gray)',
    borderRadius: '1px',
    outline: 'none',
    transform: 'rotateZ(45deg)',
    zIndex: '5',
}

export const innerRepeatedMoveStyle: CSSProperties = {
    display: 'block',
    height: '100%',
    width: '100%',
    border: '1px solid var(--gray)',
    background: 'transparent',
}

export const availableMoveStyle: CSSProperties = {
    position: 'absolute',
    display: 'block',
    width: '0.5rem',
    height: '0.5rem',
    backgroundColor: 'transparent',
    border: '2px solid var(--gray)',
    borderRadius: '1px',
    outline: 'none',
    transform: 'rotateZ(45deg)',
    zIndex: '5',
}

export const innerAvailableMoveStyle: CSSProperties = {
    display: 'block',
    height: '100%',
    width: '100%',
    border: '1px solid var(--gray)',
    background: 'transparent',
}
