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
import { TutorialArrows } from './TutorialArrows.js';

export const TUTORIAL_SEEN_KEY = 'tridichess.tutorial.seen';

// 모듈 스코프 리소스 — Step 간 cleanup 보장.
let _boardLabels = null;
let _arrows = null;
// Step 3 가 분리 GameState 로 진입할 때 캡처. 튜토리얼 완전 종료 시 복원.
let _step3Snapshot = null;

/** Controller.end() 가 호출. Step 3 이후 남은 격리 state 복원. */
export function restoreTutorialSnapshot(api) {
    if (_step3Snapshot) {
        api.restore(_step3Snapshot);
        _step3Snapshot = null;
    }
}

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
        title: 'Step 1 / 6 — 보드 인지',
        body: `
            <p>Tri-Dimensional Chess 는 <strong>메인 보드 3장</strong> (낮은 W · 중간 N · 높은 B)
            과 <strong>어택 보드 4장</strong> (QL1·KL1·QL3·KL3) 으로 구성됩니다.</p>
            <p>총 64칸 — 평면 체스와 같은 칸 수지만 <em>레벨</em> 축이 추가되어
            piece 가 위·아래로도 움직입니다.</p>
            <p class="hint">💡 카메라가 자동으로 회전하며 보드 구조를 보여줍니다.
            보드 위 라벨로 각 plate 의 위치를 확인하세요.</p>
            <p class="hint">📋 오른쪽 <strong>2D Control Panel</strong> 은 위에서
            내려다본 평면도입니다. 3D 뷰가 어렵다면 이쪽이 더 직관적이고,
            piece 선택·이동·AB 라벨 클릭 모두 동일하게 동작합니다.</p>
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

    // ── Step 2: Camera 조작 ─────────────────────────────────────
    {
        id: 'camera-controls',
        title: 'Step 2 / 6 — 카메라 조작',
        body: `
            <p>3D 보드를 자유롭게 살펴볼 수 있는 카메라 컨트롤입니다.
            강조된 <strong>Main View</strong> 안에서 다음 조작을 시도해 보세요:</p>
            <ul style="margin: 6px 0 6px 16px; padding: 0;">
                <li><strong>좌 클릭 + 드래그</strong> — 보드 주위를 회전 (rotate)</li>
                <li><strong>우 클릭 + 드래그</strong> 또는 <strong>두 손가락 드래그</strong> — 시점 이동 (pan)</li>
                <li><strong>휠 스크롤</strong> 또는 <strong>두 손가락 핀치</strong> — 확대 / 축소 (zoom)</li>
            </ul>
            <p class="hint">💡 보드 사이의 수직 정렬이 보이는 각도로 맞춰 두면 piece
            이동을 추적하기 쉽습니다. 답답하면 새로고침으로 기본 시점 복귀.</p>
        `,
        placement: 'bottom-left',
        spotlight: '#view-3d',
    },

    // ── Step 3: Piece 호버 ──────────────────────────────────────
    {
        id: 'pieces-hover',
        title: 'Step 3 / 6 — Piece 식별',
        body: `
            <p>👉 강조된 <strong>3D 보드</strong> 위 piece 를 마우스로 호버하면
            이름과 합법 이동 칸이 노란색으로 표시됩니다.</p>
            <p class="tut-hover-info" data-hover-info>호버한 piece 의 이름이 여기에 표시됩니다.</p>
            <p class="hint">💡 piece 별 이동 패턴을 비교해 보세요 — 같은 색
            piece 도 위치에 따라 합법 칸이 다릅니다. 준비되면 "다음" 을 클릭.</p>
            <p class="hint">📋 오른쪽 2D Control Panel 의 격자에서도 같은 위치를
            확인할 수 있습니다 (호버는 3D 뷰에서만 동작).</p>
        `,
        placement: 'bottom-left',
        spotlight: '#view-3d',
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
        title: 'Step 4 / 6 — 첫 수 두기',
        body: `
            <p>이제 직접 한 수 둬 봅니다. <strong>백 폰</strong> 한 개가
            자동 선택돼 있고 합법 이동 칸이 <span style="color:#ffe54a">노란색</span> 으로
            표시됩니다.</p>
            <p class="hint">💡 노란 칸 중 하나를 클릭해 폰을 이동시키세요.
            (3D 보드의 칸 또는 <strong>오른쪽 2D Control Panel</strong> 의 해당 칸을
            클릭해도 동일하게 동작합니다.) 이동 후 자동으로 다음 step 으로 넘어갑니다.</p>
            <p class="hint">⚠ 튜토리얼 중 두는 수는 격리된 상태에서 진행돼 진행 중인
            실제 게임에는 영향을 주지 않습니다.</p>
        `,
        placement: 'bottom-left',
        autoAdvance: true,
        onEnter({ api, controller }) {
            // 분리 GameState 인스턴스 — 튜토리얼 종료 시 복원 (controller.end → restoreTutorialSnapshot).
            // Step 4/5 에서도 학습 결과를 계속 볼 수 있도록 onExit 에선 복원하지 않는다.
            if (!_step3Snapshot) _step3Snapshot = api.snapshot();
            api.loadTutorialState();

            // 백 폰 선택 — Roth 초기 배치에서 백 폰은 W rank 2 + 어택 보드 rank 2.
            // 가장 시연이 명료한 b2(W) (메인 보드 폰) 선택.
            const allPieces = [...api.gameState.pieces.values()];
            const targetPawn = allPieces.find(p =>
                p.color === 'white' && p.type === 'P' &&
                p.position.file === 'b' && p.position.rank === 2 &&
                p.position.level === 'W'
            ) || allPieces.find(p => p.color === 'white' && p.type === 'P');
            if (targetPawn) api.selectSquare(targetPawn.position);

            this._from = api.ui.selected;

            // 합법 칸 위로 빨간 화살표 (3D 뷰 + 2D 패널). 최대 2개만 (혼잡 방지).
            _arrows = new TutorialArrows({
                camera: api.camera,
                renderer: api.renderer,
                squareMeshes: api.squareMeshes,
            });
            const targets = api.ui.moves.slice(0, 2);
            targets.forEach((sq, i) => {
                _arrows.point(sq.toString(), { label: i === 0 ? `여기 클릭! (${sq})` : `또는 ${sq}` });
            });

            api.setClickHandler((sq) => {
                if (!this._from) return;
                const ok = api.ui.moves.some(m => m.equals(sq));
                if (!ok) return; // 비합법 칸 클릭 무시
                api.commitMove(this._from, sq);
                this._from = null;
                controller.next();
            });
        },
        onExit({ api }) {
            // snapshot 복원은 튜토리얼 완전 종료 시 (restoreTutorialSnapshot).
            api.setClickHandler(null);
            this._from = null;
            if (_arrows) { _arrows.destroy(); _arrows = null; }
        },
    },

    // ── Step 5: Attack Board ────────────────────────────────────
    {
        id: 'attack-board',
        title: 'Step 5 / 6 — Attack Board 이동',
        body: `
            <p>표준 체스와의 가장 큰 차이 — <strong>어택 보드 자체</strong> 를
            한 턴 행동으로 옮길 수 있습니다 (piece 이동 대신).</p>
            <p>조건 (Roth §7): 어택 보드가 <strong>비어 있거나 자기 색 폰 1개만</strong>
            탑승. 그 외 piece 가 있으면 잠김.</p>
            <p class="hint">📋 강조된 <strong>2D Control Panel</strong> 의
            <code>QL1 / KL1 / QL3 / KL3</code> 라벨 중 하나를 클릭하면 이동 가능한
            핀(pin) 목록이 트레이로 펼쳐집니다. 핀 ID 를 누르면 보드가 이동.</p>
            <p class="hint">💡 처음엔 자기 색 (현재 턴) AB 만 반응합니다. 핀 거리
            ≤ 2 + 보드 회전 색 제약이 적용됩니다. 자세한 룰은 룰북 §7 참조.</p>
        `,
        placement: 'bottom-left',
        spotlight: '#panel-2d',
        onEnter({ api }) {
            // 핀 이동을 시연 가능한 초기 상태로 (Step 4 commit 후 black turn 이면 자기 AB 비활성)
            api.loadTutorialState();
        },
    },

    // ── Step 6: Path A/B ────────────────────────────────────────
    {
        id: 'path-ab',
        title: 'Step 6 / 6 — Path A / B & 마무리',
        body: `
            <p>어택 보드가 메인 보드 위에 떠 있을 때, piece 는 두 가지 경로를 가질 수
            있습니다 — <strong>Path A</strong> (메인 보드 통과) 와 <strong>Path B</strong>
            (어택 보드 경유). 캡처 가능성과 차단 여부가 두 경로에서 다를 수 있어
            전술적으로 중요합니다.</p>
            <p class="hint">⚠ 현 구현은 <code>ADR-0010</code> 단순화로 highest-path 단일
            경로만 지원합니다. Path B 시각화는 후속 sprint 에서 추가 예정 — 룰북 §5 참조.</p>
            <p>여기까지가 기본 튜토리얼입니다. <strong>"마치기"</strong> 를 누르면 원래
            게임으로 돌아갑니다. 즐거운 한 판 되세요! 🖖</p>
            <p class="hint">📖 더 자세한 룰: 사이드바 상단 <strong>📖</strong> 버튼 →
            한글 룰북.</p>
        `,
        placement: 'bottom-left',
    },
];
