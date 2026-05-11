/**
 * serialize.js — GameState JSON 직렬화 / 복원.
 *
 * 용도: 테스트/공유. 현 state 를 클립보드로 복사 → 다른 세션에서 paste 해서 재현.
 */

import { GameState } from './GameState.js';
import { Piece } from './Piece.js';
import { SquareId } from './SquareId.js';

function serializePiece(p) {
    return {
        id: p.id,
        type: p.type,
        color: p.color,
        position: p.position.toString(),
        hasMoved: p.hasMoved,
    };
}

function deserializePiece(d) {
    return new Piece({
        id: d.id,
        type: d.type,
        color: d.color,
        position: SquareId.fromString(d.position),
        hasMoved: d.hasMoved,
    });
}

export function serializeGameState(state) {
    return {
        version: 1,
        turn: state.turn,
        rulesetId: state.rulesetId,
        pieces: [...state.pieces.entries()].map(([k, p]) => [k, serializePiece(p)]),
        boards: [...state.boards.entries()].map(([k, b]) => [k, b]),
        moveHistory: [...state.moveHistory],
        capturedByWhite: state.capturedByWhite.map(serializePiece),
        capturedByBlack: state.capturedByBlack.map(serializePiece),
        enPassant: state.enPassant ? {
            target: state.enPassant.target.toString(),
            victim: state.enPassant.victim.toString(),
            color: state.enPassant.color,
        } : null,
    };
}

export function deserializeGameState(data) {
    if (!data || data.version !== 1) throw new Error('Invalid or unsupported state version');
    const pieces = new Map(data.pieces.map(([k, p]) => [k, deserializePiece(p)]));
    const boards = new Map(data.boards.map(([k, b]) => {
        const node = { ...b };
        if (!node.pin) {
            // legacy state (pre-pin model): pin 없으면 default 사용
            node.pin = k.endsWith('1') ? 'W-S-up' : 'B-N-up';
        }
        return [k, Object.freeze(node)];
    }));
    return new GameState({
        pieces,
        boards,
        turn: data.turn,
        moveHistory: data.moveHistory,
        rulesetId: data.rulesetId,
        capturedByWhite: data.capturedByWhite.map(deserializePiece),
        capturedByBlack: data.capturedByBlack.map(deserializePiece),
        enPassant: data.enPassant ? {
            target: SquareId.fromString(data.enPassant.target),
            victim: SquareId.fromString(data.enPassant.victim),
            color: data.enPassant.color,
        } : null,
    });
}
