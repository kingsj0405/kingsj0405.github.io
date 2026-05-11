/**
 * RandomAI.js — 무작위 이동 선택 AI.
 *
 * 자기 색의 모든 piece 중 합법 이동이 있는 piece 중 random 선택,
 * 그 piece 의 합법 target 중 random 선택. Fuzz testing 용.
 */

import { generateAllMoves } from '../rules/RuleController.js';

/**
 * @param {() => number} [rng=Math.random] — 결정론적 테스트용 시드 가능
 */
export function createRandomAI(rng = Math.random) {
    /**
     * @param {import('../model/GameState.js').GameState} state
     * @returns {{ from, to } | null} — 가능한 이동 없으면 null (terminal)
     */
    return function pickMove(state) {
        const moves = generateAllMoves(state);
        if (moves.length === 0) return null;
        return moves[Math.floor(rng() * moves.length)];
    };
}

/**
 * 시드 가능한 LCG 난수 생성기 (재현 가능 테스트용).
 */
export function seededRng(seed) {
    let s = seed >>> 0;
    return function() {
        // mulberry32
        s = (s + 0x6D2B79F5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
