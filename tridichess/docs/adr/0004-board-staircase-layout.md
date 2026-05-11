# ADR-0004 — 메인 보드 Z 후퇴 staircase 배치 복원

- **상태:** Accepted
- **일자:** 2026-05-11
- **관련:** `src/renderer/CoordMapper.js`, `src/renderer/BoardRenderer.js`
- **Sprint:** 3.1 (QA BLOCKER 처리)

---

## 컨텍스트

Sprint 3.1 QA 에서 사용자가 **"보드 모양이 이상함"** 을 BLOCKER 로 보고했다.
원인 진단:

- 원본 프로토타입(`c92164f`) 은 정통 Tri-D staircase 배치였음:
  - W : (0, 0,        0)
  - N : (0, LEVEL_H,  -2*SQ)
  - B : (0, 2*LEVEL_H,-4*SQ)
- M2 (`260220-2240-KST-M2-implementation-report.md`) 에서 "스테어케이스 제거" 라며
  세 메인 보드를 모두 `z = 0` 으로 모았음.
- 결과: N 보드(빈 칸)가 W 위에 직접 겹쳐 거의 안 보이고, 어택 보드 위치도 어긋남.
- 계획서 §11 의 "X/Z 동일, Y 높이만 다름" 문구가 잘못된 가정의 원인.

## 결정

**원본 staircase 배치로 복원.** 각 메인 보드는 Y 가 올라갈수록 Z 가 뒤로 물러남.

```
LEVEL_Z = {
  W:   0,
  N:  -2 * SQ,
  B:  -4 * SQ,
  QL1: 0,           // W 모서리에 부착
  KL1: 0,
  QL3: -6 * SQ,     // B 뒤쪽에 부착
  KL3: -6 * SQ,
}

squareToVector3:  z = LEVEL_Z[level] + (2.5 - rank) * SQ
```

어택 보드 X 오프셋도 함께 조정 (`QL: -2, KL: +4`) 하여 plate 중심이 `±3*SQ` 가 되도록.

## 대안

| 대안 | 기각 사유 |
|------|----------|
| M2 "stacked" 유지 (Y만 다름) | 시각적으로 N 보드가 사라짐, 어택 보드 정합 안 됨 |
| 더 큰 Z 후퇴 (예: -3*SQ 간격) | 카메라 줌 거리 조정 필요, 시각 이득 적음 |
| Roth 정확 anchor 구현 | M4 (Attack Board 시스템) 와 함께 다룸 — 지금은 정적 배치만 |

## 결과

- N 보드가 시각적으로 분리되어 보임
- QL3/KL3 어택 보드가 B 보드와 명확히 구분됨
- 어택 보드 X/Z 모두 부모 메인 보드 옆/뒤로 깔끔히 분리

## 트레이드오프

- 어택 보드의 Roth 정통 anchor 위치(예: QL1 ↔ a4(W) 모서리)는 **본 ADR 범위 외**.
  현재는 시각적으로 합리적인 위치에 배치하고, M4 에서 Attack Board 컨트롤러가 도입될 때
  정확한 anchor 의미를 재정의한다.
- Z 후퇴 폭(`2*SQ`)은 시각 휴리스틱. Roth 원문에 수치 명시 없음.

## 재검토 트리거

- M4 Attack Board 시스템 도입 시 (anchor 의미 재정의)
- 카메라/줌 변경 시 staircase 가시성 문제 발생 시
- Roth 원문에서 정확한 staircase 간격 출처 발견 시

## 참조

- 원본 프로토타입 위치값: `c92164f tridichess/index.html` `setupPhysicalBoards()`
- `production/qa/M3-sprint-3.1-qa.md` (QA BLOCKER 기록)
- 계획서 §11 (수정 이력 참조)
