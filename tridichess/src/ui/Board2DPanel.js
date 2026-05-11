/**
 * Board2DPanel.js — 사이드바 2D 탑다운 제어 패널.
 *
 * 3D 뷰의 클릭 대체/보완. 7개 보드를 3×3 outer grid 에 배치:
 *
 *   [QL3] [B]  [KL3]
 *   [ . ] [N]  [ . ]
 *   [QL1] [W]  [KL1]
 *
 * 각 보드 cell 내부: rank 큰 값이 위, 작은 값이 아래 (white-bottom 관행).
 * file a~d 는 왼쪽→오른쪽.
 *
 * 클릭/하이라이트는 3D 와 동일한 onSquareClick / render(state, ui) 인터페이스.
 */

import { SquareId, FILES, LEVELS, getVerticalColumn } from '../model/SquareId.js';

const PIECE_SYMBOLS = {
    white: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
    black: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' },
};

const LAYOUT_ROWS = [
    ['QL3', 'B',  'KL3'],
    [null,  'N',  null ],
    ['QL1', 'W',  'KL1'],
];

const ATTACK_FILES = ['a', 'b'];

export class Board2DPanel {
    /**
     * @param {HTMLElement} gridEl  — `<div class="panel-2d-grid">`
     * @param {(squareId: SquareId) => void} onSquareClick
     */
    constructor(gridEl, onSquareClick) {
        this._grid          = gridEl;
        this._onSquareClick = onSquareClick;
        /** @type {Map<string, HTMLElement>} */
        this._squareEls     = new Map();
        this._build();
    }

    _build() {
        this._grid.innerHTML = '';
        for (const row of LAYOUT_ROWS) {
            for (const level of row) {
                if (level === null) {
                    const spacer = document.createElement('div');
                    spacer.className = 'cell-empty';
                    this._grid.appendChild(spacer);
                } else {
                    this._grid.appendChild(this._buildBoard(level));
                }
            }
        }
    }

    /** @param {string} level */
    _buildBoard(level) {
        const isMain  = LEVELS.MAIN.includes(level);
        const ranks   = isMain ? [4, 3, 2, 1] : [2, 1];
        const files   = isMain ? FILES : ATTACK_FILES;

        const wrap = document.createElement('div');
        wrap.className = 'board-wrap';

        const label = document.createElement('div');
        label.className   = 'board-label';
        label.textContent = level;
        wrap.appendChild(label);

        const grid = document.createElement('div');
        grid.className = 'board-grid' + (isMain ? '' : ' attack');
        grid.style.gridTemplateColumns = `repeat(${files.length}, 1fr)`;

        for (const rank of ranks) {
            for (let f = 0; f < files.length; f++) {
                const file  = files[f];
                const sqKey = `${file}${rank}(${level})`;
                const cell  = document.createElement('button');
                cell.className = 'sq ' + (((f + rank) % 2 === 0) ? 'dark' : 'light');
                cell.dataset.sq = sqKey;
                cell.title      = sqKey;
                cell.addEventListener('click', () => {
                    this._onSquareClick(SquareId.fromString(sqKey));
                });
                grid.appendChild(cell);
                this._squareEls.set(sqKey, cell);
            }
        }
        wrap.appendChild(grid);
        return wrap;
    }

    /**
     * @param {import('../model/GameState.js').GameState} state
     * @param {{ selected: SquareId|null, moves: SquareId[], hints?: Array<{from:SquareId,to:SquareId}>, lastMove?: {from:SquareId,to:SquareId}|null }} ui
     */
    render(state, ui) {
        for (const [sqKey, el] of this._squareEls) {
            const piece = state.pieces.get(sqKey);
            if (piece) {
                el.textContent = PIECE_SYMBOLS[piece.color][piece.type];
                el.classList.toggle('white-piece', piece.color === 'white');
                el.classList.toggle('black-piece', piece.color === 'black');
            } else {
                el.textContent = '';
                el.classList.remove('white-piece', 'black-piece');
            }
            el.classList.remove('selected', 'move', 'castle', 'column', 'last-move',
                                'hint-1', 'hint-2', 'hint-3', 'in-check');
        }

        // in-check King 표시
        if (ui.checkSquare) {
            this._squareEls.get(ui.checkSquare.toString())?.classList.add('in-check');
        }

        // last move (지속 표시, 가장 낮은 우선순위)
        if (ui.lastMove) {
            this._squareEls.get(ui.lastMove.from.toString())?.classList.add('last-move');
            this._squareEls.get(ui.lastMove.to.toString())?.classList.add('last-move');
        }

        if (ui.selected) {
            for (const c of getVerticalColumn(ui.selected)) {
                this._squareEls.get(c.toString())?.classList.add('column');
            }
        }
        const castleSet = ui.castles instanceof Set ? ui.castles : new Set();
        for (const m of ui.moves) {
            const key = m.toString();
            const el  = this._squareEls.get(key);
            if (!el) continue;
            el.classList.add(castleSet.has(key) ? 'castle' : 'move');
        }
        if (ui.hints) {
            for (let i = 0; i < ui.hints.length && i < 3; i++) {
                const cls = `hint-${i + 1}`;
                const h = ui.hints[i];
                this._squareEls.get(h.from.toString())?.classList.add(cls);
                this._squareEls.get(h.to.toString())?.classList.add(cls);
            }
        }
        if (ui.selected) {
            this._squareEls.get(ui.selected.toString())?.classList.add('selected');
        }
    }
}
