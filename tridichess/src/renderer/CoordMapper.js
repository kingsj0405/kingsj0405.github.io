/**
 * CoordMapper.js — SquareId ↔ Three.js Vector3 변환 (M2 버전)
 *
 * 보드 레이아웃 (Roth/Bartmess Franklin Mint 기준):
 *
 *   메인 보드 (X/Z 동일, Y 높이만 다름):
 *     White(W)  : Y = 0
 *     Neutral(N): Y = LEVEL_H     = 25
 *     Black(B)  : Y = 2*LEVEL_H   = 50
 *
 *   어택 보드:
 *     QL1 / KL1 : Y = LEVEL_H * 0.5   = 12.5
 *     QL3 / KL3 : Y = LEVEL_H * 2.5   = 62.5
 *
 *   X (file): 'a'=−1.5*SQ, 'b'=−0.5*SQ, 'c'=0.5*SQ, 'd'=1.5*SQ
 *   Z (rank): rank 1(앞) = +1.5*SQ, rank 4(뒤) = −1.5*SQ
 *             rank 2(어택) = +0.5*SQ
 *
 *   Attack Board 오프셋 (×SQ):
 *     QL1/QL3 : X − 2*SQ  (Queen 쪽, 좌)
 *     KL1/KL3 : X + 2*SQ  (King 쪽, 우)
 *     QL1/KL1 : Z + 1*SQ  (White 앞쪽)
 *     QL3/KL3 : Z − 1*SQ  (Black 뒤쪽)
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

const FILE_X = { a: -1.5, b: -0.5, c: 0.5, d: 1.5 };

const AB_X_OFFSET = { QL1: -2, KL1: 2, QL3: -2, KL3: 2 };
const AB_Z_OFFSET = { QL1:  1, KL1: 1, QL3: -1, KL3: -1 };

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
    let z = (2.5 - rank) * SQ; // rank 1(앞)=+1.5*SQ, rank 4(뒤)=−1.5*SQ

    if (isAttack) {
        x += AB_X_OFFSET[level] * SQ;
        z += AB_Z_OFFSET[level] * SQ;
    }

    return new THREE.Vector3(x, y + 0.5, z);
}

/**
 * 물리 보드 플레이트 중심 좌표 반환.
 * setupPhysicalBoards()와 좌표를 일치시키기 위한 헬퍼.
 * @param {string} level
 * @returns {{ x:number, y:number, z:number }}
 */
export function getBoardCenter(level) {
    switch (level) {
        case 'W':   return { x: 0,   y: 0,              z: 0  };
        case 'N':   return { x: 0,   y: LEVEL_H,        z: 0  };
        case 'B':   return { x: 0,   y: 2 * LEVEL_H,    z: 0  };
        // 어택 보드 중심 = 4개 칸 중심의 평균
        case 'QL1': return { x: -3 * SQ, y: LEVEL_H * 0.5, z:  2 * SQ };
        case 'KL1': return { x:  SQ,     y: LEVEL_H * 0.5, z:  2 * SQ };
        case 'QL3': return { x: -3 * SQ, y: LEVEL_H * 2.5, z:  0      };
        case 'KL3': return { x:  SQ,     y: LEVEL_H * 2.5, z:  0      };
        default:    throw new Error(`Unknown level: ${level}`);
    }
}
