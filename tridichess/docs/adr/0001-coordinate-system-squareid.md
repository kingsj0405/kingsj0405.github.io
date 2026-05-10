# ADR-0001 — 좌표계로 SquareId(file, rank, level) 채택

- **상태:** Accepted
- **일자:** 2026-02-20 (M2 시점), 본 문서는 2026-05-10 사후 작성
- **관련:** `src/model/SquareId.js`, 계획서 §11

---

## 컨텍스트

M1 시점 코드는 8×8 평면 인덱스(0~63)로 칸을 식별했다. 그러나 Tri-Dimensional Chess 는:

- Main Board 3장 (W/N/B) 각 4×4 = 48칸
- Attack Board 4장 (QL1/KL1/QL3/KL3) 각 2×2 = 16칸
- 총 64 **유효** 칸 — 그러나 64 = 8×8 우연의 일치이며 **2D 인덱스로 매핑하면 void 칸이 발생**.

M1 의 `getLogicPos(index)` 는 일부 인덱스에 `null` 을 반환했고, 이 처리가 클릭/이동/렌더 모든 곳에 누수됐다.

## 결정

칸을 다음 3-튜플 불변 객체로 식별:

```
SquareId { file: 'a'|'b'|'c'|'d',
           rank: 1..4,
           level: 'W'|'N'|'B'|'QL1'|'KL1'|'QL3'|'KL3' }
```

- 직렬화: `"d4(N)"` 형식 (Map/Set 키, 히스토리 저장).
- `getAllSquares()` 가 정확히 64개 유효 좌표만 생성 → **void 칸 개념 자체 소멸**.
- `Object.freeze` 로 불변 보장.

## 대안

| 대안 | 기각 사유 |
|------|----------|
| 8×8 평면 인덱스 (M1) | void 칸 누수, level 차원 표현 불가 |
| 단일 정수 0~63 | 디버깅 불편, 직렬화 가독성 0, 레벨/파일 추출 비용 |
| 3차원 배열 `board[level][file][rank]` | Attack Board 의 가변 앵커 처리 불가, 직렬화 어려움 |
| 그래프 노드 (BoardNode + 인접 리스트) | 초기 구현 비용 과다, 64칸 규모에 과잉 |

## 결과

- M2 에서 전면 채택 (`tests/model/SquareId.test.js` 18/18 통과).
- `squareMeshes: Map<string, THREE.Mesh>` 로 키 통일.
- 레이캐스트 결과는 `mesh.userData.squareId` 로 역산.
- 룰 엔진 좌표 연산은 `(file, rank, level)` 분해 → 이동 변환 → 재조립 패턴.

## 트레이드오프

- 매 이동마다 새 SquareId 인스턴스 생성. 64칸 규모에서 무시 가능.
- Attack Board 의 anchor 변경 시 좌표 자체는 그대로(보드 상대 좌표), 물리 위치만 `CoordMapper` 가 anchor 참조로 계산.

## 재검토 트리거

- 보드 크기/레벨 수 확장 (예: 5D 변형)
- 좌표 비교 비용이 프로파일 hot path 가 될 때 (현재 비현실적)

## 참조

- `src/model/SquareId.js`
- 계획서 §4-1, §11
- M2 보고서 `production/milestones/M2-report.md`
