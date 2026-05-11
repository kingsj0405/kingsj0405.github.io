/**
 * tests/rules/castling.test.js — Roth-2012 캐슬링 (King ↔ Rook 크로스 보드).
 */

import { describe, it, expect } from 'vitest';
import { applyMove, generateLegalMoves, isInCheck } from '../../src/rules/RuleController.js';
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

describe('Castling — kingside (white)', () => {
    it('K c1(W) + R b1(KL1) 모두 unmoved + 경로 안전 → 목적지 b1(KL1) legal', () => {
        let s = empty();
        s = place(s, 'c1(W)', 'K', 'white');
        s = place(s, 'b1(KL1)', 'R', 'white');
        s = place(s, 'd4(B)', 'K', 'black');  // 흑 King 자리만 잡아둠
        const targets = generateLegalMoves(s, sq('c1(W)')).map(t => t.toString());
        expect(targets).toContain('b1(KL1)');
    });

    it('실행: K → b1(KL1), R → c1(W)', () => {
        let s = empty();
        s = place(s, 'c1(W)', 'K', 'white');
        s = place(s, 'b1(KL1)', 'R', 'white');
        s = place(s, 'd4(B)', 'K', 'black');
        s = applyMove(s, sq('c1(W)'), sq('b1(KL1)'));
        expect(s.getPiece(sq('b1(KL1)'))?.type).toBe('K');
        expect(s.getPiece(sq('c1(W)'))?.type).toBe('R');
        expect(s.moveHistory[s.moveHistory.length - 1]).toBe('O-O');
    });

    it('K 이미 이동했으면 castle 불가', () => {
        let s = empty();
        s = place(s, 'c1(W)', 'K', 'white', { hasMoved: true });
        s = place(s, 'b1(KL1)', 'R', 'white');
        s = place(s, 'd4(B)', 'K', 'black');
        const targets = generateLegalMoves(s, sq('c1(W)')).map(t => t.toString());
        expect(targets).not.toContain('b1(KL1)');
    });

    it('현재 체크 중이면 castle 불가', () => {
        let s = empty();
        s = place(s, 'c1(W)', 'K', 'white');
        s = place(s, 'b1(KL1)', 'R', 'white');
        s = place(s, 'd4(B)', 'K', 'black');
        s = place(s, 'c1(N)', 'R', 'black'); // 흑 R 가 W K 직접 공격 (수직열 위)
        expect(isInCheck(s, 'white')).toBe(true);
        const targets = generateLegalMoves(s, sq('c1(W)')).map(t => t.toString());
        expect(targets).not.toContain('b1(KL1)');
    });
});

describe('Castling — queenside (white)', () => {
    it('Queen 이 b1(W) 비웠을 때 castle 가능 → K b1(W), R c1(W)', () => {
        let s = empty();
        s = place(s, 'c1(W)', 'K', 'white');
        s = place(s, 'a1(QL1)', 'R', 'white');
        // Queen 은 없음 (= 이미 이동했다고 가정)
        s = place(s, 'd4(B)', 'K', 'black');
        const targets = generateLegalMoves(s, sq('c1(W)')).map(t => t.toString());
        expect(targets).toContain('b1(W)');

        s = applyMove(s, sq('c1(W)'), sq('b1(W)'));
        expect(s.getPiece(sq('b1(W)'))?.type).toBe('K');
        expect(s.getPiece(sq('c1(W)'))?.type).toBe('R');
        expect(s.moveHistory[s.moveHistory.length - 1]).toBe('O-O-O');
    });

    it('Queen 이 b1(W) 에 있으면 queen-side castle 불가', () => {
        let s = empty();
        s = place(s, 'c1(W)', 'K', 'white');
        s = place(s, 'a1(QL1)', 'R', 'white');
        s = place(s, 'b1(W)', 'Q', 'white');
        s = place(s, 'd4(B)', 'K', 'black');
        const targets = generateLegalMoves(s, sq('c1(W)')).map(t => t.toString());
        expect(targets).not.toContain('b1(W)');
    });
});

describe('Castling — black', () => {
    it('흑 king-side: K c4(B) ↔ R b2(KL3)', () => {
        let s = empty();
        s = place(s, 'a1(W)', 'K', 'white');
        s = place(s, 'c4(B)', 'K', 'black');
        s = place(s, 'b2(KL3)', 'R', 'black');
        s = s.with({ turn: 'black' });
        const targets = generateLegalMoves(s, sq('c4(B)')).map(t => t.toString());
        expect(targets).toContain('b2(KL3)');
        s = applyMove(s, sq('c4(B)'), sq('b2(KL3)'));
        expect(s.getPiece(sq('b2(KL3)'))?.type).toBe('K');
        expect(s.getPiece(sq('c4(B)'))?.type).toBe('R');
    });
});
