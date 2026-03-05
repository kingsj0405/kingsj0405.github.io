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

export class SquareId {
    constructor(file, rank, level) {
        this.file  = file;   // 'a'~'d'
        this.rank  = rank;   // 정수
        this.level = level;  // 'W' | 'N' | 'B' | 'QL1' | 'KL1' | 'QL3' | 'KL3'
        Object.freeze(this);
    }

    /** 직렬화 키 (Map/Set 키, 히스토리 저장) */
    toString() {
        return `${this.file}${this.rank}(${this.level})`;
    }

    /** 역직렬화: "d4(N)" → SquareId */
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
}

export const FILE_INDEX = { a: 0, b: 1, c: 2, d: 3 };
export const FILES       = ['a', 'b', 'c', 'd'];

export const LEVELS = {
    MAIN:   ['W', 'N', 'B'],
    ATTACK: ['QL1', 'KL1', 'QL3', 'KL3'],
    ALL:    ['W', 'N', 'B', 'QL1', 'KL1', 'QL3', 'KL3'],
};

const MAIN_FILES   = ['a', 'b', 'c', 'd'];
const MAIN_RANKS   = [1, 2, 3, 4];
const ATTACK_FILES = ['a', 'b'];
const ATTACK_RANKS = [1, 2];

/**
 * 유효한 모든 64개 SquareId를 생성해 배열로 반환한다.
 * Main 3×16=48 + Attack 4×4=16 = 64
 * @returns {SquareId[]}
 */
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
 * 특정 squareId와 같은 file+rank지만 다른 level에 있는 모든 칸을 반환한다.
 * 3D 체스의 "수직 열(vertical column)" 개념.
 * @param {SquareId} squareId
 * @returns {SquareId[]}
 */
export function getVerticalColumn(squareId) {
    return getAllSquares().filter(sq =>
        sq.file === squareId.file &&
        sq.rank === squareId.rank &&
        !sq.equals(squareId)
    );
}
