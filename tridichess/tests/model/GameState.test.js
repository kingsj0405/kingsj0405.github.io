import { describe, it, expect } from 'vitest';
import { GameState } from '../../src/model/GameState.js';
import { Piece } from '../../src/model/Piece.js';
import { SquareId } from '../../src/model/SquareId.js';
import { createInitialState } from '../../src/model/initialState.js';

const sq = (s) => SquareId.fromString(s);

describe('GameState — basic', () => {
    it('빈 상태 생성', () => {
        const s = new GameState({ pieces: new Map() });
        expect(s.pieceCount).toBe(0);
        expect(s.turn).toBe('white');
        expect(s.rulesetId).toBe('roth2012');
        expect(Object.isFrozen(s)).toBe(true);
    });

    it('잘못된 turn / rulesetId 거부', () => {
        expect(() => new GameState({ pieces: new Map(), turn: 'red' })).toThrow();
        expect(() => new GameState({ pieces: new Map(), rulesetId: 'foo' })).toThrow();
    });

    it('with(patch) 는 새 인스턴스 반환', () => {
        const s1 = new GameState({ pieces: new Map() });
        const s2 = s1.with({ turn: 'black' });
        expect(s1.turn).toBe('white');
        expect(s2.turn).toBe('black');
        expect(s1).not.toBe(s2);
    });

    it('moveHistory 는 freeze', () => {
        const s = new GameState({ pieces: new Map(), moveHistory: [] });
        expect(Object.isFrozen(s.moveHistory)).toBe(true);
        expect(() => s.moveHistory.push('x')).toThrow();
    });
});

describe('GameState — piece manipulation', () => {
    const wK = new Piece({ id: 'wK', type: 'K', color: 'white', position: sq('d4(W)') });

    it('setPiece 후 원본 불변', () => {
        const s1 = new GameState({ pieces: new Map() });
        const s2 = s1.setPiece(sq('d4(W)'), wK);
        expect(s1.pieceCount).toBe(0);
        expect(s2.pieceCount).toBe(1);
        expect(s2.getPiece(sq('d4(W)'))).toBe(wK);
    });

    it('setPiece(null) 로 제거', () => {
        const s1 = new GameState({ pieces: new Map([['d4(W)', wK]]) });
        const s2 = s1.setPiece(sq('d4(W)'), null);
        expect(s2.pieceCount).toBe(0);
        expect(s2.getPiece(sq('d4(W)'))).toBeNull();
    });

    it('movePiece 는 position + hasMoved 갱신', () => {
        const s1 = new GameState({ pieces: new Map([['d4(W)', wK]]) });
        const s2 = s1.movePiece(sq('d4(W)'), sq('d4(N)'));
        const moved = s2.getPiece(sq('d4(N)'));
        expect(moved.position.toString()).toBe('d4(N)');
        expect(moved.hasMoved).toBe(true);
        expect(s2.getPiece(sq('d4(W)'))).toBeNull();
        // 원본 보존
        expect(s1.getPiece(sq('d4(W)'))).toBe(wK);
    });

    it('movePiece — 빈 칸에서 throw', () => {
        const s1 = new GameState({ pieces: new Map() });
        expect(() => s1.movePiece(sq('d4(W)'), sq('d4(N)'))).toThrow();
    });

    it('findKing', () => {
        const bK = new Piece({ id: 'bK', type: 'K', color: 'black', position: sq('d1(B)') });
        const s = new GameState({ pieces: new Map([
            ['d4(W)', wK],
            ['d1(B)', bK],
        ]) });
        expect(s.findKing('white').toString()).toBe('d4(W)');
        expect(s.findKing('black').toString()).toBe('d1(B)');
    });
});

describe('createInitialState', () => {
    const state = createInitialState();

    it('정확히 32개 말 배치', () => {
        expect(state.pieceCount).toBe(32);
    });

    it('White / Black 각 16개', () => {
        const counts = { white: 0, black: 0 };
        for (const p of state.pieces.values()) counts[p.color] += 1;
        expect(counts.white).toBe(16);
        expect(counts.black).toBe(16);
    });

    it('각 색 폰 8개, 룩 2, 나이트 2, 비숍 2, 퀸 1, 킹 1', () => {
        const tally = (color) => {
            const t = { K: 0, Q: 0, R: 0, B: 0, N: 0, P: 0 };
            for (const p of state.pieces.values()) {
                if (p.color === color) t[p.type] += 1;
            }
            return t;
        };
        expect(tally('white')).toEqual({ K: 1, Q: 1, R: 2, B: 2, N: 2, P: 8 });
        expect(tally('black')).toEqual({ K: 1, Q: 1, R: 2, B: 2, N: 2, P: 8 });
    });

    it('Kings 위치 c1(W) 와 c4(B)', () => {
        expect(state.findKing('white').toString()).toBe('c1(W)');
        expect(state.findKing('black').toString()).toBe('c4(B)');
    });

    it('모든 piece 의 id 가 unique', () => {
        const ids = new Set();
        for (const p of state.pieces.values()) ids.add(p.id);
        expect(ids.size).toBe(32);
    });

    it('모든 piece.position 이 Map key 와 일치', () => {
        for (const [key, piece] of state.pieces.entries()) {
            expect(piece.position.toString()).toBe(key);
        }
    });

    it('모든 piece 는 hasMoved=false', () => {
        for (const p of state.pieces.values()) {
            expect(p.hasMoved).toBe(false);
        }
    });

    it('첫 turn 은 white', () => {
        expect(state.turn).toBe('white');
    });

    it('boards: 4 AB BoardNode 초기값', () => {
        expect(state.boards.size).toBe(4);
        for (const id of ['QL1', 'KL1', 'QL3', 'KL3']) {
            const node = state.boards.get(id);
            expect(node).toBeDefined();
            expect(node.boardId).toBe(id);
            expect(['white', 'black']).toContain(node.owner);
            expect(typeof node.fileOffset).toBe('number');
            expect(typeof node.rankOffset).toBe('number');
            expect(node.inverted).toBe(false);
            expect(Object.isFrozen(node)).toBe(true);
        }
        // White owns L1, black owns L3
        expect(state.boards.get('QL1').owner).toBe('white');
        expect(state.boards.get('KL1').owner).toBe('white');
        expect(state.boards.get('QL3').owner).toBe('black');
        expect(state.boards.get('KL3').owner).toBe('black');
    });
});
