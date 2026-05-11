/**
 * Piece.js — 불변 피스 객체.
 *
 * 변경은 with(patch) 로 새 인스턴스 반환. 직접 mutate 금지 (ADR-0002).
 *
 * id 규칙: 'wK' / 'bK' (King/Queen 단일), 'wP1'~'wP8', 'wR1'/'wR2' 등
 *          → 단순 unique 식별자. 직렬화 키로 사용 가능.
 */

import { SquareId } from './SquareId.js';

export const PIECE_TYPES = ['K', 'Q', 'R', 'B', 'N', 'P'];
export const COLORS      = ['white', 'black'];

const SYMBOLS = {
    K: ['♔', '♚'], Q: ['♕', '♛'], R: ['♖', '♜'],
    B: ['♗', '♝'], N: ['♘', '♞'], P: ['♙', '♟'],
};

export class Piece {
    /**
     * @param {object} args
     * @param {string} args.id
     * @param {'K'|'Q'|'R'|'B'|'N'|'P'} args.type
     * @param {'white'|'black'} args.color
     * @param {SquareId} args.position
     * @param {boolean} [args.hasMoved=false]
     */
    constructor({ id, type, color, position, hasMoved = false }) {
        if (!PIECE_TYPES.includes(type)) {
            throw new Error(`Piece: invalid type "${type}"`);
        }
        if (!COLORS.includes(color)) {
            throw new Error(`Piece: invalid color "${color}"`);
        }
        if (!(position instanceof SquareId)) {
            throw new Error(`Piece: position must be SquareId`);
        }
        if (typeof id !== 'string' || id.length === 0) {
            throw new Error(`Piece: id must be non-empty string`);
        }
        this.id       = id;
        this.type     = type;
        this.color    = color;
        this.position = position;
        this.hasMoved = hasMoved;
        Object.freeze(this);
    }

    /** 불변 업데이트 — 새 인스턴스 반환. */
    with(patch) {
        return new Piece({
            id:       this.id,
            type:     this.type,
            color:    this.color,
            position: this.position,
            hasMoved: this.hasMoved,
            ...patch,
        });
    }

    get isWhite() { return this.color === 'white'; }
    get isBlack() { return this.color === 'black'; }
    get symbol()  { return SYMBOLS[this.type][this.isWhite ? 0 : 1]; }

    equals(other) {
        return other instanceof Piece && other.id === this.id;
    }
}
