/**
 * pawn.js — Pawn 이동 (ADR-0010 multi-candidate).
 *
 * abs rank ±1 (color dir) 전진. target abs 의 ALL 후보를 player choice.
 *   - 전진 1: 후보 중 비어있는 것만 가능
 *   - 전진 2 (첫 이동): fwd1 abs 의 모든 후보가 비어야 fwd2 도 가능
 *   - 대각 캡처: target abs 의 적 후보 모두
 * en passant / 프로모션 / Rook-pawn 옵션 미구현.
 */

import { allSquaresAt } from '../../model/SquareId.js';

export function pseudoMoves(state, piece) {
    const from = piece.position.toAbs(state);
    const dir  = piece.color === 'white' ? +1 : -1;
    const out  = [];

    const fwd1Cands  = allSquaresAt(from.absFile, from.absRank + dir, state);
    let allFwd1Empty = fwd1Cands.length > 0;
    for (const cand of fwd1Cands) {
        if (state.getPiece(cand)) {
            allFwd1Empty = false;
        } else {
            out.push(cand);
        }
    }
    if (!piece.hasMoved && allFwd1Empty) {
        for (const cand of allSquaresAt(from.absFile, from.absRank + 2 * dir, state)) {
            if (!state.getPiece(cand)) out.push(cand);
        }
    }

    for (const df of [-1, +1]) {
        for (const cap of allSquaresAt(from.absFile + df, from.absRank + dir, state)) {
            const occ = state.getPiece(cap);
            if (occ) {
                if (occ.color !== piece.color) out.push(cap);
            } else if (state.enPassant &&
                       cap.toString() === state.enPassant.target.toString() &&
                       state.enPassant.color !== piece.color) {
                // En passant: target square 비어있어도 합법 캡처
                out.push(cap);
            }
        }
    }

    return out;
}
