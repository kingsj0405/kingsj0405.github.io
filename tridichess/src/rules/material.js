/**
 * material.js — piece 가치 계산.
 *
 * 표준 체스 PE values 사용 (Knight 와 Bishop 동일 3 점). King 은 종료 판정용 큰 값.
 */

export const PIECE_VALUES = {
    K: 1000,
    Q: 9,
    R: 5,
    B: 3,
    N: 3,
    P: 1,
};

/**
 * 보드 위 piece 합산. captured 는 별도 — 캡처 후 material 변화는 자연스럽게 보드 합 차이로 나타남.
 *
 * @param {import('../model/GameState.js').GameState} state
 * @returns {{ white: number, black: number, advantage: number }}
 *          advantage = white - black (양수 = 백 우세)
 */
export function computeMaterial(state) {
    let white = 0, black = 0;
    for (const p of state.pieces.values()) {
        const v = PIECE_VALUES[p.type] ?? 0;
        if (p.color === 'white') white += v;
        else                     black += v;
    }
    return { white, black, advantage: white - black };
}
