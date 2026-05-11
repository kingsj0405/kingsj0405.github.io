/**
 * tests/rules/enpassant.test.js — 앙파상 룰.
 *
 * Roth-2012: 폰이 2-step 후, 다음 턴 한 번만 상대 폰이 대각 캡처 가능.
 * 도착 칸 = 통과 칸 (highest-path), 빅팀 = 2-step 한 폰의 실제 도착 칸.
 */

import { describe, it, expect } from 'vitest';
import { applyMove, generateLegalMoves } from '../../src/rules/RuleController.js';
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

describe('En passant', () => {
    it('white 폰 2-step 후 state.enPassant 설정', () => {
        let s = empty();
        s = place(s, 'a1(W)', 'K', 'white');
        s = place(s, 'd4(B)', 'K', 'black');
        s = place(s, 'b2(W)', 'P', 'white');
        // b2 → b1(N) 또는 b2(N) 의 2-step. b2(W) abs (2,2) → abs (2,4) = b2(N) (highest)
        s = applyMove(s, sq('b2(W)'), sq('b2(N)'));
        expect(s.enPassant).not.toBeNull();
        expect(s.enPassant.target.toString()).toBe('b1(N)');  // 통과 칸
        expect(s.enPassant.victim.toString()).toBe('b2(N)');  // 실제 도착
        expect(s.enPassant.color).toBe('white');
    });

    it('흑 폰이 적 enPassant target 으로 대각 캡처 → 빅팀 제거', () => {
        let s = empty();
        s = place(s, 'a1(W)', 'K', 'white');
        s = place(s, 'd4(B)', 'K', 'black');
        s = place(s, 'b2(W)', 'P', 'white');
        s = place(s, 'a4(N)', 'P', 'black');   // 흑 폰 abs (1, 6) — b2(N) abs (2, 4) 와 diag 안 됨
        // 더 간단: 흑 폰을 a2(N) abs (1, 4) — b2(N) abs (2, 4) 와 같은 rank, 옆 file
        // 흑 폰 forward 는 abs rank -1. a2(N) → a1(N) abs (1, 3) 가 enPassant target!
        s = place(s, 'a2(N)', 'P', 'black');

        // 백이 b2→b2(N) 2-step
        s = applyMove(s, sq('b2(W)'), sq('b2(N)'));
        expect(s.turn).toBe('black');
        expect(s.enPassant.target.toString()).toBe('b1(N)');

        // 흑 a2(N) 의 대각 캡처: abs (1, 4)+(+1, -1)=(2, 3) → highest = W b3
        //                       abs (1, 4)+(-1, -1)=(0, 3) → off
        // enPassant target 은 b1(N) abs (2, 3). 흑 폰 a2(N) abs (1, 4) 의 (+1, -1) 대각 = abs (2, 3)
        // highest at (2, 3) = W b3 or QL1? QL1 file 0..1 rank 0..1 no. So W b3 abs (2, 3).
        // But enPassant target = b1(N) — abs file 2 abs rank 4 = b2(N)? wait... let me recompute.
        // b1(N): N file 'b' rank 1 → abs file 2, abs rank 1+2=3. So b1(N) abs = (2, 3). 같음!
        // 그런데 highest at (2, 3) 는 어디? W b3 abs (2, 3) Y=0, N b1 abs (2, 3) Y=25. N higher.
        // 그래서 highestSquareAt(2, 3) = b1(N). enPassant target = b1(N) ✓
        // 흑 폰 a2(N) 의 diag (+1, -1) = highest at (2, 3) = b1(N). enPassant target 매치.
        const targets = generateLegalMoves(s, sq('a2(N)')).map(t => t.toString());
        expect(targets).toContain('b1(N)');

        // 캡처 실행
        s = applyMove(s, sq('a2(N)'), sq('b1(N)'));
        // 흑 폰이 b1(N) 으로, 백 폰 b2(N) 은 제거됨
        expect(s.getPiece(sq('b1(N)'))?.color).toBe('black');
        expect(s.getPiece(sq('b2(N)'))).toBeNull();
    });

    it('enPassant 는 한 턴만 유효 — 다음 턴 자동 소멸', () => {
        let s = empty();
        s = place(s, 'a1(W)', 'K', 'white');
        s = place(s, 'd4(B)', 'K', 'black');
        s = place(s, 'b2(W)', 'P', 'white');

        s = applyMove(s, sq('b2(W)'), sq('b2(N)')); // turn → black
        expect(s.enPassant).not.toBeNull();

        // 흑이 다른 수 (King 이동) → 다음 백 턴에서 enPassant 소멸
        s = applyMove(s, sq('d4(B)'), sq('c4(B)'));
        expect(s.enPassant).toBeNull();
    });
});
