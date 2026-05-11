/**
 * Move.js — 한 턴의 이동을 기술하는 불변 객체.
 *
 * kind 'piece'        : 일반 말 이동
 * kind 'attack-board' : Attack Board 자체 이동 (M4)
 *
 * pathA / pathB : 두 경로 옵션 (M5에서 활용). 현재는 null 가능.
 */

import { Piece } from './Piece.js';
import { SquareId } from './SquareId.js';

export const MOVE_KINDS = ['piece', 'attack-board'];

export class Move {
    /**
     * @param {object} args
     * @param {'piece'|'attack-board'} args.kind
     * @param {Piece}    [args.piece]    — 이동하는 말 (kind='piece')
     * @param {SquareId} [args.from]
     * @param {SquareId} [args.to]
     * @param {Piece|null} [args.captured=null]
     * @param {SquareId[]|null} [args.pathA=null]
     * @param {SquareId[]|null} [args.pathB=null]
     * @param {string|null}     [args.boardId=null]   — kind='attack-board'
     * @param {SquareId|null}   [args.newAnchor=null] — kind='attack-board'
     * @param {boolean}         [args.invert=false]   — kind='attack-board'
     */
    constructor({
        kind,
        piece     = null,
        from      = null,
        to        = null,
        captured  = null,
        pathA     = null,
        pathB     = null,
        boardId   = null,
        newAnchor = null,
        invert    = false,
    }) {
        if (!MOVE_KINDS.includes(kind)) {
            throw new Error(`Move: invalid kind "${kind}"`);
        }
        if (kind === 'piece') {
            if (!(piece instanceof Piece)) throw new Error('Move(piece): piece required');
            if (!(from  instanceof SquareId)) throw new Error('Move(piece): from required');
            if (!(to    instanceof SquareId)) throw new Error('Move(piece): to required');
        } else if (kind === 'attack-board') {
            if (typeof boardId !== 'string') throw new Error('Move(attack-board): boardId required');
            if (!(newAnchor instanceof SquareId)) throw new Error('Move(attack-board): newAnchor required');
        }

        this.kind      = kind;
        this.piece     = piece;
        this.from      = from;
        this.to        = to;
        this.captured  = captured;
        this.pathA     = pathA ? Object.freeze([...pathA]) : null;
        this.pathB     = pathB ? Object.freeze([...pathB]) : null;
        this.boardId   = boardId;
        this.newAnchor = newAnchor;
        this.invert    = invert;
        Object.freeze(this);
    }

    /** 사람이 읽기 쉬운 표기 */
    toString() {
        if (this.kind === 'piece') {
            const cap = this.captured ? `x${this.captured.symbol}` : '';
            return `${this.piece.symbol}${this.from}${cap}${this.to}`;
        }
        return `[AB ${this.boardId} → ${this.newAnchor}${this.invert ? ' ⟲' : ''}]`;
    }
}
