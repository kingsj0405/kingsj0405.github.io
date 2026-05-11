/**
 * RuleController.js — pseudo-legal 이동 dispatcher + applyMove.
 *
 * applyMove: 불변 이동 — 캡처 자동 처리, turn flip, moveHistory, capturedBy* 갱신.
 * Self-check 필터는 Sprint 3.5 에서 추가 예정 (현재 pseudo-legal == legal).
 */

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
 * pseudo-legal 이동 — self-check 필터 없음. 내부 / isInCheck 에서 사용.
 *
 * @param {import('../model/GameState.js').GameState} state
 * @param {import('../model/SquareId.js').SquareId}   from
 * @returns {import('../model/SquareId.js').SquareId[]}
 */
export function generatePseudoMoves(state, from) {
    const piece = state.getPiece(from);
    if (!piece) return [];
    const mover = MOVEMENT[piece.type];
    if (!mover) return [];
    return mover(state, piece);
}

/**
 * 주어진 색의 King 이 상대 piece 에 의해 공격받고 있는지.
 *
 * @param {import('../model/GameState.js').GameState} state
 * @param {'white'|'black'} color
 * @returns {boolean}
 */
export function isInCheck(state, color) {
    const kingSq = state.findKing(color);
    if (!kingSq) return false;
    const kingKey = kingSq.toString();
    const enemy   = color === 'white' ? 'black' : 'white';
    for (const piece of state.pieces.values()) {
        if (piece.color !== enemy) continue;
        for (const t of generatePseudoMoves(state, piece.position)) {
            if (t.toString() === kingKey) return true;
        }
    }
    return false;
}

/**
 * 합법 이동 — pseudo-legal 에서 자기 King 을 체크에 노출하는 수 제거.
 *
 * @param {import('../model/GameState.js').GameState} state
 * @param {import('../model/SquareId.js').SquareId}   from
 * @returns {import('../model/SquareId.js').SquareId[]}
 */
export function generateLegalMoves(state, from) {
    const piece = state.getPiece(from);
    if (!piece) return [];
    const pseudo = generatePseudoMoves(state, from);
    return pseudo.filter(to => {
        const next = state.movePiece(from, to);
        return !isInCheck(next, piece.color);
    });
}

/**
 * 현재 turn 의 게임 상태.
 * @returns {'ongoing'|'check'|'checkmate'|'stalemate'}
 */
export function gameStatus(state) {
    const inCheck = isInCheck(state, state.turn);
    const anyMove = generateAllMoves(state).length > 0;
    if (!anyMove) return inCheck ? 'checkmate' : 'stalemate';
    return inCheck ? 'check' : 'ongoing';
}

/**
 * 한 piece 이동을 적용해 새 GameState 반환 (불변).
 * 캡처 발생 시 capturedBy{Color} 에 자동 추가, turn flip, moveHistory append.
 *
 * @param {import('../model/GameState.js').GameState} state
 * @param {import('../model/SquareId.js').SquareId}   from
 * @param {import('../model/SquareId.js').SquareId}   to
 * @returns {import('../model/GameState.js').GameState}
 */
export function applyMove(state, from, to) {
    const piece = state.getPiece(from);
    if (!piece) throw new Error(`applyMove: no piece at ${from}`);
    const captured = state.getPiece(to);

    // Promotion 사전 검사 (Roth-2012, ADR-0011): 폰 도착 abs rank ≥8 (백) / ≤1 (흑)
    let promoteTo = null;
    if (piece.type === 'P') {
        const abs = to.toAbs();
        if (piece.color === 'white' && abs.absRank >= 8) promoteTo = 'Q';
        else if (piece.color === 'black' && abs.absRank <= 1) promoteTo = 'Q';
    }

    const moveStr = `${piece.symbol} ${from}→${to}${captured ? `×${captured.symbol}` : ''}${promoteTo ? `=${promoteTo}` : ''}`;
    const nextTurn = state.turn === 'white' ? 'black' : 'white';

    const patch = {
        turn:        nextTurn,
        moveHistory: [...state.moveHistory, moveStr],
    };
    if (captured) {
        if (piece.color === 'white') {
            patch.capturedByWhite = [...state.capturedByWhite, captured];
        } else {
            patch.capturedByBlack = [...state.capturedByBlack, captured];
        }
    }

    let next = state.movePiece(from, to).with(patch);

    if (promoteTo) {
        const moved = next.getPiece(to);
        const promoted = moved.with({ type: promoteTo });
        const pieces = new Map(next.pieces);
        pieces.set(to.toString(), promoted);
        next = next.with({ pieces });
    }

    return next;
}

/**
 * 모든 자기 색 piece 의 pseudo-legal 이동을 (from, to) 쌍으로 평탄화.
 * AI / 게임 종료 판정에 사용.
 *
 * @param {import('../model/GameState.js').GameState} state
 * @param {'white'|'black'} [color=state.turn]
 * @returns {Array<{ from: import('../model/SquareId.js').SquareId, to: import('../model/SquareId.js').SquareId }>}
 */
export function generateAllMoves(state, color = state.turn) {
    const out = [];
    for (const piece of state.pieces.values()) {
        if (piece.color !== color) continue;
        const targets = generateLegalMoves(state, piece.position);
        for (const t of targets) out.push({ from: piece.position, to: t });
    }
    return out;
}
