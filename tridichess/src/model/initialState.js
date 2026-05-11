/**
 * initialState.js — Tri-D 정통 초기 배치 (ADR-0005) + AB BoardNodes (M4 D-1).
 *
 * 16 piece × 2 색. 메인 back rank 에는 B/K/Q 만, R/N 은 attack board 에 배치.
 * 백은 자기 쪽(z=+21, W rank 1)에, 흑은 자기 쪽(z=-77, B rank 4)에.
 *
 * boards: state.boards 에 4 AB BoardNode 초기값. 현재는 abs 좌표 system 의
 *         default 와 동일하므로 행동 변화 X. M4 D-2 에서 abs threading 도입 시 활용.
 */

import { GameState } from './GameState.js';
import { Piece } from './Piece.js';
import { SquareId } from './SquareId.js';

/** AB 초기 anchor (현재 SquareId BOARD_INFO 와 일치). 후속 sprint 에서 동적화. */
const INITIAL_BOARDS_RAW = [
    { boardId: 'QL1', fileOffset: 0, rankOffset: -1, owner: 'white', inverted: false },
    { boardId: 'KL1', fileOffset: 4, rankOffset: -1, owner: 'white', inverted: false },
    { boardId: 'QL3', fileOffset: 0, rankOffset:  7, owner: 'black', inverted: false },
    { boardId: 'KL3', fileOffset: 4, rankOffset:  7, owner: 'black', inverted: false },
];

const LAYOUT = [
    // ── White ────────────────────────────────────────────────
    // W rank 1 (back): B-Q-K-B
    ['a1(W)', 'B', 'white'],
    ['b1(W)', 'Q', 'white'],
    ['c1(W)', 'K', 'white'],
    ['d1(W)', 'B', 'white'],
    // W rank 2 (pawns)
    ['a2(W)', 'P', 'white'],
    ['b2(W)', 'P', 'white'],
    ['c2(W)', 'P', 'white'],
    ['d2(W)', 'P', 'white'],
    // QL1 — a(outer)=R, b(inner)=N + 2 pawns on rank 2
    ['a1(QL1)', 'R', 'white'],
    ['b1(QL1)', 'N', 'white'],
    ['a2(QL1)', 'P', 'white'],
    ['b2(QL1)', 'P', 'white'],
    // KL1 — a(inner)=N, b(outer)=R + 2 pawns
    ['a1(KL1)', 'N', 'white'],
    ['b1(KL1)', 'R', 'white'],
    ['a2(KL1)', 'P', 'white'],
    ['b2(KL1)', 'P', 'white'],

    // ── Black (mirror) ───────────────────────────────────────
    // B rank 4 (back): B-Q-K-B
    ['a4(B)', 'B', 'black'],
    ['b4(B)', 'Q', 'black'],
    ['c4(B)', 'K', 'black'],
    ['d4(B)', 'B', 'black'],
    // B rank 3 (pawns)
    ['a3(B)', 'P', 'black'],
    ['b3(B)', 'P', 'black'],
    ['c3(B)', 'P', 'black'],
    ['d3(B)', 'P', 'black'],
    // QL3 — back rank for black at rank 2 (closer to black edge)
    ['a2(QL3)', 'R', 'black'],
    ['b2(QL3)', 'N', 'black'],
    ['a1(QL3)', 'P', 'black'],
    ['b1(QL3)', 'P', 'black'],
    // KL3
    ['a2(KL3)', 'N', 'black'],
    ['b2(KL3)', 'R', 'black'],
    ['a1(KL3)', 'P', 'black'],
    ['b1(KL3)', 'P', 'black'],
];

/**
 * @param {object} [opts]
 * @param {string} [opts.rulesetId='roth2012']
 * @returns {GameState}
 */
export function createInitialState({ rulesetId = 'roth2012' } = {}) {
    const pieces = new Map();
    const counts = {};
    for (const [sqKey, type, color] of LAYOUT) {
        const colorPrefix = color === 'white' ? 'w' : 'b';
        const baseKey     = `${colorPrefix}${type}`;
        counts[baseKey]   = (counts[baseKey] ?? 0) + 1;
        // K/Q 는 단일이므로 인덱스 생략. 그 외는 wP1, wR1 처럼.
        const id = (type === 'K' || type === 'Q')
            ? baseKey
            : `${baseKey}${counts[baseKey]}`;
        const position = SquareId.fromString(sqKey);
        pieces.set(sqKey, new Piece({ id, type, color, position }));
    }
    const boards = new Map();
    for (const raw of INITIAL_BOARDS_RAW) {
        boards.set(raw.boardId, Object.freeze({ ...raw }));
    }

    return new GameState({ pieces, boards, rulesetId });
}
