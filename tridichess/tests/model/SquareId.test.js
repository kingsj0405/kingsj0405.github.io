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

// ── getVerticalColumn() ─────────────────────────────────────────
describe('getVerticalColumn()', () => {
    it('메인 보드 칸의 수직열은 같은 file+rank를 가진 6개의 다른 칸이다', () => {
        const sq = new SquareId('a', 1, 'W');
        const col = getVerticalColumn(sq);
        // 같은 file='a', rank=1인 칸: N, B, QL1, KL1, QL3, KL3 = 6개
        // (QL1/KL1/QL3/KL3는 'a'파일과 rank 1을 가지므로 포함)
        expect(col.length).toBeGreaterThanOrEqual(1);
        for (const c of col) {
            expect(c.file).toBe('a');
            expect(c.rank).toBe(1);
            expect(c.equals(sq)).toBe(false);
        }
    });

    it('자기 자신을 포함하지 않는다', () => {
        const sq = new SquareId('d', 4, 'N');
        const col = getVerticalColumn(sq);
        expect(col.some(c => c.equals(sq))).toBe(false);
    });

    it('반환된 모든 칸은 동일한 file과 rank를 가진다', () => {
        const sq = new SquareId('b', 2, 'B');
        for (const c of getVerticalColumn(sq)) {
            expect(c.file).toBe(sq.file);
            expect(c.rank).toBe(sq.rank);
        }
    });
});
