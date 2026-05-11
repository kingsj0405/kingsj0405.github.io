/**
 * attackBoard.js — Attack Board 이동 (M4 D-3+, pin 모델).
 *
 * Bartmess 정통:
 *   "An attack board, when containing a pawn or less, may be moved to
 *    any other attack board pin within two squares."
 *
 * 각 file (QL/KL) 당 12 pins. 현재 pin 에서 rank 거리 ≤ 2 인 다른 pin 으로 이동.
 *
 * 미구현 (후속):
 *   - Invert (반전)
 *   - 소유권 변경 (last piece capture)
 *   - 최소 폰 잔존 룰
 */

import { ALL_PIN_IDS, getPin, pinRankDistance } from './pins.js';

const MAX_PIN_DISTANCE = 2;

function piecesOnBoard(state, boardId) {
    const out = [];
    for (const p of state.pieces.values()) {
        if (p.position.level === boardId) out.push(p);
    }
    return out;
}

function abFile(boardId) {
    return boardId.startsWith('QL') ? 'QL' : 'KL';
}

/**
 * 같은 file 의 다른 AB 가 도착 pin 을 점유하고 있는지.
 */
function pinOccupiedByOther(state, boardId, targetPin) {
    const myFile = abFile(boardId);
    for (const [otherId, otherNode] of state.boards) {
        if (otherId === boardId) continue;
        if (abFile(otherId) !== myFile) continue;
        if (otherNode.pin === targetPin) return true;
    }
    return false;
}

/**
 * @param {import('../model/GameState.js').GameState} state
 * @param {'white'|'black'} color
 * @returns {Array<{ kind:'attack-board', boardId:string, newPin:string }>}
 */
export function generateBoardMoves(state, color) {
    const moves = [];
    for (const [boardId, node] of state.boards) {
        if (node.owner !== color) continue;

        const pieces = piecesOnBoard(state, boardId);
        if (pieces.length > 1) continue;
        if (pieces.length === 1) {
            const p = pieces[0];
            if (p.color !== color || p.type !== 'P') continue;
        }

        const curPin = node.pin;
        if (!curPin) continue;

        for (const candidate of ALL_PIN_IDS) {
            if (candidate === curPin) continue;
            if (pinRankDistance(curPin, candidate) > MAX_PIN_DISTANCE) continue;
            if (pinOccupiedByOther(state, boardId, candidate)) continue;
            moves.push({ kind: 'attack-board', boardId, newPin: candidate });
        }
    }
    return moves;
}

/**
 * @param {import('../model/GameState.js').GameState} state
 * @param {{ boardId:string, newPin:string }} move
 */
export function applyBoardMove(state, move) {
    const node = state.boards.get(move.boardId);
    if (!node) throw new Error(`applyBoardMove: unknown board ${move.boardId}`);
    const pinInfo = getPin(move.newPin);
    const newNode = Object.freeze({
        ...node,
        pin: move.newPin,
        rankOffset: pinInfo.rankOffset,
    });
    const newBoards = new Map(state.boards);
    newBoards.set(move.boardId, newNode);

    const nextTurn = state.turn === 'white' ? 'black' : 'white';
    const moveStr  = `[${move.boardId} ${node.pin}→${move.newPin}]`;

    return state.with({
        boards: newBoards,
        turn: nextTurn,
        moveHistory: [...state.moveHistory, moveStr],
        enPassant: null,
    });
}
