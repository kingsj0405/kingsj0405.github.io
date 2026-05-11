/**
 * GameState.js — 불변 게임 상태 스냅샷 (ADR-0002).
 *
 * 변경은 with(patch) 또는 setPiece/movePiece 같은 헬퍼로 새 인스턴스 반환.
 * pieces / boards Map 자체는 freeze 되지 않으므로 외부에서 mutate 금지 (관행).
 */

import { Piece } from './Piece.js';
import { SquareId } from './SquareId.js';

export const RULESETS = ['roth2012', 'video2022'];
export const TURNS    = ['white', 'black'];

export class GameState {
    /**
     * @param {object} args
     * @param {Map<string, Piece>} args.pieces      — sqKey → Piece
     * @param {Map<string, object>} [args.boards]   — boardId → BoardNode (M4부터)
     * @param {'white'|'black'} [args.turn='white']
     * @param {Array} [args.moveHistory=[]]
     * @param {string} [args.rulesetId='roth2012']
     */
    constructor({
        pieces,
        boards      = new Map(),
        turn        = 'white',
        moveHistory = [],
        rulesetId   = 'roth2012',
    }) {
        if (!(pieces instanceof Map)) throw new Error('GameState: pieces must be Map');
        if (!TURNS.includes(turn))    throw new Error(`GameState: invalid turn "${turn}"`);
        if (!RULESETS.includes(rulesetId)) {
            throw new Error(`GameState: invalid rulesetId "${rulesetId}"`);
        }
        this.pieces      = pieces;
        this.boards      = boards;
        this.turn        = turn;
        this.moveHistory = Object.freeze([...moveHistory]);
        this.rulesetId   = rulesetId;
        Object.freeze(this);
    }

    with(patch) {
        return new GameState({
            pieces:      this.pieces,
            boards:      this.boards,
            turn:        this.turn,
            moveHistory: this.moveHistory,
            rulesetId:   this.rulesetId,
            ...patch,
        });
    }

    /** @param {SquareId|string} squareIdOrKey */
    getPiece(squareIdOrKey) {
        const key = typeof squareIdOrKey === 'string'
            ? squareIdOrKey
            : squareIdOrKey.toString();
        return this.pieces.get(key) ?? null;
    }

    /**
     * @param {SquareId} squareId
     * @param {Piece|null} piece — null 시 제거
     * @returns {GameState}
     */
    setPiece(squareId, piece) {
        const next = new Map(this.pieces);
        const key  = squareId.toString();
        if (piece === null) next.delete(key);
        else                next.set(key, piece);
        return this.with({ pieces: next });
    }

    /**
     * 말 이동. 캡처 발생 시 to 위치 기존 말은 제거됨.
     * Move history 는 갱신하지 않음 (RuleController.applyMove 가 책임).
     *
     * @param {SquareId} from
     * @param {SquareId} to
     * @returns {GameState}
     */
    movePiece(from, to) {
        const piece = this.getPiece(from);
        if (!piece) throw new Error(`GameState.movePiece: no piece at ${from}`);
        const moved = piece.with({ position: to, hasMoved: true });
        const next  = new Map(this.pieces);
        next.delete(from.toString());
        next.set(to.toString(), moved);
        return this.with({ pieces: next });
    }

    /** 같은 색 말의 King 위치를 찾아 반환. 없으면 null (테스트 fixture). */
    findKing(color) {
        for (const piece of this.pieces.values()) {
            if (piece.type === 'K' && piece.color === color) return piece.position;
        }
        return null;
    }

    /** 말 개수 (색별/타입별 집계가 필요하면 호출자에서 reduce). */
    get pieceCount() { return this.pieces.size; }
}
