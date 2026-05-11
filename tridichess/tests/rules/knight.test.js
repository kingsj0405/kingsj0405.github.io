/**
 * tests/rules/knight.test.js — Knight multi-candidate (ADR-0010).
 */

import { describe, it, expect } from 'vitest';
import { pseudoMoves } from '../../src/rules/pieceMovement/knight.js';
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

describe('Knight — abs L-shape multi-candidate', () => {
    it('d4(W) abs (4,4): 7 targets across multiple levels', () => {
        const s = place(empty(), 'd4(W)', 'N', 'white');
        expect(targets(s, 'd4(W)')).toEqual(new Set([
            'b3(N)', 'b1(B)',  // (-2,+1)→(2,5)
            'b3(W)', 'b1(N)',  // (-2,-1)→(2,3)
            'c4(N)', 'c2(B)',  // (-1,+2)→(3,6)
            'c2(W)',           // (-1,-2)→(3,2) — N rank 0 invalid
        ]));
    });

    it('b2(W) abs (2,2): 10 targets', () => {
        const s = place(empty(), 'b2(W)', 'N', 'white');
        expect(targets(s, 'b2(W)')).toEqual(new Set([
            'd3(W)', 'd1(N)',  // (+2,+1)→(4,3)
            'd1(W)', 'a2(KL1)',// (+2,-1)→(4,1)
            'a2(QL1)',         // (-2,-1)→(0,1)
            'c4(W)', 'c2(N)',  // (+1,+2)→(3,4)
            'a4(W)', 'a2(N)',  // (-1,+2)→(1,4)
            'b1(QL1)',         // (-1,-2)→(1,0)
        ]));
    });

    it('a1(QL1) abs (0,0): 2 jumps onto W', () => {
        const s = place(empty(), 'a1(QL1)', 'N', 'white');
        expect(targets(s, 'a1(QL1)')).toEqual(new Set(['b1(W)', 'a2(W)']));
    });
});

describe('Knight — interactions', () => {
    it('아군 점유 target 제외', () => {
        let s = empty();
        s = place(s, 'b2(W)', 'N', 'white');
        s = place(s, 'd1(N)', 'P', 'white', 'A');
        expect(targets(s, 'b2(W)').has('d1(N)')).toBe(false);
        expect(targets(s, 'b2(W)').has('d3(W)')).toBe(true); // same abs different level still ok
    });

    it('적 piece target 캡처 가능', () => {
        let s = empty();
        s = place(s, 'b2(W)', 'N', 'white');
        s = place(s, 'd1(N)', 'P', 'black', 'A');
        expect(targets(s, 'b2(W)').has('d1(N)')).toBe(true);
    });
});
