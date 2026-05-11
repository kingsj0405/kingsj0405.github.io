# ADR-0008 — MVP 이동 규칙: same-level only (Pawn/Rook/Bishop/Queen)

- **상태:** Superseded by ADR-0009 (abs 좌표 + highest-path lite)
- **일자:** 2026-05-11
- **관련:** `src/rules/pieceMovement/{pawn,rook,bishop,queen}.js`

---

## 컨텍스트

Sprint 3.2 QA 에서 사용자가 "폰이 같은 레벨 어디든 텔레포트" BLOCKER 제기.
Sprint 3.3 (R/B/Q) + 3.4 (P) 를 앞당겨 합쳐서 처리.

Roth-2012 정통 룰의 핵심은 **"highest path"** — 레벨 간 이동 시 사용 가능한 가장 높은 레벨의
경로를 따라 이동. 이는 다음을 함의:

- 슬라이딩 piece (R/B/Q) 가 단순 file/rank 가 아닌 absolute-coord (file_abs, rank_abs) 그리드에서
  움직이며, 각 step 마다 그 좌표를 가진 가장 높은 level 의 SquareId 를 선택.
- 폰 forward 이동 역시 abs 좌표 +1 후 highest path 적용.

이 메커니즘은 구현 복잡도가 크고, 정확한 정의 (어떤 보드 위 어떤 경우에 highest 가 어디인가)
가 룰셋마다 미묘하게 다름. MVP 단계에서 전부 구현하면 진척이 정지됨.

## 결정

**Pawn / Rook / Bishop / Queen 은 MVP 에서 same-level only.**

- 각 piece 의 (file, rank) 만 변하며 level 은 그대로 유지.
- pseudo-legal 이동은 같은 SquareId.level 안에서만 생성.
- 결과적으로 attack board 위 piece 가 main 으로 빠져나오지 못함 (의도된 한계).

**Knight 와 King 은 별도 ADR (0006) 의 규칙 유지** — Knight 는 same-level L-shape,
King 은 same-level 8방향 + 인접 레벨 수직 1칸 (file/rank 일치 시).

## 대안

| 대안 | 기각 사유 |
|------|----------|
| Roth highest-path 정확 구현 | 구현 복잡도 폭발, 우선 정확한 동일레벨 룰부터 확정 필요 |
| Absolute-coord 그리드 위 이동 + 해당 abs 의 모든 level SquareId 후보 | 한 이동이 multiple level 후보를 만드는데 UI/UX 확정 어려움 |
| 데모 fallback 유지 | 폰 텔레포트 = BLOCKER 자체 |

## 결과

### Pawn (same-level)
- 전진 1칸: rank ± 1 (color), 빈 칸이어야 함.
- 전진 2칸: `hasMoved === false` 일 때, 두 칸 모두 빈 경우.
- 대각 캡처: file ± 1, rank ± 1, 적 말 있을 때만.
- en passant / 프로모션: 미구현.

### Rook (same-level)
- file/rank 4 방향 슬라이딩, 첫 장애물에서 정지 (적이면 캡처 후 정지).

### Bishop (same-level)
- 대각 4 방향 슬라이딩.

### Queen (same-level)
- Rook + Bishop 합집합.

### 알려진 한계
- Attack board 위 piece (white QL1/KL1 R/N/P, black QL3/KL3) 의 게임 진행 불가:
  - QL1 white pawn at a1: forward 후보는 a2(QL1) 뿐. 게임 진행에 따라 빈 칸 캡처 가능성 적음.
  - QL1 white rook at a1: same-level 만 슬라이딩 → b1(QL1) 한 칸 + (a2 차단 또는 캡처).
  - 결과적으로 attack board piece 가 거의 정지 상태로 게임 진행됨.
- 메인 보드 간 이동 (예: W rank 3 의 백 폰이 N rank 1 으로 진출) 불가.

## 재검토 트리거 (다음 ADR 후보)

- M5 룰셋 분기 시 (Roth-2012 highest path 정확 구현)
- 사용자 QA 가 "게임이 진행 안 됨" BLOCKER 로 평가 시 → 우선 highest-path lite 도입
- Attack board controller (M4) 도입 후 piece 가 attack board 이동으로 옮겨다닐 수 있게 되면 충분할 수도

## 참조

- `src/rules/RuleController.js` (dispatch)
- `src/rules/pieceMovement/*.js`
- ADR-0006 (Knight/King 레벨 횡단)
- ADR-0007 (Bartmess overlap geometry)
- https://www.thedance.net/~roth/TECHBLOG/chess.html (Roth-2012 룰북 원본)
