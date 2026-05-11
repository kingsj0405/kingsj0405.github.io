import { describe, it, expect } from 'vitest';
import { Piece } from '../../src/model/Piece.js';
import { SquareId } from '../../src/model/SquareId.js';

const sq = (s) => SquareId.fromString(s);

describe('Piece', () => {
    it('생성 후 freeze 되어 mutate 불가', () => {
        const p = new Piece({ id: 'wK', type: 'K', color: 'white', position: sq('d4(W)') });
        expect(() => { p.type = 'Q'; }).toThrow();
        expect(Object.isFrozen(p)).toBe(true);
    });

    it('with(patch) 는 새 인스턴스 반환, 원본 불변', () => {
        const p1 = new Piece({ id: 'wK', type: 'K', color: 'white', position: sq('d4(W)') });
        const p2 = p1.with({ position: sq('d4(N)'), hasMoved: true });
        expect(p1.position.toString()).toBe('d4(W)');
        expect(p1.hasMoved).toBe(false);
        expect(p2.position.toString()).toBe('d4(N)');
        expect(p2.hasMoved).toBe(true);
        expect(p2.id).toBe('wK');
        expect(p1).not.toBe(p2);
    });

    it('잘못된 type 거부', () => {
        expect(() => new Piece({ id: 'x', type: 'X', color: 'white', position: sq('a1(W)') }))
            .toThrow(/invalid type/);
    });

    it('잘못된 color 거부', () => {
        expect(() => new Piece({ id: 'x', type: 'P', color: 'red', position: sq('a1(W)') }))
            .toThrow(/invalid color/);
    });

    it('position 이 SquareId 가 아니면 거부', () => {
        expect(() => new Piece({ id: 'x', type: 'P', color: 'white', position: 'a1(W)' }))
            .toThrow(/position must be SquareId/);
    });

    it('symbol 은 색에 따라 변함', () => {
        const wK = new Piece({ id: 'wK', type: 'K', color: 'white', position: sq('d4(W)') });
        const bK = new Piece({ id: 'bK', type: 'K', color: 'black', position: sq('d1(B)') });
        expect(wK.symbol).toBe('♔');
        expect(bK.symbol).toBe('♚');
    });

    it('equals 는 id 비교', () => {
        const a = new Piece({ id: 'wP1', type: 'P', color: 'white', position: sq('a2(W)') });
        const b = new Piece({ id: 'wP1', type: 'P', color: 'white', position: sq('a3(W)') });
        const c = new Piece({ id: 'wP2', type: 'P', color: 'white', position: sq('a2(W)') });
        expect(a.equals(b)).toBe(true);
        expect(a.equals(c)).toBe(false);
    });
});
