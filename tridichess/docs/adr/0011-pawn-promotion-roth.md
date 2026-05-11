# ADR-0011 — Pawn promotion: Roth abs rank 8/9 (main + attack)

- **상태:** Accepted
- **일자:** 2026-05-12
- **관련:** `src/rules/RuleController.js`

---

## 컨텍스트

Sprint 3.5 후속에서 promotion 미구현 — 폰이 끝 랭크 도달해도 그대로 폰. 룰북 정의:

> "White Pawns promote (normally) whenever they reach rank 8 or rank 9.
>  Similarly, black Pawns promote whenever they reach rank 1 or rank 0."
> — Roth-2012

abs 좌표 기준:
- 백 폰 promotion: `absRank >= 8` (즉 abs rank 8 = B rank 4 또는 attack rank 1, abs rank 9 = attack rank 2)
- 흑 폰 promotion: `absRank <= 1` (즉 abs rank 1 = W rank 1 또는 attack rank 2, abs rank 0 = attack rank 1)

Roth 는 **main + attack 둘 다** 프로모션 영역으로 정의. 추가로 어택 보드 이동으로 폰이
끝 랭크에 옮겨지는 경우도 promotion (M4 에서 함께 처리 예정).

## 결정

`RuleController.applyMove` 가 폰 이동 직후 abs rank 검사 → 자동 Queen 으로 promotion.
선택 UI 는 미구현 (MVP 항상 Q). 후속 ADR 에서 픽커 도입 가능.

moveHistory 표기: `♙ a7→a8=Q` (=Q suffix).

## 대안

| 대안 | 기각 사유 |
|------|----------|
| 메인 보드만 (main-land 원칙) | Roth 정통과 어긋남, attack board 위 폰 의미 약화 |
| 항상 Queen 강제 | 채택 (MVP). 후속: 픽커 UI |
| 4 piece 픽커 (Q/R/B/N) | UX 작업 필요, 후속 sprint |
| auto-cancel 가능한 임시 promotion | MVP 과잉 |

## 결과

- 백 폰 a 파일이 a8(B) (abs 8) 또는 a1(KL3)/a2(KL3) (abs 8/9) 도달 시 Queen 변환.
- 흑 폰도 동일하게 abs rank ≤ 1 시 변환.
- AI 가 자연스럽게 promotion 가치 (Q vs P = 8 점 차) 인식 → 폰 추진 가속화.

## 트레이드오프

- 항상 Queen 이라 R/B/N underpromotion 불가 (드물지만 존재).
- attack board 위 promotion 이 게임감 변화 가져옴 (의도된 Roth 동작).

## 재검토 트리거

- 사용자가 underpromotion 필요하다고 요청
- M4 Attack Board 이동 promotion 추가
- 게임 테스트 결과 promotion 빈도가 비현실적이면

## 참조

- https://www.thedance.net/~roth/TECHBLOG/chess.html — Roth-2012 promotion 룰
- `src/rules/RuleController.js` `applyMove` 끝부분
