/**
 * tests/rules/attackBoard.test.js — pin-based AB 이동 (Bartmess).
 */

import { describe, it, expect } from 'vitest';
import { generateBoardMoves, applyBoardMove } from '../../src/rules/attackBoard.js';
import { Piece } from '../../src/model/Piece.js';
import { SquareId } from '../../src/model/SquareId.js';
import { createInitialState } from '../../src/model/initialState.js';

const sq = (s) => SquareId.fromString(s);

describe('Attack Board moves — initial state', () => {
    it('초기 AB 는 4 piece 라 이동 불가 (Bartmess: 빈 보드 또는 자기 폰 1개만)', () => {
        const state = createInitialState();
        const moves = generateBoardMoves(state, 'white');
        expect(moves).toEqual([]);
    });
});

describe('Attack Board moves — pin distance', () => {
    function emptyWithBoards() {
        const state = createInitialState();
        return state.with({ pieces: new Map(), capturedByWhite: [], capturedByBlack: [] });
    }

    it('빈 QL1 (W-S-up): 거리 ≤ 2 핀 = W-S-dn, N-S-up, N-S-dn (3 moves)', () => {
        const state = emptyWithBoards();
        const moves = generateBoardMoves(state, 'white').filter(m => m.boardId === 'QL1');
        const newPins = moves.map(m => m.newPin).sort();
        expect(newPins).toEqual(['N-S-dn', 'N-S-up', 'W-S-dn'].sort());
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

    it('같은 file 의 다른 AB 가 도착 핀 점유 시 이동 불가', () => {
        // KL1 은 QL 파일이 아니므로 QL1 과 충돌 X. 다른 QL 보드를 만들어 같은 pin 점유 시뮬레이션.
        let state = emptyWithBoards();
        // QL1 의 후보 핀 중 하나(N-S-up)에 가상 QL 보드를 임의 추가
        const newBoards = new Map(state.boards);
        newBoards.set('QLX', Object.freeze({
            boardId: 'QLX', fileOffset: 0, pin: 'N-S-up', rankOffset: 1, owner: 'white', inverted: false,
        }));
        state = state.with({ boards: newBoards });
        const moves = generateBoardMoves(state, 'white').filter(m => m.boardId === 'QL1');
        const pins = moves.map(m => m.newPin);
        expect(pins).not.toContain('N-S-up');
    });
});

describe('applyBoardMove', () => {
    it('pin 변경 + rankOffset 갱신 + turn flip + moveHistory append', () => {
        const state = createInitialState().with({ pieces: new Map() });
        const next = applyBoardMove(state, { boardId: 'QL1', newPin: 'N-S-up' });
        const node = next.boards.get('QL1');
        expect(node.pin).toBe('N-S-up');
        expect(node.rankOffset).toBe(1);
        expect(node.owner).toBe('white');
        expect(next.turn).toBe('black');
        expect(next.moveHistory[next.moveHistory.length - 1]).toMatch(/QL1.*W-S-up.*N-S-up/);
    });

    it('탑승 piece SquareId 유지, abs 만 동적 변함', () => {
        let state = createInitialState().with({ pieces: new Map() });
        state = state.setPiece(sq('a1(QL1)'), new Piece({
            id: 'wP-rider', type: 'P', color: 'white', position: sq('a1(QL1)'),
        }));
        const beforeAbs = sq('a1(QL1)').toAbs(state);
        expect(beforeAbs.absRank).toBe(0); // W-S-up: RO=-1 → abs rank 1+(-1)=0

        const next = applyBoardMove(state, { boardId: 'QL1', newPin: 'N-S-up' });
        const piece = next.getPiece(sq('a1(QL1)'));
        expect(piece).not.toBeNull();
        const afterAbs = sq('a1(QL1)').toAbs(next);
        expect(afterAbs.absRank).toBe(2); // N-S-up: RO=1 → abs rank 1+1=2
    });
});
