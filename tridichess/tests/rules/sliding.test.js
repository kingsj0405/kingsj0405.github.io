/**
 * tests/rules/sliding.test.js — Rook/Bishop/Queen multi-candidate (ADR-0010).
 */

import { describe, it, expect } from 'vitest';
import { pseudoMoves as rookMoves }   from '../../src/rules/pieceMovement/rook.js';
import { pseudoMoves as bishopMoves } from '../../src/rules/pieceMovement/bishop.js';
import { pseudoMoves as queenMoves }  from '../../src/rules/pieceMovement/queen.js';
import { GameState } from '../../src/model/GameState.js';
import { Piece } from '../../src/model/Piece.js';
import { SquareId } from '../../src/model/SquareId.js';

const sq = (s) => SquareId.fromString(s);
const empty = () => new GameState({ pieces: new Map() });

function place(state, key, type, color) {
    return state.setPiece(sq(key), new Piece({
        id: `${color[0]}${type}-${key}`,
        type, color, position: sq(key),
    }));
}
const toSet = (arr) => new Set(arr.map(s => s.toString()));

describe('Rook — multi-candidate sliding', () => {
    it('d1(W) abs (4,1) 빈 보드: 양 레벨 후보 모두 포함', () => {
        const s = place(empty(), 'd1(W)', 'R', 'white');
        const r = toSet(rookMoves(s, s.getPiece(sq('d1(W)'))));
        // +rank ray (양 후보):
        expect(r.has('d2(W)')).toBe(true);
        expect(r.has('d3(W)')).toBe(true); expect(r.has('d1(N)')).toBe(true);
        expect(r.has('d4(W)')).toBe(true); expect(r.has('d2(N)')).toBe(true);
        expect(r.has('d3(N)')).toBe(true); expect(r.has('d1(B)')).toBe(true);
        expect(r.has('d4(N)')).toBe(true); expect(r.has('d2(B)')).toBe(true);
        expect(r.has('d3(B)')).toBe(true);
        expect(r.has('d4(B)')).toBe(true); expect(r.has('a1(KL3)')).toBe(true);
        expect(r.has('a2(KL3)')).toBe(true);
        // -file ray:
        expect(r.has('c1(W)')).toBe(true);
        expect(r.has('b1(W)')).toBe(true);
        expect(r.has('a1(W)')).toBe(true); expect(r.has('b2(QL1)')).toBe(true);
        expect(r.has('a2(QL1)')).toBe(true);
        // +file / -rank:
        expect(r.has('b2(KL1)')).toBe(true);
        expect(r.has('a1(KL1)')).toBe(true);
    });

    it('적 차단: 적 후보가 끝 cell 에 있으면 capture 가능', () => {
        let s = empty();
        s = place(s, 'd1(W)', 'R', 'white');
        s = place(s, 'd1(N)', 'P', 'black');     // (4,3) abs N
        const r = toSet(rookMoves(s, s.getPiece(sq('d1(W)'))));
        expect(r.has('d2(W)')).toBe(true);   // (4,2) 통과
        expect(r.has('d3(W)')).toBe(true);   // (4,3) 같은 abs 의 다른 후보
        expect(r.has('d1(N)')).toBe(true);   // capture
        expect(r.has('d2(N)')).toBe(false);  // 차단 너머
    });

    it('아군 차단: 같은 abs cell 에 아군 → 그 후보 제외, sliding 정지', () => {
        let s = empty();
        s = place(s, 'd1(W)', 'R', 'white');
        s = place(s, 'd1(N)', 'P', 'white'); // 아군
        const r = toSet(rookMoves(s, s.getPiece(sq('d1(W)'))));
        expect(r.has('d3(W)')).toBe(true);  // 같은 cell 다른 후보는 OK
        expect(r.has('d1(N)')).toBe(false); // 아군 제외
        expect(r.has('d2(N)')).toBe(false); // 너머 차단
    });
});

describe('Bishop — multi-candidate sliding', () => {
    it('a1(W) corner 대각: (+1,+1) ray 양 후보', () => {
        const s = place(empty(), 'a1(W)', 'B', 'white');
        const r = toSet(bishopMoves(s, s.getPiece(sq('a1(W)'))));
        expect(r.has('b2(W)')).toBe(true);
        // (2, 2) (1 step) — only W b2 candidate
        expect(r.has('c3(W)')).toBe(true); expect(r.has('c1(N)')).toBe(true);  // (3,3)
        expect(r.has('d4(W)')).toBe(true); expect(r.has('d2(N)')).toBe(true);  // (4,4)
        // (-1,-1) ray:
        expect(r.has('a1(QL1)')).toBe(true);
    });
});

describe('Queen — rook + bishop', () => {
    it('Queen 후보 = Rook ∪ Bishop', () => {
        const s = place(empty(), 'b2(W)', 'Q', 'white');
        const q = toSet(queenMoves(s, s.getPiece(sq('b2(W)'))));
        const r = toSet(rookMoves(s,   s.getPiece(sq('b2(W)'))));
        const b = toSet(bishopMoves(s, s.getPiece(sq('b2(W)'))));
        for (const t of r) expect(q.has(t)).toBe(true);
        for (const t of b) expect(q.has(t)).toBe(true);
        expect(q.size).toBe(r.size + b.size);
    });
});
