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
import { getVerticalColumn }                       from './model/SquareId.js';
import { createInitialState }                       from './model/initialState.js';
import { generateLegalMoves }                       from './rules/RuleController.js';

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
        const on = !debugOverlay.isVisible;
        debugOverlay.toggle();
        document.getElementById('debug-panel').hidden = !on;
        document.getElementById('btn-debug').textContent = on ? 'Hide Debug' : 'Debug';
        if (on) updateDebugPanel();
    };

    controls.addEventListener('change', () => {
        if (!document.getElementById('debug-panel').hidden) updateDebugCamera();
    });

    window.addEventListener('resize', onResize);
    animate();
}

// ── 디버그 패널 ──────────────────────────────────────────────────
function fmtV3(v) {
    return `(${v.x.toFixed(1)}, ${v.y.toFixed(1)}, ${v.z.toFixed(1)})`;
}

function updateDebugCamera() {
    const pos    = camera.position;
    const target = controls.target;
    const dist   = pos.distanceTo(target);
    document.getElementById('dbg-cam-pos').textContent    = fmtV3(pos);
    document.getElementById('dbg-cam-target').textContent = fmtV3(target);
    document.getElementById('dbg-cam-dist').textContent   = dist.toFixed(1);
}

function updateDebugPanel() {
    updateDebugCamera();
    document.getElementById('dbg-selected').textContent  = ui.selected ? ui.selected.toString() : '—';
    document.getElementById('dbg-moves').textContent     = ui.moves.length;
    const hist = gameState.moveHistory;
    document.getElementById('dbg-last-move').textContent = hist.length > 0 ? String(hist[hist.length - 1]) : '—';
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
    if (!document.getElementById('debug-panel').hidden) updateDebugPanel();
}

// ── 이동 적용 ────────────────────────────────────────────────────
/**
 * @param {import('./model/SquareId.js').SquareId} from
 * @param {import('./model/SquareId.js').SquareId} to
 */
function applyMove(from, to) {
    const piece    = gameState.getPiece(from);
    const captured = gameState.getPiece(to);

    const moveStr = `${piece.symbol} ${from}→${to}${captured ? `×${captured.symbol}` : ''}`;
    gameState = gameState
        .movePiece(from, to)
        .with({
            turn: gameState.turn === 'white' ? 'black' : 'white',
            moveHistory: [...gameState.moveHistory, moveStr],
        });

    log(`${piece.symbol} ${from} → ${to}`, 'action');
    if (captured) log(`  ✕ Captured ${captured.symbol}`, 'capture');

    ui.selected = null;
    ui.moves    = [];

    clearAllHighlights();
    pieceRenderer.render(gameState.pieces);
    board2D.render(gameState, ui);
    renderTurnIndicator();
    if (!document.getElementById('debug-panel').hidden) updateDebugPanel();
}

// ── 이동 가능 목록 — RuleController 위임 ────────────────────
// Knight/King 은 정통 규칙. 나머지 piece 는 같은 레벨 데모 폴백 (Sprint 3.3~3.5 에서 교체).
/**
 * @param {import('./model/SquareId.js').SquareId} squareId
 * @returns {import('./model/SquareId.js').SquareId[]}
 */
function getMoves(squareId) {
    return generateLegalMoves(gameState, squareId);
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
    if (!document.getElementById('debug-panel').hidden) updateDebugPanel();
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
    /** 현 카메라 pose 콘솔에 출력 + 객체 반환 (복붙용) */
    cam: () => {
        const p = camera.position, t = controls.target;
        const out = {
            position: { x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2) },
            target:   { x: +t.x.toFixed(2), y: +t.y.toFixed(2), z: +t.z.toFixed(2) },
            distance: +p.distanceTo(t).toFixed(2),
        };
        console.log('camera.position.set(%s, %s, %s);  controls.target.set(%s, %s, %s);',
            out.position.x, out.position.y, out.position.z,
            out.target.x,   out.target.y,   out.target.z);
        return out;
    },
    /** 카메라 즉시 적용. setCam(px,py,pz, tx?,ty?,tz?) */
    setCam: (px, py, pz, tx, ty, tz) => {
        camera.position.set(px, py, pz);
        if (tx !== undefined) controls.target.set(tx, ty, tz);
        controls.update();
    },
};

init();
