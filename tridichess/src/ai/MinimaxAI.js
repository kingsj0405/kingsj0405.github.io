/**
 * MinimaxAI.js — alpha-beta minimax 탐색 AI.
 *
 * Material 평가 + King 캡처 종료. depth 1~3 권장 (3D 체스 branching 큼).
 * 동점 시 RNG 로 tie-break (재현성 위해 seed 가능).
 */

import { applyMove, generateAllMoves } from '../rules/RuleController.js';
import { computeMaterial }              from '../rules/material.js';

const INF = 1e9;

/**
 * @param {import('../model/GameState.js').GameState} state
 * @param {'white'|'black'} maximizingColor
 * @returns {number} 평가 점수 (maximizingColor 시점에서 큰 값 = 유리)
 */
function evaluate(state, maximizingColor) {
    const otherColor = maximizingColor === 'white' ? 'black' : 'white';
    if (!state.findKing(maximizingColor)) return -INF;
    if (!state.findKing(otherColor))      return  INF;
    const mat = computeMaterial(state);
    return maximizingColor === 'white' ? mat.advantage : -mat.advantage;
}

/**
 * 게임 종료 여부.
 */
function isTerminal(state) {
    return !state.findKing('white') || !state.findKing('black');
}

/**
 * @param {import('../model/GameState.js').GameState} state
 * @param {number} depth
 * @param {number} alpha
 * @param {number} beta
 * @param {'white'|'black'} maximizingColor
 * @returns {{ score: number, move: ({from,to}|null) }}
 */
function search(state, depth, alpha, beta, maximizingColor) {
    if (depth === 0 || isTerminal(state)) {
        return { score: evaluate(state, maximizingColor), move: null };
    }

    const moves = generateAllMoves(state);
    if (moves.length === 0) {
        return { score: evaluate(state, maximizingColor), move: null };
    }

    const isMax = state.turn === maximizingColor;
    let bestScore = isMax ? -INF : INF;
    /** @type {Array<{from,to}>} */
    let bestMoves = [];

    for (const m of moves) {
        const next = applyMove(state, m.from, m.to);
        const { score } = search(next, depth - 1, alpha, beta, maximizingColor);

        if (isMax) {
            if (score > bestScore) {
                bestScore = score;
                bestMoves = [m];
            } else if (score === bestScore) {
                bestMoves.push(m);
            }
            alpha = Math.max(alpha, bestScore);
        } else {
            if (score < bestScore) {
                bestScore = score;
                bestMoves = [m];
            } else if (score === bestScore) {
                bestMoves.push(m);
            }
            beta = Math.min(beta, bestScore);
        }
        if (beta <= alpha) break; // prune
    }

    return { score: bestScore, move: bestMoves.length > 0 ? bestMoves[0] : null, candidates: bestMoves };
}

/**
 * 현재 turn 의 root 수 후보를 minimax 평가 후 점수 내림차순 정렬해 반환.
 * @param {import('../model/GameState.js').GameState} state
 * @param {number} depth
 * @param {number} [topN=Infinity]
 * @returns {Array<{from, to, score: number}>}
 */
export function evaluateRootMoves(state, depth, topN = Infinity) {
    if (isTerminal(state)) return [];
    const moves = generateAllMoves(state);
    if (moves.length === 0) return [];
    const max = state.turn;
    const scored = moves.map(m => {
        const next = applyMove(state, m.from, m.to);
        const { score } = search(next, depth - 1, -INF, INF, max);
        return { from: m.from, to: m.to, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topN);
}

/**
 * 점수 내림차순 top-N 수, 단 from/to 가 이전 선정 수와 겹치지 않는 것만 선택.
 *
 * @param {import('../model/GameState.js').GameState} state
 * @param {number} depth
 * @param {number} [n=3]
 * @returns {Array<{from, to, score: number}>}
 */
export function topDistinctMoves(state, depth, n = 3) {
    const scored = evaluateRootMoves(state, depth);
    const used   = new Set();
    const out    = [];
    for (const m of scored) {
        const fk = m.from.toString();
        const tk = m.to.toString();
        if (used.has(fk) || used.has(tk)) continue;
        out.push(m);
        used.add(fk);
        used.add(tk);
        if (out.length >= n) break;
    }
    return out;
}

/**
 * @param {object} [opts]
 * @param {number} [opts.depth=2]
 * @param {() => number} [opts.rng=Math.random]
 */
export function createMinimaxAI({ depth = 2, rng = Math.random } = {}) {
    /**
     * @param {import('../model/GameState.js').GameState} state
     * @returns {{ from, to } | null}
     */
    return function pickMove(state) {
        if (isTerminal(state)) return null;
        const moves = generateAllMoves(state);
        if (moves.length === 0) return null;

        const result = search(state, depth, -INF, INF, state.turn);
        const candidates = result.candidates && result.candidates.length > 0
            ? result.candidates
            : (result.move ? [result.move] : moves);
        return candidates[Math.floor(rng() * candidates.length)];
    };
}
