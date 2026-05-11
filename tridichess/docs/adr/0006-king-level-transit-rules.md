# ADR-0006 — Knight·King 레벨 횡단 규칙 (Sprint 3.2 MVP)

- **상태:** Superseded by ADR-0009 (abs 좌표 + highest-path lite 통합)
- **일자:** 2026-05-11
- **관련:** `src/rules/pieceMovement/knight.js`, `src/rules/pieceMovement/king.js`

---

## 컨텍스트

Sprint 3.2 에서 Knight 와 King 의 pseudo-legal 이동을 구현. 정통 Roth/Bartmess
규칙은 레벨 횡단(level transit) 을 명시적으로 정의하나, 본 프로젝트의 7-level 좌표계
(W, N, B, QL1, KL1, QL3, KL3) 에 그대로 매핑되지 않음. 두 가지 결정을 내려야 함:

1. **Knight 가 레벨을 횡단하는가?**
2. **King 의 레벨 인접 그래프는?**

본 ADR 은 MVP 진행을 위해 **가장 단순한 선택**을 한다. 추후 정통 룰셋 분기(M5) 시 재검토.

## 결정

### (1) Knight: 레벨 횡단 없음 (Sprint 3.2)

같은 레벨 안에서만 2D L-shape ((±2,±1) 또는 (±1,±2)). 4×4 메인 보드에서 코너 2칸,
준중앙 4칸 정도. 2×2 attack board 위에서는 항상 0칸.

### (2) King: 같은 레벨 8방향 + 인접 레벨 수직 1칸

레벨 인접 그래프(대칭):

```
W   ↔ N
W   ↔ QL1, KL1
N   ↔ B
B   ↔ QL3, KL3
```

명시: N 은 attack board 와 직접 인접하지 않음 (Y 거리상 N↔QL1=12.5 이지만 attack board 의
의미가 "메인 보드 모서리에 부착" 이므로 부모 메인만 직접 인접 처리).

수직 이동 조건: 인접 레벨에 **같은 (file, rank) 칸이 존재** 해야 함.
- d3(W) → d3(N) ✓ (둘 다 main)
- a1(W) → a1(QL1) ✓ (file a rank 1 이 QL1 에 존재)
- d3(W) → d3(QL1) ✗ (QL1 에 file d 없음)

## 대안

### Knight 대안 — 레벨 횡단 허용

| 대안 | 기각 사유 |
|------|----------|
| (2,1,0) 의 모든 부호·축 순열로 3D 점프 | 합법 이동 수 폭증, 정통 규칙 출처 불분명 |
| Roth-2012 명시 정의 채택 | 원문 검증 필요, MVP 단계에서 지연 |

### King 대안 — 인접 그래프

| 대안 | 기각 사유 |
|------|----------|
| Y 거리 ≤ 12.5 인 모든 페어 인접 | N↔attack board 가 추가됨. 의미적으로 미묘 |
| Main 끼리만 인접 (W↔N↔B), attack 무관 | attack board 위 King 이 메인으로 못 가는 불합리 |
| 모든 동일 (file, rank) 칸 = 거리 무관 인접 | 너무 강력, Star Trek 시각적 인접성 깨짐 |

## 결과

- Knight pseudo-legal: 0~4칸 (4×4 메인), 0칸 (2×2 attack).
- King pseudo-legal: 3~8 same-level + 0~3 vertical. 메인 중앙 b3(N) 에서 최대 10칸.
- 대칭성 단위 테스트 추가 (인접 그래프 invariant).

## 트레이드오프

- Knight 가 attack board 위에서 무력화됨. 게임 디자인 의도와 부합하는지 미확인.
- N 보드 King 이 attack board 로 직접 못 감 — 메인 → attack 우회 필요.
- 사용자 (본인) 의 직관 vs 정통 룰의 충돌 시 정통 우선이지만, 정통 출처 자체가 모호.

## 재검토 트리거

- Roth-2012 원본 룰북 입수
- M5 룰셋 분기 (Roth2012 vs Triple-S) 추가 시
- Sprint 3.5 self-check 도입 시 게임감 어색하면

## 참조

- `src/rules/pieceMovement/king.js` (`LEVEL_VERTICAL_ADJACENCY` 상수)
- `tests/rules/king.test.js` (인접 그래프 대칭성 테스트)
- 계획서 §7 M3
