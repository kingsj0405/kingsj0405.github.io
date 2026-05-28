/**
 * Tutorial step definitions (data-only).
 * Step controller reads this in order; per-step rendering decisions live in
 * TutorialOverlay.js. Keep this file free of DOM / Three.js imports.
 *
 * 각 step:
 *  - id        : 식별자 (route/anchor 후보)
 *  - title     : 말풍선 헤더 (KO)
 *  - body      : 본문 (HTML 허용, span/strong/code 정도만)
 *  - placement : 'center' | 'bottom-right' (오버레이 위치 힌트)
 *  - waitFor   : 'click-next' | { kind:'predicate', name:string }
 *                  predicate 는 controller 가 라우팅 — Step 3 부터 활용
 */

export const STEPS = [
    {
        id: 'welcome-board',
        title: 'Step 1 — 보드 인지',
        body: `
            <p>Tri-Dimensional Chess 는 <strong>메인 보드 3장</strong> (낮은 W / 중간 N / 높은 B)
            과 <strong>어택 보드 4장</strong> (각 모서리 핀에 부착) 으로 구성됩니다.</p>
            <p>총 64칸 — 평면 체스와 같은 칸 수지만 <em>레벨</em> 축이 추가되어
            piece 가 위·아래로도 움직입니다.</p>
            <p class="hint">💡 마우스 드래그로 보드를 회전시켜 구조를 살펴보세요.</p>
        `,
        placement: 'bottom-right',
        waitFor: 'click-next',
    },
    {
        id: 'pieces',
        title: 'Step 2 — Piece 식별 (예정)',
        body: `<p>각 piece 의 이동 패턴을 호버로 확인합니다. <em>(Step 2 미구현 — 후속 sprint)</em></p>`,
        placement: 'bottom-right',
        waitFor: 'click-next',
    },
    {
        id: 'first-move',
        title: 'Step 3 — 첫 수 (예정)',
        body: `<p>White Pawn 1수 — 합법 칸만 highlight 되어 직접 클릭합니다. <em>(미구현)</em></p>`,
        placement: 'bottom-right',
        waitFor: 'click-next',
    },
    {
        id: 'attack-board',
        title: 'Step 4 — Attack Board (예정)',
        body: `<p>어택 보드 자체를 옮기는 데모. <em>(미구현)</em></p>`,
        placement: 'bottom-right',
        waitFor: 'click-next',
    },
    {
        id: 'path-ab',
        title: 'Step 5 — Path A/B (예정)',
        body: `<p>한 piece 가 어택 보드 경유 시 두 경로 시각화. <em>(미구현)</em></p>`,
        placement: 'bottom-right',
        waitFor: 'click-next',
    },
];

export const TUTORIAL_SEEN_KEY = 'tridichess.tutorial.seen';
