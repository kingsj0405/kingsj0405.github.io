/**
 * king.js — King 1-step + vertical (ADR-0010 multi-candidate).
 *
 *   (1) abs 8 방향 1 step → 각 target abs 의 ALL 후보
 *   (2) 같은 abs cell 의 다른 레벨 (vertical column) → 직접 이동
 */

import { allSquaresAt, getVerticalColumn } from '../../model/SquareId.js';

const STEPS = [
    [+1,  0], [-1,  0], [ 0, +1], [ 0, -1],
    [+1, +1], [+1, -1], [-1, +1], [-1, -1],
];

export function pseudoMoves(state, piece) {
    const from = piece.position.toAbs();
    const out  = [];

    for (const [df, dr] of STEPS) {
        for (const cand of allSquaresAt(from.absFile + df, from.absRank + dr)) {
            const occ = state.getPiece(cand);
            if (occ && occ.color === piece.color) continue;
            out.push(cand);
        }
    }

    for (const sq of getVerticalColumn(piece.position)) {
        const occ = state.getPiece(sq);
        if (occ && occ.color === piece.color) continue;
        out.push(sq);
    }

    return out;
}
