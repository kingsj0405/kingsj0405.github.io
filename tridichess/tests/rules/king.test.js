/**
 * tests/rules/king.test.js — King multi-candidate (ADR-0010).
 */

import { describe, it, expect } from 'vitest';
import { pseudoMoves } from '../../src/rules/pieceMovement/king.js';
import { GameState } from '../../src/model/GameState.js';
import { Piece } from '../../src/model/Piece.js';
import { SquareId } from '../../src/model/SquareId.js';

const sq = (s) => SquareId.fromString(s);
const empty = () => new GameState({ pieces: new Map() });

function place(state, key, type, color, idSuffix = '') {
    return state.setPiece(sq(key), new Piece({
        id: `${color[0]}${type}${idSuffix || 'x'}`,
        type, color, position: sq(key),
    }));
}
const targets = (state, key) =>
    new Set(pseudoMoves(state, state.getPiece(key)).map(s => s.toString()));

describe('King — multi-candidate', () => {
    it('d4(W) abs (4,4): 10 neighbors + 1 vertical = 11', () => {
        const s = place(empty(), 'd4(W)', 'K', 'white');
        const r = targets(s, 'd4(W)');
        expect(r.size).toBe(11);
        // 양 레벨 후보 양쪽 다 들어가는지 sanity
        expect(r.has('c4(W)')).toBe(true);
        expect(r.has('c2(N)')).toBe(true);
        expect(r.has('d3(W)')).toBe(true);
        expect(r.has('d1(N)')).toBe(true);
        expect(r.has('d2(N)')).toBe(true); // vertical
    });

    it('a1(W) abs (1,1): 6 neighbors + 1 vertical = 7', () => {
        const s = place(empty(), 'a1(W)', 'K', 'white');
        expect(targets(s, 'a1(W)')).toEqual(new Set([
            'b1(W)', 'a2(QL1)', 'a2(W)', 'b1(QL1)', 'b2(W)', 'a1(QL1)',
            'b2(QL1)',
        ]));
    });

    it('b3(N) abs (2,5): 16 neighbors + 1 vertical = 17', () => {
        const s = place(empty(), 'b3(N)', 'K', 'white');
        const r = targets(s, 'b3(N)');
        expect(r.size).toBe(17);
        expect(r.has('b1(B)')).toBe(true); // vertical
        expect(r.has('b2(N)')).toBe(true); // 양 후보 한쪽
        expect(r.has('b4(W)')).toBe(true); // 다른 후보 (W b4)
    });

    it('a1(QL1) abs (0,0): 4 targets', () => {
        const s = place(empty(), 'a1(QL1)', 'K', 'white');
        expect(targets(s, 'a1(QL1)')).toEqual(new Set([
            'b1(QL1)', 'a2(QL1)',
            'a1(W)', 'b2(QL1)',   // (+1,+1)→(1,1) 2 candidates
        ]));
    });
});

describe('King — blocking', () => {
    it('아군 점유 칸 제외', () => {
        let s = empty();
        s = place(s, 'a1(W)', 'K', 'white');
        s = place(s, 'a2(W)', 'P', 'white', 'A');
        expect(targets(s, 'a1(W)').has('a2(W)')).toBe(false);
    });

    it('적 점유 칸 캡처 가능', () => {
        let s = empty();
        s = place(s, 'a1(W)', 'K', 'white');
        s = place(s, 'a2(W)', 'P', 'black', 'A');
        expect(targets(s, 'a1(W)').has('a2(W)')).toBe(true);
    });

    it('vertical 칸 아군 → 제외', () => {
        let s = empty();
        s = place(s, 'a1(W)', 'K', 'white');
        s = place(s, 'b2(QL1)', 'P', 'white', 'A');
        expect(targets(s, 'a1(W)').has('b2(QL1)')).toBe(false);
    });
});
