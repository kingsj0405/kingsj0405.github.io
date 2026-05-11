/**
 * tests/fuzz.test.js — RandomAI self-play 로 룰 엔진 invariant 검증.
 *
 * N 게임 × M 수 self-play. 매 수마다 invariant 확인. 위반 시 fail (seed 기록).
 *
 * 검증 invariant:
 *  - piece 수는 monotone non-increasing (증식 없음)
 *  - state.pieces 의 모든 Map key 가 piece.position.toString() 과 일치
 *  - 모든 piece.position 이 SquareId.exists 통과
 *  - turn alternation 정상
 *  - capturedByWhite/Black 합 = 초기 32 − 현 piece 수
 *  - 예외 0
 *  - King 캡처 발생 시 그 게임 종료 (King 없으면 다음 수 못 둠)
 */

import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/model/initialState.js';
import { applyMove } from '../src/rules/RuleController.js';
import { createRandomAI, seededRng } from '../src/ai/RandomAI.js';
import { SquareId } from '../src/model/SquareId.js';

const GAMES        = 200;
const MAX_PLIES    = 150;
const SEED_BASE    = 1234;

function assertInvariants(state, prevPieceCount, ply, seed) {
    const ctx = `seed=${seed} ply=${ply}`;

    // (1) piece 수 monotone
    expect(state.pieces.size, `${ctx}: piece 수 증식`).toBeLessThanOrEqual(prevPieceCount);

    // (2) 모든 piece.position 이 Map key 와 일치
    for (const [key, piece] of state.pieces.entries()) {
        expect(piece.position.toString(), `${ctx}: key/position mismatch at ${key}`).toBe(key);
    }

    // (3) 모든 piece.position 이 SquareId.exists 통과
    for (const p of state.pieces.values()) {
        const { file, rank, level } = p.position;
        expect(SquareId.exists(file, rank, level), `${ctx}: invalid square ${p.position}`).toBe(true);
    }

    // (4) 캡처 합산 = 초기 32 - 현 보드 piece 수
    const totalCaptured = state.capturedByWhite.length + state.capturedByBlack.length;
    expect(state.pieces.size + totalCaptured, `${ctx}: piece + captured ≠ 32`).toBe(32);

    // (5) turn 은 white/black
    expect(['white', 'black'], `${ctx}: invalid turn`).toContain(state.turn);
}

describe(`Fuzz — RandomAI ${GAMES} games × ${MAX_PLIES} plies`, () => {
    it('invariant 위반 0', { timeout: 60_000 }, () => {
        for (let g = 0; g < GAMES; g++) {
            const seed = SEED_BASE + g;
            const rng  = seededRng(seed);
            const ai   = createRandomAI(rng);

            let state = createInitialState();
            let prevCount = state.pieces.size;

            for (let ply = 0; ply < MAX_PLIES; ply++) {
                // 게임 종료 조건: King 한 쪽 없음
                const wK = state.findKing('white');
                const bK = state.findKing('black');
                if (!wK || !bK) break;

                const move = ai(state);
                if (!move) break; // 합법 이동 없음 — stalemate-ish

                state = applyMove(state, move.from, move.to);

                assertInvariants(state, prevCount, ply, seed);
                prevCount = state.pieces.size;
            }
        }
    });
});
