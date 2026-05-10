# CLAUDE.md — Tri-Dimensional Chess

이 파일은 Claude Code가 매 세션 시작 시 읽는 마스터 컨벤션 문서다.
프로젝트 진행 절차/원칙은 `docs/260510-2324-KST-revised-implementation-plan.md` 가 기준이며,
본 문서는 그중 **Claude가 매번 따라야 할 항목**만 추린 것이다.

---

## 1. 프로젝트 개요

- **목표:** Star Trek Tri-Dimensional Chess 를 웹에서 정확한 규칙으로 플레이.
- **기술:** 바닐라 ES Modules + importmap + Three.js (CDN), Vitest.
- **현재 상태:** M1(구조 분해) + M2(SquareId 좌표계) 완료. 다음은 **M2.5 인프라 정비 → M3 이동 엔진**.
- **호스팅:** GitHub Pages (정적). 빌드 단계 없음.

---

## 2. 절대 따를 원칙

### 2-1. 언어
- **코드/식별자/파일명:** 영어.
- **문서/주석/커밋 메시지/대화:** 한국어.

### 2-2. 모듈/빌드
- ES Modules + importmap **만** 사용. 번들러(Vite/esbuild/webpack) 도입 금지 (M5까지).
- 도입 필요 시 ADR 추가 후 합의.
- 외부 의존성 추가 시 사용자에게 먼저 옵션을 제시.

### 2-3. 불변성 (Immutability)
- `SquareId`, `Piece`, `Move`, `GameState`, `BoardNode` 는 모두 `Object.freeze`.
- 변경은 `with(patch)` 패턴으로 새 객체 생성. 직접 mutate 금지.
- 배열/Map 도 신규 인스턴스로 교체 (in-place push/set 금지 — 게임 상태 한정).

### 2-4. 테스트
- `src/model/`, `src/rules/`, `src/board/` 변경은 **vitest 동반 필수**.
- 렌더러(`src/renderer/`)·UI(`src/ui/`)·입력(`src/input/`)은 수동 스모크 + QA 게이트로 검증.
- 새 규칙 도입 시 fixtures (`tests/fixtures/*.json`) 1개 이상 추가.

### 2-5. 결정 기록 (ADR)
다음 종류의 결정은 `docs/adr/NNNN-<slug>.md` 로 기록:
- 좌표계/상태모델 변경
- 이동 규칙의 모호한 분기 (예: 대각선 레벨 이동 정의)
- 번들러/외부 의존성 도입
- 룰셋 분기 (Roth2012 vs Triple-S)
- 되돌리기 어려운 디렉토리 구조 변경

ADR 형식: 1~2페이지, "결정 / 대안 / 사유 / 결과 / 재검토 트리거" 5개 항목.

### 2-6. 협업 루프
**Question → Options → Decision → Draft → Approval** 을 큰 변경에 적용.
- 옵션 2~3개 + 트레이드오프 제시 후 사용자 결정 대기.
- 단순한 수정은 바로 진행. 판단 기준: "되돌리기 어려운가?" YES → 옵션 제시.

### 2-7. QA 워크플로우
매 sprint 종료 시 다음 형식으로 **QA 패키지** 출력:

```markdown
## QA 요청 — Sprint X.Y

### 실행 방법
npm run dev → http://localhost:8080

### 변경 요약
- (한 줄)

### 확인 체크리스트 (5~10분)
[ ] 1. (구체 행동) → (기대 결과)
[ ] 2. ...
[ ] 3. (회귀) 이전 sprint 동작 유지

### 일부러 확인 안 한 것
- (범위 밖)

### 알려진 한계
- (의도된 stub/미구현)
```

체크리스트는 **자동 테스트가 못 잡는 것 위주**. 사용자 피드백 우선순위 라벨:
`BLOCKER` / `MAJOR` / `MINOR` / `NIT` / `NOTE`.

`BLOCKER` 0 + `MAJOR` 처리/이월 합의 시 sprint 종료. 자세한 절차는 계획서 §4-bis.

---

## 3. 디렉토리 규약

```
tridichess/
├── CLAUDE.md                ← 이 파일
├── index.html
├── src/
│   ├── main.js
│   ├── model/               ← 불변 데이터 (SquareId, Piece, Move, GameState)
│   ├── rules/               ← 이동 규칙, 체크 판정 (RuleController, pieceMovement/)
│   ├── board/               ← Attack Board 컨트롤러
│   ├── input/               ← 클릭 상태 머신
│   ├── renderer/            ← Three.js 씬/메시
│   ├── ui/                  ← DOM 사이드바, 디버그 오버레이
│   └── config/              ← 상수, 룰셋
├── tests/
│   ├── model/  rules/  board/  fixtures/
├── docs/
│   ├── 260220-2130-...-implementation-plan.md  ← 설계 사양 (불변)
│   ├── 260510-2324-...-revised-implementation-plan.md  ← 진행 절차
│   └── adr/                 ← 결정 기록
├── production/
│   ├── milestones/          ← M1-report.md, M2-report.md, M3-sprint-plan.md, ...
│   ├── qa/                  ← M3-sprint-3.X-qa.md (사용자 피드백)
│   ├── retrospectives/
│   ├── backlog.md           ← MINOR/NIT 적재
│   └── ideas.md             ← 결함 아닌 아이디어
├── prototypes/              ← 격리 실험 (메인 코드와 분리)
└── .claude/
    ├── agents/              ← rule-engineer, three-renderer, qa-tester, ux-controller
    └── hooks/               ← pre-commit.sh (vitest run)
```

**파일 배치 규칙:**
- `src/rules/` 는 Three.js 의존 금지 (Node 환경에서 테스트 가능해야 함).
- `src/renderer/` 는 게임 상태 mutate 금지 (read-only 소비자).
- `src/main.js` 가 유일한 조립점 (DI 컨테이너 역할).

---

## 4. 코드 스타일

### 4-1. 주석
- **기본은 주석 없음.** 변수명/함수명으로 의도를 표현.
- 작성하는 경우: WHY(숨은 제약, 비자명한 invariant, 워크어라운드)만. WHAT 설명 금지.
- JSDoc 은 model/rules 의 public API 에만 (1~3줄). 절대 paragraph docstring 금지.

### 4-2. 네이밍
- 클래스: `PascalCase`.
- 함수/변수: `camelCase`.
- 상수: `UPPER_SNAKE`.
- 파일: 모듈 export 한 클래스명과 일치 (`SquareId.js` → `export class SquareId`).
- private 헬퍼: 파일 내 `_camelCase` (export 안 함).

### 4-3. 함수 길이
- 50줄 이상이면 분해 검토. 단, 규칙 엔진의 분기 표는 예외.

### 4-4. 금지 패턴
- `console.log` 잔류 (디버그용은 `console.debug` + `?debug=1` 가드).
- 미사용 import / 미사용 변수.
- TODO 누적 (해결 PR 또는 백로그 항목으로 변환).
- `<details>` HTML 블록을 마크다운 문서에 사용.
- `--no-verify` 로 훅 우회.

---

## 5. 커밋

- 메시지: `<scope>: <intent>` 형식. scope = `rules/pawn`, `renderer/board`, `model/state`, `docs/adr` 등.
- 한국어 본문 가능. 첫 줄은 50자 이내.
- 사용자가 "커밋해줘" 라고 명시할 때만 커밋. 자체 판단으로 커밋 금지.
- pre-commit 훅(vitest) 실패 시 우회 금지, 원인 수정.

---

## 6. 서브에이전트 사용 가이드

| 에이전트 | 호출 시점 |
|---------|----------|
| `rule-engineer` | `src/rules/`, `src/model/`, `tests/rules/` 변경 |
| `three-renderer` | `src/renderer/`, 시각 효과/카메라 |
| `qa-tester` | 테스트 작성, fixtures, 회귀 검증 |
| `ux-controller` | `src/input/`, `src/ui/` |

각 에이전트는 자기 영역 외 파일 수정 시 사용자에게 먼저 알린다.

---

## 7. 자주 쓰는 명령

```bash
npm run dev        # http-server -p 8080 -c-1
npm test           # vitest run
npm run test:watch # 개발 중
```

**배포:** 빌드 단계 없음. `kingsj0405.github.io` 저장소에 push 하면 GitHub Pages가
`tridichess/index.html` 을 그대로 서빙한다 (https://yangspace.co.kr/tridichess/).
- importmap 으로 three.js 를 unpkg CDN 에서 로드 → `node_modules` 배포 불필요.
- `package.json` 의 vitest/http-server 는 개발 도구일 뿐 런타임 의존성 아님.
- 번들러 도입은 ADR-0003 재검토 트리거 (외부 npm 패키지 추가, TS 도입, 모듈 30개 초과 등) 충족 시에만.

브라우저 디버그 도구 (M3.5부터 추가 예정):
- `?debug=1` → 좌표 라벨 + FPS + 상태 dump 자동 ON
- `window.tridi.dumpState()` → 현 상태 JSON 콘솔 출력
- `window.tridi.loadFixture(name)` → fixture 즉시 로드

---

## 8. 참고 문서 (이 순서로 우선 참조)

1. `docs/260510-2324-KST-revised-implementation-plan.md` — 진행 절차/스프린트 분해 (현재 기준)
2. `docs/260220-2130-KST-implementation-plan.md` — 설계 사양/좌표계/규칙 명세
3. `production/milestones/` — 마일스톤별 보고서
4. `docs/adr/` — 결정 기록
5. Roth/Bartmess 규칙: https://www.thedance.net/~roth/TECHBLOG/chess.html
