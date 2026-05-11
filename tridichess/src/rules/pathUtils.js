/**
 * pathUtils.js — abs 좌표 multi-candidate sliding ray (ADR-0010).
 *
 * 각 abs step 의 ALL 후보 SquareId 를 target 으로 enumerate.
 * Roth-2012: player chooses target level (자유 다중 후보).
 *
 * blocking: 한 abs cell 의 후보들 중 하나라도 점유되면 그 cell 에서 sliding 중단
 *           (단, 점유 후보가 적이면 capture target 으로 추가).
 */

import { allSquaresAt } from '../model/SquareId.js';

/**
 * @param {import('../model/GameState.js').GameState} state
 * @param {import('../model/SquareId.js').SquareId}    from
 * @param {{ dFile:number, dRank:number }}            dir
 * @param {'white'|'black'}                            color
 * @returns {import('../model/SquareId.js').SquareId[]}
 */
export function slidingRay(state, from, dir, color) {
    const fromAbs = from.toAbs(state);
    const moves = [];
    let af = fromAbs.absFile + dir.dFile;
    let ar = fromAbs.absRank + dir.dRank;
    while (true) {
        const candidates = allSquaresAt(af, ar, state);
        if (candidates.length === 0) break;
        let blocked = false;
        for (const cand of candidates) {
            const occ = state.getPiece(cand);
            if (occ) {
                blocked = true;
                if (occ.color !== color) moves.push(cand); // capture
            } else {
                moves.push(cand);
            }
        }
        if (blocked) break;
        af += dir.dFile;
        ar += dir.dRank;
    }
    return moves;
}
