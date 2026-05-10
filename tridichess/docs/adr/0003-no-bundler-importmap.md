# ADR-0003 — 번들러 미도입, importmap + CDN 유지

- **상태:** Accepted
- **일자:** 2026-05-10
- **관련:** `index.html`, `package.json`, GitHub Pages 배포

---

## 컨텍스트

프로젝트는 GitHub Pages 정적 호스팅으로 배포된다 (https://yangspace.co.kr/tridichess/).
의존성은 `three` 단일이며 `unpkg` CDN 에서 importmap 으로 로드한다:

```html
<script type="importmap">
{ "imports": {
    "three":         "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
}}
</script>
<script type="module" src="src/main.js"></script>
```

`package.json` 에 적힌 `vitest`, `http-server` 는 **개발 도구일 뿐 런타임 의존성 아님**.
브라우저는 importmap 을 직접 해석하므로 `node_modules` 가 배포에 들어갈 필요가 없다.

이 시점에 Vite/esbuild 같은 번들러 도입을 보류하는 결정을 명시한다.

## 결정

**M5 까지 번들러를 도입하지 않는다.** 정적 ES Modules + importmap + unpkg CDN 으로 유지.

## 대안

| 대안 | 기각 사유 |
|------|----------|
| Vite 도입 | 빌드 단계 추가, GitHub Actions 필요, 1 의존성 규모에 과잉 |
| esbuild 도입 | 위와 동일, 학습 비용은 더 낮으나 이득 없음 |
| three 를 `vendor/` 로 직접 호스팅 | 버전 업데이트 수동, CDN 캐시 이점 손실 |
| 모든 코드를 단일 `<script>` 로 합치기 | M2 의 모듈 분리 의도와 정면 충돌 |

## 결과

- **배포 절차:** `kingsj0405.github.io` 저장소에 push → 끝. CI 없음.
- **로컬 개발:** `npm run dev` (http-server) 만으로 동등 환경.
- **`file://` 직접 열기 불가** (CORS) — 반드시 HTTP 서빙 필요.
- **테스트 환경:** vitest 는 Node 환경에서 `src/model/`, `src/rules/`, `src/board/` 만 import. Three.js 의존 모듈은 테스트 안 함 (CLAUDE.md §3).

## 트레이드오프

- **장점:**
  - 빌드 0초, 배포 = git push.
  - 디버거에서 원본 파일 그대로 보임 (소스맵 불필요).
  - 의존성 1개 늘어도 importmap 한 줄 추가로 끝.
- **단점:**
  - 트리쉐이킹 없음 → three 전체 번들 로드 (현 시점 ~600KB gzip, 수용 가능).
  - 외부 패키지 추가 시 CDN URL 핀 관리 필요.
  - HTTP/2 라도 모듈 다수 시 요청 비용 누적 (모듈 30개 이내라 무시).

## 재검토 트리거

다음 중 **하나라도** 발생 시 본 ADR 재검토 (신규 ADR 발행 후 결정):

1. 외부 npm 패키지를 2개 이상 추가 (예: chess.js, tweakpane, …)
2. TypeScript 도입 결정
3. WASM 자산 도입 (예: Stockfish AI)
4. `src/` 내 .js 모듈이 30개 초과
5. 모바일 로딩 시간이 사용자 QA 에서 BLOCKER 로 지적됨
6. CSS 전처리/PostCSS 필요성 발생

## 참조

- `index.html` (importmap 정의 위치)
- `package.json` (devDependencies 만 존재)
- CLAUDE.md §7 배포 안내
- 계획서 §9 빌드·개발 환경
