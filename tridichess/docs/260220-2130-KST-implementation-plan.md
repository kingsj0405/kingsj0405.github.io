# Tri-Dimensional Chess — 상세 구현 계획서

> 작성일: 2026-02-20 21:30 KST
> 기준 코드: `tridichess/index.html` (Three.js 프로토타입)
> 목표: 규칙 정확한 스타트렉 3D 체스 — 바닐라 JS + Three.js

---

## 목차

1. [참고 레포지토리 및 자료](#1-참고-레포지토리-및-자료)
2. [현재 코드 진단 요약](#2-현재-코드-진단-요약)
3. [디렉토리 구조](#3-디렉토리-구조)
4. [핵심 데이터 모델](#4-핵심-데이터-모델)
5. [컨트롤러 인터페이스](#5-컨트롤러-인터페이스)
6. [렌더러 인터페이스](#6-렌더러-인터페이스)
7. [마일스톤별 구현 계획](#7-마일스톤별-구현-계획)
8. [테스트 전략](#8-테스트-전략)
9. [빌드·개발 환경](#9-빌드개발-환경)
10. [룰셋 차이표 (Roth 2012 vs. Triple-S)](#10-룰셋-차이표)
11. [3D 체스 보드 좌표계 명세](#11-3d-체스-보드-좌표계-명세)

---

## 1. 참고 레포지토리 및 자료

### 1-1. 엔진 · 규칙 분리 아키텍처 참고

| 레포 | 설명 | 참고 포인트 |
|------|------|-------------|
| [lichess-org/chessground](https://github.com/lichess-org/chessground) | Lichess 공식 보드 UI. 엔진과 UI 완전 분리. | `Config` 타입, `State` 불변 객체 패턴, `move` 이벤트 발행 방식 |
| [jhlywa/chess.js](https://github.com/jhlywa/chess.js) | 2D 체스 규칙 엔진 (순수 JS). | `moves()` API, FEN/PGN 파싱, `_attacked()` 내부 구조 |
| [niklasf/stockfish.js](https://github.com/niklasf/stockfish.js) | Stockfish → WebAssembly 포팅 | Web Worker 통신 패턴 (나중에 AI 붙일 때) |
| [jhlywa/chess.ts](https://github.com/jhlywa/chess.js) (소스 내 chess.ts) | chess.js TypeScript 소스 | `Move` 인터페이스, 내부 `attack_table` 설계 |

### 1-2. Three.js 3D 보드 UX 참고

| 레포 | 설명 | 참고 포인트 |
|------|------|-------------|
| [pmndrs/drei](https://github.com/pmndrs/drei) | react-three-fiber 헬퍼 모음 | `Html` 오버레이, `Line`, `Billboard` 컴포넌트 — 경로 프리뷰 구현 힌트 |
| [nicholasbailey/3d-chess](https://github.com/nicholasbailey/3d-chess) | 간단한 3D 체스 (Three.js) | 피스 3D 메시 방식, 라이선스 확인 필요 |
| [Mugen87/yuka](https://github.com/Mugen87/yuka) | 게임 AI 라이브러리 (JS) | 상태 머신(StateMachine) — InputController 구현에 참고 |

### 1-3. 규칙 문서

| 자료 | URL |
|------|-----|
| Roth/Bartmess 규칙 원문 | https://www.thedance.net/~roth/TECHBLOG/chess.html |
| Triple S Games 영상 | https://youtu.be/IvERuXW2_I4 |
| Franklin Mint 보드 구조 사진 | (위 Roth 페이지 내 이미지) |

### 1-4. 테스트·빌드 도구

| 도구 | 용도 |
|------|------|
| [Vitest](https://github.com/vitest-dev/vitest) | 단위 테스트 (ES Module 네이티브, 설정 최소) |
| [esbuild](https://github.com/evanw/esbuild) | 번들링 (선택) |
| [http-server](https://github.com/http-party/http-server) | 로컬 개발 서버 |

---

## 2. 현재 코드 진단 요약

`index.html` 내 단일 `<script type="module">` 블록 분석 결과:

```
현재 구조 (단일 파일, 약 520줄)
│
├── setupScene()          ← Three.js 씬/카메라/조명/컨트롤
├── setupPhysicalBoards() ← 유리판 메시 생성 (위치 하드코딩)
├── getLogicPos(index)    ← 0-63 인덱스 → Vector3 변환
│     └── 문제: 2D 8×8 평면 인덱스 사용, attack board void 처리 불완전
├── setupLogicalSquares() ← 클릭 가능 칸 메시 + 레이캐스터
├── setupPieces()         ← 문자열 파싱으로 초기 배치
├── renderPieces()        ← Canvas Sprite로 피스 렌더링
├── handleSquareClick()   ← Select/Move 입력 처리
├── movePiece()           ← 상태 반영 + 화면 갱신
└── getMoves()            ← ⚠ 데모용 거리 필터 (규칙 없음)
```

**핵심 문제점:**

| 항목 | 문제 | 해결 방향 |
|------|------|-----------|
| 좌표계 | `index 0-63` 2D 배열 → Attack Board void 칸이 `null` 반환 처리 뿐 | `SquareId {file, rank, level}` 3D 좌표계로 교체 |
| 이동 규칙 | `getMoves()` 가 ±2 범위 필터. 실제 규칙 없음 | `RuleController.generateLegalMoves()` 분리 |
| Attack Board | 이동/소유권/반전/파일고정 로직 전무 | `BoardController` 신설 |
| 입력 상태 | `selected/moves` 전역 변수 2개. 상태 머신 없음 | `InputController` 상태 머신 (4단계) |
| 렌더 | `renderPieces()` 매번 전체 재생성 | 변경된 칸만 업데이트하는 dirty-flag 방식 |

---

## 3. 디렉토리 구조

```
tridichess/
├── index.html               ← 진입점 (HTML 뼈대 + importmap 유지)
├── src/
│   ├── main.js              ← init() — 컨트롤러·렌더러 조립
│   │
│   ├── model/
│   │   ├── SquareId.js      ← 좌표 타입 + 직렬화/역직렬화
│   │   ├── BoardNode.js     ← Main/Attack Board 메타
│   │   ├── Piece.js         ← 피스 데이터 (불변 객체)
│   │   ├── GameState.js     ← 전체 게임 상태 (불변 스냅샷)
│   │   ├── Move.js          ← 이동 기술자
│   │   └── initialState.js  ← 초기 배치 팩토리
│   │
│   ├── rules/
│   │   ├── RuleController.js     ← legal move 생성, check 판정
│   │   ├── pieceMovement/
│   │   │   ├── pawn.js
│   │   │   ├── knight.js
│   │   │   ├── bishop.js
│   │   │   ├── rook.js
│   │   │   ├── queen.js
│   │   │   └── king.js
│   │   ├── pathUtils.js          ← Path A / Path B 경로 계산
│   │   └── specialRules.js       ← 캐슬링, 앙파상, 프로모션
│   │
│   ├── board/
│   │   └── BoardController.js    ← Attack Board 이동·소유권·반전
│   │
│   ├── input/
│   │   └── InputController.js    ← 클릭 상태 머신
│   │
│   ├── renderer/
│   │   ├── SceneSetup.js         ← Three.js 씬·카메라·조명
│   │   ├── BoardRenderer.js      ← 보드 메시 생성·업데이트
│   │   ├── PieceRenderer.js      ← 피스 스프라이트·3D 메시
│   │   ├── HighlightRenderer.js  ← 선택/이동 가능/경로 하이라이트
│   │   └── CameraController.js   ← Orbit/뷰 전환·레벨 클리핑
│   │
│   ├── ui/
│   │   ├── UIController.js       ← 턴 표시·로그·Undo/Redo·룰셋 토글
│   │   └── DebugOverlay.js       ← 좌표 라벨·void 칸 시각화 (개발용)
│   │
│   └── config/
│       ├── rulesets.js            ← 'roth2012' | 'video2022' 분기 설정
│       └── constants.js           ← SQ, LEVEL_H 등 렌더링 상수
│
├── tests/
│   ├── model/
│   ├── rules/
│   └── fixtures/              ← 포지션 스냅샷 JSON
│
└── docs/
    └── 260220-2130-KST-implementation-plan.md  ← 이 문서
```

---

## 4. 핵심 데이터 모델

### 4-1. SquareId — 3D 좌표 식별자

```js
// src/model/SquareId.js

/**
 * 3D 체스판의 단일 칸을 식별하는 불변 객체.
 *
 * file : 'a' | 'b' | 'c' | 'd'           (Main Board 1열~4열)
 * rank : 1 ~ 8                             (White=1 ~ Black=8 방향)
 * level: 'W' | 'N' | 'B'                  (White/Neutral/Black 메인 보드)
 *         | 'QL1' | 'KL1' | 'QL3' | 'KL3' (Attack Board)
 *
 * 문자열 표현 예: "d4(N)", "b1(QL1)"
 */

export class SquareId {
  constructor(file, rank, level) {
    this.file  = file;   // 'a'~'d'
    this.rank  = rank;   // 1~4 (보드 내 상대 랭크), 혹은 절대 랭크 1~8
    this.level = level;  // 'W' | 'N' | 'B' | 'QL1' | 'KL1' | 'QL3' | 'KL3'
    Object.freeze(this);
  }

  /** 직렬화 키 (Map/Set 키, 히스토리 저장) */
  toString() {
    return `${this.file}${this.rank}(${this.level})`;
  }

  /** 역직렬화 */
  static fromString(s) {
    // 파싱: "d4(N)" → { file:'d', rank:4, level:'N' }
    const m = s.match(/^([a-d])(\d)\(([^)]+)\)$/);
    if (!m) throw new Error(`Invalid SquareId: ${s}`);
    return new SquareId(m[1], parseInt(m[2]), m[3]);
  }

  equals(other) {
    return this.toString() === other.toString();
  }
}

/** 파일 문자 → 0-based 인덱스 */
export const FILE_INDEX = { a: 0, b: 1, c: 2, d: 3 };
export const FILES = ['a', 'b', 'c', 'd'];

/**
 * 보드 레벨 상수.
 * Main Board: White(W), Neutral(N), Black(B)
 * Attack Board: QueenLeft-Level1(QL1), KingLeft-Level1(KL1), 등
 */
export const LEVELS = {
  MAIN: ['W', 'N', 'B'],
  ATTACK: ['QL1', 'KL1', 'QL3', 'KL3'],
};
```

### 4-2. BoardNode — 보드 메타 정보

```js
// src/model/BoardNode.js

/**
 * 보드 한 장의 상태.
 *
 * Main Board: 4×4, 위치 고정, 레벨(W/N/B)에 따라 Y축 높이 결정.
 * Attack Board: 2×2, 이동 가능, 메인 보드 모서리에 앵커링.
 *
 * anchorSquare: 현재 붙어있는 Main Board 코너 SquareId
 * inverted    : Attack Board가 뒤집혀 있는지 (규칙상 반전 가능)
 * owner       : 소유 측 ('white' | 'black' | null=중립)
 * filePinned  : 파일 고정 여부 (AB 이동 후 특정 규칙에서 고정)
 */

export class BoardNode {
  constructor({ boardId, type, anchorSquare, inverted = false, owner = null }) {
    this.boardId      = boardId;      // 'W' | 'N' | 'B' | 'QL1' | ...
    this.type         = type;         // 'main' | 'attack'
    this.anchorSquare = anchorSquare; // SquareId | null (main은 null)
    this.inverted     = inverted;
    this.owner        = owner;
    Object.freeze(this);
  }

  /** 불변 업데이트 — 새 BoardNode 반환 */
  with(patch) {
    return new BoardNode({ ...this, ...patch });
  }
}
```

### 4-3. Piece — 피스 불변 객체

```js
// src/model/Piece.js

export const PIECE_TYPES = ['K', 'Q', 'R', 'B', 'N', 'P'];
export const COLORS      = ['white', 'black'];

export class Piece {
  constructor({ id, type, color, position, hasMoved = false }) {
    this.id       = id;        // 고유 식별자 (예: 'wK', 'bP3')
    this.type     = type;      // 'K' | 'Q' | 'R' | 'B' | 'N' | 'P'
    this.color    = color;     // 'white' | 'black'
    this.position = position;  // SquareId
    this.hasMoved = hasMoved;
    Object.freeze(this);
  }

  with(patch) {
    return new Piece({ ...this, ...patch });
  }

  get isWhite() { return this.color === 'white'; }
  get symbol()  {
    const syms = {
      K: ['♔','♚'], Q: ['♕','♛'], R: ['♖','♜'],
      B: ['♗','♝'], N: ['♘','♞'], P: ['♙','♟'],
    };
    return syms[this.type][this.isWhite ? 0 : 1];
  }
}
```

### 4-4. Move — 이동 기술자

```js
// src/model/Move.js

/**
 * 한 턴의 이동을 완전히 기술하는 불변 객체.
 *
 * kind 'piece'        : 일반 말 이동
 * kind 'attack-board' : Attack Board 자체 이동 (말 이동 대신 턴 소모)
 *
 * pathA / pathB : 3D 체스의 두 경로 규칙 (Path A = 주 경로, B = 대안 경로)
 *                 각각 SquareId[] (경로 상 지나는 칸 목록, 목적지 포함)
 */

export class Move {
  constructor({
    kind,
    // piece move fields
    piece      = null,  // Piece
    from       = null,  // SquareId
    to         = null,  // SquareId
    captures   = null,  // Piece | null
    promotion  = null,  // PieceType | null
    pathA      = [],    // SquareId[]
    pathB      = [],    // SquareId[] (비어있으면 pathA와 동일)
    // attack-board move fields
    boardId    = null,  // string
    boardFrom  = null,  // SquareId (기존 앵커)
    boardTo    = null,  // SquareId (새 앵커)
    inverted   = false,
    // meta
    notation   = '',    // 3D 대수 기보 문자열
    checkFlags = { check: false, checkmate: false },
  }) {
    Object.assign(this, {
      kind, piece, from, to, captures, promotion,
      pathA, pathB, boardId, boardFrom, boardTo,
      inverted, notation, checkFlags,
    });
    Object.freeze(this);
  }
}
```

### 4-5. GameState — 전체 상태 (불변 스냅샷)

```js
// src/model/GameState.js

/**
 * GameState는 특정 시점의 게임 상태 스냅샷.
 * 모든 컨트롤러 함수는 (state, ...) → newState 형태로 순수하게 구현.
 * 불변성을 유지해 Undo/Redo, 리플레이가 자연스럽게 가능.
 */

export class GameState {
  constructor({
    pieces,         // Piece[]
    boardNodes,     // BoardNode[]
    turn,           // 'white' | 'black'
    castlingRights, // { white: { kSide, qSide }, black: { kSide, qSide } }
    enPassant,      // SquareId | null
    history,        // Move[]
    check,          // boolean
    checkmate,      // boolean
    stalemate,      // boolean
    ruleset,        // 'roth2012' | 'video2022'
  }) {
    Object.assign(this, {
      pieces, boardNodes, turn, castlingRights,
      enPassant, history, check, checkmate, stalemate, ruleset,
    });
    Object.freeze(this);
  }

  /** occupancyMap 조회 — 매번 생성은 비효율이므로 lazy 캐시 사용 가능 */
  getPieceAt(squareId) {
    return this.pieces.find(p => p.position.equals(squareId)) ?? null;
  }

  getBoardNode(boardId) {
    return this.boardNodes.find(b => b.boardId === boardId);
  }

  /** 불변 업데이트 */
  with(patch) {
    return new GameState({ ...this, ...patch });
  }
}
```

---

## 5. 컨트롤러 인터페이스

### 5-1. RuleController

```js
// src/rules/RuleController.js

/**
 * 순수 함수 집합. 외부 상태를 변경하지 않는다.
 * 모든 함수는 GameState를 받아 새 GameState 또는 데이터를 반환.
 */

export const RuleController = {

  /**
   * 선택한 칸에서 가능한 모든 합법적 이동 반환.
   * 내부적으로 pseudo-legal 생성 후 자기 체크 필터.
   *
   * @param {GameState} state
   * @param {SquareId}  square
   * @returns {Move[]}
   */
  generateLegalMoves(state, square) { /* ... */ },

  /**
   * Attack Board 이동을 포함한 현재 플레이어 가능 이동 전체.
   * @param {GameState} state
   * @returns {Move[]}
   */
  generateAllLegalMoves(state) { /* ... */ },

  /**
   * 이동 적용 — 순수 함수. 새 GameState 반환.
   * check/checkmate/stalemate 플래그도 함께 계산.
   * @param {GameState} state
   * @param {Move}      move
   * @returns {GameState}
   */
  applyMove(state, move) { /* ... */ },

  /** 특정 색이 체크 상태인지 */
  isInCheck(state, color) { /* ... */ },

  /** 체크메이트 판정 */
  isCheckmate(state, color) { /* ... */ },

  /** 스테일메이트 판정 */
  isStalemate(state, color) { /* ... */ },

  /**
   * 이동이 합법적인지 단독 검증 (선택적으로 사용).
   * generateLegalMoves 결과 안에 포함되어 있으면 항상 true이므로
   * 주로 외부 입력 검증(리플레이, 멀티플레이 동기화)에 사용.
   */
  isLegalMove(state, move) { /* ... */ },

  /**
   * 이동 불가 사유 문자열 반환 (UX 피드백용).
   * @returns {string | null}  null이면 합법 이동
   */
  getIllegalReason(state, from, to) { /* ... */ },
};
```

**내부 pieceMovement 함수 시그니처 예시 (pawn.js):**

```js
// src/rules/pieceMovement/pawn.js

/**
 * 폰의 pseudo-legal 이동 목록 생성.
 * 3D 체스 폰 규칙:
 *   - 전진 방향: 자기 메인 보드에서 상대 방향 (W→N→B)
 *   - 레벨 이동: Attack Board → Main Board 진입 시 1칸으로 간주
 *   - 앙파상: enPassant 대상 칸이 있을 때만 생성
 *   - 프로모션: 상대 메인 보드 맨 끝 랭크 도달 시
 *
 * @param {GameState}  state
 * @param {Piece}      piece
 * @returns {Move[]}
 */
export function pawnMoves(state, piece) { /* ... */ }
```

### 5-2. BoardController

```js
// src/board/BoardController.js

/**
 * Attack Board 기구학(Kinematics) 전담.
 * '보드 이동'도 한 턴을 소모하므로 RuleController.applyMove 안에서 호출.
 */

export const BoardController = {

  /**
   * 해당 Attack Board의 합법적 이동 목록 반환.
   * 이동 조건:
   *   1. 현재 플레이어 소유이거나 중립
   *   2. 목적지 앵커가 비어 있음 (중복 포스트 금지)
   *   3. 이동 거리 1~2칸 (파일 또는 랭크 방향)
   *   4. 파일 고정 규칙 미위반
   *   5. 반전 가능한 위치인지 확인
   *
   * @param {GameState} state
   * @param {string}    boardId  'QL1' | 'KL1' | 'QL3' | 'KL3'
   * @returns {Move[]}
   */
  getLegalBoardMoves(state, boardId) { /* ... */ },

  /**
   * Attack Board 이동 적용 (순수 함수).
   * - anchorSquare 업데이트
   * - inverted 플래그 토글 (반전 이동 시)
   * - 소유권 변경 (상대 영역으로 이동 시 소유자 변경)
   * - 탑승 중인 폰 위치 연동
   *
   * @param {GameState} state
   * @param {Move}      move   (kind: 'attack-board')
   * @returns {GameState}
   */
  applyBoardMove(state, move) { /* ... */ },

  /**
   * 현재 플레이어가 해당 AB를 조작할 수 있는지.
   * 소유권 규칙: 자기 소유 또는 중립 AB만 이동 가능.
   */
  canMove(state, boardId, color) { /* ... */ },

  /**
   * 앵커 SquareId에서 Attack Board 가 차지하는 칸 목록 계산.
   * anchorSquare (Main Board 코너) 기준 2×2 전개.
   */
  getOccupiedSquares(boardNode) { /* ... */ },
};
```

### 5-3. InputController — 상태 머신

```js
// src/input/InputController.js

/**
 * 입력 상태 머신. 4단계:
 *
 *  idle → selected → preview → confirm → (applyMove) → idle
 *                ↘ cancel → idle (어느 단계에서도)
 *
 *  - idle     : 아무것도 선택 안 된 상태
 *  - selected : 말 또는 Attack Board 선택됨. 가능한 이동 하이라이트.
 *  - preview  : 특정 목적지로 마우스 호버 시 경로 프리뷰
 *  - confirm  : 클릭으로 목적지 확정. 프로모션 선택 등 추가 입력 대기.
 *
 * 이벤트 발행 방식으로 렌더러와 분리:
 *   on('stateChange', (newInputState) => highlightRenderer.update(newInputState))
 *   on('moveCommit',  (move) => applyAndRender(move))
 */

export class InputController extends EventTarget {
  #phase = 'idle';
  #selected = null;    // SquareId | boardId string
  #legalMoves = [];    // Move[]
  #pendingMove = null; // Move (confirm 단계에서 대기)

  constructor(gameStateRef, ruleController) {
    super();
    this._state     = gameStateRef;  // { current: GameState } 참조
    this._rules     = ruleController;
  }

  get phase() { return this.#phase; }

  /** 칸 클릭 이벤트 진입 */
  handleSquareClick(squareId) {
    switch (this.#phase) {
      case 'idle':     return this.#onIdleClick(squareId);
      case 'selected': return this.#onSelectedClick(squareId);
      case 'confirm':  return this.#cancel();
    }
  }

  /** Attack Board 클릭 */
  handleBoardClick(boardId) { /* ... */ }

  /** 호버 — preview 단계 진입 */
  handleSquareHover(squareId) {
    if (this.#phase !== 'selected') return;
    const move = this.#legalMoves.find(m => m.to?.equals(squareId));
    if (!move) return;
    this.#phase = 'preview';
    this.#pendingMove = move;
    this.#emit('stateChange');
  }

  /** ESC 또는 빈 칸 클릭 */
  cancel() { this.#cancel(); }

  #cancel() {
    this.#phase = 'idle';
    this.#selected = null;
    this.#legalMoves = [];
    this.#pendingMove = null;
    this.#emit('stateChange');
  }

  #emit(event, data) {
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}
```

### 5-4. CameraController

```js
// src/renderer/CameraController.js

/**
 * 카메라 뷰 관리.
 *
 * 지원 뷰:
 *   'orbit'      : 자유 회전 (OrbitControls)
 *   'white-pov'  : White 플레이어 시점 고정
 *   'black-pov'  : Black 플레이어 시점 고정
 *   'top'        : 수직 탑뷰
 *   'level-W/N/B': 특정 메인 보드 레벨 강조 (나머지 투명도 감소)
 *
 * levelFocus: 특정 레벨 포커스 시 해당 레벨 외 투명도 조절.
 */

export class CameraController {
  constructor(camera, orbitControls, renderer) { /* ... */ }

  setView(viewName) { /* ... */ }
  focusLevel(level) { /* ... */ }  // 'W' | 'N' | 'B' | null(전체)
  animateTo(position, target, durationMs = 600) { /* ... */ }
}
```

---

## 6. 렌더러 인터페이스

### 6-1. HighlightRenderer

```js
// src/renderer/HighlightRenderer.js

/**
 * 하이라이트 3종:
 *   1. 선택된 칸 (초록)
 *   2. 이동 가능한 칸 (노랑 테두리)
 *   3. 경로 프리뷰 선 (Path A: 파랑, Path B: 주황)
 *
 * squareMeshes: Map<squareIdString, THREE.Mesh>
 */

export class HighlightRenderer {
  constructor(scene, squareMeshes) { /* ... */ }

  /** InputController 'stateChange' 이벤트 수신 시 호출 */
  update(inputState) {
    this.#clearAll();
    switch (inputState.phase) {
      case 'selected':
        this.#highlightSelected(inputState.selected);
        this.#highlightMoves(inputState.legalMoves);
        break;
      case 'preview':
        this.#highlightSelected(inputState.selected);
        this.#highlightPath(inputState.pendingMove);
        break;
    }
  }

  #clearAll()              { /* emissive 초기화 */ }
  #highlightSelected(sq)   { /* 초록 emissive */ }
  #highlightMoves(moves)   { /* 노랑 테두리/점 */ }
  #highlightPath(move)     { /* Line으로 pathA/pathB 표시 */ }
}
```

### 6-2. PieceRenderer

```js
// src/renderer/PieceRenderer.js

/**
 * 피스 렌더링.
 * 현재: Canvas Sprite (2D 유니코드 심볼)
 * 추후: GLTF 3D 모델로 교체 가능하도록 인터페이스 분리.
 *
 * update(prevState, nextState): dirty 칸만 업데이트 (전체 재생성 방지)
 */

export class PieceRenderer {
  constructor(scene) {
    this._scene    = scene;
    this._meshMap  = new Map(); // pieceId → THREE.Sprite
  }

  /** 초기 배치 */
  init(state) { /* ... */ }

  /**
   * 상태 변경 적용. 이동한 피스만 위치 업데이트.
   * 캡처된 피스는 제거, 프로모션은 교체.
   */
  applyMove(move) { /* ... */ }

  #createSprite(piece) { /* Canvas Texture 생성 */ }
  #worldPos(squareId)  { /* SquareId → THREE.Vector3 변환 (CoordMapper 사용) */ }
}
```

### 6-3. CoordMapper — SquareId ↔ Three.js Vector3

```js
// src/renderer/CoordMapper.js

/**
 * 논리 좌표(SquareId) ↔ Three.js 월드 좌표(Vector3) 변환.
 *
 * 보드 레이아웃 (Roth/Bartmess Franklin Mint 기준):
 *
 *   메인 보드:
 *     White(W)  : Y = 0
 *     Neutral(N): Y = LEVEL_H     = 25
 *     Black(B)  : Y = 2*LEVEL_H   = 50
 *
 *   Attack Board:
 *     QL1 / KL1 : Y = LEVEL_H * 0.5   = 12.5
 *     QL3 / KL3 : Y = LEVEL_H * 2.5   = 62.5
 *
 *   X (file): 'a'=−1.5*SQ, 'b'=−0.5*SQ, 'c'=0.5*SQ, 'd'=1.5*SQ
 *   Z (rank): rank 1 = 1.5*SQ (front), rank 4 = −1.5*SQ (back)
 *
 *   Attack Board 오프셋:
 *     QL1/QL3: X − 2*SQ (Queen 쪽, 좌)
 *     KL1/KL3: X + 2*SQ (King 쪽, 우)
 */

export const SQ       = 14;
export const LEVEL_H  = 25;

const LEVEL_Y = {
  W: 0, N: LEVEL_H, B: 2 * LEVEL_H,
  QL1: LEVEL_H * 0.5, KL1: LEVEL_H * 0.5,
  QL3: LEVEL_H * 2.5, KL3: LEVEL_H * 2.5,
};

const FILE_X = { a: -1.5, b: -0.5, c: 0.5, d: 1.5 };

const AB_X_OFFSET = { QL1: -2, KL1: 2, QL3: -2, KL3: 2 };
const AB_Z_OFFSET = { QL1:  1, KL1: 1, QL3: -1, KL3: -1 }; // Main Board 기준 앞/뒤

export function squareToVector3(squareId) {
  const { file, rank, level } = squareId;
  const isAttack = level.length > 1;  // 'QL1' 등

  const y = LEVEL_Y[level];
  let x = FILE_X[file] * SQ;
  let z = (2.5 - rank) * SQ; // rank 1(front)=+1.5*SQ, rank 4(back)=-1.5*SQ

  if (isAttack) {
    x += AB_X_OFFSET[level] * SQ;
    z += AB_Z_OFFSET[level] * SQ;
  }

  return new THREE.Vector3(x, y + 0.5, z);
}

/**
 * Three.js 레이캐스트 결과(교차점) → 가장 가까운 SquareId 역산.
 * 교차한 Mesh의 userData.squareId 를 직접 읽는 방식 권장.
 */
export function vector3ToSquareId(v3, squareMeshes) {
  // 각 메시의 userData.squareId 에 미리 저장해두고 조회
  /* ... */
}
```

---

## 7. 마일스톤별 구현 계획

### M1. 구조 분해 (리팩터링) — 예상 작업 범위: ~1주

**목표:** 현재 `index.html` 의 모든 로직을 `src/` 하위 파일로 분리.
화면 동작은 분리 전과 동일하게 유지.

```
작업 순서:
1. constants.js 추출 (SQ, LEVEL_H 등)
2. CoordMapper.js 추출 + squareToVector3() 단위 테스트 작성
3. SceneSetup.js 추출 (setupScene 함수)
4. BoardRenderer.js 추출 (setupPhysicalBoards, setupLogicalSquares)
5. PieceRenderer.js 추출 (setupPieces, renderPieces)
6. GameState 불변 객체 도입 (model/GameState.js)
7. main.js 에서 조립
8. 스모크 테스트: 화면 렌더 확인, 클릭/이동 동작 확인
```

**검증 기준:**
- `index.html` 에서 `<script type="module" src="src/main.js">` 한 줄로 동일 화면 동작.
- 콘솔 에러 없음.

---

### M2. 좌표계 확정 + 시각 디버그 — ~4~5일

**목표:** `SquareId` 기반 좌표계 전환 + 디버그 오버레이.

```
작업 순서:
1. SquareId, FILES, LEVELS 상수 정의
2. CoordMapper.squareToVector3() 전면 교체 (기존 index 방식 제거)
3. squareMeshes Map 키를 squareId.toString() 으로 전환
4. userData.squareId 에 SquareId 저장 (레이캐스트 역산용)
5. DebugOverlay.js: 각 칸에 "d4(N)" 라벨 표시/숨김 토글 버튼
6. void 칸(존재하지 않는 좌표) 시각화: 반투명 X 표시
7. 전체 칸 수 확인 테스트: Main 3×(4×4)=48칸 + Attack 4×(2×2)=16칸 = 64칸
```

**SquareId ↔ 물리 위치 매핑 테이블 (일부):**

| SquareId       | 물리 위치 설명              |
|----------------|-----------------------------|
| `a1(W)`        | White Main, Queen쪽 앞줄 좌 |
| `d4(W)`        | White Main, King쪽 뒷줄 우  |
| `a1(N)`        | Neutral Main, Queen쪽 앞줄  |
| `b2(QL1)`      | QL1 Attack Board 안쪽 칸    |
| `a1(QL1)`      | QL1 Attack Board 바깥 앞칸  |

---

### M3. 이동 엔진 v1 (말 이동 + Path A 체크) — ~1~2주

**목표:** 6종 말의 합법 이동 생성 + 자기 체크 금지.

```
작업 순서:
1. pathUtils.js: 슬라이딩 피스 경로 계산
     slidingRay(state, from, direction): SquareId[]
     direction = { dFile, dRank, dLevel }  (레벨 이동은 별도 전환 테이블)
2. 각 말별 pseudo-legal 이동 생성:
     knight.js  — 3D 나이트 점프 (레벨 변경 포함)
     rook.js    — 파일/랭크 슬라이딩 (레벨 고정)
     bishop.js  — 대각선 슬라이딩 (레벨 변경 규칙 포함)
     queen.js   — rook + bishop
     king.js    — 1칸 이동 (레벨 이동 포함)
     pawn.js    — 전진/대각 캡처/레벨 진입
3. RuleController.generateLegalMoves(): pseudo-legal → 자기체크 필터
4. isInCheck(): 모든 상대 말의 공격 범위 합집합 계산
5. 단위 테스트:
     - 빈 보드에서 각 말의 이동 수 검증
     - 장애물 있을 때 슬라이딩 차단
     - 자기 체크 차단

핵심 구현 노트 — 3D 체스 레벨 이동 규칙 (Roth 2012):
  - 말은 Main Board ↔ Attack Board 간 이동 시 경로 규칙 적용
  - Attack Board 위 칸은 Main Board 의 해당 앵커 좌표와 '같은 수직선' 공유
  - 수직 이동(레벨만 다른 같은 file/rank)은 별도 이동으로 간주
  - 나이트: 3D 이동 → (2,1,0) 순열 + 부호 조합 (확인 필요)
```

**Path A / Path B 개념:**

```
Path A (직접 경로):
  e.g. QL1의 b2 → N 보드 b2 직접 레벨 상승 이동

Path B (우회 경로):
  e.g. 같은 목적지를 Main Board를 경유해 도달하는 경로
  두 경로 모두 유효한 경우 플레이어가 선택 가능
  (경로 선택에 따라 캡처 대상이 달라질 수 있음)
```

---

### M4. Attack Board 시스템 v1 — ~1주

**목표:** AB 이동·반전·소유권 변경·파일고정 구현.

```
작업 순서:
1. BoardController.getLegalBoardMoves() 구현
     - 이동 가능한 앵커 목록 탐색
     - 각 앵커에 대해 BoardNode.getOccupiedSquares() 로 충돌 체크
2. BoardController.applyBoardMove() 구현
     - BoardNode.anchorSquare 업데이트
     - 탑승 폰 위치 연동 (AB와 함께 이동)
     - 소유권: 상대 Main Board 영역 앵커링 시 소유 변경
3. 반전(Inversion) 구현:
     - AB가 뒤집히면 랭크 순서 역전
     - inverted 플래그 토글
     - CoordMapper 에서 inverted 고려한 좌표 계산
4. InputController 에 AB 선택 흐름 추가
     - AB 클릭 → AB 이동 가능 앵커 하이라이트
     - 앵커 클릭 → AB 이동 확정
5. 시각 테스트:
     - AB가 이동하면 위에 있던 피스도 함께 이동
     - 반전 시 AB 메시 rotation 변경
```

**Attack Board 이동 규칙 (Roth 2012 기준):**

| 규칙 | 상세 |
|------|------|
| 이동 거리 | 랭크 방향 1~2칸 (파일 방향 이동 불가) |
| 반전 | 이동하면서 뒤집기 가능 (턴 1회 소모) |
| 파일 고정 | AB가 특정 Main Board 모서리에 부착되면 파일 고정 |
| 소유권 | 자기 AB만 이동 가능; 중립은 양쪽 가능 |
| 폰 탑승 | AB 위 단일 폰만 탑승 가능; 이동 시 폰 연동 |
| 중복 금지 | 같은 앵커에 두 AB 동시 불가 |

---

### M5. 이동 엔진 v2 (Path B + 특수규칙) — ~1주

```
작업 순서:
1. pathUtils.js 에 Path B 분기 추가
2. specialRules.js:
     캐슬링   : 3D 체스 캐슬링 적용 가능 위치 확인 (King/Rook 미이동 조건)
     앙파상   : Attack Board 위에서의 앙파상 경우 처리
     프로모션 : Black 보드 맨 끝 도달 시 선택 UI 트리거
3. ruleset 토글:
     rulesets.js 에 Roth2012/Video2022 차이 플래그 관리
     특수규칙 적용 여부를 ruleset 에 따라 분기
4. AB 캡처 규칙: 말이 AB 위 피스를 캡처 후 AB 소유권 변경
```

---

### M6. UX 개선 — ~4~5일

```
1. 레벨 선택 버튼 (사이드바): W/N/B 클릭 시 해당 레벨 포커스
2. 경로 프리뷰:
     - THREE.Line 으로 pathA (파랑), pathB (주황) 표시
     - 캡처 가능 칸: 빨간 X 마커
3. 불법 이동 피드백: "이 말은 해당 칸으로 이동할 수 없습니다 (이유)" 툴팁
4. Undo/Redo: history[] 배열 기반, Ctrl+Z / Ctrl+Y 바인딩
5. 기보 패널: 3D 대수 표기 (e.g. "Nd4(W)→b3(N)") 리스트
```

---

### M7. 품질·테스트 — 지속

```
1. 단위 테스트 (Vitest):
     CoordMapper: SquareId → Vector3 좌표 검증
     pawnMoves(): 초기 배치에서 White 폰 가능 이동 수 = ?
     isInCheck(): 간단한 체크 포지션 스냅샷

2. 포지션 스냅샷 테스트:
     tests/fixtures/ 에 JSON 포지션 저장
     { state: GameState, expectedMoves: Move[] } 형태
     Roth 문서 예제 일부 포함

3. 랜덤 시뮬레이션 (Fuzzing):
     generateAllLegalMoves → 무작위 이동 반복
     crash / 불법 상태(킹 없음 등) 탐지
     1000 게임 중 에러 0 목표
```

---

## 8. 테스트 전략

### Vitest 설정

```js
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',  // Three.js 제외한 순수 로직만 테스트
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/model/**', 'src/rules/**', 'src/board/**'],
    },
  },
});
```

### 테스트 예시 — 좌표 검증

```js
// tests/model/SquareId.test.js
import { describe, it, expect } from 'vitest';
import { SquareId } from '../../src/model/SquareId.js';

describe('SquareId', () => {
  it('직렬화/역직렬화 round-trip', () => {
    const sq = new SquareId('d', 4, 'N');
    expect(SquareId.fromString(sq.toString())).toEqual(sq);
  });

  it('동등성 비교', () => {
    const a = new SquareId('a', 1, 'W');
    const b = new SquareId('a', 1, 'W');
    expect(a.equals(b)).toBe(true);
  });
});
```

### 테스트 예시 — 폰 이동 검증

```js
// tests/rules/pawn.test.js
import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../src/model/initialState.js';
import { RuleController } from '../../src/rules/RuleController.js';
import { SquareId } from '../../src/model/SquareId.js';

describe('Pawn moves — initial position', () => {
  it('a2(W) 폰은 a3(W) 또는 a3(N) 으로 이동 가능', () => {
    const state = createInitialState();
    const from  = new SquareId('a', 2, 'W');
    const moves = RuleController.generateLegalMoves(state, from);
    const destinations = moves.map(m => m.to.toString());
    expect(destinations).toContain('a3(W)');
  });
});
```

### 포지션 스냅샷 테스트

```js
// tests/fixtures/check_position.json
{
  "description": "White King in check by Black Rook",
  "state": { /* GameState JSON */ },
  "expectedInCheck": true,
  "expectedLegalMovesForKing": ["b1(W)", "d1(W)"]
}
```

---

## 9. 빌드·개발 환경

### 로컬 개발 서버

```bash
# npx 로 즉시 실행 (설치 불필요)
npx http-server tridichess/ -p 8080 -c-1
```

### 패키지 설정 (선택 — 테스트 도구용)

```json
// tridichess/package.json
{
  "name": "tridichess",
  "type": "module",
  "scripts": {
    "dev":   "npx http-server . -p 8080 -c-1",
    "test":  "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0"
  }
}
```

### Three.js Import Map (현재 방식 유지)

```html
<!-- index.html — 외부 CDN 사용으로 번들러 불필요 -->
<script type="importmap">
{
  "imports": {
    "three":          "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/":  "https://unpkg.com/three@0.160.0/examples/jsm/"
  }
}
</script>
<script type="module" src="src/main.js"></script>
```

---

## 10. 룰셋 차이표

현재 파악된 Roth 2012 vs. Triple-S Games 영상 차이:

| 항목 | Roth 2012 (A) | Triple-S Video (B) | 구현 방식 |
|------|---------------|--------------------|-----------|
| Attack Board 이동 거리 | 1~2칸 (랭크 방향) | 1칸만 | `ruleset === 'roth2012' ? [1,2] : [1]` |
| AB 반전 | 이동 + 반전 가능 (1턴) | 불명확 | 토글 플래그 |
| 폰 전진 방향 | W→N→B 레벨 관통 | 동일 | 동일 구현 |
| 캐슬링 | 3D 버전 허용 | 언급 없음 | `allowCastling` 플래그 |
| 앙파상 | 적용 | 적용 (추정) | 동일 구현 |
| AB 위 폰 수 | 단일 폰만 탑승 | 동일 | 동일 구현 |
| 중립 AB 소유권 | 점령 규칙 있음 | 간략 설명 | `roth2012` 기준 구현 후 토글 |

```js
// src/config/rulesets.js
export const RULESETS = {
  roth2012: {
    attackBoardMoveDistances: [1, 2],
    allowCastling:  true,
    allowEnPassant: true,
    abInversion:    true,
    neutralAbOwnership: 'capture', // 점령 규칙
  },
  video2022: {
    attackBoardMoveDistances: [1],
    allowCastling:  false,
    allowEnPassant: true,
    abInversion:    false,
    neutralAbOwnership: 'free',
  },
};
```

---

## 11. 3D 체스 보드 좌표계 명세

### 보드 구성 요약

```
레벨 구성 (아래 → 위):

  QL1 (Y=12.5) ─────── KL1 (Y=12.5)     ← Attack Board (White 쪽)
        │  White Main (W, Y=0)  │
        └──────────────────────┘

  QL1b          Neutral Main (N, Y=25)           KL1b
                ←───────────────────→

  QL3 (Y=62.5)─────────────────────── KL3 (Y=62.5)  ← Attack Board (Black 쪽)
               Black Main (B, Y=50)
               ←───────────────────→

각 Main Board: 4파일 (a-d) × 4랭크 (1-4) = 16칸
각 Attack Board: 2파일 (a-b) × 2랭크 (1-2) = 4칸
총: 3×16 + 4×4 = 48 + 16 = 64개의 논리 칸
```

### Attack Board 앵커 초기 위치

| Attack Board | 초기 앵커 (Main Board 코너) | 소유자 |
|--------------|-----------------------------|--------|
| QL1 | White Main `a4(W)` (Queen쪽 뒤) | White |
| KL1 | White Main `d4(W)` (King쪽 뒤)  | White |
| QL3 | Black Main `a1(B)` (Queen쪽 앞) | Black |
| KL3 | Black Main `d1(B)` (King쪽 앞)  | Black |

### 레이아웃 다이어그램 (위에서 본 모습, Y축 무시)

```
Queen side ←                        → King side
         a    b    c    d
Rank 4 [ -- ][ -- ][ -- ][ -- ]   ← Black Main / AB 앵커
Rank 3 [ -- ][ -- ][ -- ][ -- ]
Rank 2 [ -- ][ -- ][ -- ][ -- ]
Rank 1 [ -- ][ -- ][ -- ][ -- ]   ← White Main / AB 앵커

QL1 Attack (White Q-side):     a1(QL1) a2(QL1) b1(QL1) b2(QL1)
KL1 Attack (White K-side):     a1(KL1) a2(KL1) b1(KL1) b2(KL1)
QL3 Attack (Black Q-side):     a1(QL3) a2(QL3) b1(QL3) b2(QL3)
KL3 Attack (Black K-side):     a1(KL3) a2(KL3) b1(KL3) b2(KL3)
```

---

## 구현 우선순위 요약

```
Week 1:  M1 (구조 분해) + M2 (좌표계 교체)
Week 2:  M3 (이동 엔진 v1) — 폰/나이트/비숍 먼저
Week 3:  M3 완료 (룩/퀸/킹 + 체크 판정) + 단위 테스트
Week 4:  M4 (Attack Board 시스템)
Week 5:  M5 (Path B + 특수 규칙) + M6 UX
Week 6+: M7 (테스트 강화) + 버그 수정 + 기보 기록
```

---

*이 문서는 구현 진행에 따라 지속 업데이트 예정.*
