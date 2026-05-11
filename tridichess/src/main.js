/**
 * main.js — 컨트롤러·렌더러 조립 및 게임 루프 (Sprint 3.1 버전)
 *
 * Sprint 3.1 변경사항:
 *   - gameState 를 plain obj → 불변 GameState 인스턴스로 교체 (ADR-0002)
 *   - createInitialState() 사용
 *   - 이동: gameState = gameState.movePiece(from, to).with({ turn: ... })
 *   - selected / moves 는 UI state 로 분리
 *
 * M3.5 까지 getMoves() 는 데모 (같은 레벨 이동 + 같은 색 차단). RuleController 가 교체.
 */

import { setupScene }                              from './renderer/SceneSetup.js';
import { setupPhysicalBoards, setupLogicalSquares } from './renderer/BoardRenderer.js';
import { PieceRenderer }                           from './renderer/PieceRenderer.js';
import { DebugOverlay }                            from './ui/DebugOverlay.js';
import { Board2DPanel }                            from './ui/Board2DPanel.js';
import { getAllSquares, getVerticalColumn }         from './model/SquareId.js';
import { createInitialState }                       from './model/initialState.js';

// ── 게임 상태 ──────────────────────────────────────────────────
/** @type {import('./model/GameState.js').GameState} */
let gameState = createInitialState();

// ── UI 상태 (선택/이동 후보) — 게임 상태와 분리 ────────────────
const ui = {
    /** @type {import('./model/SquareId.js').SquareId | null} */
    selected: null,
    /** @type {import('./model/SquareId.js').SquareId[]} */
    moves: [],
};

// ── Three.js 참조 ──────────────────────────────────────────────
let scene, camera, renderer, controls;
/** @type {Map<string, THREE.Mesh>} */
let squareMeshes = new Map();
let pieceRenderer;
let debugOverlay;
/** @type {Board2DPanel} */
let board2D;

// ── 하이라이트 색상 ────────────────────────────────────────────
const COLOR = {
    NONE:     0x000000,
    SELECTED: 0x00ff00,
    COLUMN:   0x004466,
    MOVE:     0xffff00,
};

// ── 초기화 ──────────────────────────────────────────────────────
function init() {
    const container = document.getElementById('view-3d');

    ({ scene, camera, renderer, controls } = setupScene(container));

    setupPhysicalBoards(scene);
    squareMeshes = setupLogicalSquares(scene, renderer, camera, handleSquareClick);

    pieceRenderer = new PieceRenderer(scene);
    debugOverlay  = new DebugOverlay(container, scene);

    const panel2DGrid = document.querySelector('#panel-2d .panel-2d-grid');
    board2D = new Board2DPanel(panel2DGrid, handleSquareClick);

    pieceRenderer.render(gameState.pieces);
    board2D.render(gameState, ui);
    renderTurnIndicator();

    document.getElementById('btn-reset').onclick = resetGame;
    document.getElementById('btn-rules').onclick = () => {
        document.getElementById('rule-modal').style.display = 'block';
    };
    document.getElementById('btn-debug').onclick = () => {
        debugOverlay.toggle();
        const btn = document.getElementById('btn-debug');
        btn.textContent = debugOverlay.isVisible ? 'Hide Coords' : 'Debug Coords';
    };

    window.addEventListener('resize', onResize);
    animate();
}

// ── 클릭 핸들러 ─────────────────────────────────────────────────
/** @param {import('./model/SquareId.js').SquareId} squareId */
function handleSquareClick(squareId) {
    const piece = gameState.getPiece(squareId);
    const isOwn = piece && piece.color === gameState.turn;

    clearAllHighlights();

    if (isOwn) {
        ui.selected = squareId;
        ui.moves    = getMoves(squareId);

        highlightSquare(squareId.toString(), COLOR.SELECTED);
        for (const colSq of getVerticalColumn(squareId)) {
            highlightSquare(colSq.toString(), COLOR.COLUMN);
        }
        for (const moveSq of ui.moves) {
            highlightSquare(moveSq.toString(), COLOR.MOVE);
        }

        log(`Selected ${piece.symbol} at ${squareId}`, 'info');

    } else if (ui.selected !== null && isMoveTarget(squareId)) {
        applyMove(ui.selected, squareId);

    } else {
        ui.selected = null;
        ui.moves    = [];
        if (piece) log(`${squareId}: ${piece.color} ${piece.type}`, 'info');
    }

    board2D.render(gameState, ui);
}

// ── 이동 적용 ────────────────────────────────────────────────────
/**
 * @param {import('./model/SquareId.js').SquareId} from
 * @param {import('./model/SquareId.js').SquareId} to
 */
function applyMove(from, to) {
    const piece    = gameState.getPiece(from);
    const captured = gameState.getPiece(to);

    gameState = gameState
        .movePiece(from, to)
        .with({ turn: gameState.turn === 'white' ? 'black' : 'white' });

    log(`${piece.symbol} ${from} → ${to}`, 'action');
    if (captured) log(`  ✕ Captured ${captured.symbol}`, 'capture');

    ui.selected = null;
    ui.moves    = [];

    clearAllHighlights();
    pieceRenderer.render(gameState.pieces);
    board2D.render(gameState, ui);
    renderTurnIndicator();
}

// ── 이동 가능 목록 (Sprint 3.1 데모용) ─────────────────────────
// Sprint 3.5 에서 RuleController.generateLegalMoves() 로 교체.
/**
 * @param {import('./model/SquareId.js').SquareId} squareId
 * @returns {import('./model/SquareId.js').SquareId[]}
 */
function getMoves(squareId) {
    const piece = gameState.getPiece(squareId);
    if (!piece) return [];

    return getAllSquares().filter(sq => {
        if (sq.level !== squareId.level) return false;
        if (sq.equals(squareId)) return false;
        const occupant = gameState.getPiece(sq);
        if (occupant && occupant.color === piece.color) return false;
        return true;
    });
}

/** @param {import('./model/SquareId.js').SquareId} squareId */
function isMoveTarget(squareId) {
    return ui.moves.some(m => m.equals(squareId));
}

// ── 하이라이트 헬퍼 ─────────────────────────────────────────────
function clearAllHighlights() {
    squareMeshes.forEach(mesh => mesh.material.emissive.setHex(COLOR.NONE));
}

function highlightSquare(key, color) {
    const mesh = squareMeshes.get(key);
    if (mesh) mesh.material.emissive.setHex(color);
}

// ── 리셋 ─────────────────────────────────────────────────────────
function resetGame() {
    gameState   = createInitialState();
    ui.selected = null;
    ui.moves    = [];
    clearAllHighlights();
    pieceRenderer.render(gameState.pieces);
    board2D.render(gameState, ui);
    renderTurnIndicator();
    log('▸ Game Reset', 'system');
}

// ── 로그 ─────────────────────────────────────────────────────────
/**
 * @param {string} msg
 * @param {'action'|'capture'|'info'|'system'} [kind='info']
 */
function log(msg, kind = 'info') {
    const panel = document.getElementById('log-panel');
    const div   = document.createElement('div');
    div.className   = `log-${kind}`;
    div.textContent = msg;
    panel.appendChild(div);
    panel.scrollTop = panel.scrollHeight;
}

// ── 턴 인디케이터 ────────────────────────────────────────────────
function renderTurnIndicator() {
    const el = document.getElementById('turn-indicator');
    const isWhite = gameState.turn === 'white';
    el.classList.toggle('white', isWhite);
    el.classList.toggle('black', !isWhite);
    el.querySelector('.text').textContent = isWhite ? 'White' : 'Black';
}

// ── 리사이즈 ─────────────────────────────────────────────────────
function onResize() {
    const container = document.getElementById('view-3d');
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    debugOverlay.onResize(w, h);
}

// ── 렌더 루프 ────────────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    debugOverlay.render(camera);
}

// ── 디버그 도구 (CLAUDE.md §7) ─────────────────────────────────
window.tridi = {
    getState: () => gameState,
    dumpState: () => {
        const out = {
            turn: gameState.turn,
            rulesetId: gameState.rulesetId,
            pieces: Object.fromEntries(
                [...gameState.pieces.entries()].map(([k, p]) => [k, {
                    id: p.id, type: p.type, color: p.color, hasMoved: p.hasMoved,
                }])
            ),
        };
        console.log(JSON.stringify(out, null, 2));
        return out;
    },
};

init();
