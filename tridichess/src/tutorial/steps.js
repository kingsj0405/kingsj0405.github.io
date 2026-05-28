/**
 * Tutorial step definitions — Step 1/2/3 본구현, Step 4/5 stub.
 *
 * 각 step:
 *  - id          : 식별자
 *  - title       : 헤더 (KO)
 *  - body        : 본문 HTML
 *  - placement   : 'center' | 'bottom-right'
 *  - onEnter(ctx): step 진입 시 호출. ctx = { api, controller, bubble }
 *  - onExit(ctx) : step 종료/Skip 시 cleanup
 *  - autoAdvance : true 면 'Next' 버튼 노출 X (Step 3 처럼 사용자 액션이 advance 트리거)
 */
import { TutorialBoardLabels } from './TutorialBoardLabels.js';

export const TUTORIAL_SEEN_KEY = 'tridichess.tutorial.seen';

// 모듈 스코프 리소스 — Step 간 cleanup 보장.
let _boardLabels = null;

const PIECE_KO = {
    P: '폰 (Pawn)',
    N: '나이트 (Knight)',
    B: '비숍 (Bishop)',
    R: '룩 (Rook)',
    Q: '퀸 (Queen)',
    K: '킹 (King)',
};

export const STEPS = [
    // ── Step 1: Welcome & Board ─────────────────────────────────
    {
        id: 'welcome-board',
        title: 'Step 1 / 5 — 보드 인지',
        body: `
            <p>Tri-Dimensional Chess 는 <strong>메인 보드 3장</strong> (낮은 W · 중간 N · 높은 B)
            과 <strong>어택 보드 4장</strong> (QL1·KL1·QL3·KL3) 으로 구성됩니다.</p>
            <p>총 64칸 — 평면 체스와 같은 칸 수지만 <em>레벨</em> 축이 추가되어
            piece 가 위·아래로도 움직입니다.</p>
            <p class="hint">💡 카메라가 자동으로 회전하며 보드 구조를 보여줍니다.
            보드 위 라벨로 각 plate 의 위치를 확인하세요.</p>
        `,
        placement: 'bottom-right',
        onEnter({ api }) {
            api.controls.autoRotate = true;
            api.controls.autoRotateSpeed = 1.2;
            _boardLabels = new TutorialBoardLabels({
                camera: api.camera,
                renderer: api.renderer,
                getState: () => api.gameState,
            });
            _boardLabels.show();
        },
        onExit({ api }) {
            api.controls.autoRotate = false;
            if (_boardLabels) { _boardLabels.hide(); _boardLabels = null; }
        },
    },

    // ── Step 2: Piece 호버 ──────────────────────────────────────
    {
        id: 'pieces-hover',
        title: 'Step 2 / 5 — Piece 식별',
        body: `
            <p>보드 위 piece 를 <strong>마우스로 호버</strong> 하면 이름과
            합법 이동 칸이 노란색으로 강조됩니다.</p>
            <p class="tut-hover-info" data-hover-info>호버한 piece 의 이름이 여기에 표시됩니다.</p>
            <p class="hint">💡 nighy/king 등 piece 별 이동 패턴을 비교해 보세요.
            준비되면 "다음" 을 클릭.</p>
        `,
        placement: 'bottom-right',
        onEnter({ api, bubble }) {
            const info = bubble.querySelector('[data-hover-info]');
            api.setHoverHandler((sq) => {
                if (!sq) {
                    api.ui.selected = null; api.ui.moves = []; api.ui.castles = new Set();
                    api.clearAllHighlights();
                    if (info) info.textContent = '호버한 piece 의 이름이 여기에 표시됩니다.';
                    return;
                }
                const piece = api.gameState.getPiece(sq);
                if (!piece) {
                    api.ui.selected = null; api.ui.moves = []; api.ui.castles = new Set();
                    api.clearAllHighlights();
                    if (info) info.textContent = `${sq} — 빈 칸`;
                    return;
                }
                api.ui.selected = sq;
                api.ui.moves    = api.getLegalMoves(sq);
                api.ui.castles  = new Set();
                api.clearAllHighlights();
                api.highlightSquare(sq.toString(), api.COLOR.SELECTED);
                for (const m of api.ui.moves) {
                    api.highlightSquare(m.toString(), api.COLOR.MOVE);
                }
                if (info) {
                    const colorKo = piece.color === 'white' ? '백' : '흑';
                    const name = PIECE_KO[piece.type] || piece.type;
                    const n = api.ui.moves.length;
                    info.textContent = `${colorKo} ${name} @ ${sq} — 합법 수 ${n}개`;
                }
            });
            // Step 2 에선 클릭 무시 (선택은 호버로만)
            api.setClickHandler(() => {});
        },
        onExit({ api }) {
            api.setHoverHandler(null);
            api.setClickHandler(null);
            api.ui.selected = null; api.ui.moves = []; api.ui.castles = new Set();
            api.clearAllHighlights();
        },
    },

    // ── Step 3: 첫 수 강제 (분리 GameState) ─────────────────────
    {
        id: 'first-move',
        title: 'Step 3 / 5 — 첫 수 두기',
        body: `
            <p>이제 직접 한 수 둬 봅니다. <strong>b1(W) 의 백 폰</strong> 이
            자동 선택돼 있고 합법 이동 칸이 <span style="color:#ffe54a">노란색</span> 으로
            표시됩니다.</p>
            <p class="hint">💡 노란 칸 중 하나를 클릭해 폰을 이동시키세요.
            이동 후 자동으로 다음 step 으로 넘어갑니다.</p>
        `,
        placement: 'bottom-right',
        autoAdvance: true,
        onEnter({ api, controller }) {
            // 분리 GameState 인스턴스 — 종료 시 복원
            this._snap = api.snapshot();
            api.loadTutorialState();

            // b1(W) White Pawn 선택
            const allSquares = [...api.gameState.pieces.values()];
            const wPawnB1 = allSquares.find(p =>
                p.color === 'white' && p.type === 'P' &&
                p.position.file === 'b' && p.position.rank === 1 &&
                p.position.level === 'W'
            );
            const fromSq = wPawnB1 ? wPawnB1.position : null;
            if (!fromSq) {
                // 안전망 — 못 찾으면 첫 white pawn 으로 폴백
                const anyP = allSquares.find(p => p.color === 'white' && p.type === 'P');
                if (anyP) api.selectSquare(anyP.position);
            } else {
                api.selectSquare(fromSq);
            }

            this._from = api.ui.selected;
            api.setClickHandler((sq) => {
                if (!this._from) return;
                const ok = api.ui.moves.some(m => m.equals(sq));
                if (!ok) return; // 비합법 칸 클릭 무시
                api.commitMove(this._from, sq);
                // 한 수 두면 다음 step 으로
                controller.next();
            });
        },
        onExit({ api }) {
            api.setClickHandler(null);
            if (this._snap) { api.restore(this._snap); this._snap = null; }
            this._from = null;
        },
    },

    // ── Step 4: Attack Board (stub) ─────────────────────────────
    {
        id: 'attack-board',
        title: 'Step 4 / 5 — Attack Board (예고)',
        body: `
            <p>다음 sprint 에서 추가 예정 — 어택 보드 자체를 옮기는 데모.</p>
            <p>2D 패널의 <code>QL1/KL1/QL3/KL3</code> 라벨 클릭으로 핀 이동을
            시도할 수 있습니다 (룰북 §7 참조).</p>
        `,
        placement: 'bottom-right',
    },

    // ── Step 5: Path A/B (stub) ─────────────────────────────────
    {
        id: 'path-ab',
        title: 'Step 5 / 5 — Path A / B (예고)',
        body: `
            <p>한 piece 가 어택 보드 경유 시 두 경로 시각화 — 다음 sprint.</p>
            <p>"마치기" 를 누르면 일반 게임으로 진입합니다. 즐겨주세요! 🖖</p>
        `,
        placement: 'bottom-right',
    },
];
