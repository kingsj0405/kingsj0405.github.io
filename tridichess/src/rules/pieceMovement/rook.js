/**
 * rook.js — Rook pseudo-legal 이동 (Sprint 3.3 MVP, same-level only / ADR-0008).
 *
 * 같은 레벨 file/rank 직선 슬라이딩. 첫 장애물에서 정지 (적이면 캡처 포함).
 */

import { slidingRay } from '../pathUtils.js';

const DIRS = [
    { dFile: +1, dRank:  0 }, { dFile: -1, dRank:  0 },
    { dFile:  0, dRank: +1 }, { dFile:  0, dRank: -1 },
];

export function pseudoMoves(state, piece) {
    return DIRS.flatMap(d => slidingRay(state, piece.position, d, piece.color));
}
