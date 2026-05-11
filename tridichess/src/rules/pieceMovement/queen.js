/**
 * queen.js — Queen = Rook ∪ Bishop (Sprint 3.3 MVP, same-level only / ADR-0008).
 */

import { slidingRay } from '../pathUtils.js';

const DIRS = [
    { dFile: +1, dRank:  0 }, { dFile: -1, dRank:  0 },
    { dFile:  0, dRank: +1 }, { dFile:  0, dRank: -1 },
    { dFile: +1, dRank: +1 }, { dFile: +1, dRank: -1 },
    { dFile: -1, dRank: +1 }, { dFile: -1, dRank: -1 },
];

export function pseudoMoves(state, piece) {
    return DIRS.flatMap(d => slidingRay(state, piece.position, d, piece.color));
}
