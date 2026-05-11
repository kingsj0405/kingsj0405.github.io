/**
 * tests/rules/pawn.test.js — Pawn multi-candidate (ADR-0010).
 */

import { describe, it, expect } from 'vitest';
import { pseudoMoves } from '../../src/rules/pieceMovement/pawn.js';
import { GameState } from '../../src/model/GameState.js';
import { Piece } from '../../src/model/Piece.js';
import { SquareId } from '../../src/model/SquareId.js';

const sq = (s) => SquareId.fromString(s);
const empty = () => new GameState({ pieces: new Map() });

function place(state, key, type, color, opts = {}) {
    return state.setPiece(sq(key), new Piece({
        id: `${color[0]}${type}-${key}`,
        type, color, position: sq(key),
        hasMoved: opts.hasMoved ?? false,
    }));
}
const moves = (state, key) =>
    new Set(pseudoMoves(state, state.getPiece(key)).map(s => s.toString()));

describe('Pawn — forward (multi-candidate, player choice)', () => {
    it('흰 폰 a2(W) 첫 이동: W/N 4 후보 (a3W, a1N, a4W, a2N)', () => {
        const s = place(empty(), 'a2(W)', 'P', 'white');
        expect(moves(s, 'a2(W)')).toEqual(new Set([
            'a3(W)', 'a1(N)',  // fwd1 abs (1,3)
            'a4(W)', 'a2(N)',  // fwd2 abs (1,4)
        ]));
    });

    it('흰 폰 hasMoved=true: fwd1 만 (2 후보)', () => {
        const s = place(empty(), 'a2(W)', 'P', 'white', { hasMoved: true });
        expect(moves(s, 'a2(W)')).toEqual(new Set(['a3(W)', 'a1(N)']));
    });

    it('흑 폰 a3(B) 첫 이동: N/B 4 후보 — 흑이 N 으로 내려감', () => {
        const s = place(empty(), 'a3(B)', 'P', 'black');
        expect(moves(s, 'a3(B)')).toEqual(new Set([
            'a4(N)', 'a2(B)',  // fwd1 abs (1,6)
            'a3(N)', 'a1(B)',  // fwd2 abs (1,5)
        ]));
    });

    it('W rank 4 흰 폰: 3D 로 N/B 까지 진출', () => {
        const s = place(empty(), 'a4(W)', 'P', 'white');
        expect(moves(s, 'a4(W)')).toEqual(new Set([
            'a3(N)', 'a1(B)',  // fwd1 abs (1,5)
            'a4(N)', 'a2(B)',  // fwd2 abs (1,6)
        ]));
    });

    it('fwd1 후보 중 하나라도 아군 → 그 후보 제외, fwd2 도 차단', () => {
        let s = empty();
        s = place(s, 'a2(W)', 'P', 'white');
        s = place(s, 'a1(N)', 'P', 'white', { hasMoved: true });
        // fwd1 cands {a3(W), a1(N)}. a3(W) 비어 → 후보. a1(N) 아군 → 제외. allFwd1Empty=false → fwd2 차단.
        expect(moves(s, 'a2(W)')).toEqual(new Set(['a3(W)']));
    });

    it('fwd1 비어, fwd2 의 한 후보가 적 → fwd2 그 후보만 제외', () => {
        let s = empty();
        s = place(s, 'a2(W)', 'P', 'white');
        s = place(s, 'a2(N)', 'P', 'black');
        // fwd1 cands 모두 비어. fwd2 cands {a4(W), a2(N)}. a4(W) 빈 칸 → 후보. a2(N) 적 → 폰 전진 캡처 불가 → 제외.
        expect(moves(s, 'a2(W)')).toEqual(new Set(['a3(W)', 'a1(N)', 'a4(W)']));
    });
});

describe('Pawn — diagonal capture', () => {
    it('대각 적 캡처 — abs target 의 모든 적 후보', () => {
        // b2(W) abs (2,2). diag(-1)→(1,3) {a3W, a1N}. diag(+1)→(3,3) {c3W, c1N}.
        let s = empty();
        s = place(s, 'b2(W)', 'P', 'white');
        s = place(s, 'a3(W)', 'P', 'black');
        s = place(s, 'c1(N)', 'P', 'black');
        const r = moves(s, 'b2(W)');
        expect(r.has('a3(W)')).toBe(true);
        expect(r.has('c1(N)')).toBe(true);
    });

    it('대각 빈 칸 못 감 (캡처 아님)', () => {
        const s = place(empty(), 'b2(W)', 'P', 'white');
        const r = moves(s, 'b2(W)');
        expect(r.has('a3(W)')).toBe(false);
        expect(r.has('c1(N)')).toBe(false);
    });

    it('대각 아군 캡처 불가', () => {
        let s = empty();
        s = place(s, 'b2(W)', 'P', 'white');
        s = place(s, 'a3(W)', 'P', 'white', { hasMoved: true });
        expect(moves(s, 'b2(W)').has('a3(W)')).toBe(false);
    });

    it('흑 폰 대각 캡처', () => {
        // b3(B) abs (2,7). diag(-1)→(1,6) {a4N, a2B}. diag(+1)→(3,6) {c4N, c2B}.
        let s = empty();
        s = place(s, 'b3(B)', 'P', 'black');
        s = place(s, 'a2(B)', 'P', 'white');
        s = place(s, 'a4(N)', 'P', 'white');
        const r = moves(s, 'b3(B)');
        expect(r.has('a2(B)')).toBe(true);
        expect(r.has('a4(N)')).toBe(true);
    });
});
