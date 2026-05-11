# ADR-0010 — Multi-candidate target rule (player choice)

- **상태:** Accepted
- **일자:** 2026-05-11
- **Supersedes:** ADR-0009 (strict highest-path only)
- **관련:** `src/rules/pathUtils.js`, `src/rules/pieceMovement/*.js`

---

## 컨텍스트

Sprint 3.3+3.4 QA: 흑이 B 보드 밖으로 못 나감. 강제 highest 가 항상 B 를 선택해서 흑 폰이
N/W 으로 advance 못 함. 게임 진행 불가능.

Roth-2012 원문 재확인 결과:
> "you may choose to (try to) end the move on a different level (**any** different level)"
> "The player chooses both start and target squares"

따라서 **target level 은 플레이어 선택**. ADR-0009 의 강제 highest 는 룰 오해.

## 결정

### 다중 후보 target
모든 piece 의 pseudo-legal move 생성에서 target abs cell 의 `allSquaresAt(absFile, absRank)`
**모든** SquareId 를 후보로 추가. 플레이어가 UI 에서 원하는 level 을 직접 클릭.

### Sliding blocking 규칙 (lite)
ray 따라가다가 한 abs cell 의 **후보 중 하나라도 점유** 시:
- 비어있는 후보는 target 으로 포함
- 적 후보는 capture target 으로 포함
- 아군 후보는 제외
- 그 abs cell 이후로는 sliding 종료 (어느 레벨이든)

이는 strict Roth "highest path" 의 파생: 정확한 path 계산 대신 "한 cell 에 piece 있으면
이후 막힘" 으로 단순화. MVP 단계 충분.

### Y 방향 제약 미적용
사용자가 제안한 "백은 down 불가, 흑은 up 불가" 제약은 abs rank 가 이미 forward 방향을
encoding 하므로 자연스럽게 처리됨. 별도 Y 필터 불요.

## 대안

| 대안 | 기각 사유 |
|------|----------|
| Strict highest-path (ADR-0009) | 흑이 B 에 갇힘, 게임 진행 불가 |
| Per-target full path 검증 (Roth 정확) | 구현 복잡, MVP 후 가능 |
| Player Y 제약 (白 ↑ only, 黑 ↓ only) | abs rank 가 이미 처리. King/Knight 까지 제약하면 비현실 |
| 각 cell 의 각 후보를 독립 path 처리 | 사이드 효과 분기 폭증 |

## 결과

### 새 이동 수
- 흰 폰 a2(W) 첫 이동: 4 후보 = {a3(W), a1(N), a4(W), a2(N)}. 플레이어 선택.
- 흑 폰 a3(B) 첫 이동: 4 후보 = {a4(N), a2(B), a3(N), a1(B)}. **N 으로 하강 가능.**
- King d4(W): 11 후보 (10 neighbors + 1 vertical)
- Knight d4(W): 7 후보
- Rook d1(W) on empty: 약 20 후보 (다방향 × multi-candidate)

### Sliding 의 "cell 중 하나라도 blocked → 멈춤" 의 의미
- 예: Rook d1(W) → +rank 슬라이딩. abs (4, 3) 의 N d1 이 적이면:
  - d3(W) ← 같은 cell 빈 후보 추가
  - d1(N) ← 적 capture 추가
  - 다음 cell (4, 4) 이후 sliding 종료

### 한계
- 정확한 per-path 검증 부족 (룰 디테일 손실 가능). 후속 ADR 검토.
- En passant / 프로모션 / 캐슬링 / Attack board 이동 / Self-check filter 미구현.

## 재검토 트리거

- 사용자가 "각 cell 다 다 막혀 답답" 피드백 → per-candidate path 모드 검토
- M4 Attack Board controller 와 정합
- 실제 게임 테스트 결과 어느 piece 가 너무 약/강한지 평가

## 참조

- ADR-0009 (강제 highest, supersede)
- Roth-2012 원문: https://www.thedance.net/~roth/TECHBLOG/chess.html
