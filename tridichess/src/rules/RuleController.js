/**
 * RuleController.js — pseudo-legal 이동 dispatcher.
 *
 * Sprint 3.2: Knight/King 만 정통 규칙. 나머지는 데모(같은 레벨 이동) 폴백.
 * Sprint 3.3 (Rook/Bishop/Queen), 3.4 (Pawn), 3.5 (self-check 필터) 에서 확장.
 */

import { getAllSquares } from '../model/SquareId.js';
import * as knight from './pieceMovement/knight.js';
import * as king   from './pieceMovement/king.js';
import * as pawn   from './pieceMovement/pawn.js';
import * as rook   from './pieceMovement/rook.js';
import * as bishop from './pieceMovement/bishop.js';
import * as queen  from './pieceMovement/queen.js';

const MOVEMENT = {
    K: king.pseudoMoves,
    Q: queen.pseudoMoves,
    R: rook.pseudoMoves,
    B: bishop.pseudoMoves,
    N: knight.pseudoMoves,
    P: pawn.pseudoMoves,
};

/**
 * 주어진 출발 칸의 합법(legal) 이동 후보를 반환.
 * 현재는 pseudo-legal == legal. self-check 필터는 Sprint 3.5 추가.
 *
 * @param {import('../model/GameState.js').GameState} state
 * @param {import('../model/SquareId.js').SquareId}   from
 * @returns {import('../model/SquareId.js').SquareId[]}
 */
export function generateLegalMoves(state, from) {
    const piece = state.getPiece(from);
    if (!piece) return [];
    const mover = MOVEMENT[piece.type];
    if (mover) return mover(state, piece);
    return demoSameLevelMoves(state, piece);
}

function demoSameLevelMoves(state, piece) {
    return getAllSquares().filter(sq => {
        if (sq.level !== piece.position.level)   return false;
        if (sq.equals(piece.position))           return false;
        const occ = state.getPiece(sq);
        return !occ || occ.color !== piece.color;
    });
}
