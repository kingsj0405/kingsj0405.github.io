/**
 * knight.js — 3D Knight L-shape jump (ADR-0010 multi-candidate).
 *
 * abs (±2,±1)/(±1,±2) 점프. target abs 의 ALL 후보 (player choice).
 * 경로 무시 (Roth: knight doesn't care about obstacles).
 */

import { allSquaresAt } from '../../model/SquareId.js';

const OFFSETS = [
    [+2, +1], [+2, -1], [-2, +1], [-2, -1],
    [+1, +2], [+1, -2], [-1, +2], [-1, -2],
];

export function pseudoMoves(state, piece) {
    const from = piece.position.toAbs(state);
    const out  = [];
    for (const [df, dr] of OFFSETS) {
        for (const cand of allSquaresAt(from.absFile + df, from.absRank + dr, state)) {
            const occ = state.getPiece(cand);
            if (occ && occ.color === piece.color) continue;
            out.push(cand);
        }
    }
    return out;
}
