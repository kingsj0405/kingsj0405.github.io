# ADR-0012 — `src/tutorial/` 모듈 신설

- **상태:** Accepted
- **일자:** 2026-05-28
- **관련:** `src/tutorial/`, `src/main.js`, `index.html`, `rules-ko.html`, 사이드카 hub `exaone_individual/docs/260528-2026-KST-tridichess-dev/`

---

## 컨텍스트

3D 체스는 룰 자체가 낯설어 첫 방문자 진입 장벽이 높다 (cf. `rules-ko.html` §14 동기). 현재 신규 사용자 경로는:

1. 사이트 진입 → 빈 보드와 사이드바.
2. 📖 룰 버튼 → `rules-ko.html` 595 줄 단일 페이지.
3. 다시 게임으로 돌아와 시도.

룰북만으로는 "보드 구조 → piece 식별 → 첫 수 → 어택 보드" 같은 공간 개념을 머리에 그리기 어렵다.
사이드카 hub plan (Phase 2) 에서 5-step interactive 튜토리얼을 합의했고, 첫 방문 자동 modal 진입점도 확정 (cf. plan `Q2 → A`).

이를 호스팅할 새 디렉토리 `src/tutorial/` 이 필요하다. CLAUDE.md §2-5 는 "되돌리기 어려운 디렉토리 구조 변경" 을 ADR 대상으로 명시 — 그래서 이 ADR 을 먼저 작성한다.

## 결정

- 신규 디렉토리 `src/tutorial/` 신설.
- 책임: 5-step 시나리오 정의·진행 상태 관리·DOM overlay 렌더·종료 콜백.
- **튜토리얼 전용 `GameState` 인스턴스** 를 분리 생성. 일반 게임의 `GameState` 와 절대 공유 X (immutability + flag-free 회귀).
- `src/rules/` 의 합법성 검증 API 는 그대로 import (Three.js 의존 0 → import 무비용).
- `src/renderer/` 는 read-only — 튜토리얼은 자체 카메라 hint/말풍선만 추가, 씬 mutate 금지.
- 진입점: `index.html` 첫 방문 시 `localStorage["tridichess.tutorial.seen"]` 미설정이면 자동 modal. Skip / Start 두 버튼. 이후 사이드바 `❓` 버튼으로도 재진입.
- step 정의는 데이터(JSON-like 객체) 로 분리, 컨트롤러는 step index 만 보유.

### 디렉토리 규약 (`src/tutorial/`)

```
src/tutorial/
  TutorialController.js   // step index, advance/skip/restart, GameState 분리 생성
  TutorialOverlay.js      // DOM overlay (말풍선, 진행 dot, Skip 버튼)
  steps.js                // STEPS = [ { id, title, body, highlights, predicate }, ... ]
  WelcomeModal.js         // 첫 방문 진입 modal (Start / Skip / "다시 보지 않기")
```

`src/tutorial/` 는 `src/rules/`, `src/model/` 만 import 한다. `src/renderer/`, `src/ui/` 는 콜백 인터페이스 (`renderer.highlightSquares(ids, kind)`) 를 통해서만 접근.

## 대안

| 대안 | 기각 사유 |
|------|----------|
| `tutorial.html` 별도 페이지 | scene 격리 명료성은 ↑, 하지만 사용자 결정 = "첫 방문 자동 modal" (Q2-A). 메인 진입을 그대로 살림 |
| `src/ui/tutorial/` 하위 신설 | `src/ui/` 는 패널·디버그 오버레이로 협소화돼 있음. 신규 동급 책임이라 평행 디렉토리 적합 |
| modal/overlay 만 `src/ui/` 에 두고 컨트롤러는 `src/main.js` 에 인라인 | `src/main.js` 비대화. 5-step state 머신을 진입점에 두는 건 격리 위반 |
| ADR 없이 material 만으로 결정 기록 | tridichess repo CLAUDE.md §2-5 "되돌리기 어려운 디렉토리 구조 변경" 정직 적용 — 외부 hub 만으로는 repo 내 일관성 깨짐 |

## 결과

- `src/tutorial/` 4 파일 추가, 일반 게임 흐름 unchanged (flag 분기 0 — 진입 단계에서만 `localStorage` 확인).
- 튜토리얼 종료/Skip 시 정상 게임 진입.
- 테스트: `src/tutorial/` 는 `src/model/`·`src/rules/` 만 의존하는 step `predicate` 로직에 한해 vitest fixture 1개 (`tests/fixtures/tutorial-steps.json`) 추가. DOM overlay 는 수동 스모크.

## 트레이드오프

- 신규 디렉토리 추가로 mental model 표면적 +1. 책임 격리 분명해서 비용 < 가치.
- `localStorage` flag 도입 — 첫 방문 판정만 사용, 추후 사용자 설정 확장 가능.
- `src/tutorial/` 가 `GameState` 분리 인스턴스를 들고 있으므로 메인 씬 state 와의 동기화 책임 없음 (의도).

## 재검토 트리거

- step 정의가 데이터-only 로 부족해 시나리오마다 컨트롤러 로직이 분기 → DSL/엔진 추출 필요할 때.
- 튜토리얼 후 main 게임 진입에서 state mutation 누수 발견 시.
- M5 (visual overhaul) 에서 renderer API 가 크게 바뀌면 overlay 인터페이스 재정의.
- 다국어 (`assets/i18n/`) 도입 시 `steps.js` 의 KO 텍스트 분리.

## 참조

- 사이드카 hub plan: `exaone_individual/docs/260528-2026-KST-tridichess-dev/plan-260528-2026-KST-rulebook-and-tutorial.md`
- Phase 0 진단: `exaone_individual/docs/260528-2026-KST-tridichess-dev/material-260528-2110-KST-phase0-rules-ko-painpoints.md`
- ADR-0003 (no bundler) — `src/tutorial/` 도 ES Modules + importmap 만 사용.
- ADR-0002 (immutable state) — 튜토리얼 전용 `GameState` 도 동일 규약.
