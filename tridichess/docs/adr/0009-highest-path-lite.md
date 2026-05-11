# ADR-0009 — Highest-Path Lite: abs 좌표 기반 통합 이동 모델

- **상태:** Superseded by ADR-0010 (multi-candidate, player choice)
- **일자:** 2026-05-11
- **Supersedes:** ADR-0006 (King 레벨 인접 그래프), ADR-0008 (same-level only MVP)
- **관련:** `src/model/SquareId.js`, `src/rules/pathUtils.js`, `src/rules/pieceMovement/*.js`

---

## 컨텍스트

Sprint 3.3+3.4 QA 에서 MAJOR 두 가지:
1. 보드 간 같은 (local file, rank) 칸이 잘못 "vertical column" 으로 묶여 cyan 하이라이트가 엉뚱한
   칸을 강조 (예: a1(W) 와 a1(N) 이 column 으로 표시되나 실제 (x,z) 가 다름).
2. piece 이동 logic 이 same-level only 라 보드 간 이동 없음, 게임 진행 불가.

원인:
- `getVerticalColumn` 이 SquareId.local (file, rank) 비교로 column 산출 — abs 좌표가
  같은 칸끼리 묶여야 정확.
- 모든 piece 이동이 local rank/file delta 로 step → abs 좌표 기준이 아니라 인접 보드 진입 안 됨.

웹 출처 (Roth/Bartmess) 의 "highest path" rule 을 단순화한 버전으로 통합.

## 결정

### Absolute 좌표 모델
- 각 SquareId 는 `BOARD_INFO[level]` 의 fileOffset/rankOffset 으로 `(absFile, absRank)` 로 변환됨.
- abs 그리드: `(0..5, 0..9)`, gaps 있음.
- 7 보드의 Y 순위 (highest first): QL3, KL3 (Y=62.5) > B (50) > N (25) > QL1, KL1 (12.5) > W (0).

### 새 헬퍼 (SquareId.js)
- `SquareId.prototype.toAbs()` → `{ absFile, absRank }`
- `allSquaresAt(absFile, absRank)` → 해당 abs cell 의 모든 SquareId (Y 내림차순)
- `highestSquareAt(absFile, absRank)` → 그 첫번째 (가장 높은) SquareId 또는 null
- `getVerticalColumn(sq)` → 같은 abs 의 다른 SquareId 들 (대부분 빈 배열, overlap cell 만 1~2 개)

### 이동 규칙 통합
모든 piece 가 다음 패턴 따름:
1. 출발 SquareId 의 abs 좌표를 구함.
2. piece-specific abs offset (또는 ray direction) 으로 target abs cell 계산.
3. `highestSquareAt(targetAbs)` 로 실제 target SquareId 결정.
4. 점유 여부 검사:
   - 비어있음 → 이동/슬라이딩 계속
   - 아군 → 차단 (target 제외)
   - 적 → 캡처 가능, 그 너머 정지

**Piece 별 구체:**
- **Pawn**: abs rank ±1 (color dir) 전진 1/2, abs (±1, ±1) 대각 캡처.
- **Knight**: 8 종 (±2, ±1)/(±1, ±2) abs 점프, 경로 무시 (장애물 통과).
- **King**: 8 abs 방향 1 step + `getVerticalColumn` 으로 same-abs 다른 레벨 이동 (특권).
- **Rook**: abs (±1, 0) / (0, ±1) ray.
- **Bishop**: abs (±1, ±1) ray.
- **Queen**: rook + bishop ray 합.

## 대안

| 대안 | 기각 사유 |
|------|----------|
| Roth 정확 "highest path" (path A + path B) | 구현 복잡, MVP 에서 게임 진행 가능성 검증 우선 |
| Local-coord same-level only | game 진행 불가, BLOCKER 자체 |
| Multi-candidate target (player chooses which level) | UI/UX 복잡, MVP 후 검토 |
| Strict Roth: piece 가 "below" 칸에 있을 때 보이지 않음 | 게임감 매우 다름, hobby 단계엔 과도 |

## 결과

### Gameplay 변화
- 백 폰 a2(W) 첫 이동: a3(W) 가 아니라 **a1(N)** (N 이 abs (1,3) 의 highest).
  즉 폰이 첫 이동에서 자동으로 N 보드 로 진입.
- King at a1(W) 의 이동 후보: 8 abs 인접 + b2(QL1) (vertical pair) = 7 칸.
  attack board overlap 코너로의 이동이 자연스럽게 활성화.
- Knight at b2(W) 가 abs (4, 3) 점프 → N d1 으로 이동 (W d3 가 아닌).
- Rook 슬라이딩이 보드 간 이동 자연스럽게 — d1(W) → d2(W) → d1(N) → d2(N) → d1(B) → ...

### Vertical column 의미 수정
- a1(W) 의 vertical column: 이제 `[b2(QL1)]` 만 (이전 6 개 잘못된 칸들 제거).
- 대부분 칸은 vertical column 이 빈 배열.

### 한계 (후속 ADR 후보)
- "Multi-candidate target" 없음 — 가장 높은 레벨 강제.
  예: 폰이 W rank 3 에서 forward 시 N rank 1 으로만 갈 수 있고 W rank 4 를 선택 못 함.
  체스 변형에서 player choice 가 필요할 때 ADR 추가.
- En passant / 프로모션 / 캐슬링 / Attack board 이동 — 미구현.
- Self-check filter — Sprint 3.5.

## 재검토 트리거

- 사용자가 "강제 highest 가 답답하다" 피드백 → multi-candidate 모드 검토
- M4 Attack Board 시스템과 연동 시
- M5 룰셋 분기 (Roth-정확 vs Triple-S 단순화) 시

## 참조

- ADR-0006 (이전 King 인접 그래프, 본 ADR 로 단순화)
- ADR-0007 (Bartmess overlap geometry — abs 좌표의 기반)
- ADR-0008 (이전 same-level only MVP, supersede)
- https://www.thedance.net/~roth/TECHBLOG/chess.html
