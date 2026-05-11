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
import { setupPhysicalBoards, setupLogicalSquares, updateBoardPositions } from './renderer/BoardRenderer.js';
import { PieceRenderer }                           from './renderer/PieceRenderer.js';
import { DebugOverlay }                            from './ui/DebugOverlay.js';
import { Board2DPanel }                            from './ui/Board2DPanel.js';
import { getVerticalColumn }                       from './model/SquareId.js';
import { createInitialState }                       from './model/initialState.js';
import { generateLegalMoves, applyMove as applyMoveRC, gameStatus, isInCheck } from './rules/RuleController.js';
import { getCastleConfig } from './rules/castling.js';
import { computeMaterial }                          from './rules/material.js';
import { createMinimaxAI, topDistinctMoves }        from './ai/MinimaxAI.js';
import { generateBoardMoves, applyBoardMove }       from './rules/attackBoard.js';
import { serializeGameState, deserializeGameState } from './model/serialize.js';

// ── 게임 상태 + 히스토리 ──────────────────────────────────────
/** @type {import('./model/GameState.js').GameState} */
let gameState = createInitialState();
/** @type {Array<import('./model/GameState.js').GameState>} */
let history    = [gameState];
let historyIdx = 0;

function pushState(newState) {
    // 과거 시점에서 새 수 → 그 뒤 히스토리 truncate (branch 단순화)
    if (historyIdx < history.length - 1) {
        history = history.slice(0, historyIdx + 1);
    }
    history.push(newState);
    historyIdx = history.length - 1;
}

function jumpToHistory(idx) {
    if (idx < 0 || idx >= history.length) return;
    historyIdx = idx;
    gameState  = history[idx];

    // UI 상태 초기화
    ui.selected    = null;
    ui.moves       = [];
    ui.castles     = new Set();
    ui.hints       = [];
    ui.checkSquare = null;
    // lastMove 는 해당 시점의 마지막 수로 추출
    if (historyIdx > 0) {
        const prev = history[historyIdx - 1];
        // moveHistory 의 마지막 항목으로 from/to 알기 어려움 — 일단 last 만 표시 X
        ui.lastMove = null;
    } else {
        ui.lastMove = null;
    }

    cancelPendingAI();
    hideGameOver();
    // 현 상태가 종료 상태일 수도 있으니 재평가
    evaluateAndAnnounce();

    refreshHighlights();
    updateBoardPositions(gameState); debugOverlay.updatePositions(gameState);  // AB plate/mesh 위치 동기 (Undo 시 필수)
    pieceRenderer.render(gameState.pieces, gameState);
    board2D.render(gameState, ui);
    renderTurnIndicator();
    renderCapturesPanel();
    renderHistoryPanel();
    log(`▸ Jumped to move ${idx}`, 'log-system');
    scheduleAIMove();
}

// ── UI 상태 (선택/이동 후보) — 게임 상태와 분리 ────────────────
const ui = {
    /** @type {import('./model/SquareId.js').SquareId | null} */
    selected: null,
    /** @type {import('./model/SquareId.js').SquareId[]} */
    moves: [],
    /** @type {Set<string>} — castle 인 target sqKey 들 (moves 의 부분집합) */
    castles: new Set(),
    /** @type {Array<{from, to, score: number}>} */
    hints: [],
    /** @type {{from, to} | null} */
    lastMove: null,
    /** @type {import('./model/SquareId.js').SquareId | null} — 체크 받은 King */
    checkSquare: null,
};

let gameOver = false;

// ── AI 설정 ────────────────────────────────────────────────────
const ai = {
    mode: 'hva',       // 기본: Me (White) vs AI (Black). 'hvh' | 'hva' | 'avh' | 'ava'
    depth: 2,
    auto: true,
    thinking: false,
    pending: null,
};

// ── Three.js 참조 ──────────────────────────────────────────────
let scene, camera, renderer, controls;
/** @type {Map<string, THREE.Mesh>} */
let squareMeshes = new Map();
let pieceRenderer;
let debugOverlay;
/** @type {Board2DPanel} */
let board2D;

// ── 하이라이트 색상 (CSS variables 와 동기화) ──────────────────
const COLOR = {
    NONE:      0x000000,
    SELECTED:  0x00ff7f,
    COLUMN:    0x004466,
    MOVE:      0xffe54a,
    LAST_MOVE: 0xff8c40,
    CASTLE:    0xc77dff,
};
const HINT_COLORS = [0xff44cc, 0x2196f3, 0xffc107]; // top-1/2/3
const HINT_LOG_CLASSES = ['log-hint-1', 'log-hint-2', 'log-hint-3'];

// ── 초기화 ──────────────────────────────────────────────────────
function init() {
    const container = document.getElementById('view-3d');

    ({ scene, camera, renderer, controls } = setupScene(container));

    setupPhysicalBoards(scene, gameState);
    squareMeshes = setupLogicalSquares(scene, renderer, camera, handleSquareClick, gameState);

    pieceRenderer = new PieceRenderer(scene);
    debugOverlay  = new DebugOverlay(container, scene);

    const panel2DGrid = document.querySelector('#panel-2d .panel-2d-grid');
    board2D = new Board2DPanel(panel2DGrid, handleSquareClick);

    pieceRenderer.render(gameState.pieces, gameState);
    board2D.render(gameState, ui);
    renderTurnIndicator();
    renderCapturesPanel();
    renderHistoryPanel();

    document.getElementById('btn-reset').onclick = resetGame;
    document.getElementById('btn-rules').onclick = () => {
        document.getElementById('rule-modal').style.display = 'block';
    };
    document.getElementById('btn-debug').onclick = () => {
        // 3D 좌표 라벨 토글 + Debug 탭으로 전환
        debugOverlay.toggle();
        switchTab('debug');
        updateDebugPanel();
    };

    document.getElementById('btn-hint').onclick = showHints;
    document.getElementById('btn-step').onclick = () => scheduleAIMove(true);
    document.getElementById('btn-undo').onclick = undoMove;
    document.getElementById('tab-collapse').onclick = toggleTabContent;
    document.getElementById('ai-auto').onchange = (e) => {
        ai.auto = e.target.checked;
        updateAIControlsVisibility();
        if (ai.auto) scheduleAIMove();
    };
    updateAIControlsVisibility();
    document.getElementById('go-replay').onclick = () => { hideGameOver(); resetGame(); };

    // Tab 전환
    document.querySelectorAll('#tab-bar .tab').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // History 항목 클릭 → 점프
    document.getElementById('history-list').addEventListener('click', (e) => {
        const item = e.target.closest('.hist-item');
        if (!item) return;
        jumpToHistory(parseInt(item.dataset.idx, 10));
    });

    // Copy / Paste
    document.getElementById('btn-hist-copy').onclick = copyStateJSON;
    document.getElementById('btn-hist-paste').onclick = pasteStateJSON;

    // 2D 패널의 AB 라벨 클릭 → AB 이동 후보 표시 / 적용
    document.querySelector('#panel-2d .panel-2d-grid').addEventListener('click', (e) => {
        const lbl = e.target.closest('.ab-label');
        if (lbl) handleABLabelClick(lbl.dataset.boardId);
    });

    document.getElementById('ai-mode').onchange = (e) => {
        ai.mode = e.target.value;
        log(`Mode: ${e.target.value}`, 'log-system');
        cancelPendingAI();
        updateAIControlsVisibility();
        scheduleAIMove();
    };
    document.getElementById('ai-depth').onchange = (e) => {
        ai.depth = parseInt(e.target.value, 10);
        log(`AI depth: ${ai.depth}`, 'log-system');
        cancelPendingAI();
        scheduleAIMove();
    };

    controls.addEventListener('change', () => {
        if (isDebugTabActive()) updateDebugCamera();
    });

    window.addEventListener('resize', onResize);
    animate();
    scheduleAIMove();
}

// ── AI 차례 처리 ──────────────────────────────────────────────
function aiColorForTurn() {
    if (ai.mode === 'ava')              return gameState.turn;
    if (ai.mode === 'hva' && gameState.turn === 'black') return 'black';
    if (ai.mode === 'avh' && gameState.turn === 'white') return 'white';
    return null;
}
function isAIturn() { return aiColorForTurn() !== null; }

function setAIStatus(text) {
    document.getElementById('ai-status').textContent = text;
}

function cancelPendingAI() {
    if (ai.pending) { clearTimeout(ai.pending); ai.pending = null; }
    ai.thinking = false;
    setAIStatus('');
}

function scheduleAIMove(force = false) {
    if (!force && !ai.auto) return;
    if (!isAIturn() || ai.thinking || gameOver) return;
    if (!gameState.findKing('white') || !gameState.findKing('black')) return;

    ai.thinking = true;
    setAIStatus(`AI thinking (depth ${ai.depth})…`);

    ai.pending = setTimeout(() => {
        try {
            const agent = createMinimaxAI({ depth: ai.depth });
            const move  = agent(gameState);
            if (!move) {
                log('AI: no legal moves', 'log-system');
                ai.thinking = false;
                setAIStatus('AI: stalemate');
                return;
            }
            ai.thinking = false;
            ai.pending  = null;
            setAIStatus('');
            applyMove(move.from, move.to);
        } catch (err) {
            console.error('AI error:', err);
            ai.thinking = false;
            setAIStatus('AI error (see console)');
        }
    }, 350);
}

// ── Undo / Move counter / 탭 collapse ────────────────────────
function undoMove() {
    if (historyIdx === 0) return;
    let target = historyIdx - 1;
    // vs-AI 모드에서 무른 결과가 AI 차례면 한 번 더 무름
    if (target > 0) {
        const turnAtTarget = history[target].turn;
        if ((ai.mode === 'hva' && turnAtTarget === 'black') ||
            (ai.mode === 'avh' && turnAtTarget === 'white')) {
            target--;
        }
    }
    jumpToHistory(target);
}

function updateMoveCounter() {
    const el = document.getElementById('move-counter');
    if (!el) return;
    el.textContent = `#${historyIdx}/${history.length - 1}`;
    const btnUndo = document.getElementById('btn-undo');
    if (btnUndo) btnUndo.disabled = historyIdx === 0;
}

function toggleTabContent() {
    const tc  = document.getElementById('tab-content');
    const btn = document.getElementById('tab-collapse');
    const collapsed = tc.classList.toggle('collapsed');
    btn.textContent = collapsed ? '▴' : '▾';
}

// AI 모드/Auto 상태에 따라 Step 버튼 활성 여부.
// Step 은 (AI 모드 켜져있고) + (Auto 꺼져있거나 AI vs AI) 때 의미 있음.
function updateAIControlsVisibility() {
    const stepBtn = document.getElementById('btn-step');
    if (!stepBtn) return;
    const hasAI = ai.mode !== 'hvh';
    // Step 은 AI 모드 + Auto 꺼졌을 때 가장 유용. Auto 켜져 있으면 사실상 불필요하지만 disable 안 함.
    stepBtn.disabled = !hasAI;
    stepBtn.style.opacity = stepBtn.disabled ? '0.3' : '';
}

// ── 탭 전환 ─────────────────────────────────────────────────
function switchTab(name) {
    document.querySelectorAll('#tab-bar .tab').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === name);
    });
    document.querySelectorAll('#tab-content > [data-tab-content]').forEach(p => {
        p.classList.toggle('active', p.dataset.tabContent === name);
    });
    if (name === 'debug') updateDebugPanel();
    if (name === 'history') renderHistoryPanel();
}

function isDebugTabActive() {
    const el = document.querySelector('#tab-content > [data-tab-content="debug"]');
    return el && el.classList.contains('active');
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

// ── 통합 하이라이트 리프레시 ─────────────────────────────────
function refreshHighlights() {
    clearAllHighlights();
    // last move (지속, 가장 낮은 우선)
    if (ui.lastMove) {
        highlightSquare(ui.lastMove.from.toString(), COLOR.LAST_MOVE);
        highlightSquare(ui.lastMove.to.toString(),   COLOR.LAST_MOVE);
    }
    // column for selected
    if (ui.selected) {
        for (const c of getVerticalColumn(ui.selected, gameState)) {
            highlightSquare(c.toString(), COLOR.COLUMN);
        }
    }
    // moves (castle 인 것은 보라색 우선)
    for (const m of ui.moves) {
        const key = m.toString();
        const col = ui.castles && ui.castles.has(key) ? COLOR.CASTLE : COLOR.MOVE;
        highlightSquare(key, col);
    }
    // hints (top-N 각각 unique color, from/to 같은 색)
    for (let i = 0; i < ui.hints.length && i < HINT_COLORS.length; i++) {
        const h = ui.hints[i];
        const c = HINT_COLORS[i];
        highlightSquare(h.from.toString(), c);
        highlightSquare(h.to.toString(),   c);
    }
    // selected on top
    if (ui.selected) {
        highlightSquare(ui.selected.toString(), COLOR.SELECTED);
    }
}

// ── 클릭 핸들러 ─────────────────────────────────────────────────
/** @param {import('./model/SquareId.js').SquareId} squareId */
function handleSquareClick(squareId) {
    if (gameOver || isAIturn() || ai.thinking) return;
    const piece = gameState.getPiece(squareId);
    const isOwn = piece && piece.color === gameState.turn;

    ui.hints = []; // 액션 시 hints 초기화

    // 1순위: 선택된 piece 의 합법 target 이면 무조건 그 이동 실행.
    //         (castle target 이 own Rook 자리 위인 경우 등 처리)
    if (ui.selected !== null && isMoveTarget(squareId)) {
        if (isPromotionMove(ui.selected, squareId)) {
            showPromotionPicker(ui.selected, squareId);
        } else {
            applyMove(ui.selected, squareId);
        }
        return;
    }

    // 2순위: own piece → 새 선택
    if (isOwn) {
        ui.selected = squareId;
        ui.moves    = getMoves(squareId);
        ui.castles  = computeCastleTargets(squareId);
        log(`Selected ${piece.symbol} at ${squareId}`, 'log-select');

    } else {
        ui.selected = null;
        ui.moves    = [];
        ui.castles  = new Set();
        if (piece) log(`${squareId}: ${piece.color} ${piece.type}`, 'log-info');
    }

    refreshHighlights();
    board2D.render(gameState, ui);
    if (isDebugTabActive()) updateDebugPanel();
}

// ── 이동 적용 — RuleController.applyMove 위임 ─────────────────
/**
 * @param {import('./model/SquareId.js').SquareId} from
 * @param {import('./model/SquareId.js').SquareId} to
 */
function applyMove(from, to, promotionType = 'Q') {
    const piece    = gameState.getPiece(from);
    // castle 시 to 위 piece 는 자기 Rook (캡처 아님)
    const castle   = piece && piece.type === 'K' ? getCastleConfig(gameState, from, to) : null;
    const captured = castle ? null : gameState.getPiece(to);

    gameState = applyMoveRC(gameState, from, to, promotionType);
    pushState(gameState);
    const movedAfter = gameState.getPiece(to);
    const promoted = piece.type === 'P' && movedAfter && movedAfter.type !== 'P';

    if (castle) {
        const tag = castle.rookFrom.includes('KL') ? 'O-O' : 'O-O-O';
        log(`${tag} (${piece.color === 'white' ? 'White' : 'Black'})`, 'log-action');
    } else {
        log(`${piece.symbol} ${from} → ${to}`, 'log-action');
        if (captured) log(`  ✕ Captured ${captured.symbol}`, 'log-capture');
    }
    if (promoted) log(`  ↑ Promoted to ${movedAfter.symbol}`, 'log-system');

    ui.selected = null;
    ui.moves    = [];
    ui.castles  = new Set();
    ui.hints    = [];
    ui.lastMove = { from, to };

    refreshHighlights();
    pieceRenderer.render(gameState.pieces, gameState);
    board2D.render(gameState, ui);
    renderTurnIndicator();
    renderCapturesPanel();
    if (isDebugTabActive()) updateDebugPanel();

    const ended = checkGameOver();
    board2D.render(gameState, ui);
    renderHistoryPanel();
    if (ended) return;
    scheduleAIMove();
}

// ── State Copy / Paste (테스트/공유용) ───────────────────────
async function copyStateJSON() {
    try {
        const text = JSON.stringify(serializeGameState(gameState));
        await navigator.clipboard.writeText(text);
        log(`📋 State JSON 클립보드 복사 (${text.length} chars)`, 'log-system');
    } catch (err) {
        console.error('copy failed:', err);
        log('Copy 실패 — 콘솔 확인', 'log-capture');
    }
}

function pasteStateJSON() {
    const text = prompt('Paste GameState JSON:');
    if (!text) return;
    try {
        const data = JSON.parse(text);
        const newState = deserializeGameState(data);
        cancelPendingAI();
        hideGameOver();
        gameState = newState;
        history = [newState];
        historyIdx = 0;
        ui.selected = null;
        ui.moves = [];
        ui.castles = new Set();
        ui.hints = [];
        ui.lastMove = null;
        ui.checkSquare = null;
        clearAllHighlights();
        updateBoardPositions(gameState); debugOverlay.updatePositions(gameState);
        pieceRenderer.render(gameState.pieces, gameState);
        board2D.render(gameState, ui);
        renderTurnIndicator();
        renderCapturesPanel();
        renderHistoryPanel();
        evaluateAndAnnounce();
        log('📥 State 로드 완료', 'log-system');
        scheduleAIMove();
    } catch (err) {
        console.error('paste failed:', err);
        log(`Paste 실패: ${err.message}`, 'log-capture');
    }
}

// ── 히스토리 패널 ────────────────────────────────────────────
function renderHistoryPanel() {
    updateMoveCounter();
    const list = document.getElementById('history-list');
    if (!list) return;
    list.innerHTML = '';
    for (let i = 0; i < history.length; i++) {
        const st  = history[i];
        const li  = document.createElement('li');
        li.className = 'hist-item' + (i === historyIdx ? ' current' : '');
        li.dataset.idx = String(i);
        if (i === 0) {
            li.innerHTML = `<span class="hist-no">0</span> <span class="hist-move">Initial</span>`;
        } else {
            const last = st.moveHistory[st.moveHistory.length - 1] ?? '';
            const turnAfter = st.turn === 'white' ? 'B' : 'W';
            li.innerHTML = `<span class="hist-no">${i}</span> <span class="hist-move">${last}</span> <span class="hist-after">→ ${turnAfter}</span>`;
        }
        list.appendChild(li);
    }
    // 스크롤 현재 항목으로
    const cur = list.querySelector('.hist-item.current');
    if (cur) cur.scrollIntoView({ block: 'nearest', behavior: 'auto' });
}

// ── 게임 상태 평가 (체크/체크메이트/스테일메이트) ──────────────
function evaluateAndAnnounce() {
    ui.checkSquare = null;

    // King 캡처 (안전망 — legal filter 가 있으면 정상적으로 발생 안 함)
    const wK = gameState.findKing('white');
    const bK = gameState.findKing('black');
    if (!wK || !bK) {
        const winner = !wK ? 'Black' : 'White';
        return endGame(`Game Over`, `${winner} wins — King captured.`);
    }

    const st = gameStatus(gameState);
    if (st === 'checkmate') {
        const winner = gameState.turn === 'white' ? 'Black' : 'White';
        ui.checkSquare = gameState.findKing(gameState.turn);
        return endGame(`Checkmate`, `${winner} wins.`);
    }
    if (st === 'stalemate') {
        return endGame(`Stalemate`, `Draw — no legal moves and not in check.`);
    }
    if (st === 'check') {
        ui.checkSquare = gameState.findKing(gameState.turn);
        const who = gameState.turn === 'white' ? 'White' : 'Black';
        log(`▸ Check on ${who} King at ${ui.checkSquare}`, 'log-capture');
    }
    return false;
}

function endGame(title, msg) {
    gameOver = true;
    cancelPendingAI();
    document.getElementById('go-title').textContent = title;
    document.getElementById('go-msg').textContent   = msg;
    document.getElementById('game-over-overlay').setAttribute('data-show', 'true');
    log(`▸ ${title} — ${msg}`, 'log-capture');
    return true;
}

// 기존 이름 호환 (applyMove 에서 호출)
function checkGameOver() {
    return evaluateAndAnnounce();
}

function hideGameOver() {
    gameOver = false;
    document.getElementById('game-over-overlay').setAttribute('data-show', 'false');
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

/** 선택한 piece 의 target 중 castle 인 sqKey 들 */
function computeCastleTargets(fromSq) {
    const piece = gameState.getPiece(fromSq);
    if (!piece || piece.type !== 'K') return new Set();
    const out = new Set();
    for (const to of ui.moves) {
        if (getCastleConfig(gameState, fromSq, to)) out.add(to.toString());
    }
    return out;
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

// ── Promotion picker ────────────────────────────────────────
const PROMOTION_SYMBOLS = {
    white: { Q: '♕', R: '♖', B: '♗', N: '♘' },
    black: { Q: '♛', R: '♜', B: '♝', N: '♞' },
};

function isPromotionMove(from, to) {
    const p = gameState.getPiece(from);
    if (!p || p.type !== 'P') return false;
    const abs = to.toAbs(gameState);
    return (p.color === 'white' && abs.absRank >= 8) ||
           (p.color === 'black' && abs.absRank <= 1);
}

function showPromotionPicker(from, to) {
    const modal = document.getElementById('promotion-modal');
    const color = gameState.turn;
    const syms  = PROMOTION_SYMBOLS[color];
    modal.querySelector('[data-sym-q]').textContent = syms.Q;
    modal.querySelector('[data-sym-r]').textContent = syms.R;
    modal.querySelector('[data-sym-b]').textContent = syms.B;
    modal.querySelector('[data-sym-n]').textContent = syms.N;
    modal.setAttribute('data-show', 'true');

    const picks = modal.querySelectorAll('.pick');
    const handler = (e) => {
        const btn = e.currentTarget;
        const type = btn.dataset.promote;
        modal.setAttribute('data-show', 'false');
        picks.forEach(b => b.removeEventListener('click', handler));
        applyMove(from, to, type);
    };
    picks.forEach(b => b.addEventListener('click', handler));
}

// ── Attack Board 이동 (M4 D-3 + tray UX) ──────────────────────
let _selectedAB = null;

function closeABTrays() {
    document.querySelectorAll('#panel-2d .ab-tray').forEach(t => { t.hidden = true; t.innerHTML = ''; });
    document.querySelectorAll('#panel-2d .ab-label').forEach(el => el.classList.remove('ab-selected'));
    _selectedAB = null;
}

function handleABLabelClick(boardId) {
    if (gameOver || isAIturn() || ai.thinking) return;
    const node = gameState.boards.get(boardId);
    if (!node) return;

    // 토글: 같은 AB 다시 클릭 → 닫기
    if (_selectedAB === boardId) {
        closeABTrays();
        return;
    }
    closeABTrays();

    if (node.owner !== gameState.turn) {
        log(`${boardId}: ${node.owner} 소유 — 현재 ${gameState.turn} 턴이라 이동 불가`, 'log-info');
        return;
    }

    const piecesOnAB = [...gameState.pieces.values()].filter(p => p.position.level === boardId);
    if (piecesOnAB.length > 1) {
        log(`${boardId}: 이동 불가 — ${piecesOnAB.length} piece 탑승. Roth: 빈 보드 또는 자기 폰 1개만`, 'log-info');
        return;
    }
    if (piecesOnAB.length === 1) {
        const p = piecesOnAB[0];
        if (p.color !== gameState.turn) {
            log(`${boardId}: 이동 불가 — 상대 ${p.symbol} 탑승`, 'log-info');
            return;
        }
        if (p.type !== 'P') {
            log(`${boardId}: 이동 불가 — 폰 아닌 piece 탑승 (${p.symbol})`, 'log-info');
            return;
        }
    }

    const moves = generateBoardMoves(gameState, gameState.turn).filter(m => m.boardId === boardId);
    if (moves.length === 0) {
        log(`${boardId}: 이동 가능한 anchor 없음 (보드 경계 또는 충돌)`, 'log-info');
        return;
    }

    _selectedAB = boardId;
    showABTray(boardId, node, moves);
    log(`${boardId} ${node.pin} → 이동 가능 핀: ${moves.map(m => m.newPin).join(', ')}`, 'log-select');
}

function showABTray(boardId, node, moves) {
    const tray = document.querySelector(`#panel-2d .ab-tray[data-board-id="${boardId}"]`);
    if (!tray) return;
    tray.hidden = false;
    tray.innerHTML = '';
    const sorted = [...moves].sort((a, b) => a.newPin.localeCompare(b.newPin));
    for (const m of sorted) {
        const btn = document.createElement('button');
        btn.className = 'ab-target-btn';
        btn.textContent = m.newPin;
        btn.title = `Move ${boardId} to pin ${m.newPin}`;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            commitABMove(boardId, m.newPin);
        });
        tray.appendChild(btn);
    }
    document.querySelector(`#panel-2d .ab-label[data-board-id="${boardId}"]`)?.classList.add('ab-selected');
}

function commitABMove(boardId, newPin) {
    const move = { boardId, newPin };
    gameState = applyBoardMove(gameState, move);
    pushState(gameState);
    log(`[${boardId} → ${newPin}]`, 'log-action');
    closeABTrays();
    ui.selected = null;
    ui.moves = [];
    ui.castles = new Set();
    ui.hints = [];
    refreshHighlights();
    updateBoardPositions(gameState); debugOverlay.updatePositions(gameState);
    pieceRenderer.render(gameState.pieces, gameState);
    board2D.render(gameState, ui);
    renderTurnIndicator();
    renderCapturesPanel();
    renderHistoryPanel();
    if (isDebugTabActive()) updateDebugPanel();
    if (checkGameOver()) return;
    scheduleAIMove();
}

// ── AI Assist (Hint) — top-3 추천 수 ─────────────────────────
function showHints() {
    if (gameOver) return;
    if (isAIturn() || ai.thinking) {
        log('Hint: AI 차례 중 사용 불가', 'log-system');
        return;
    }
    setAIStatus(`Hint computing (depth ${ai.depth})…`);
    // 동기 호출. setTimeout 으로 UI 응답 보장.
    setTimeout(() => {
        try {
            const top = topDistinctMoves(gameState, ai.depth, 3);
            if (top.length === 0) {
                log('Hint: 합법 수 없음', 'log-system');
                setAIStatus('');
                return;
            }
            ui.hints    = top;
            ui.selected = null;
            ui.moves    = [];
            ui.castles  = new Set();
            refreshHighlights();
            board2D.render(gameState, ui);
            log(`Hints (depth ${ai.depth}):`, 'log-system');
            top.forEach((h, i) => {
                const p = gameState.getPiece(h.from);
                const sym = p ? p.symbol : '?';
                const s = h.score > 0 ? `+${h.score}` : `${h.score}`;
                log(`  ${i + 1}. ${sym} ${h.from} → ${h.to} (${s})`, HINT_LOG_CLASSES[i] || 'log-info');
            });
            setAIStatus('');
        } catch (err) {
            console.error('Hint error:', err);
            setAIStatus('Hint error (see console)');
        }
    }, 50);
}

// ── 리셋 ─────────────────────────────────────────────────────────
function resetGame() {
    cancelPendingAI();
    hideGameOver();
    gameState    = createInitialState();
    history      = [gameState];
    historyIdx   = 0;
    ui.selected    = null;
    ui.moves       = [];
    ui.castles     = new Set();
    ui.hints       = [];
    ui.lastMove    = null;
    ui.checkSquare = null;
    clearAllHighlights();
    updateBoardPositions(gameState); debugOverlay.updatePositions(gameState);
    pieceRenderer.render(gameState.pieces, gameState);
    board2D.render(gameState, ui);
    renderTurnIndicator();
    renderCapturesPanel();
    renderHistoryPanel();
    if (isDebugTabActive()) updateDebugPanel();
    log('▸ Game Reset', 'log-system');
    scheduleAIMove();
}

// ── 로그 ─────────────────────────────────────────────────────────
/**
 * @param {string} msg
 * @param {string} [klass='log-info'] — CSS 클래스 (예: log-info, log-action, log-select, log-hint-1)
 */
function log(msg, klass = 'log-info') {
    const panel = document.getElementById('log-panel');
    const div   = document.createElement('div');
    div.className   = klass;
    div.textContent = msg;
    panel.appendChild(div);
    panel.scrollTop = panel.scrollHeight;
}

// ── 상태바 (Turn + Material) ─────────────────────────────────
function renderTurnIndicator() {
    const el = document.getElementById('status-bar');
    const isWhite = gameState.turn === 'white';
    el.classList.toggle('white', isWhite);
    el.classList.toggle('black', !isWhite);
    el.querySelector('.turn-pill .text').textContent = isWhite ? 'White' : 'Black';

    const mat = computeMaterial(gameState);
    const mEl = document.getElementById('material-display');
    if (mat.advantage > 0) {
        mEl.textContent = `W +${mat.advantage}`;
        mEl.className = 'material adv-white';
    } else if (mat.advantage < 0) {
        mEl.textContent = `B +${-mat.advantage}`;
        mEl.className = 'material adv-black';
    } else {
        mEl.textContent = '±0';
        mEl.className = 'material';
    }
}

// ── 캡처된 piece 표시 (status bar 안) ──────────────────────────
function renderCapturesPanel() {
    const order = { Q: 0, R: 1, B: 2, N: 3, P: 4, K: -1 };
    const fmt = (arr) => arr.length === 0
        ? '—'
        : [...arr].sort((a, b) => order[a.type] - order[b.type]).map(p => p.symbol).join('');
    const wEl = document.getElementById('capt-white');
    const bEl = document.getElementById('capt-black');
    const wt = fmt(gameState.capturedByWhite);
    const bt = fmt(gameState.capturedByBlack);
    wEl.textContent = wt;
    bEl.textContent = bt;
    wEl.title = `White took (${gameState.capturedByWhite.length}): ${wt}`;
    bEl.title = `Black took (${gameState.capturedByBlack.length}): ${bt}`;
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
