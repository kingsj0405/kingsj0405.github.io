/**
 * pins.js — Attack Board 의 핀(Pin) 모델 (canonical).
 *
 * AB 는 메인 보드 모서리의 "핀" 에 부착된다. 한 file (QL 또는 KL) 당:
 *   3 메인 × 2 corner(S/N) × 2 elevation(up/dn) = 12 pins.
 *
 * pin id 형식: `<main>-<corner>-<elevation>` (예: 'W-S-up').
 * rankOffset 과 y(elevation) 는 핀에서 derived.
 */

import { LEVEL_H } from '../config/constants.js';

/** @typedef {'W-S-up'|'W-S-dn'|'W-N-up'|'W-N-dn'|'N-S-up'|'N-S-dn'|'N-N-up'|'N-N-dn'|'B-S-up'|'B-S-dn'|'B-N-up'|'B-N-dn'} PinId */

const MAIN_Y = { W: 0, N: LEVEL_H, B: 2 * LEVEL_H };
const ELEV_DELTA = LEVEL_H * 0.5; // ±12.5

/**
 * 핀이 메인 보드의 어느 모서리에 위치한지에 따라 결정되는 rankOffset.
 * - corner S (south, 가까운 쪽): AB 중심이 메인 보드 남쪽 모서리 → AB 가 메인 보드 첫 두 rank 와 겹침
 * - corner N (north, 먼 쪽):     AB 중심이 메인 보드 북쪽 모서리 → AB 가 마지막 두 rank 와 겹침
 *
 * Main rank range: W=1-4, N=3-6, B=5-8.
 * AB 점유 abs ranks = [rankOffset+1, rankOffset+2].
 */
const PIN_RANK_OFFSET = {
    'W-S': -1, 'W-N': 3,
    'N-S':  1, 'N-N': 5,
    'B-S':  3, 'B-N': 7,
};

/** distance 계산용 핀 중심 rank (메인 보드 모서리 좌표). */
const PIN_RANK_CENTER = {
    'W-S': 0.5, 'W-N': 4.5,
    'N-S': 2.5, 'N-N': 6.5,
    'B-S': 4.5, 'B-N': 8.5,
};

export const ALL_PIN_IDS = Object.freeze([
    'W-S-up', 'W-S-dn', 'W-N-up', 'W-N-dn',
    'N-S-up', 'N-S-dn', 'N-N-up', 'N-N-dn',
    'B-S-up', 'B-S-dn', 'B-N-up', 'B-N-dn',
]);

/**
 * pin id → { main, corner, up, rankOffset, y, cornerKey }
 */
export function getPin(pinId) {
    const [main, corner, elev] = pinId.split('-');
    const cornerKey = `${main}-${corner}`;
    const up = elev === 'up';
    return {
        id: pinId,
        main,
        corner,
        up,
        cornerKey,
        rankOffset: PIN_RANK_OFFSET[cornerKey],
        y: MAIN_Y[main] + (up ? ELEV_DELTA : -ELEV_DELTA),
        rankCenter: PIN_RANK_CENTER[cornerKey],
    };
}

/**
 * 두 핀 간 "rank 거리" — Bartmess "any other pin within two squares".
 * 같은 corner 의 elevation 토글은 Δ=0.
 */
export function pinRankDistance(pinA, pinB) {
    const a = getPin(pinA);
    const b = getPin(pinB);
    return Math.abs(a.rankCenter - b.rankCenter);
}
