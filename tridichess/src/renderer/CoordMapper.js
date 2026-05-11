/**
 * CoordMapper.js — SquareId ↔ Three.js Vector3 변환 (Sprint 3.1 hotfix)
 *
 * 좌표계 (Star Trek Tri-D 정통 staircase 배치):
 *
 *   메인 보드 (Y 높이 + Z 후퇴 staircase):
 *     White(W)  : Y = 0,           Z_center = 0          (가장 앞)
 *     Neutral(N): Y = LEVEL_H,     Z_center = -2*SQ      (뒤로 한 단)
 *     Black(B)  : Y = 2*LEVEL_H,   Z_center = -4*SQ      (뒤로 두 단)
 *
 *   어택 보드 (각각 부모 메인 보드의 모서리에 부착):
 *     QL1 / KL1 (W에 부착): Y = LEVEL_H * 0.5,   Z_center = 0
 *     QL3 / KL3 (B에 부착): Y = LEVEL_H * 2.5,   Z_center = -6*SQ
 *
 *   X (file):       'a'=−1.5*SQ, 'b'=−0.5*SQ, 'c'=0.5*SQ, 'd'=1.5*SQ
 *   X (attack):     QL = X − 2*SQ (queen-side), KL = X + 2*SQ (king-side)
 *   Z (rank):       z = LEVEL_Z[level] + (2.5 − rank) * SQ
 *
 *   ※ M2 에서 staircase 가 잘못 제거되어 N/B 가 W 위에 직접 겹쳐 보이는 회귀가 있었음.
 *     본 hotfix 에서 원본 프로토타입 좌표로 복원.
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

// 메인 보드 Z 후퇴(staircase). 어택 보드는 부모 메인의 z_center 기준으로 어긋나게 부착.
const LEVEL_Z = {
    W:   0,
    N:  -2 * SQ,
    B:  -4 * SQ,
    QL1: 0,         // W 앞쪽 (rank 1-2 = z +21, +7)
    KL1: 0,
    QL3: -6 * SQ,   // B 뒤쪽 (rank 1-2 = z -63, -77)
    KL3: -6 * SQ,
};

const FILE_X = { a: -1.5, b: -0.5, c: 0.5, d: 1.5 };

// X 만 부모 메인 보드 옆으로 밀어냄. Z 는 LEVEL_Z 가 책임.
// QL plate center x = (FILE_X['a']+FILE_X['b'])/2 * SQ + offset*SQ = (offset-1)*SQ.
// 원하는 plate center: ±3*SQ → QL offset = -2, KL offset = +4.
// (왼쪽 a-b 컬럼이 plate 안쪽 절반에 위치하도록)
const AB_X_OFFSET = { QL1: -2, KL1: 4, QL3: -2, KL3: 4 };

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
 * 어택 보드는 ranks 1-2 만 사용하므로 plate 중심 z = LEVEL_Z + (2.5 - 1.5) * SQ.
 * @param {string} level
 * @returns {{ x:number, y:number, z:number }}
 */
export function getBoardCenter(level) {
    const isMain = MAIN_LEVELS.has(level);
    const y = LEVEL_Y[level];
    if (isMain) {
        return { x: 0, y, z: LEVEL_Z[level] };
    }
    const x = AB_X_OFFSET[level] * SQ;
    // ranks 1-2 평균 = (2.5 - 1.5) * SQ = SQ
    const z = LEVEL_Z[level] + SQ;
    return { x, y, z };
}
