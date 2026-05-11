/**
 * CoordMapper.js — SquareId ↔ Three.js Vector3 변환 (M4 D-3: state-aware).
 *
 * 좌표계 (ADR-0007, Bartmess 정통):
 *   - x = (abs_file - 2.5) * SQ
 *   - z = (2.5 - abs_rank) * SQ
 *   - y = 메인 (W=0, N=25, B=50) / AB (rankOffset 에 따라 12.5 / 37.5 / 62.5)
 *
 *   abs_file = local_file_index + fileOffset
 *   abs_rank = local_rank + rankOffset
 *
 * fileOffset / rankOffset: 메인은 고정, AB 는 state.boards 의 BoardNode 동적.
 */

import * as THREE from 'three';
import { SQ, LEVEL_H } from '../config/constants.js';
import { FILE_INDEX } from '../model/SquareId.js';
import { getPin } from '../rules/pins.js';

// 메인 보드는 고정. AB default (state 없을 때) 는 초기 pin 위치.
const DEFAULT_OFFSETS = {
    W:   { fileOffset: 1, rankOffset: 0,  y: 0 },
    QL1: { fileOffset: 0, rankOffset: -1, y: LEVEL_H * 0.5 },
    KL1: { fileOffset: 4, rankOffset: -1, y: LEVEL_H * 0.5 },
    N:   { fileOffset: 1, rankOffset: 2,  y: LEVEL_H },
    B:   { fileOffset: 1, rankOffset: 4,  y: 2 * LEVEL_H },
    QL3: { fileOffset: 0, rankOffset: 7,  y: LEVEL_H * 2.5 },
    KL3: { fileOffset: 4, rankOffset: 7,  y: LEVEL_H * 2.5 },
};

const MAIN_LEVELS = new Set(['W', 'N', 'B']);

function getOffsets(level, state) {
    if (state && state.boards && state.boards.has(level)) {
        const node = state.boards.get(level);
        const pin = node.pin ? getPin(node.pin) : null;
        return {
            fileOffset: node.fileOffset,
            rankOffset: pin ? pin.rankOffset : node.rankOffset,
            y: pin ? pin.y : DEFAULT_OFFSETS[level].y,
        };
    }
    return DEFAULT_OFFSETS[level];
}

function getY(level, off) {
    if (level === 'W') return 0;
    if (level === 'N') return LEVEL_H;
    if (level === 'B') return 2 * LEVEL_H;
    return off.y;
}

/**
 * SquareId → Three.js Vector3.
 * state 가 주어지면 AB 동적 anchor 반영.
 */
export function squareToVector3(squareId, state) {
    const { file, rank, level } = squareId;
    const off = getOffsets(level, state);
    const absFile = FILE_INDEX[file] + off.fileOffset;
    const absRank = rank + off.rankOffset;
    const x = (absFile - 2.5) * SQ;
    const z = (2.5 - absRank) * SQ;
    const y = getY(level, off);
    return new THREE.Vector3(x, y + 0.5, z);
}

/**
 * 보드 플레이트 중심 좌표.
 * 메인 (4x4): avg abs file 2.5 → x=0; mid abs rank = 2.5 + rankOffset → z = -rankOffset * SQ
 *             (rank 1..4 mid = 2.5 → abs mid = 2.5 + RO → z = (2.5 - (2.5+RO))*SQ = -RO*SQ)
 * AB (2x2): mid abs file = 0.5 + fileOffset; mid abs rank = 1.5 + rankOffset
 */
export function getBoardCenter(level, state) {
    const off = getOffsets(level, state);
    const isMain = MAIN_LEVELS.has(level);
    if (isMain) {
        return { x: 0, y: getY(level, off), z: -off.rankOffset * SQ };
    }
    const midAbsFile = 0.5 + off.fileOffset;
    const midAbsRank = 1.5 + off.rankOffset;
    return {
        x: (midAbsFile - 2.5) * SQ,
        y: getY(level, off),
        z: (2.5 - midAbsRank) * SQ,
    };
}
