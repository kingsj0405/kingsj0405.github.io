# M3 — 이동 엔진 v1 — 스프린트 계획

> 기준: `docs/260510-2324-KST-revised-implementation-plan.md` §3
> 목표: 6종 말의 합법 이동 + 자기 체크 금지. 화면에서 합법 이동만 노란색 표시.
> 예상 총 기간: 8일 (Sprint 3.1~3.5 합)
> 시작 조건: M2.5 인프라 정비 완료 (CLAUDE.md / ADR 0001~0003 / production/ / agents / hooks)

---

## Sprint 3.1 — 데이터 모델 완성 (1일)

### 목표
불변 game state 모델을 완성하고 초기 배치를 그릴 수 있게 한다.

### 작업
- [ ] `src/model/Piece.js` — `{id, type, color, position, hasMoved}`, `with(patch)`
- [ ] `src/model/Move.js` — `{kind, piece, from, to, captured?, pathA?, pathB?}`
- [ ] `src/model/GameState.js` — `{pieces: Map, boards: Map, turn, moveHistory, rulesetId}`, `with(patch)`
- [ ] `src/model/initialState.js` — `createInitialState()` 32 piece 배치
- [ ] 기존 `src/main.js` 의 임시 board Map 을 `GameState` 로 교체 (renderer 인터페이스 유지)
- [ ] `tests/model/GameState.test.js` — 초기 배치 32개, getPiece/setPiece round-trip, freeze 검증

### 종료 조건
- 화면에 32개 말 정상 배치
- 자동 테스트 신규 8개 이상 통과
- vitest 전체 그린
- **QA 게이트:** §QA 패키지 → BLOCKER 0

### 의존성
M2.5 인프라 완료 이후 시작 가능.

---

## Sprint 3.2 — pathUtils + 비-슬라이딩 피스 (1.5일) — ✅ COMPLETED 2026-05-11

### 목표
Knight, King 의 pseudo-legal 이동 생성. 슬라이딩 인프라 마련.

### 작업
- [x] `src/rules/pathUtils.js` — `slidingRay(state, from, dir, color): SquareId[]` (3.3 에서 활용)
- [x] `src/rules/pieceMovement/knight.js` — 2D L-shape, 같은 레벨만 (ADR-0006)
- [x] `src/rules/pieceMovement/king.js` — 인접 1칸 + 수직 인접 레벨
- [x] **레벨 인접 그래프**: W↔N↔B, QL1/KL1↔W, QL3/KL3↔B (ADR-0006)
- [x] `src/rules/RuleController.js` — generateLegalMoves dispatcher (데모 폴백 포함)
- [x] `tests/rules/knight.test.js` (7), `tests/rules/king.test.js` (10)
- [x] `SquareId.exists()` static + tests (3)
- [x] main.js getMoves 가 RuleController 위임

### 종료 조건
- [x] 자동 테스트: 62/62 (이전 42 + 신규 20)
- [x] Knight/King 클릭 시 정통 합법 이동만 표시
- [x] 다른 piece 는 데모 폴백 유지
- [ ] **QA 게이트:** BLOCKER 0 (사용자 확인 대기)

---

## Sprint 3.3 — 슬라이딩 피스 + 대각선 정의 ADR (2일)

### 목표
Rook, Bishop, Queen 의 pseudo-legal 이동 + Bishop 의 레벨 횡단 정의 결정.

### 작업
- [ ] **ADR-0004 작성** — 대각선 레벨 이동 정의
  - 옵션 A: 레벨 고정(2D 대각만)
  - 옵션 B: (file,rank,level) 모두 ±1 동시
  - 옵션 C: 수직 투영 매칭 시만
  - 권장: **A 로 시작**, level transit 은 King/Pawn 한정
- [ ] `src/rules/pieceMovement/rook.js` — 같은 레벨 내 file/rank 슬라이딩
- [ ] `src/rules/pieceMovement/bishop.js` — ADR-0004 결정 따라
- [ ] `src/rules/pieceMovement/queen.js` — rook + bishop
- [ ] `tests/rules/rook.test.js`, `bishop.test.js`, `queen.test.js`
  - 빈 보드 d1(W) Rook = 6칸 (같은 레벨)
  - 장애물 차단, 적 캡처

### 종료 조건
- ADR-0004 머지
- 슬라이딩 3종 단위 테스트 그린
- 화면에서 클릭 시 슬라이딩 차단 시각적으로 정확
- **QA 게이트:** BLOCKER 0

---

## Sprint 3.4 — Pawn (1.5일)

### 목표
폰 전진/대각 캡처/레벨 진입. 앙파상·프로모션은 M5.

### 작업
- [ ] `src/rules/pieceMovement/pawn.js`
  - 1칸 전진 (rank+1 for white)
  - 초기 위치에서 2칸 전진 옵션
  - 대각 캡처
  - 레벨 진입 (W→N→B 수직열 한 칸 위로 가는 경로 — Roth 재독)
- [ ] 프로모션 stub (도달 시 console.warn, UI 는 M6)
- [ ] `tests/rules/pawn.test.js`
  - 초기 배치 White pawn 8개 각각 가능 이동 수
  - 캡처 가능 케이스 fixture

### 종료 조건
- 폰 8개 모두 정상 이동
- 앙파상/프로모션 미구현 명시 (CLAUDE.md "알려진 한계")
- **QA 게이트:** BLOCKER 0

---

## Sprint 3.5 — RuleController + 자기 체크 필터 (2일)

### 목표
pseudo-legal → legal 필터링. M3 종료점.

### 작업
- [ ] `src/rules/RuleController.js`
  - `generateLegalMoves(state, from): Move[]`
  - `isInCheck(state, color): boolean` — 모든 상대 말의 pseudo-legal 합집합에 자기 King 위치 포함 여부
  - `applyMove(state, move): GameState` — 불변
- [ ] `src/main.js` 의 데모 `getMoves()` 제거 → RuleController 결선
- [ ] 회귀 fixtures: `tests/fixtures/check_simple.json`, `check_blocked.json`, `double_check.json`
- [ ] 통합 테스트: 초기 배치에서 White 가능 이동 총수 (수치는 측정 후 회귀 anchor 로 고정)

### 종료 조건
- vitest 전체 그린, 신규 fixture 3건 검증
- 화면에서 자기 체크 두는 수 차단됨 (시각 확인)
- 백/흑 번갈아 5수씩 콘솔 에러 0
- **QA 게이트:** BLOCKER 0

---

## M3 전체 종료 게이트

- [ ] vitest 50개 이상, 전부 통과
- [ ] 수동 스모크: 백/흑 5수씩 × 2회, 에러 0
- [ ] 모든 sprint QA 의 BLOCKER 0
- [ ] `production/milestones/M3-report.md` 작성 (M2 보고서 형식: 변경 파일 표 / 자동 테스트 결과 / QA 결과 요약 / M4 영향)
- [ ] M3 retrospective 1페이지 (`production/retrospectives/M3-retro.md`)

---

## 현재 진행 상태

- 시작 전 (M2.5 인프라 정비 진행 중)
- 다음 액션: Sprint 3.1 작업 항목 첫 번째 — `Piece.js` 작성
