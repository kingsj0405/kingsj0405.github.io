/**
 * bishop.js — Bishop pseudo-legal 이동 (Sprint 3.3 MVP, same-level only / ADR-0008).
 *
 * 같은 레벨 대각 슬라이딩 (4 방향). 첫 장애물에서 정지.
 */

import { slidingRay } from '../pathUtils.js';

const DIRS = [
    { dFile: +1, dRank: +1 }, { dFile: +1, dRank: -1 },
    { dFile: -1, dRank: +1 }, { dFile: -1, dRank: -1 },
];

export function pseudoMoves(state, piece) {
    return DIRS.flatMap(d => slidingRay(state, piece.position, d, piece.color));
}
