# Tri-Dimensional Chess — M1 구현 보고서

> 작성일: 2026-02-20 21:55 KST
> 기준 계획서: `docs/260220-2130-KST-implementation-plan.md`
> 마일스톤: M1 — 구조 분해 (리팩터링)

---

## 1. 작업 요약

`tridichess/index.html` 내 단일 `<script type="module">` 블록(약 440줄)을 `src/` 하위 모듈 파일들로 분리했다.
화면 동작은 분리 전과 동일하게 유지했다.

---

## 2. 생성된 파일 목록

```
tridichess/
├── index.html               ← script 블록 제거, <script src="src/main.js"> 한 줄로 교체
├── package.json             ← 신규: Vitest 개발 의존성 + npm 스크립트
├── vitest.config.js         ← 신규: Vitest 설정 (node 환경, tests/**/*.test.js)
└── src/
    ├── main.js              ← 신규: 게임 상태 + 로직 조립 (init, 게임루프)
    ├── config/
    │   └── constants.js     ← 신규: SQ=14, LEVEL_H=25
    └── renderer/
        ├── CoordMapper.js   ← 신규: getLogicPos(index), indexToNotation(i)
        ├── SceneSetup.js    ← 신규: setupScene(container) → {scene, camera, renderer, controls}
        ← BoardRenderer.js  ← 신규: setupPhysicalBoards(scene), setupLogicalSquares(...)
        └── PieceRenderer.js ← 신규: PieceRenderer 클래스
```

추가로 빈 디렉토리 구조도 생성했다 (M2~M7 진행을 위한 사전 준비):

```
src/board/      ← M4: BoardController 예정
src/input/      ← M4: InputController 예정
src/model/      ← M2: SquareId, GameState 등 예정
src/rules/      ← M3: RuleController 예정
src/ui/         ← M6: UIController 예정
tests/model/
tests/rules/
tests/fixtures/
```

---

## 3. 모듈별 역할

### `src/config/constants.js`
렌더링 상수를 단일 위치에서 관리한다. 모든 렌더러가 이를 import한다.

```js
export const SQ = 14;      // 칸 크기 (Three.js 단위)
export const LEVEL_H = 25; // 메인 보드 레벨 간 높이
```

### `src/renderer/CoordMapper.js`
논리 인덱스(0-63) → Three.js Vector3 변환 담당.
**주의:** M1 임시 버전으로, 8×8 평면 인덱스 기반이다. M2에서 SquareId 기반으로 전면 교체 예정.

| 함수 | 입력 | 출력 |
|------|------|------|
| `getLogicPos(index)` | 0-63 정수 | `THREE.Vector3 \| null` (void 칸은 null) |
| `indexToNotation(i)` | 0-63 정수 | `"e4"` 형태 문자열 |

### `src/renderer/SceneSetup.js`
Three.js 씬·카메라·조명·OrbitControls·받침대·스파인을 초기화하고 반환한다.

```js
// 반환값
{ scene, camera, renderer, controls }
```

### `src/renderer/BoardRenderer.js`
두 가지 역할을 담당한다:
- `setupPhysicalBoards(scene)` — 유리 보드 메시 7장(메인 3 + 어택 4) 생성
- `setupLogicalSquares(scene, renderer, camera, onSquareClick)` — 클릭 가능한 논리 칸 메시 생성 + 레이캐스터 등록, `squareMeshes` 객체 반환

클릭 이벤트는 콜백(`onSquareClick`)으로 main.js에 전달해 렌더러와 게임 로직을 분리했다.

### `src/renderer/PieceRenderer.js`
Canvas Sprite 기반 피스 렌더링을 캡슐화한 클래스.

```js
const pr = new PieceRenderer(scene);
pr.render(board); // board: Array(64) — 변경 시마다 전체 재생성 (M1 방식)
```

> M3 이후 `applyMove(move)` 방식의 dirty-flag 업데이트로 교체 예정.

### `src/main.js`
게임 상태 관리 및 모듈 조립. 현재 포함된 로직:
- `gameState` 객체 (board, turn, selected, moves)
- `setupPieces()` — 초기 배치
- `handleSquareClick(idx)` — 선택/이동 입력 처리
- `movePiece(from, to)` — 이동 적용
- `getMoves(idx)` — 이동 가능 목록 (데모용 ±2칸 필터, M3에서 RuleController로 교체 예정)
- `resetGame()`, `log()`, `animate()` 헬퍼

---

## 4. index.html 변경 사항

```html
<!-- 변경 전: 440줄 분량의 인라인 <script type="module"> 블록 -->
<script type="module">
  // ... 모든 코드 ...
</script>

<!-- 변경 후: 한 줄 -->
<script type="module" src="src/main.js"></script>
```

importmap(Three.js CDN)은 그대로 유지했다.

---

## 5. 검증 기준 달성 여부

| 기준 | 결과 |
|------|------|
| `index.html`에 `<script type="module" src="src/main.js">` 한 줄 | ✅ |
| 화면 렌더 동일 (보드 구조, 피스 배치) | ✅ |
| 클릭/이동 동작 동일 | ✅ |
| 콘솔 에러 없음 | ✅ (HTTP 서버 기동 시) |

---

## 6. 주의 사항 — 로컬 실행 방법 변경

M1 이전에는 `index.html`을 파일 탐색기에서 바로 열어도 동작했다.
M1 이후에는 ES Module `import`가 별도 파일 HTTP 요청을 발생시키므로
**반드시 로컬 HTTP 서버를 통해 접속해야 한다.**

```bash
cd tridichess
npx http-server . -p 8080 -c-1
# → http://localhost:8080 으로 접속
```

`file://` 프로토콜로 직접 열면 브라우저 CORS 정책에 의해 차단된다.

---

## 7. 다음 단계 — M2 계획

M2에서 수행할 작업:

1. `src/model/SquareId.js` 구현 (file, rank, level 기반 3D 좌표)
2. `src/renderer/CoordMapper.js` 전면 교체 — `squareToVector3(squareId)` 함수
3. `squareMeshes` Map 키를 `squareId.toString()` 으로 전환
4. `userData.squareId` 에 SquareId 저장 (레이캐스트 역산용)
5. `src/ui/DebugOverlay.js` — 각 칸에 `"d4(N)"` 라벨 표시/숨김 토글
6. void 칸 시각화 (반투명 X 표시)
7. 전체 칸 수 검증: Main 3×16 + Attack 4×4 = 64칸

M2 완료 후 기대 상태:
- 모든 칸이 `SquareId` 로 식별됨
- 클릭 시 콘솔에 `"d4(N)"` 형태 좌표 출력
- DebugOverlay 버튼으로 라벨 토글 가능
