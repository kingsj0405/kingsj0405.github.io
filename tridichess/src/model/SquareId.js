/**
 * SquareId.js — 3D 체스판 좌표 식별자
 *
 * file : 'a' | 'b' | 'c' | 'd'  (메인 보드 4파일; 어택 보드 a-b만 사용)
 * rank : 1 ~ 4                    (메인 보드); 1 ~ 2 (어택 보드)
 * level: 'W' | 'N' | 'B'         (메인 보드 3장)
 *         | 'QL1' | 'KL1'         (White 쪽 어택 보드)
 *         | 'QL3' | 'KL3'         (Black 쪽 어택 보드)
 *
 * 문자열 표현 예: "d4(N)", "b1(QL1)"
 */

export const FILE_INDEX = { a: 0, b: 1, c: 2, d: 3 };
export const FILES       = ['a', 'b', 'c', 'd'];

export const LEVELS = {
    MAIN:   ['W', 'N', 'B'],
    ATTACK: ['QL1', 'KL1', 'QL3', 'KL3'],
    ALL:    ['W', 'N', 'B', 'QL1', 'KL1', 'QL3', 'KL3'],
};

/**
 * 보드별 absolute 좌표 변환 정보 (ADR-0007/0009).
 *
 *   - fileOffset / rankOffset: SquareId local → abs 변환
 *   - minF/maxF/minR/maxR:     해당 보드가 점유하는 abs (file, rank) 범위
 *   - yIndex: Y 높이 인덱스 (highest-path 선정 우선순위)
 */
const BOARD_INFO = {
    W:   { fileOffset: 1, rankOffset: 0,  minF: 1, maxF: 4, minR: 1, maxR: 4, yIndex: 0 },
    QL1: { fileOffset: 0, rankOffset: -1, minF: 0, maxF: 1, minR: 0, maxR: 1, yIndex: 1 },
    KL1: { fileOffset: 4, rankOffset: -1, minF: 4, maxF: 5, minR: 0, maxR: 1, yIndex: 1 },
    N:   { fileOffset: 1, rankOffset: 2,  minF: 1, maxF: 4, minR: 3, maxR: 6, yIndex: 2 },
    B:   { fileOffset: 1, rankOffset: 4,  minF: 1, maxF: 4, minR: 5, maxR: 8, yIndex: 3 },
    QL3: { fileOffset: 0, rankOffset: 7,  minF: 0, maxF: 1, minR: 8, maxR: 9, yIndex: 4 },
    KL3: { fileOffset: 4, rankOffset: 7,  minF: 4, maxF: 5, minR: 8, maxR: 9, yIndex: 4 },
};

// 높이 내림차순 (highest-path 우선순위)
const LEVEL_Y_ORDER = ['QL3', 'KL3', 'B', 'N', 'QL1', 'KL1', 'W'];

export class SquareId {
    constructor(file, rank, level) {
        this.file  = file;
        this.rank  = rank;
        this.level = level;
        Object.freeze(this);
    }

    toString()  { return `${this.file}${this.rank}(${this.level})`; }

    static fromString(s) {
        const m = s.match(/^([a-d])(\d)\(([^)]+)\)$/);
        if (!m) throw new Error(`Invalid SquareId: "${s}"`);
        return new SquareId(m[1], parseInt(m[2], 10), m[3]);
    }

    equals(other) {
        return other instanceof SquareId && this.toString() === other.toString();
    }

    get isMainBoard()   { return LEVELS.MAIN.includes(this.level); }
    get isAttackBoard() { return LEVELS.ATTACK.includes(this.level); }

    /** Main: a-d, 1-4. Attack: a-b, 1-2. */
    static exists(file, rank, level) {
        if (LEVELS.MAIN.includes(level)) {
            return FILES.includes(file) && Number.isInteger(rank) && rank >= 1 && rank <= 4;
        }
        if (LEVELS.ATTACK.includes(level)) {
            return (file === 'a' || file === 'b') && (rank === 1 || rank === 2);
        }
        return false;
    }

    /** local → absolute 좌표 (보드 위치 공통 그리드, ADR-0007). */
    toAbs() {
        const info = BOARD_INFO[this.level];
        return {
            absFile: FILE_INDEX[this.file] + info.fileOffset,
            absRank: this.rank + info.rankOffset,
        };
    }
}

const MAIN_FILES   = ['a', 'b', 'c', 'd'];
const MAIN_RANKS   = [1, 2, 3, 4];
const ATTACK_FILES = ['a', 'b'];
const ATTACK_RANKS = [1, 2];

export function getAllSquares() {
    const squares = [];
    for (const level of LEVELS.MAIN) {
        for (const rank of MAIN_RANKS) {
            for (const file of MAIN_FILES) {
                squares.push(new SquareId(file, rank, level));
            }
        }
    }
    for (const level of LEVELS.ATTACK) {
        for (const rank of ATTACK_RANKS) {
            for (const file of ATTACK_FILES) {
                squares.push(new SquareId(file, rank, level));
            }
        }
    }
    return squares;
}

/**
 * (absFile, absRank) 에 존재하는 모든 SquareId 반환 (0~2 개).
 * Y 내림차순 정렬 — 0 번째가 highest path 대상.
 */
export function allSquaresAt(absFile, absRank) {
    const out = [];
    for (const level of LEVEL_Y_ORDER) {
        const info = BOARD_INFO[level];
        if (absFile < info.minF || absFile > info.maxF) continue;
        if (absRank < info.minR || absRank > info.maxR) continue;
        const localFile = FILES[absFile - info.fileOffset];
        const localRank = absRank - info.rankOffset;
        out.push(new SquareId(localFile, localRank, level));
    }
    return out;
}

/** (absFile, absRank) 의 highest 레벨 SquareId 반환, 없으면 null. */
export function highestSquareAt(absFile, absRank) {
    for (const level of LEVEL_Y_ORDER) {
        const info = BOARD_INFO[level];
        if (absFile < info.minF || absFile > info.maxF) continue;
        if (absRank < info.minR || absRank > info.maxR) continue;
        const localFile = FILES[absFile - info.fileOffset];
        const localRank = absRank - info.rankOffset;
        return new SquareId(localFile, localRank, level);
    }
    return null;
}

/**
 * 주어진 SquareId 와 같은 (absFile, absRank) 의 다른 SquareId 들.
 * 즉 물리적으로 같은 (x, z) 위치의 다른 레벨 칸들.
 * 대부분 셀은 빈 배열, overlap 셀만 1~2 개 반환.
 */
export function getVerticalColumn(squareId) {
    const { absFile, absRank } = squareId.toAbs();
    return allSquaresAt(absFile, absRank).filter(sq => !sq.equals(squareId));
}
