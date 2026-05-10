---
status: active
supersedes_partial: docs/260220-2130-KST-implementation-plan.md (§7 마일스톤 일부)
inspired_by: https://github.com/Donchitos/Claude-Code-Game-Studios
---

# Tri-Dimensional Chess — 개정 구현 계획서 (v2)

> 작성일: 2026-05-10 23:24 KST
> 기준 상태: M1(구조 분해) + M2(SquareId 좌표계) 완료. 다음은 M3(이동 엔진).
> 본 문서의 위치: 기존 `260220-2130-KST-implementation-plan.md`는 **설계 사양서**로 유지하고,
>                 본 문서는 **앞으로의 진행 절차/작업 분해**를 다룬다.

---

## 0. 이 문서가 추가로 다루는 것

기존 계획서는 "무엇을 만들 것인가"(좌표계, 규칙, 데이터 모델)는 잘 정의했지만,
**"어떻게 협업하며 진행할 것인가"** 와 **"M3를 며칠짜리 작업 단위로 어떻게 쪼갤 것인가"**
가 비어 있었다. 본 문서는 그 두 축을 채운다.

참고 레포 [Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)
에서 **취사선택**한 것:

| 채택 | 사유 |
|------|------|
| `CLAUDE.md` 마스터 컨벤션 파일 | 매 세션 컨텍스트 재로딩 비용 절감 |
| `docs/adr/` 결정 기록 (ADR) | 좌표계·상태모델 같은 되돌리기 어려운 결정 기록 |
| `production/` 마일스톤·스프린트 폴더 | M1/M2 보고서 누적 위치 일원화 |
| `prototypes/` 격리 실험 폴더 | 캡처 애니/AI 등은 메인 코드와 분리 |
| 소수 서브에이전트 (4~5개) | 게임 스튜디오의 49개는 과잉. 프로젝트 규모에 맞게 축소 |
| pre-commit 훅 (vitest + lint) | M3부터 규칙 엔진 회귀 위험 큼 |
| Question→Options→Decision→Draft→Approval 루프 | 1인 hobby라도 결정 추적 가치 큼 |

**채택하지 않은 것:** 72개 슬래시 커맨드, 40+ 서브에이전트, 11개 path-scoped rule.
혼자 굴리는 hobby 프로젝트에 비례하지 않는 무게.

---

## 1. 작업 인프라 정비 (M2.5)

M3에 들어가기 전에 한 번에 정리할 가벼운 단계. 예상 작업: **반나절**.

### 1-1. 디렉토리 추가

```
tridichess/
├── CLAUDE.md                       ← 신규
├── docs/
│   ├── 260220-2130-...plan.md      ← 기존 (설계 사양)
│   ├── 260510-2324-...plan.md      ← 본 문서 (절차)
│   └── adr/                        ← 신규
│       ├── 0001-coordinate-system-squareid.md
│       ├── 0002-state-model-immutable-snapshot.md
│       └── 0003-no-bundler-importmap.md
├── production/                     ← 신규
│   ├── milestones/
│   │   ├── M1-report.md            ← 기존 docs/260220-2155-... 이동
│   │   ├── M2-report.md            ← 기존 docs/260220-2240-... 이동
│   │   └── M3-sprint-plan.md       ← 신규 (§3 참조)
│   ├── qa/                         ← 신규: sprint별 QA 노트 (§4-bis)
│   │   └── M3-sprint-3.X-qa.md
│   ├── retrospectives/
│   ├── backlog.md                  ← 신규: MINOR/NIT 적재
│   └── ideas.md                    ← 신규: 결함 아닌 아이디어/관찰
├── prototypes/                     ← 신규 (현재 비어둠)
└── .claude/
    ├── agents/
    │   ├── rule-engineer.md
    │   ├── three-renderer.md
    │   ├── qa-tester.md
    │   └── ux-controller.md
    └── hooks/
        └── pre-commit.sh           ← vitest run
```

### 1-2. `CLAUDE.md` 핵심 항목 (요약)

- **언어:** 코드/식별자 영어, 문서/주석/커뮤니케이션 한국어.
- **모듈:** ES Modules + importmap. 번들러 도입 금지(M5까지). 도입 시점은 ADR 추가 후 결정.
- **테스트:** `src/model/`, `src/rules/`, `src/board/` 변경은 vitest 동반 필수. 렌더러는 수동 스모크.
- **불변성:** GameState/Piece/Move/SquareId는 모두 `Object.freeze`. 변경은 `with(patch)` 패턴.
- **결정 기록:** 좌표계·상태모델·이동규칙 분기·번들러 도입 등 되돌리기 어려운 결정은 **ADR**로.
- **루프:** Question → Options → Decision → Draft → Approval. 큰 변경 전에 옵션 2~3개 제시 후 합의.
- **커밋 메시지:** `<scope>: <intent>` (예: `rules/pawn: legal forward moves on same level`).
- **금지:** `<details>` 블록, 의미 없는 주석(WHAT 설명), TODO 누적.

### 1-3. `.claude/agents/` 4개 (필요 최소)

| 에이전트 | 담당 | 사용 시점 |
|---------|------|----------|
| `rule-engineer` | `src/rules/`, `src/model/`, `tests/rules/` | M3, M5 |
| `three-renderer` | `src/renderer/`, 시각 효과 | M4(반전), M6(경로 프리뷰) |
| `qa-tester` | 테스트 작성/회귀, fixtures | 모든 마일스톤 종료 시 |
| `ux-controller` | `src/input/`, `src/ui/` | M6 |

각 에이전트 정의는 한 페이지 이내. 게임 스튜디오 레포의 길고 무거운 정의를 그대로 옮기지 않는다.

### 1-4. pre-commit 훅

```sh
#!/usr/bin/env sh
# .claude/hooks/pre-commit.sh
set -e
npm test --silent
```

훅이 실패하면 `--no-verify`로 우회하지 않고 원인을 고친다.

---

## 2. ADR 초기 3건 (즉시 작성)

각 1~2페이지. 결정만 기록하고 코드 인용은 최소화.

1. **ADR-0001 좌표계 = `SquareId(file, rank, level)`**
   - 대안: 8×8 인덱스(M1), 단일 정수, 3차원 배열.
   - 결정 사유: void 칸 자연 제거, 직렬화 용이, 레벨 추가 확장성.
   - 결과: M2에서 채택, 본문 §11 명세 따름.

2. **ADR-0002 상태 모델 = 불변 스냅샷 + Map**
   - 대안: 가변 배열 mutate, OOP 보드 그래프.
   - 결정 사유: undo/redo·스냅샷 테스트·체크 시뮬레이션이 단순해짐.
   - 트레이드오프: 매 이동마다 새 객체 생성 비용. 64칸 규모에서는 무시 가능.

3. **ADR-0003 번들러 미도입 (M5까지)**
   - 대안: Vite, esbuild.
   - 결정 사유: GitHub Pages 정적 호스팅, 의존성은 three 단일, 빌드 단계 추가 비용 회피.
   - 재검토 트리거: 외부 npm 패키지 2개 이상 도입 시, 또는 모듈 30개 초과 시.

---

## 3. M3 스프린트 분해 (이동 엔진 v1)

기존 계획서 §7 M3은 "1~2주"로 추정만 있고 작업 단위가 큼. 다음과 같이 **5개 sprint**로 쪼갠다.
각 sprint는 독립 PR/커밋 단위, 종료 시 `production/milestones/M3-sprint-plan.md`에 체크.

### Sprint 3.1 — 데이터 모델 완성 (1일)
- `src/model/Piece.js`, `Move.js`, `GameState.js`, `initialState.js` 작성.
- 모두 `Object.freeze` + `with(patch)`.
- 테스트: `tests/model/GameState.test.js` — 초기 배치 32개 말, getPiece/setPiece round-trip.
- **종료 조건:** `createInitialState()` 가 64칸 중 32칸 점유 상태 반환, 테스트 통과.

### Sprint 3.2 — pathUtils + 비-슬라이딩 (1.5일)
- `src/rules/pathUtils.js` 의 `slidingRay(state, from, dir)`.
- `pieceMovement/knight.js`, `king.js` (1칸 이동만, 캐슬링 X).
- 레벨 이동은 **수직열 동일 좌표만** 우선 허용 (Path B는 M5).
- 테스트: 빈 보드 N(d4) Knight = 8칸 + 수직 변형, K(d4) = 인접 8칸 + 수직.

### Sprint 3.3 — 슬라이딩 피스 (2일)
- `pieceMovement/rook.js`, `bishop.js`, `queen.js`.
- 핵심 결정: **대각선이 레벨을 가로지를 때의 정의** → ADR-0004로 기록.
  - 옵션 A: 레벨 고정(2D 대각선만)
  - 옵션 B: (file, rank, level) 모두 ±1 동시 이동 허용 (Roth 명시 없음)
  - 옵션 C: 수직 투영 후 같은 (file,rank) 매칭 시만 레벨 변경
  - **현재 권장:** A로 시작, 별도 "level transit" 이동을 King/Pawn에만 허용 → M5 재검토.
- 테스트: 빈 보드 d1(W) Rook = 6칸(같은 레벨), 장애물 차단, 적 캡처.

### Sprint 3.4 — Pawn (1.5일)
- `pieceMovement/pawn.js` — 전진 1/2칸, 대각 캡처, 레벨 진입(W→N→B 수직열).
- 앙파상은 M5로 미룸. 프로모션은 stub만.
- 테스트: 초기 배치에서 White pawn 8개 각각 가능 이동 수.

### Sprint 3.5 — RuleController + 자기체크 필터 (2일)
- `RuleController.generateLegalMoves(state, from)`: pseudo-legal → 자기체크 제거.
- `isInCheck(state, color)`: 상대 모든 말의 pseudo-legal 합집합에 자기 King 위치 포함 여부.
- `applyMove(state, move): GameState` (불변).
- `main.js` 의 데모 `getMoves()` 제거, RuleController 결선.
- 회귀 테스트 fixtures: `tests/fixtures/check_*.json` 3개 (단순 체크, 차단, 더블체크).
- **종료 조건:** 화면에서 합법 이동만 노란색 표시. 자기 체크 두는 수 차단됨.

### M3 전체 종료 기준
- vitest: 50개 이상 테스트, 전부 통과.
- 수동 스모크: 백/흑 번갈아 5수씩 두어보기, 콘솔 에러 0.
- `production/milestones/M3-report.md` 작성 (변경 파일 표 + 검증 결과 표 + M2 보고서 형식 유지).

---

## 4. M4 이후 변경 사항 (기존 계획 대비)

### M4 (Attack Board 시스템) — 변경 없음
기존 계획서 §7 M4 그대로. 단, **소유권 변경 규칙은 ADR로 별도 기록**(룰셋 분기 영향).

### M5 (Path B + 특수규칙) — 범위 확정
기존 계획서 §7 M5에 다음 추가:
- **Path B 정의 ADR 필수.** 두 경로 중 캡처 결과가 다를 때 UI 분기 필요.
- 캐슬링: 3D 변형 규칙은 Roth 원문 재검증 후 ADR.

### M6 (UX) — 우선순위 재조정
기존: 레벨 선택 → 경로 프리뷰 → 불법수 피드백 → Undo/Redo → 기보.
**개정 우선순위:** 불법수 사유 표시 → 경로 프리뷰 → Undo/Redo → 레벨 포커스 → 기보.
사유: 사용자(본인) 디버깅 가치 > 미려함.

### M7 (테스트 강화) — Fuzzing 목표 명시
- 1000게임 무작위 시뮬레이션, 0 크래시 + 모든 종료 상태가 체크메이트/스테일메이트/무승부 중 하나.

---

## 4-bis. QA 워크플로우 (사용자 수동 검증 → 반영 루프)

자동 테스트(vitest)는 규칙 엔진의 정확성은 잡지만, **3D 카메라/하이라이트/클릭 반응성/시각적 어색함**
같은 UX 문제는 사용자가 직접 만져봐야 보인다. 따라서 모든 sprint는 다음 5단계 사이클로 진행한다.

### 4-bis-1. Sprint 사이클 (5단계)

```
[1] 구현 (Claude Code)
       │   - 코드 변경 + vitest 통과 + 자체 스모크
       ▼
[2] QA 패키지 전달 (Claude Code → 사용자)
       │   - 무엇을 어떻게 확인하면 되는지 체크리스트 제공
       ▼
[3] 수동 QA (사용자, 브라우저)
       │   - 체크리스트 따라 시연 + 자유 탐색
       ▼
[4] 피드백 기록 (사용자 → QA 노트)
       │   - production/qa/<sprint>-qa.md 에 한 줄씩
       ▼
[5] 반영 / 다음 sprint 진입 결정
           - Blocker 있음 → 같은 sprint 내 수정 후 [2]로 복귀
           - Minor 있음   → 백로그(production/backlog.md)에 적재 후 진행
           - Pass         → sprint 종료, 다음 sprint 진입
```

### 4-bis-2. QA 패키지 형식 (Claude Code가 매 sprint 끝에 출력)

매 sprint 종료 시 Claude Code는 **다음 형식의 메시지를 사용자에게 출력**한다.
별도 문서 파일을 매번 만들지 않고 채팅에 붙여넣는다 (가벼움 우선).

```markdown
## QA 요청 — Sprint 3.X

### 실행 방법
npm run dev → http://localhost:8080

### 변경 요약
- (한 줄) 무엇이 바뀌었는지

### 확인 체크리스트 (5~10분)
[ ] 1. (구체적 행동) → (기대 결과)
[ ] 2. ...
[ ] 3. (회귀 확인) 이전 sprint에서 됐던 X가 여전히 됨

### 일부러 확인 안 한 것 (이번 sprint 범위 밖)
- 예: AB 반전 — M4에서 다룸

### 알려진 한계
- 예: pawn 프로모션 UI 없음, 콘솔에 stub 로그 출력
```

체크리스트는 **자동 테스트가 못 잡는 것 위주**로 작성한다. vitest가 검증한 항목을 다시 손으로 누르지 않는다.

### 4-bis-3. 사용자 피드백 형식

`production/qa/M3-sprint-3.X-qa.md` 한 파일에 누적. 한 항목 한 줄, 우선순위 prefix.

```markdown
# Sprint 3.3 QA — 2026-05-24

[BLOCKER] d1 룩이 d2를 지나 d3까지 못 감 — d2 빈 칸인데도 차단됨
[MAJOR]   하이라이트 노란색이 어두운 보드에서 잘 안 보임
[MINOR]   클릭 시 카메라가 살짝 흔들림
[NIT]     수직열 청록색이 이전보다 옅어짐
[NOTE]    같은 색 말 위에 마우스 오버 시 커서 모양 바꿔주면 좋겠음
```

**우선순위 정의:**
| 라벨 | 의미 | 처리 |
|------|------|------|
| `BLOCKER` | sprint 목표가 깨짐 | **같은 sprint 내 수정**, 종료 보류 |
| `MAJOR` | 동작은 하지만 명백한 결함 | 같은 sprint 내 수정 권장, 시간 부족 시 다음 sprint 첫 작업 |
| `MINOR` | 사용성 거슬림, 기능은 정상 | 백로그 적재 |
| `NIT` | 취향/마감 디테일 | 백로그 적재 (M6에서 통합 처리) |
| `NOTE` | 아이디어/관찰, 결함 아님 | `production/ideas.md` 로 이동 |

### 4-bis-4. 백로그 운영

`production/backlog.md` 단일 파일. 위에서 아래로 우선순위 내림차순.
sprint 시작 시 상위 3개를 검토 → 현 sprint 범위에 합류시킬지 결정.
6개월 묵은 항목은 가차 없이 삭제 (혼자 hobby라 의무 없음).

### 4-bis-5. QA 가속을 위한 도구

- **`?debug=1` URL 플래그:** 좌표 라벨/FPS/현재 상태 dump 자동 ON.
- **`window.tridi.dumpState()`:** 콘솔에서 현 GameState JSON 복사 → 버그 리포트에 첨부.
- **`window.tridi.loadFixture(name)`:** `tests/fixtures/` 의 포지션을 화면에 즉시 로드 (M3.5부터).
- **스크린샷 단축키:** Three.js canvas → toDataURL → 클립보드 (M6에서 추가).

### 4-bis-6. 마일스톤 종료 게이트

각 마일스톤 종료 시 `production/milestones/MX-report.md` 에 다음 4개 섹션 필수:

1. 변경 파일 표
2. 자동 테스트 결과 (개수, 통과율, 커버리지)
3. **QA 결과 요약** (sprint별 BLOCKER 0, MAJOR 처리/이월, 잔여 MINOR 수)
4. 다음 마일스톤 영향/선결 조건

QA 결과 섹션이 비면 마일스톤 종료로 인정하지 않는다.

### 4-bis-7. 각 Sprint 종료 조건에 QA 게이트 추가

§3의 Sprint 3.1~3.5 종료 조건은 모두 다음을 **공통 추가**한다:

> **+ QA 게이트:** 4-bis-2 형식의 QA 패키지 전달 → 사용자 체크리스트 통과 (BLOCKER 0).

자동 테스트가 통과해도 QA 게이트를 통과 못 하면 sprint는 끝나지 않는다.

---

## 5. 작업 순서 요약 (앞으로 6주)

```
Week 0 (반나절):  M2.5 인프라 — CLAUDE.md, ADR 0001~0003, production/ 폴더, 훅
Week 1:           Sprint 3.1 + 3.2 (모델 + 비슬라이딩)
Week 2:           Sprint 3.3 + 3.4 (슬라이딩 + 폰)
Week 3:           Sprint 3.5 (체크 필터) + M3 보고서
Week 4:           M4 (Attack Board)
Week 5:           M5 (Path B + 특수규칙)
Week 6+:          M6 UX, M7 테스트 강화
```

---

## 6. 즉시 다음 액션 (다음 세션에서 할 일)

1. `CLAUDE.md` 작성 — §1-2 항목 따라.
2. `docs/adr/0001-coordinate-system-squareid.md` ~ `0003-no-bundler-importmap.md` 작성.
3. `production/milestones/` 만들고 기존 M1/M2 보고서 이동.
4. `production/milestones/M3-sprint-plan.md` 작성 — §3 그대로 옮기고 체크박스 추가.
5. `.claude/agents/rule-engineer.md` 1개만 먼저 작성 (Sprint 3.1 진입용).
6. `.claude/hooks/pre-commit.sh` + 권한 부여.

위 6개를 한 PR로 묶으면 인프라 정비 1회 커밋. 이후 Sprint 3.1 시작.

---

## 7. 결정 보류 항목 (추후 ADR 후보)

- Path A/B 의 정확한 정의 (M5 진입 시).
- 룩 슬라이딩이 같은 file+rank의 다른 레벨까지 닿는지 여부 (Roth 재독 후).
- Attack Board 위에서의 앙파상 (희귀 케이스, 룰셋 분기).
- 번들러 도입 시점 (외부 의존성 추가 시).
- AI(상대 봇) 도입 여부 — 본 계획 범위 외.

---

*M3 진입 신호: §6의 6개 항목 완료 시점.*
