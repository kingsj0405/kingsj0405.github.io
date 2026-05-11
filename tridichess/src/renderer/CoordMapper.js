/**
 * CoordMapper.js — SquareId ↔ Three.js Vector3 변환.
 *
 * 좌표계 (ADR-0007, Bartmess 정통 staircase):
 *
 *   - 메인 보드는 다음 보드가 이전 보드의 rank 3 위에서 시작 (2 rank 씩 겹침).
 *     → N rank 1 = W rank 3, B rank 1 = N rank 3 (xy 동일).
 *   - 어택 보드 한 모서리는 메인 보드 모서리와 정확히 겹침.
 *     → QL1 b2 = W a1, KL1 a2 = W d1, QL3 b1 = B a4, KL3 a1 = B d4 (xy 동일).
 *
 *   메인 보드 Z 후퇴: W(0) → N(-2*SQ) → B(-4*SQ).
 *   어택 보드 Z:      QL1/KL1 = +SQ, QL3/KL3 = -7*SQ.
 *
 *   파일 좌표 통일 absolute file index 0..5 → x = (abs_file - 2.5) * SQ:
 *     - W/N/B files a-d = abs 1..4 → x = -1.5..+1.5 * SQ
 *     - QL* files a-b   = abs 0..1 → x = -2.5..-1.5 * SQ (AB_X_OFFSET = -1)
 *     - KL* files a-b   = abs 4..5 → x = +1.5..+2.5 * SQ (AB_X_OFFSET = +3)
 *
 *   ※ Sprint 3.1 의 hotfix 는 staircase 메인 보드만 복구하고 어택 보드는 부정확했음.
 *     본 fix 에서 어택 보드까지 정통 모서리 overlap 으로 보정 (ADR-0007).
 */

import * as THREE from 'three';
import { SQ, LEVEL_H } from '../config/constants.js';

const LEVEL_Y = {
    W:   0,
    N:   LEVEL_H,
    B:   2 * LEVEL_H,
    QL1: LEVEL_H * 0.5,
    KL1: LEVEL_H * 0.5,
    QL3: LEVEL_H * 2.5,
    KL3: LEVEL_H * 2.5,
};

// 보드별 z 원점 (z = LEVEL_Z[level] + (2.5 - rank) * SQ).
// QL1 rank 2 = +SQ + 0.5*SQ = +1.5*SQ = +21 = W a1 z (overlap).
// QL3 rank 1 = -7*SQ + 1.5*SQ = -5.5*SQ = -77 = B a4 z (overlap).
const LEVEL_Z = {
    W:   0,
    N:  -2 * SQ,
    B:  -4 * SQ,
    QL1: +SQ,
    KL1: +SQ,
    QL3: -7 * SQ,
    KL3: -7 * SQ,
};

const FILE_X = { a: -1.5, b: -0.5, c: 0.5, d: 1.5 };

// 어택 보드 file → absolute file index 시프트 (× SQ).
// QL: abs file 0..1 → file 'a'/'b' 의 W-system 인덱스 (-1.5/-0.5) 에 -1 더함.
// KL: abs file 4..5 → +3 더함.
const AB_X_OFFSET = { QL1: -1, KL1: 3, QL3: -1, KL3: 3 };

const MAIN_LEVELS = new Set(['W', 'N', 'B']);

/**
 * SquareId → Three.js Vector3 (월드 좌표)
 * @param {import('../model/SquareId.js').SquareId} squareId
 * @returns {THREE.Vector3}
 */
export function squareToVector3(squareId) {
    const { file, rank, level } = squareId;
    const isAttack = !MAIN_LEVELS.has(level);

    const y = LEVEL_Y[level];
    let x = FILE_X[file] * SQ;
    const z = LEVEL_Z[level] + (2.5 - rank) * SQ;

    if (isAttack) {
        x += AB_X_OFFSET[level] * SQ;
    }

    return new THREE.Vector3(x, y + 0.5, z);
}

/**
 * 물리 보드 플레이트 중심 좌표 반환.
 * 메인: avg files a-d → x=0;  avg ranks 1-4 → z = LEVEL_Z (rank-formula 가 SQ*(-1.5..+1.5) 평균 0).
 * 어택: avg files a-b → x = (-1 + AB_X_OFFSET)*SQ;  avg ranks 1-2 → z = LEVEL_Z + SQ.
 * @param {string} level
 * @returns {{ x:number, y:number, z:number }}
 */
export function getBoardCenter(level) {
    const isMain = MAIN_LEVELS.has(level);
    const y = LEVEL_Y[level];
    if (isMain) {
        return { x: 0, y, z: LEVEL_Z[level] };
    }
    const x = (-1 + AB_X_OFFSET[level]) * SQ;
    const z = LEVEL_Z[level] + SQ;
    return { x, y, z };
}
