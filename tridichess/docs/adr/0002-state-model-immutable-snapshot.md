# ADR-0002 — 게임 상태를 불변 스냅샷 + Map 으로 모델링

- **상태:** Accepted
- **일자:** 2026-02-20 (M2), 사후 작성 2026-05-10
- **관련:** `src/model/`, 계획서 §4

---

## 컨텍스트

M3 이후 다음 기능들이 동시에 필요:

- 합법 이동 생성 시 **각 후보를 가상으로 적용해 자기 체크 여부 확인** (`isInCheck` 시뮬레이션)
- Undo/Redo (M6)
- 포지션 스냅샷 테스트 (`tests/fixtures/*.json`)
- 향후 AI 탐색 (탐색 트리 노드마다 상태 분기)

가변 상태(in-place mutate)로 위 4가지를 구현하면 각 시점에서 **수동 deep-copy** 또는 **롤백 로직**이 필요해진다. 이는 M1 데모의 `board: Array(64)` 직접 변경 방식의 한계였다.

## 결정

게임 상태는 **불변 스냅샷**. 변경은 신규 `GameState` 인스턴스 반환.

```js
GameState {
  pieces:        Map<string, Piece>,    // squareId.toString() → Piece
  boards:        Map<string, BoardNode>, // boardId → BoardNode (Attack Board 앵커/반전/소유)
  turn:          'white' | 'black',
  moveHistory:   Move[],
  rulesetId:     'roth2012' | 'video2022',
}
```

- 모든 model 클래스(`SquareId`, `Piece`, `Move`, `BoardNode`, `GameState`)는 `Object.freeze`.
- 변경: `instance.with(patch)` → 새 인스턴스 반환.
- `applyMove(state, move): GameState` 는 순수 함수.

## 대안

| 대안 | 기각 사유 |
|------|----------|
| 가변 배열 + mutate | 시뮬레이션마다 deep-copy/롤백 코드 누적, 버그 온상 |
| OOP 보드 그래프 (`Board.move()`) | 메서드 사이드 이펙트, 테스트 어려움 |
| Immer / Immutable.js | 외부 의존성 추가 (ADR-0003 빌드 정책과 충돌). 64칸 규모에 과잉 |
| Redux 스타일 reducer + action | 보일러플레이트 비례 부담, 1인 프로젝트에 과잉 |

## 결과

- `applyMove` 가 순수 함수가 되어 **테스트가 (state, move) → expectedState 비교만으로 끝남**.
- `isInCheck` 가 가상 적용 후 검사하는 패턴이 자연스러움 (롤백 불필요).
- Undo/Redo 는 `history: GameState[]` 배열의 인덱스 이동.

## 트레이드오프

- **메모리:** 매 이동마다 새 Map/객체 생성. 64칸 + 32 piece 규모에서 한 번 ~수 KB. 100수 게임도 수백 KB 수준 → 무시.
- **성능:** Map 복사가 array 인덱스보다 느림. 룰 엔진 hot path 가 되면 구조 공유(persistent data structure) 도입 검토.
- **참조 비교 안전성:** `state.pieces.get('d1(W)') === otherState.pieces.get('d1(W)')` 이 동일 객체일 때만 true. 코드에서 `equals()` 사용 강제.

## 구현 규칙

- `with(patch)` 는 얕은 병합 + 새 freeze. 깊은 mutate 금지.
- Map 변경: `new Map(oldMap).set(key, value)` 패턴.
- 배열 변경: spread (`[...arr, item]`).
- 렌더러는 **state 를 read-only 소비**. 어떤 메서드도 state 인자 mutate 금지 (CLAUDE.md §3 강제).

## 재검토 트리거

- AI 탐색 도입 후 GC 압박이 프로파일에 잡힐 때 → Immer 또는 구조 공유 라이브러리 검토
- 보드 규모 5배 이상 확장 시
- TypeScript 도입 시 (readonly 마커로 freeze 대체 가능)

## 참조

- `src/model/SquareId.js` (선례)
- 계획서 §4-2 ~ §4-5
- ADR-0001 (좌표계)
