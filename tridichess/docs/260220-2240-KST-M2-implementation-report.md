# Tri-Dimensional Chess — M2 구현 보고서

> 작성일: 2026-02-20 22:40 KST
> 기준 계획서: `docs/260220-2130-KST-implementation-plan.md`
> 마일스톤: M2 — 보드 좌표계 확정 + 시각 디버그

---

## 1. 작업 요약

M1에서 구축한 파일 구조 위에 **SquareId 기반 3D 좌표계**를 도입하고 시각 디버그 오버레이를 추가했다.
물리 보드 위치를 새 좌표계에 맞게 갱신하고, 클릭 이벤트와 게임 상태를 SquareId 중심으로 전면 전환했다.

---

## 2. 변경/생성 파일 목록

```
tridichess/
├── index.html                  ← btn-debug 버튼 추가
└── src/
    ├── main.js                 ← SquareId 기반 게임 상태 전환, DebugOverlay 연동
    ├── model/
    │   └── SquareId.js         ← 신규: SquareId 클래스 + getAllSquares() + getVerticalColumn()
    ├── renderer/
    │   ├── CoordMapper.js      ← 전면 교체: squareToVector3(squareId)
    │   ├── BoardRenderer.js    ← 갱신: 물리 보드 위치 + Map 기반 squareMeshes
    │   └── PieceRenderer.js    ← 갱신: Map<string, piece> 기반
    └── ui/
        └── DebugOverlay.js     ← 신규: CSS2DRenderer 좌표 라벨 오버레이

tests/
└── model/
    └── SquareId.test.js        ← 신규: 18개 단위 테스트 (전체 통과)
```

---

## 3. 핵심 변경 사항

### 3-1. SquareId 모델 (`src/model/SquareId.js`)

```
file  : 'a' | 'b' | 'c' | 'd'
rank  : 1 ~ 4 (메인), 1 ~ 2 (어택)
level : 'W' | 'N' | 'B' | 'QL1' | 'KL1' | 'QL3' | 'KL3'
```

- `toString()` / `fromString()` round-trip
- `getAllSquares()` — Main 3×16=48 + Attack 4×4=16 = 64칸 생성
- `getVerticalColumn(sq)` — 같은 file+rank의 다른 레벨 칸 목록

### 3-2. 좌표 변환기 교체 (`src/renderer/CoordMapper.js`)

| 구분 | 이전 (M1) | 이후 (M2) |
|------|-----------|-----------|
| 입력 | `index: number` (0-63) | `squareId: SquareId` |
| 함수명 | `getLogicPos(index)` | `squareToVector3(squareId)` |
| 좌표계 | 8×8 평면 인덱스 | file/rank/level 3D 좌표계 |

메인 보드 공식:
```
x = FILE_X[file] * SQ         // a=-21, b=-7, c=7, d=21
z = (2.5 - rank) * SQ         // rank1=+21, rank4=-21
y = LEVEL_Y[level]             // W=0, N=25, B=50
```

어택 보드 추가 오프셋:
```
AB_X_OFFSET = { QL1: -2, KL1: 2, QL3: -2, KL3: 2 }   (×SQ)
AB_Z_OFFSET = { QL1:  1, KL1: 1, QL3: -1, KL3: -1 }   (×SQ)
```

### 3-3. 물리 보드 위치 갱신 (`src/renderer/BoardRenderer.js`)

M1에서 메인 보드에 Z 오프셋이 있던 스테어케이스 배치를 제거하고, 계획서 좌표계에 맞게 동일 X/Z 위치로 통일했다.

| 보드 | M1 위치 (x, y, z) | M2 위치 (x, y, z) |
|------|-------------------|-------------------|
| W    | (0, 0, 0)         | (0, 0, 0) — 동일 |
| N    | (0, 25, **−28**)  | (0, 25, **0**)   |
| B    | (0, 50, **−56**)  | (0, 50, **0**)   |
| QL1  | (−42, 12.5, 14)   | (−42, 12.5, **28**) |
| KL1  | (**42**, 12.5, 14)| (**14**, 12.5, **28**) |
| QL3  | (−42, 62.5, **−70**) | (−42, 62.5, **0**) |
| KL3  | (**42**, 62.5, **−70**) | (**14**, 62.5, **0**) |

`squareMeshes`가 `{}` → `Map<string, THREE.Mesh>`로 전환되었으며, 각 mesh에 `userData.squareId`가 저장된다.

### 3-4. 게임 상태 전환 (`src/main.js`)

| 항목 | M1 | M2 |
|------|----|----|
| `board` | `Array(64)` | `Map<string, piece>` |
| `selected` | `number \| null` | `SquareId \| null` |
| `moves` | `number[]` | `SquareId[]` |
| 클릭 핸들러 인자 | `idx: number` | `squareId: SquareId` |

**수직 열 하이라이트 (M2 신규 기능):**
말 클릭 시 같은 file+rank를 가진 모든 다른 레벨 칸을 진한 청록(0x004466)으로 표시한다.

**하이라이트 색상 체계:**
```
녹색  (0x00ff00) — 선택된 말
청록  (0x004466) — 같은 수직열
노랑  (0xffff00) — 이동 가능 칸 (M2 데모 규칙)
```

### 3-5. DebugOverlay (`src/ui/DebugOverlay.js`)

- `CSS2DRenderer` 사용 — WebGL 렌더러 위에 HTML 라벨 오버레이
- 사이드바 "Debug Coords" 버튼으로 토글
- 64개 칸 전체에 `"a1(W)"` 형식 좌표 라벨 표시

---

## 4. 검증 기준 달성 여부

| 기준 | 결과 |
|------|------|
| SquareId 직렬화/역직렬화 round-trip | ✅ |
| getAllSquares() 정확히 64개 반환 | ✅ |
| Main 48개 + Attack 16개 구성 확인 | ✅ |
| 중복 squareId 없음 | ✅ |
| getVerticalColumn() 동작 확인 | ✅ |
| 단위 테스트 18/18 통과 | ✅ |
| DebugOverlay 토글 버튼 | ✅ |
| squareMeshes Map으로 전환 | ✅ |
| userData.squareId 저장 | ✅ |

---

## 5. 설계 노트 — void 칸 없음

M1 시스템에서는 8×8 인덱스 중 일부가 `getLogicPos(i) === null` 을 반환하는 "void 칸"이 있었다.
M2의 SquareId 시스템에서는 **유효한 64개 좌표만** 생성하므로 void 칸 자체가 존재하지 않는다.
void 시각화(반투명 X 표시) 항목은 이 구조적 변화로 인해 불필요하여 생략했다.

---

## 6. 이동 규칙 (M2 데모)

`getMoves()` 는 M2에서도 데모용으로, **같은 레벨 안의 빈 칸/적 말**을 반환한다.
실제 말 이동 규칙은 M3에서 `RuleController.generateLegalMoves()` 로 교체된다.

---

## 7. 다음 단계 — M3 계획

M3에서 수행할 작업:

1. `src/rules/pieceMovement/` — 6종 말 pseudo-legal 이동 생성
2. `src/rules/pathUtils.js` — 슬라이딩 피스 경로 계산 (`slidingRay`)
3. `src/rules/RuleController.js` — `generateLegalMoves()`, `isInCheck()`
4. 레벨 간 이동 규칙 (Attack Board ↔ Main Board 진입/이탈)
5. 단위 테스트: 각 말 초기 이동 수, 장애물 차단, 자기 체크 금지
