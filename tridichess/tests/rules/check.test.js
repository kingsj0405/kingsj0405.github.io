/**
 * tests/rules/check.test.js — isInCheck, generateLegalMoves filter, gameStatus.
 */

import { describe, it, expect } from 'vitest';
import { isInCheck, generateLegalMoves, gameStatus } from '../../src/rules/RuleController.js';
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

describe('isInCheck', () => {
    it('빈 보드에 자기 King 만: false', () => {
        const s = place(empty(), 'a1(W)', 'K', 'white');
        expect(isInCheck(s, 'white')).toBe(false);
    });

    it('적 Rook 이 King 같은 file 에서 직선 공격: true', () => {
        // a1(W) wK <- 같은 file 'a' 의 N a1 (abs file 1 abs rank 3) 적 Rook
        // 단 Rook a1(N) abs (1,3) 에서 -rank 방향으로 abs (1,2) → W a2 → (1,1) W a1
        let s = place(empty(), 'a1(W)', 'K', 'white');
        s = place(s, 'a1(N)', 'R', 'black');
        expect(isInCheck(s, 'white')).toBe(true);
    });

    it('자기 piece 가 차단하면 false', () => {
        let s = place(empty(), 'a1(W)', 'K', 'white');
        s = place(s, 'a2(W)', 'P', 'white'); // (1,2) abs, 차단
        s = place(s, 'a1(N)', 'R', 'black'); // (1,3) abs
        expect(isInCheck(s, 'white')).toBe(false);
    });

    it('흑 King 도 동일 메커니즘', () => {
        let s = place(empty(), 'a4(B)', 'K', 'black');
        s = place(s, 'a4(W)', 'R', 'white');
        expect(isInCheck(s, 'black')).toBe(true);
    });

    it('자기 King 없으면 false', () => {
        const s = place(empty(), 'a4(B)', 'K', 'black');
        expect(isInCheck(s, 'white')).toBe(false);
    });
});

describe('generateLegalMoves — self-check filter', () => {
    it('King 이 체크에서 벗어나지 못하는 수 차단', () => {
        // wK at a1(W). 흑 Rook 이 a1 abs file 공격. K 가 b1(W) 로 이동하면 빠져나옴 — 합법.
        // K 가 같은 file 안에서 a2(W) 로 가면 여전히 공격 받음 — 불법.
        let s = place(empty(), 'a1(W)', 'K', 'white');
        s = place(s, 'a1(N)', 'R', 'black'); // file 'a' 공격
        const moves = generateLegalMoves(s, sq('a1(W)')).map(m => m.toString());
        // a2(W) 로의 이동: 여전히 file 'a' 공격선상 → 불법
        expect(moves).not.toContain('a2(W)');
        // b1(W) 또는 b2(W) 등 file 'a' 벗어나는 이동: 합법 (다른 attackers 없음)
        expect(moves.length).toBeGreaterThan(0);
    });

    it('King 외 다른 piece 가 자기 King 노출하는 이동 차단 (pinned)', () => {
        // wK at a1(W). wP at a2(W) (차단). bR at a1(N).
        // wP 가 b3(W) 같은 곳으로 캡처/이동하면 King 노출 → 불법.
        let s = place(empty(), 'a1(W)', 'K', 'white');
        s = place(s, 'a2(W)', 'P', 'white', 'pin');
        s = place(s, 'a1(N)', 'R', 'black');
        // 폰의 합법 이동에서 file 'a' 떠나는 수 (대각 캡처 b3 등) 가 차단되어야 함
        const moves = generateLegalMoves(s, sq('a2(W)')).map(m => m.toString());
        // 폰이 a-file 떠나는 이동은 없어야 (대각 캡처 대상 없으니 어차피 없겠지만)
        for (const m of moves) {
            expect(m).toMatch(/^a/); // file 'a' 만 합법
        }
    });
});

describe('gameStatus', () => {
    it('초기 배치는 ongoing', () => {
        // 단순 King 두 개로 ongoing 검증 (full initial 은 복잡)
        let s = place(empty(), 'a1(W)', 'K', 'white');
        s = place(s, 'd4(B)', 'K', 'black');
        expect(gameStatus(s)).toBe('ongoing');
    });

    it('체크 + 도망갈 수 있음 → check', () => {
        let s = place(empty(), 'a1(W)', 'K', 'white');
        s = place(s, 'd4(B)', 'K', 'black');
        s = place(s, 'a1(N)', 'R', 'black'); // 백 King 체크
        expect(gameStatus(s)).toBe('check');
    });
});
