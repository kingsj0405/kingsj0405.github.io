/**
 * RuleController.js — pseudo-legal 이동 dispatcher + applyMove.
 *
 * applyMove: 불변 이동 — 캡처 자동 처리, turn flip, moveHistory, capturedBy* 갱신.
 * Self-check 필터는 Sprint 3.5 에서 추가 예정 (현재 pseudo-legal == legal).
 */

import { highestSquareAt, SquareId } from '../model/SquareId.js';
import { getCastleConfig } from './castling.js';
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
function simulateMove(state, from, to) {
    const piece = state.getPiece(from);
    if (piece && piece.type === 'K') {
        const cc = getCastleConfig(state, from, to);
        if (cc) {
            // K ↔ R 동시 이동 (swap 일 수 있어 movePiece chain 으로는 안 됨)
            const rookFrom = SquareId.fromString(cc.rookFrom);
            const rookTo   = SquareId.fromString(cc.rookTo);
            const rook     = state.getPiece(rookFrom);
            const pieces = new Map(state.pieces);
            pieces.delete(from.toString());
            pieces.delete(cc.rookFrom);
            pieces.set(to.toString(),     piece.with({ position: to,     hasMoved: true }));
            pieces.set(cc.rookTo,         rook.with({  position: rookTo, hasMoved: true }));
            return state.with({ pieces });
        }
    }
    return state.movePiece(from, to);
}

export function generateLegalMoves(state, from) {
    const piece = state.getPiece(from);
    if (!piece) return [];
    const pseudo = generatePseudoMoves(state, from);
    return pseudo.filter(to => {
        // 캐슬링: 현재 체크 중이면 금지
        if (piece.type === 'K') {
            const cc = getCastleConfig(state, from, to);
            if (cc && isInCheck(state, piece.color)) return false;
        }
        const next = simulateMove(state, from, to);
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
const PROMOTION_VALID = new Set(['Q', 'R', 'B', 'N']);

export function applyMove(state, from, to, promotionType = 'Q') {
    const piece = state.getPiece(from);
    if (!piece) throw new Error(`applyMove: no piece at ${from}`);
    if (!PROMOTION_VALID.has(promotionType)) {
        throw new Error(`applyMove: invalid promotionType "${promotionType}"`);
    }
    let captured = state.getPiece(to);

    // En passant 캡처 감지 — 폰이 비어있는 enPassant.target 으로 이동
    let enPassantCapture = null;
    if (piece.type === 'P' && !captured && state.enPassant &&
        to.toString() === state.enPassant.target.toString() &&
        state.enPassant.color !== piece.color) {
        enPassantCapture = state.getPiece(state.enPassant.victim);
        captured = enPassantCapture;
    }

    // 다음 턴 enPassant 계산 (지금 두는 수가 pawn 2-step 이면)
    let newEnPassant = null;
    if (piece.type === 'P') {
        const fromAbs = from.toAbs();
        const toAbs   = to.toAbs();
        if (Math.abs(toAbs.absRank - fromAbs.absRank) === 2) {
            const dir = (toAbs.absRank - fromAbs.absRank) > 0 ? 1 : -1;
            const midSq = highestSquareAt(toAbs.absFile, fromAbs.absRank + dir);
            if (midSq) {
                newEnPassant = { target: midSq, victim: to, color: piece.color };
            }
        }
    }

    // Promotion 사전 검사 (Roth-2012, ADR-0011)
    let promoteTo = null;
    if (piece.type === 'P') {
        const abs = to.toAbs();
        if (piece.color === 'white' && abs.absRank >= 8) promoteTo = promotionType;
        else if (piece.color === 'black' && abs.absRank <= 1) promoteTo = promotionType;
    }

    const castleCfg = piece.type === 'K' ? getCastleConfig(state, from, to) : null;
    // king-side: rookFrom 이 KL 보드. queen-side: rookFrom 이 QL 보드.
    const isKingside  = castleCfg && (castleCfg.rookFrom.includes('KL'));
    const moveStr = castleCfg
        ? (isKingside ? 'O-O' : 'O-O-O')
        : `${piece.symbol} ${from}→${to}${captured ? `×${captured.symbol}` : ''}${promoteTo ? `=${promoteTo}` : ''}`;
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

    let next;
    if (castleCfg) {
        // 캐슬링: K + R swap 형태 → Map 직접 조작
        const rookFromSq = SquareId.fromString(castleCfg.rookFrom);
        const rookToSq   = SquareId.fromString(castleCfg.rookTo);
        const rook       = state.getPiece(rookFromSq);
        const pieces = new Map(state.pieces);
        pieces.delete(from.toString());
        pieces.delete(castleCfg.rookFrom);
        pieces.set(to.toString(),       piece.with({ position: to,       hasMoved: true }));
        pieces.set(castleCfg.rookTo,    rook.with({  position: rookToSq, hasMoved: true }));
        next = state.with({ pieces, ...patch });
    } else {
        next = state.movePiece(from, to).with(patch);
    }

    // En passant: 별도 빅팀 piece 제거
    if (enPassantCapture) {
        const pieces = new Map(next.pieces);
        pieces.delete(state.enPassant.victim.toString());
        next = next.with({ pieces });
    }

    if (promoteTo) {
        const moved = next.getPiece(to);
        const promoted = moved.with({ type: promoteTo });
        const pieces = new Map(next.pieces);
        pieces.set(to.toString(), promoted);
        next = next.with({ pieces });
    }

    // 다음 턴 enPassant 적용 (이전 enPassant 자동 소멸)
    next = next.with({ enPassant: newEnPassant });

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
