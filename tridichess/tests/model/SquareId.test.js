/**
 * tests/model/SquareId.test.js
 *
 * SquareId 클래스 및 getAllSquares(), getVerticalColumn() 단위 테스트.
 */

import { describe, it, expect } from 'vitest';
import {
    SquareId,
    getAllSquares,
    getVerticalColumn,
    LEVELS,
    FILES,
} from '../../src/model/SquareId.js';

// ── SquareId 기본 동작 ───────────────────────────────────────────
describe('SquareId', () => {
    it('toString()이 올바른 형식을 반환한다', () => {
        expect(new SquareId('d', 4, 'N').toString()).toBe('d4(N)');
        expect(new SquareId('a', 1, 'W').toString()).toBe('a1(W)');
        expect(new SquareId('b', 2, 'QL1').toString()).toBe('b2(QL1)');
    });

    it('fromString() 역직렬화가 올바르게 동작한다', () => {
        const sq = SquareId.fromString('d4(N)');
        expect(sq.file).toBe('d');
        expect(sq.rank).toBe(4);
        expect(sq.level).toBe('N');
    });

    it('직렬화 → 역직렬화 round-trip이 동일한 값을 생성한다', () => {
        const original = new SquareId('c', 3, 'QL3');
        const restored = SquareId.fromString(original.toString());
        expect(restored.file).toBe(original.file);
        expect(restored.rank).toBe(original.rank);
        expect(restored.level).toBe(original.level);
    });

    it('equals()가 동일 값 객체를 true로 판정한다', () => {
        const a = new SquareId('a', 1, 'W');
        const b = new SquareId('a', 1, 'W');
        expect(a.equals(b)).toBe(true);
    });

    it('equals()가 다른 값 객체를 false로 판정한다', () => {
        const a = new SquareId('a', 1, 'W');
        const b = new SquareId('a', 1, 'N');
        expect(a.equals(b)).toBe(false);
    });

    it('Object.freeze로 인해 불변 객체이다', () => {
        const sq = new SquareId('b', 2, 'N');
        expect(() => { sq.file = 'c'; }).toThrow();
    });

    it('isMainBoard / isAttackBoard가 올바르게 동작한다', () => {
        expect(new SquareId('a', 1, 'W').isMainBoard).toBe(true);
        expect(new SquareId('a', 1, 'W').isAttackBoard).toBe(false);
        expect(new SquareId('a', 1, 'QL1').isMainBoard).toBe(false);
        expect(new SquareId('a', 1, 'QL1').isAttackBoard).toBe(true);
    });

    it('잘못된 문자열에 fromString()이 에러를 던진다', () => {
        expect(() => SquareId.fromString('invalid')).toThrow();
        expect(() => SquareId.fromString('e1(W)')).toThrow(); // 'e' 파일 없음
    });
});

// ── getAllSquares() ─────────────────────────────────────────────
describe('getAllSquares()', () => {
    it('정확히 64개 칸을 반환한다', () => {
        expect(getAllSquares().length).toBe(64);
    });

    it('메인 보드 칸이 48개이다 (3 × 16)', () => {
        const mainCount = getAllSquares().filter(sq => sq.isMainBoard).length;
        expect(mainCount).toBe(48);
    });

    it('어택 보드 칸이 16개이다 (4 × 4)', () => {
        const attackCount = getAllSquares().filter(sq => sq.isAttackBoard).length;
        expect(attackCount).toBe(16);
    });

    it('모든 레벨이 포함된다', () => {
        const squares = getAllSquares();
        for (const level of LEVELS.ALL) {
            expect(squares.some(sq => sq.level === level)).toBe(true);
        }
    });

    it('중복 SquareId가 없다 (toString 유일성)', () => {
        const keys = getAllSquares().map(sq => sq.toString());
        const unique = new Set(keys);
        expect(unique.size).toBe(keys.length);
    });

    it('메인 보드는 파일 a-d, 랭크 1-4를 모두 포함한다', () => {
        const squares = getAllSquares();
        for (const level of LEVELS.MAIN) {
            for (const file of FILES) {
                for (const rank of [1, 2, 3, 4]) {
                    const found = squares.some(
                        sq => sq.file === file && sq.rank === rank && sq.level === level
                    );
                    expect(found).toBe(true);
                }
            }
        }
    });

    it('어택 보드는 파일 a-b, 랭크 1-2만 포함한다', () => {
        const attackSquares = getAllSquares().filter(sq => sq.isAttackBoard);
        for (const sq of attackSquares) {
            expect(['a', 'b']).toContain(sq.file);
            expect([1, 2]).toContain(sq.rank);
        }
    });
});

// ── getVerticalColumn() — abs 기반 (ADR-0009) ────────────────
describe('getVerticalColumn() — abs 좌표 기반', () => {
    it('a1(W) 와 b2(QL1) 가 같은 abs(1,1) 에서 vertical pair', () => {
        const a1W   = new SquareId('a', 1, 'W');
        const b2QL1 = new SquareId('b', 2, 'QL1');
        expect(getVerticalColumn(a1W).map(s => s.toString())).toEqual(['b2(QL1)']);
        expect(getVerticalColumn(b2QL1).map(s => s.toString())).toEqual(['a1(W)']);
    });

    it('a3(W) 와 a1(N) 이 abs(1,3) 에서 vertical pair', () => {
        const a3W = new SquareId('a', 3, 'W');
        expect(getVerticalColumn(a3W).map(s => s.toString())).toEqual(['a1(N)']);
    });

    it('a3(N) 과 a1(B) 가 abs(1,5) 에서 vertical pair', () => {
        const a3N = new SquareId('a', 3, 'N');
        expect(getVerticalColumn(a3N).map(s => s.toString())).toEqual(['a1(B)']);
    });

    it('a4(B) 와 b1(QL3) 가 abs(1,8) 에서 vertical pair', () => {
        const a4B = new SquareId('a', 4, 'B');
        expect(getVerticalColumn(a4B).map(s => s.toString())).toEqual(['b1(QL3)']);
    });

    it('overlap 없는 칸 (예: a2(W) abs(1,2)) 은 빈 배열', () => {
        const a2W = new SquareId('a', 2, 'W');
        expect(getVerticalColumn(a2W)).toEqual([]);
    });

    it('자기 자신은 포함 안 됨', () => {
        const sq  = new SquareId('a', 3, 'W');
        const col = getVerticalColumn(sq);
        expect(col.some(c => c.equals(sq))).toBe(false);
    });
});

// ── toAbs / highestSquareAt ─────────────────────────────────
describe('toAbs() / highestSquareAt()', () => {
    it('W a1 abs = (1, 1)', () => {
        expect(new SquareId('a', 1, 'W').toAbs()).toEqual({ absFile: 1, absRank: 1 });
    });

    it('QL1 b2 abs = (1, 1) (= W a1 abs)', () => {
        expect(new SquareId('b', 2, 'QL1').toAbs()).toEqual({ absFile: 1, absRank: 1 });
    });

    it('B d4 abs = (4, 8)', () => {
        expect(new SquareId('d', 4, 'B').toAbs()).toEqual({ absFile: 4, absRank: 8 });
    });

    it('KL3 a1 abs = (4, 8) (= B d4 abs)', () => {
        expect(new SquareId('a', 1, 'KL3').toAbs()).toEqual({ absFile: 4, absRank: 8 });
    });
});

describe('SquareId.exists', () => {
    it('메인 보드: file a-d, rank 1-4 만 유효', () => {
        for (const level of ['W', 'N', 'B']) {
            expect(SquareId.exists('a', 1, level)).toBe(true);
            expect(SquareId.exists('d', 4, level)).toBe(true);
            expect(SquareId.exists('e', 1, level)).toBe(false);
            expect(SquareId.exists('a', 5, level)).toBe(false);
            expect(SquareId.exists('a', 0, level)).toBe(false);
        }
    });

    it('어택 보드: file a-b, rank 1-2 만 유효', () => {
        for (const level of ['QL1', 'KL1', 'QL3', 'KL3']) {
            expect(SquareId.exists('a', 1, level)).toBe(true);
            expect(SquareId.exists('b', 2, level)).toBe(true);
            expect(SquareId.exists('c', 1, level)).toBe(false);
            expect(SquareId.exists('a', 3, level)).toBe(false);
        }
    });

    it('알 수 없는 level 거부', () => {
        expect(SquareId.exists('a', 1, 'X')).toBe(false);
        expect(SquareId.exists('a', 1, 'QL2')).toBe(false);
    });
});
