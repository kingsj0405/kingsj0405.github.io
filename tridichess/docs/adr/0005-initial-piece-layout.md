# ADR-0005 — 정통 Tri-D 초기 배치 채택

- **상태:** Accepted
- **일자:** 2026-05-11
- **관련:** `src/model/initialState.js`, `tests/model/GameState.test.js`

---

## 컨텍스트

Sprint 3.1 QA 에서 사용자가 **"말 배치가 잘못된 것 같다"** 고 지적.

추적 결과:
- 현행 배치는 M2 main.js → 원본 프로토타입 `c92164f` 에서 그대로 복사.
- 원본 프로토타입은 **FIDE 8×8 표준 체스 첫 두 줄을 64칸 SquareId 좌표에 그냥 욱여넣은 것** — Tri-D 규칙 검증 없음.
- 결과: R/N 이 메인 back rank 에 박혀 있고 백/흑 방향이 카메라 기준 뒤집혀 있음.

웹 조사 (Roth-2012, Wikipedia, Chess Variants) 종합:

| 정통 Tri-D | 잘못된 원본 |
|------------|------------|
| 메인 back rank: B-K-Q-B (4 piece) | R-N-B-K + R-N-Q-B (8 piece) |
| Rook/Knight: attack board 위 | 메인 보드 위 |
| Attack board 각 4 칸 모두 사용 (R+N+2P) | 1-2 칸 P 만 |
| 백 back rank = 자기 쪽 (rank 1 of W) | 카메라에서 먼 쪽 (rank 4) |
| 16 piece × 2 (Franklin Mint 확인) | 16 × 2 |

## 결정

다음 배치를 정본으로 채택:

### White (16)
- W rank 1: `a1=B, b1=Q, c1=K, d1=B`
- W rank 2: 4 pawn
- QL1: `a1=R(outer), b1=N(inner), a2=P, b2=P`
- KL1: `a1=N(inner), b1=R(outer), a2=P, b2=P`

### Black (mirror, 16)
- B rank 4: `a4=B, b4=Q, c4=K, d4=B`
- B rank 3: 4 pawn
- QL3: `a2=R, b2=N, a1=P, b1=P` (rank 2 가 흑 쪽 edge)
- KL3: `a2=N, b2=R, a1=P, b1=P`

## 대안

| 대안 | 기각 사유 |
|------|----------|
| 원본 프로토타입 유지 | Tri-D 규칙 무시한 임시 배치 |
| Bartmess 6-file × 10-rank 좌표 도입 | SquareId 시스템(4-file, 4-rank/board) 과 충돌, 대공사 |
| 12 piece × 2 (Wikipedia 최소 해석) | Franklin Mint 16-piece 확인과 모순 |

## 보류 결정 (후속 ADR 후보)

- **B/Q 순서 (B-Q-K-B vs B-K-Q-B):** 정통 "Queen on her color" 가 4×4 에서 깔끔히 안 떨어짐. 본 ADR 은 B-Q-K-B (Queen 이 b 파일, King 이 c 파일). 향후 게임감 확인 후 재논의.
- **Attack board pawn 정확 위치:** Wikipedia 가 R/N 만 명시. 4칸 fill 가정으로 rank 2 (메인 쪽 가까운 줄) 에 2 pawn 배치. 정통이 다른 규칙을 명시한다면 수정.
- **흑 attack board 의 R/N rank:** QL3/KL3 의 rank 2 가 흑 edge 측이므로 그쪽이 back rank 로 가정. QL1/KL1 과 시각적으로 동일한 패턴 (백은 rank 1 = back, 흑은 rank 2 = back).

## 결과

- 메인 back rank 가 깔끔히 4 piece 만 차지 → 시각적으로 정통 Tri-D 모습
- Attack board 가 R+N+2P 로 가득 차서 attack board 가 의미 있는 단위로 인식됨
- 백/흑 방향이 카메라 기준 자연스러움 (백은 가까이, 흑은 멀리)
- M3 의 이동 규칙 (Sprint 3.2~3.5) 개발 시 정통 시작 포지션에서 합법 이동 수가 chess.com / lichess 참고치와 직접 비교 가능

## 재검토 트리거

- Bartmess 원본 룰북 입수 시 정확 검증
- 사용자가 다른 게임감을 원할 때
- M5 룰셋 분기 (Roth2012 vs Triple-S) 추가 시 attack board layout 차이 발견되면

## 참조

- https://www.thedance.net/~roth/TECHBLOG/chess.html
- https://en.wikipedia.org/wiki/Star_Trek_Tri-Dimensional_Chess
- M3-sprint-3.1-qa.md QA 기록
- `src/model/initialState.js`
