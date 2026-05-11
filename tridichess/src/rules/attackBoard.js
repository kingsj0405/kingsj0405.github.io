/**
 * attackBoard.js — Attack Board 이동 (M4 D-3 MVP).
 *
 *   각 AB 는 자기 file 방향으로 5 개 valid 위치 (rankOffset).
 *   1 step = 가장 가까운 anchor 로. ±1 또는 ±2 step 가능 (Roth "1~2 squares").
 *
 *   조건 (MVP):
 *     - AB 가 비어있거나 자기 색 폰 단 하나만 있을 때만 이동 가능
 *     - 도착 anchor 가 다른 AB 와 겹치지 않아야 함 (file 충돌)
 *
 *   미구현 (후속 D-4):
 *     - Invert (반전)
 *     - 소유권 변경
 *     - "최소 폰 1개 잔존" 룰
 */

import { SquareId } from '../model/SquareId.js';

/** 모든 valid rankOffset 위치 (1-rank 간격). AB 가 자기 file 따라 어디든 가능. */
const VALID_RANK_OFFSETS = [-1, 0, 1, 2, 3, 4, 5, 6, 7];

/** Roth: "1 또는 2 squares" — 1-rank 또는 2-rank 슬라이드 */
const STEP_DELTAS = [-2, -1, 1, 2];

/**
 * @param {import('../model/GameState.js').GameState} state
 * @param {string} boardId
 * @returns {import('../model/Piece.js').Piece[]}
 */
function piecesOnBoard(state, boardId) {
    const out = [];
    for (const p of state.pieces.values()) {
        if (p.position.level === boardId) out.push(p);
    }
    return out;
}

/**
 * 주어진 색의 AB 이동 후보 생성.
 *
 * @param {import('../model/GameState.js').GameState} state
 * @param {'white'|'black'} color
 * @returns {Array<{ kind:'attack-board', boardId:string, newRankOffset:number }>}
 */
export function generateBoardMoves(state, color) {
    const moves = [];
    for (const [boardId, node] of state.boards) {
        if (node.owner !== color) continue;

        // AB 위 piece 확인 — 비었거나 자기 폰 1개만
        const pieces = piecesOnBoard(state, boardId);
        if (pieces.length > 1) continue;
        if (pieces.length === 1) {
            const p = pieces[0];
            if (p.color !== color || p.type !== 'P') continue;
        }

        const curIdx = VALID_RANK_OFFSETS.indexOf(node.rankOffset);
        if (curIdx < 0) continue;

        for (const delta of STEP_DELTAS) {
            const newIdx = curIdx + delta;
            if (newIdx < 0 || newIdx >= VALID_RANK_OFFSETS.length) continue;
            const newRO = VALID_RANK_OFFSETS[newIdx];

            // 충돌 회피: 같은 file 의 다른 AB 가 같은 rankOffset 이면 불가
            let collision = false;
            for (const [otherId, otherNode] of state.boards) {
                if (otherId === boardId) continue;
                if (otherNode.fileOffset !== node.fileOffset) continue;
                if (otherNode.rankOffset === newRO) { collision = true; break; }
            }
            if (collision) continue;

            moves.push({ kind: 'attack-board', boardId, newRankOffset: newRO });
        }
    }
    return moves;
}

/**
 * AB 이동 적용 — 불변 GameState 반환.
 * 탑승 piece 의 SquareId 는 변하지 않음 (local 좌표 유지). abs 만 자동 변함.
 *
 * @param {import('../model/GameState.js').GameState} state
 * @param {{ boardId: string, newRankOffset: number }} move
 * @returns {import('../model/GameState.js').GameState}
 */
export function applyBoardMove(state, move) {
    const node = state.boards.get(move.boardId);
    if (!node) throw new Error(`applyBoardMove: unknown board ${move.boardId}`);
    const newNode = Object.freeze({ ...node, rankOffset: move.newRankOffset });
    const newBoards = new Map(state.boards);
    newBoards.set(move.boardId, newNode);

    const nextTurn = state.turn === 'white' ? 'black' : 'white';
    const moveStr  = `[${move.boardId} RO ${node.rankOffset}→${move.newRankOffset}]`;

    return state.with({
        boards: newBoards,
        turn: nextTurn,
        moveHistory: [...state.moveHistory, moveStr],
        enPassant: null,
    });
}
