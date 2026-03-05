# Tri-Dimensional Chess

Star Trek Tri-Dimensional Chess를 웹에서 플레이 가능하게 구현하는 프로젝트입니다.  
현재는 Three.js 기반 프로토타입을 모듈 구조로 분해한 상태(M1 완료)이며, 규칙 엔진 고도화(M2+)를 진행 중입니다.

## 현재 상태
- 완료: M1 구조 분해 (`index.html` 인라인 로직 -> `src/` 모듈 분리)
- 진행 예정: M2 좌표계 고도화(`SquareId` 중심), M3 규칙 엔진, M4 Attack Board 시스템
- 실행 방식: 브라우저 정적 앱(ES Modules + importmap)

## 빠른 실행
`file://`로 직접 열면 모듈 로딩이 막히므로, 반드시 로컬 HTTP 서버로 실행하세요.

```bash
cd tridichess
npx http-server . -p 8080 -c-1
# 브라우저에서 http://localhost:8080 접속
```

또는:

```bash
npm install
npm run dev
```

## 테스트

```bash
npm test
```

현재 테스트 러너는 `Vitest`를 사용합니다.

## 디렉토리 개요

```text
tridichess/
├── index.html
├── src/
│   ├── main.js
│   ├── config/constants.js
│   ├── model/SquareId.js
│   └── renderer/
│       ├── SceneSetup.js
│       ├── BoardRenderer.js
│       ├── PieceRenderer.js
│       └── CoordMapper.js
├── docs/
│   ├── 260220-2130-KST-implementation-plan.md
│   └── 260220-2155-KST-M1-implementation-report.md
├── package.json
└── vitest.config.js
```

## 문서 안내
- 상세 구현 계획서: `docs/260220-2130-KST-implementation-plan.md`
- M1 구현 보고서: `docs/260220-2155-KST-M1-implementation-report.md`

README는 사용/실행 중심으로 유지하고, 상세 설계/진행 기록은 `docs/`에 누적합니다.

## 개발 원칙
- 규칙 엔진과 렌더링(Three.js)을 분리한다.
- 상태 모델을 점진적으로 `SquareId`/불변 상태 중심으로 전환한다.
- 3D UX(레이어 선택, 경로 프리뷰, 불법수 이유 표시)를 별도 컨트롤러로 관리한다.

## 빌드/배포 (GitHub Pages)
GitHub Pages는 정적 호스팅이므로 Node 실행이 필요한 앱은 "실행"이 아니라 "빌드 결과물 배포"로 운영해야 합니다.

- 가능한 것: 정적 파일(`html/css/js/assets`)
- 불가능한 것: `npm run dev`, `npx ...`, `node server.js` 같은 서버 실행
- 원칙: Pages에는 빌드 산출물(`dist/`, `build/`, `out/`)만 배포

권장 흐름:
1. CI(예: GitHub Actions)에서 `npm install` -> `npm run build`
2. 산출물을 Pages에 배포

현재 이 프로젝트는 importmap 기반 정적 구성이므로, 단기적으로는 번들러 없이도 배포 가능하지만  
중장기적으로 모듈/자산 최적화를 위해 Vite 도입 후 `dist/` 배포를 권장합니다.

## 규칙 기준 참고
- Roth/Bartmess 규칙서: https://www.thedance.net/~roth/TECHBLOG/chess.html
- Triple S Games 설명 영상: https://youtu.be/IvERuXW2_I4

## 참고 링크
- Chessground(UI/엔진 분리 참고): https://github.com/lichess-org/chessground
- Chess.com Realtime 사례: https://www.chess.com/news/view/chesscom-gameplay-now-faster-with-servers-across-world
- 5D Chess 참고: https://www.5dchesswithmultiversetimetravel.com/
