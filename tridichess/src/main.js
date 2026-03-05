/**
 * main.js — 컨트롤러·렌더러 조립 및 게임 루프 (M2 버전)
 *
 * M2 변경사항:
 *   - 게임 상태를 Array(64) → Map<squareIdString, piece>로 전환
 *   - handleSquareClick(squareId) — SquareId 기반
 *   - 같은 수직열(vertical column) 하이라이트 추가
 *   - DebugOverlay 연동 (좌표 라벨 토글)
 *   - 초기 배치: 3D 체스 대표 위치
 */

import { setupScene }                              from './renderer/SceneSetup.js';
import { setupPhysicalBoards, setupLogicalSquares } from './renderer/BoardRenderer.js';
import { PieceRenderer }                           from './renderer/PieceRenderer.js';
import { DebugOverlay }                            from './ui/DebugOverlay.js';
import { getAllSquares, getVerticalColumn }         from './model/SquareId.js';

// ── 게임 상태 ──────────────────────────────────────────────────
const gameState = {
    /** @type {Map<string, {type:string, color:string}>} */
    board:    new Map(),
    turn:     'white',
    /** @type {import('./model/SquareId.js').SquareId | null} */
    selected: null,
    /** @type {import('./model/SquareId.js').SquareId[]} */
    moves:    [],
};

// ── Three.js 참조 ──────────────────────────────────────────────
let scene, camera, renderer, controls;
/** @type {Map<string, THREE.Mesh>} */
let squareMeshes = new Map();
let pieceRenderer;
let debugOverlay;

// ── 하이라이트 색상 ────────────────────────────────────────────
const COLOR = {
    NONE:    0x000000,
    SELECTED: 0x00ff00,  // 선택된 칸: 초록
    COLUMN:  0x004466,   // 수직 열: 진한 청록 (emissive)
    MOVE:    0xffff00,   // 이동 가능: 노랑
};

// ── 초기화 ──────────────────────────────────────────────────────
function init() {
    const container = document.getElementById('view-3d');

    ({ scene, camera, renderer, controls } = setupScene(container));

    setupPhysicalBoards(scene);
    squareMeshes = setupLogicalSquares(scene, renderer, camera, handleSquareClick);

    pieceRenderer = new PieceRenderer(scene);
    debugOverlay  = new DebugOverlay(container, scene);

    setupPieces();

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

// ── 피스 초기 배치 (3D 체스 대표 위치, M3에서 정식 규칙으로 교체) ──
function setupPieces() {
    const INITIAL = {
        // White — W level
        'a4(W)': { type: 'R', color: 'white' },
        'b4(W)': { type: 'N', color: 'white' },
        'c4(W)': { type: 'B', color: 'white' },
        'd4(W)': { type: 'K', color: 'white' },
        'a3(W)': { type: 'R', color: 'white' },
        'b3(W)': { type: 'N', color: 'white' },
        'c3(W)': { type: 'Q', color: 'white' },
        'd3(W)': { type: 'B', color: 'white' },
        // White pawns (W rank 2 + attack boards)
        'a2(W)': { type: 'P', color: 'white' },
        'b2(W)': { type: 'P', color: 'white' },
        'c2(W)': { type: 'P', color: 'white' },
        'd2(W)': { type: 'P', color: 'white' },
        'a1(QL1)': { type: 'P', color: 'white' },
        'b1(QL1)': { type: 'P', color: 'white' },
        'a1(KL1)': { type: 'P', color: 'white' },
        'b1(KL1)': { type: 'P', color: 'white' },
        // Black — B level
        'a1(B)': { type: 'R', color: 'black' },
        'b1(B)': { type: 'N', color: 'black' },
        'c1(B)': { type: 'B', color: 'black' },
        'd1(B)': { type: 'K', color: 'black' },
        'a2(B)': { type: 'R', color: 'black' },
        'b2(B)': { type: 'N', color: 'black' },
        'c2(B)': { type: 'Q', color: 'black' },
        'd2(B)': { type: 'B', color: 'black' },
        // Black pawns (B rank 3 + attack boards)
        'a3(B)': { type: 'P', color: 'black' },
        'b3(B)': { type: 'P', color: 'black' },
        'c3(B)': { type: 'P', color: 'black' },
        'd3(B)': { type: 'P', color: 'black' },
        'a1(QL3)': { type: 'P', color: 'black' },
        'b1(QL3)': { type: 'P', color: 'black' },
        'a1(KL3)': { type: 'P', color: 'black' },
        'b1(KL3)': { type: 'P', color: 'black' },
    };

    gameState.board.clear();
    for (const [key, piece] of Object.entries(INITIAL)) {
        gameState.board.set(key, piece);
    }
    pieceRenderer.render(gameState.board);
}

// ── 클릭 핸들러 ─────────────────────────────────────────────────
/**
 * @param {import('./model/SquareId.js').SquareId} squareId
 */
function handleSquareClick(squareId) {
    const key   = squareId.toString();
    const piece = gameState.board.get(key);
    const isOwn = piece && piece.color === gameState.turn;

    clearAllHighlights();

    if (isOwn) {
        // 자신의 말 선택
        gameState.selected = squareId;
        gameState.moves    = getMoves(squareId);

        highlightSquare(key, COLOR.SELECTED);

        // 같은 수직열 하이라이트
        for (const colSq of getVerticalColumn(squareId)) {
            highlightSquare(colSq.toString(), COLOR.COLUMN);
        }

        // 이동 가능 칸 하이라이트
        for (const moveSq of gameState.moves) {
            highlightSquare(moveSq.toString(), COLOR.MOVE);
        }

        const sym = getPieceSymbol(piece);
        log(`Selected ${sym} at ${key}`);

    } else if (gameState.selected !== null && isMoveTarget(squareId)) {
        movePiece(gameState.selected, squareId);

    } else {
        // 빈 칸 또는 상대 말 클릭 → 선택 해제
        gameState.selected = null;
        gameState.moves    = [];
        if (piece) log(`${key}: ${piece.color} ${piece.type}`);
    }
}

// ── 이동 적용 ────────────────────────────────────────────────────
/**
 * @param {import('./model/SquareId.js').SquareId} from
 * @param {import('./model/SquareId.js').SquareId} to
 */
function movePiece(from, to) {
    const piece  = gameState.board.get(from.toString());
    const target = gameState.board.get(to.toString());

    gameState.board.delete(from.toString());
    gameState.board.set(to.toString(), piece);

    log(`${piece.type} ${from} → ${to}`);
    if (target) log(`  Captured ${target.color} ${target.type}`);

    gameState.turn     = gameState.turn === 'white' ? 'black' : 'white';
    gameState.selected = null;
    gameState.moves    = [];

    clearAllHighlights();
    pieceRenderer.render(gameState.board);
}

// ── 이동 가능 목록 (M2 데모용 — 같은 레벨 빈 칸/적 말) ──────────
// M3에서 RuleController.generateLegalMoves()로 교체 예정
/**
 * @param {import('./model/SquareId.js').SquareId} squareId
 * @returns {import('./model/SquareId.js').SquareId[]}
 */
function getMoves(squareId) {
    const piece = gameState.board.get(squareId.toString());
    if (!piece) return [];

    return getAllSquares().filter(sq => {
        if (sq.level !== squareId.level) return false;
        if (sq.equals(squareId)) return false;
        const occupant = gameState.board.get(sq.toString());
        if (occupant && occupant.color === piece.color) return false;
        return true;
    });
}

/** @param {import('./model/SquareId.js').SquareId} squareId */
function isMoveTarget(squareId) {
    return gameState.moves.some(m => m.equals(squareId));
}

// ── 하이라이트 헬퍼 ─────────────────────────────────────────────
function clearAllHighlights() {
    squareMeshes.forEach(mesh => mesh.material.emissive.setHex(COLOR.NONE));
}

function highlightSquare(key, color) {
    const mesh = squareMeshes.get(key);
    if (mesh) mesh.material.emissive.setHex(color);
}

// ── 피스 심볼 ────────────────────────────────────────────────────
function getPieceSymbol(piece) {
    const syms = {
        P: ['♙','♟'], R: ['♖','♜'], N: ['♘','♞'],
        B: ['♗','♝'], Q: ['♕','♛'], K: ['♔','♚'],
    };
    const idx = piece.color === 'white' ? 0 : 1;
    return syms[piece.type]?.[idx] ?? piece.type;
}

// ── 리셋 ─────────────────────────────────────────────────────────
function resetGame() {
    gameState.board.clear();
    gameState.turn     = 'white';
    gameState.selected = null;
    gameState.moves    = [];
    clearAllHighlights();
    setupPieces();
    log('--- Game Reset ---');
}

// ── 로그 ─────────────────────────────────────────────────────────
function log(msg) {
    const panel = document.getElementById('log-panel');
    panel.innerHTML += `<div>${msg}</div>`;
    panel.scrollTop = panel.scrollHeight;
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

init();
