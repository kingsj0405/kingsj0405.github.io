# ADR-0007 — Bartmess overlap geometry 정확 적용

- **상태:** Accepted
- **일자:** 2026-05-11
- **관련:** `src/renderer/CoordMapper.js`, `src/renderer/BoardRenderer.js`
- **Supersedes:** ADR-0004 (메인 staircase 만 부분 복구)

---

## 컨텍스트

Sprint 3.2 QA 에서 사용자가 **"보드들 간의 연결이 잘못됨"** 으로 BLOCKER 제기.
구체적 멘탈 모델:

- QL1 b2 = W a1 (xy 일치)
- W a3 = N a1 (xy 일치) → N 은 W rank 3 위에서 시작
- N a3 = B a1 (xy 일치) → B 는 N rank 3 위에서 시작

웹 검증:
> "each next level starts above the **third row** of the previous level" — Chessvariants 빌딩 가이드
> "one of its [attack board] corner has a corner of the [main] board below it" — 동일 출처

ADR-0004 가 staircase 메인 보드까지는 복구했으나 어택 보드는 정통 overlap 을 반영하지 않아
`QL1 b2 z = +7` 같은 어긋난 위치였음.

## 결정

**Absolute 좌표 통일계 도입** (Bartmess 호환). 모든 보드는 다음 공유 (x, z) 그리드 위에 자리:

```
abs file 0..5  →  x = (abs - 2.5) * SQ
abs rank 0..9  →  z = (2.5 - abs) * SQ
```

각 board 의 local (file a..d, rank 1..4) 을 absolute 으로 매핑:

| board | file 'a' abs | rank 1 abs | LEVEL_Z (= z when rank=2.5 + offset) | AB_X_OFFSET |
|-------|--------------|------------|--------------------------------------|-------------|
| W     | 1            | 1          | 0                                    | n/a |
| N     | 1            | 3          | -2*SQ                                | n/a |
| B     | 1            | 5          | -4*SQ                                | n/a |
| QL1   | 0            | 0          | +SQ                                  | -1  |
| KL1   | 4            | 0          | +SQ                                  | +3  |
| QL3   | 0            | 8          | -7*SQ                                | -1  |
| KL3   | 4            | 8          | -7*SQ                                | +3  |

공식:
```
x = FILE_X[file] * SQ + (isAttack ? AB_X_OFFSET[level] * SQ : 0)
z = LEVEL_Z[level] + (2.5 - rank) * SQ
```

## 검증 (단위 일치 표)

| 좌표 a | 좌표 b | abs | x, z |
|--------|--------|-----|------|
| W a1   | QL1 b2 | (1, 1) | (-21, +21) |
| W d1   | KL1 a2 | (4, 1) | (+21, +21) |
| W a3   | N a1   | (1, 3) | (-21, -7)  |
| N a3   | B a1   | (1, 5) | (-21, -35) |
| B a4   | QL3 b1 | (1, 8) | (-21, -77) |
| B d4   | KL3 a1 | (4, 8) | (+21, -77) |

## 대안

| 대안 | 기각 사유 |
|------|----------|
| 어택 보드를 메인 옆 빈 공간에 단순 배치 | 정통 Tri-D 의 "corner overlap" 개념 손실 |
| Bartmess 처럼 unified (file, rank, level) 트리플 좌표로 모델 자체 교체 | SquareId 시스템 (per-board local coords) 전면 재작성, M3 진척 정지 |

## 결과

- 7 개 보드가 absolute 좌표 그리드 위에 정확히 정합.
- 메인-메인 overlap 2 rank, 어택-메인 corner overlap 1×1 칸이 시각적으로 자명.
- 자동 테스트 영향 없음 (SquareId 트리플 자체는 불변).

## 트레이드오프

- 어택 보드와 메인 보드가 (x, z) 공유 칸이 있다는 의미는 **레벨 횡단 이동 정의** 시 새 의미가 생김 — 같은 (x, z) 칸은 King 의 vertical-column 후보로 자연스럽게 잡힘. ADR-0006 의 인접 그래프와 일관: QL1 ↔ W 인접에서 b2(QL1)↔a1(W) 는 같은 (file_abs, rank_abs).
- 다만 본 ADR 은 `SquareId.toString()` 이 여전히 `b2(QL1)` 와 `a1(W)` 를 별개로 취급. 게임 로직 상으로 별개 칸. 시각적으로만 겹침.
- 2D 패널은 여전히 보드별 분리 표시 (가독성 우선). 향후 absolute-coord 모드 옵션 추가 검토 가능.

## 재검토 트리거

- M4 Attack Board 시스템 도입 시 (anchor 정확 의미 재정의)
- 사용자 멘탈 모델 재검토 (예: 2D 패널을 absolute-grid 형식으로 전환 요청)

## 참조

- ADR-0004 (이전, supersede)
- https://www.chessvariants.com/3d.dir/starboard.html (Bartmess 빌딩 가이드)
- `production/qa/M3-sprint-3.1-qa.md` 의 Sprint 3.2 BLOCKER
