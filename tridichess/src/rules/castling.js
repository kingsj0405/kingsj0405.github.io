/**
 * castling.js — Roth-2012 캐슬링 (King ↔ Rook 크로스 보드).
 *
 * 백 King-side  (O-O):   K c1(W) ↔ R b1(KL1)
 * 백 Queen-side (O-O-O): K c1(W) → b1(W),  R a1(QL1) → c1(W)  [Queen 가 home 비웠을 때만]
 * 흑 King-side:          K c4(B) ↔ R b2(KL3)
 * 흑 Queen-side:         K c4(B) → b4(B),  R a2(QL3) → c4(B)
 *
 * 조건:
 *  - K 와 해당 R 모두 hasMoved=false
 *  - 현재 K 체크 X (generateLegalMoves 에서 확인)
 *  - K 도착 칸 공격 받지 X (legal filter 의 isInCheck(next) 으로 자동 처리)
 *  - Queen-side: Queen home 칸 (b1/b4) 비어있어야 함
 */

import { SquareId } from '../model/SquareId.js';

export const CASTLE_CONFIGS = {
    white: {
        kingside:  { kingFrom: 'c1(W)', rookFrom: 'b1(KL1)', kingTo: 'b1(KL1)', rookTo: 'c1(W)', queenHome: 'b1(W)' },
        queenside: { kingFrom: 'c1(W)', rookFrom: 'a1(QL1)', kingTo: 'b1(W)',   rookTo: 'c1(W)', queenHome: 'b1(W)' },
    },
    black: {
        kingside:  { kingFrom: 'c4(B)', rookFrom: 'b2(KL3)', kingTo: 'b2(KL3)', rookTo: 'c4(B)', queenHome: 'b4(B)' },
        queenside: { kingFrom: 'c4(B)', rookFrom: 'a2(QL3)', kingTo: 'b4(B)',   rookTo: 'c4(B)', queenHome: 'b4(B)' },
    },
};

/**
 * King piece 의 가능한 castle target SquareId 들.
 * @param {import('../model/GameState.js').GameState} state
 * @param {import('../model/Piece.js').Piece} kingPiece
 * @returns {SquareId[]}
 */
export function generateCastleTargets(state, kingPiece) {
    const out = [];
    if (kingPiece.hasMoved) return out;
    const cfg = CASTLE_CONFIGS[kingPiece.color];
    if (!cfg) return out;
    const kfKey = kingPiece.position.toString();

    for (const side of ['kingside', 'queenside']) {
        const c = cfg[side];
        if (kfKey !== c.kingFrom) continue;
        const rook = state.getPiece(SquareId.fromString(c.rookFrom));
        if (!rook || rook.type !== 'R' || rook.color !== kingPiece.color || rook.hasMoved) continue;
        if (side === 'queenside') {
            // Queen home 비어있어야 함
            if (state.getPiece(SquareId.fromString(c.queenHome))) continue;
        }
        out.push(SquareId.fromString(c.kingTo));
    }
    return out;
}

/**
 * 주어진 King 이동이 castle 인가? 맞으면 config 반환, 아니면 null.
 * @returns {{kingFrom:string, rookFrom:string, kingTo:string, rookTo:string, queenHome:string} | null}
 */
export function getCastleConfig(state, from, to) {
    const p = state.getPiece(from);
    if (!p || p.type !== 'K' || p.hasMoved) return null;
    const cfgs = CASTLE_CONFIGS[p.color];
    if (!cfgs) return null;
    for (const side of ['kingside', 'queenside']) {
        const c = cfgs[side];
        if (from.toString() !== c.kingFrom) continue;
        if (to.toString()   !== c.kingTo)   continue;
        const r = state.getPiece(SquareId.fromString(c.rookFrom));
        if (!r || r.type !== 'R' || r.color !== p.color || r.hasMoved) continue;
        if (side === 'queenside') {
            if (state.getPiece(SquareId.fromString(c.queenHome))) continue;
        }
        return c;
    }
    return null;
}
