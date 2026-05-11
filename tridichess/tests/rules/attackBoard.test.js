/**
 * tests/rules/attackBoard.test.js — M4 D-3 Attack Board 이동.
 */

import { describe, it, expect } from 'vitest';
import { generateBoardMoves, applyBoardMove } from '../../src/rules/attackBoard.js';
import { GameState } from '../../src/model/GameState.js';
import { Piece } from '../../src/model/Piece.js';
import { SquareId } from '../../src/model/SquareId.js';
import { createInitialState } from '../../src/model/initialState.js';

const sq = (s) => SquareId.fromString(s);

describe('Attack Board moves — initial state', () => {
    it('초기 AB 는 4 piece 라 이동 불가 (Roth: 빈 보드 또는 자기 폰 1개만)', () => {
        const state = createInitialState();
        const moves = generateBoardMoves(state, 'white');
        expect(moves).toEqual([]);
    });
});

describe('Attack Board moves — manual setup', () => {
    function emptyWithBoards() {
        const state = createInitialState();
        // 모든 piece 제거 → AB 도 빈 상태
        return state.with({ pieces: new Map(), capturedByWhite: [], capturedByBlack: [] });
    }

    it('빈 QL1: initial RO=-1 → +1 또는 +2 step 가능 (2 forward moves)', () => {
        const state = emptyWithBoards();
        const moves = generateBoardMoves(state, 'white').filter(m => m.boardId === 'QL1');
        // VALID = [-1..7]. -1 의 index=0. delta -2,-1 시 newIdx 음수 → 무효. +1,+2 → RO 0, 1.
        expect(moves.length).toBe(2);
        const newROs = moves.map(m => m.newRankOffset).sort((a, b) => a - b);
        expect(newROs).toEqual([0, 1]);
    });

    it('자기 폰 단 1 개만 있는 AB: 이동 가능', () => {
        let state = emptyWithBoards();
        state = state.setPiece(sq('a1(QL1)'), new Piece({
            id: 'wP-only', type: 'P', color: 'white', position: sq('a1(QL1)'),
        }));
        const moves = generateBoardMoves(state, 'white').filter(m => m.boardId === 'QL1');
        expect(moves.length).toBeGreaterThan(0);
    });

    it('상대 폰 있는 AB: 이동 불가', () => {
        let state = emptyWithBoards();
        state = state.setPiece(sq('a1(QL1)'), new Piece({
            id: 'bP', type: 'P', color: 'black', position: sq('a1(QL1)'),
        }));
        const moves = generateBoardMoves(state, 'white').filter(m => m.boardId === 'QL1');
        expect(moves.length).toBe(0);
    });
});

describe('applyBoardMove', () => {
    it('rankOffset 변경 + turn flip + moveHistory append', () => {
        const state = createInitialState().with({ pieces: new Map() });
        const next = applyBoardMove(state, { boardId: 'QL1', newRankOffset: 0 });
        expect(next.boards.get('QL1').rankOffset).toBe(0);
        expect(next.boards.get('QL1').owner).toBe('white');
        expect(next.turn).toBe('black');
        expect(next.moveHistory[next.moveHistory.length - 1]).toMatch(/QL1.*-1.*0/);
    });

    it('탑승 piece 의 SquareId 는 유지 (local 좌표). abs 만 동적 변함', () => {
        let state = createInitialState().with({ pieces: new Map() });
        state = state.setPiece(sq('a1(QL1)'), new Piece({
            id: 'wP-rider', type: 'P', color: 'white', position: sq('a1(QL1)'),
        }));
        const beforeAbs = sq('a1(QL1)').toAbs(state);
        expect(beforeAbs.absRank).toBe(0); // RO=-1 + rank 1 = 0

        const next = applyBoardMove(state, { boardId: 'QL1', newRankOffset: 1 });
        const piece = next.getPiece(sq('a1(QL1)'));
        expect(piece).not.toBeNull();
        const afterAbs = sq('a1(QL1)').toAbs(next);
        expect(afterAbs.absRank).toBe(2); // RO=1 + rank 1 = 2
    });
});
