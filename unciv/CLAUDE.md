# CLAUDE.md — Unciv Web (포팅 프로젝트)

이 파일은 Claude Code가 매 세션 시작 시 읽는 마스터 컨벤션 문서다.
**이 프로젝트는 from-scratch 게임 개발이 아니라 기존 게임(Unciv)의 웹 포팅이다.** 그
한 가지 사실이 아래 모든 규약의 근거다 — 우리가 쓰는 코드의 99%는 upstream이 이미
만든 것이고, 우리 일은 "다시 만드는 것"이 아니라 "최소 변경으로 브라우저에서 돌게
하는 것"이다.

배포 대상은 `tridichess`와 동일한 패턴: `kingsj0405.github.io` 저장소의 정적 서브폴더
→ https://yangspace.co.kr/unciv/ . 단, tridichess는 손으로 쓴 JS라 소스가 이 폴더 안에
살지만, **Unciv는 거대한 Kotlin/libGDX 코드베이스라 소스는 별도 fork repo에 있고 이
폴더에는 빌드 산출물(app.js/wasm + assets)과 프로젝트 허브 문서만 둔다.**

---

## 0. 현황 & 다음 액션 (TL;DR — 여기부터 읽어라)

**현황 (2026-06-07):** ✅ **M1 부팅 성공.** TeaVM AOT(`unciv.js` ~61MB, 7590 classes)로 브라우저에서
**메인 메뉴까지 렌더**된다(배경 맵 생성·강·산·자원 포함). 작업 베이스 = `~/Projects/src/unciv-web-yosef`
브랜치 `sejong_pin_web_1.5.6` (YosefLm fork + 우리 픽스). 아직 미커밋.

**부팅까지 해결한 핵심 4건 (모두 영구 픽스):**
1. **deps 핀** — `-SNAPSHOT`(해석불가 orphan) → `backend-web:1.5.6` + `gdx-freetype-teavm:1.5.6` (Maven Central). 빌더 API 3파일(`BuildWebCommon`/`WebLauncher`) 1.5.6로 이관.
2. **java.time 가드** (`HolidayDates.kt`) — `LocalDate.now()`(TeaVM `ZoneId.systemDefault()` 미지원) → epoch-UTC 폴백.
3. **easter egg off** (`WebGame.kt`) — 장식 기능, web에서 비활성.
4. **★ThreadLocalRandom transformer** (`web/.../teavm/`) — TeaVM `ThreadLocalRandom.setSeed`가 throw→`current()` null→**Kotlin `Random.Default`/`Collection.random()` 게임 전체 깨짐**. TeaVM `ClassHolderTransformer`로 `setSeed` no-op化(plugin SPI 자동등록). **가장 중요·재발 주의**.

**다음 액션 (순서대로):**
- [ ] **A. New Game 실제 플레이 QA** — Quickstart/Start new game → 맵 진입 → 1턴. 새 java.time/`.random()` 류 갭이 더 나올 수 있음(같은 방식으로 잡기). 자율 검증 = `/tmp/unciv_pin/smoke.js` (Playwright headless+swiftshader, 스크린샷+콘솔).
- [ ] **B. 우리 fork로 정리** — 동작 확정 후 `sejong_pin_web_1.5.6`를 `kingsj0405/Unciv-for-web`(remote `web`)에 push.
- [ ] **C. M2 agentic 캡처 레이어** — `window.unciv` getState/dispatch/captureFrame (task 25 본 목적).
- [ ] **D. M3 배포** — dist → 이 폴더(`kingsj0405.github.io/unciv/`) → `yangspace.co.kr/unciv/`.

**빠른 명령:**
```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
cd ~/Projects/src/unciv-web-yosef && ./gradlew :web:webBuildJs --no-daemon   # AOT 빌드 (~30s)
cd web/build/dist && python3 -m http.server 8080 --bind 127.0.0.1            # 서빙 → http://127.0.0.1:8080/
cd /tmp/unciv_pin && node smoke.js                                           # 자율 부팅 스모크(스크린샷 /tmp/unciv_pin/smoke.png)
```
**디버깅 팁:** TeaVM은 스택프레임을 비운다(빈 stacktrace). 미구현 JDK 메서드는 `UnsupportedOperationException`(빈 메시지)로 표시됨. 위치 특정은 `com.unciv.utils.debug("...")` 브레드크럼(=console.log, web에서 레벨필터 없음) → smoke.js로 판독.

---

## 1. 저장소 지형 (포팅에서 가장 중요)

| 역할 | 경로 / remote | 비고 |
|------|---------------|------|
| **upstream (원본)** | `yairm210/Unciv` = 우리 클론의 `origin` | read-only로 취급. 직접 push 금지. |
| **working fork (우리 것)** | `kingsj0405/Unciv-for-web` = 우리 클론의 `web` remote | 포팅 작업이 들어가는 곳. |
| **working 클론** | `~/Projects/src/Unciv` (branch `sejong_teavm_web`) | 실제로 빌드/커밋하는 디렉토리. |
| **레시피 레퍼런스** | `YosefLm/unciv-web` → `~/Projects/src/unciv-web-yosef` (pin `a31a82ff`) | **이미 브라우저 gameplay를 통과시킨 web 포팅 선례.** 막히면 여기를 먼저 본다. |
| **배포 대상 (이 폴더)** | `kingsj0405.github.io/unciv/` | 정적 산출물 + 허브 문서. 소스 아님. |

**원칙: upstream → working fork → 이 배포 폴더, 한 방향.** 게임 로직은 upstream에서
오고, 포팅 델타는 working fork에 쌓이고, 빌드 결과만 이 폴더로 흐른다.

---

## 2. 포팅 절대 원칙 (from-scratch 프로젝트와 다른 점)

### 2-1. Divergence 최소화가 최우선 가치
- upstream 파일을 **고칠수록 미래의 sync 비용이 늘어난다.** 모든 변경은 빚이다.
- 우선순위: **(a) 새 파일/모듈 추가 ≫ (b) upstream 파일에 작은 hook 추가 ≫ (c) upstream
  로직 수정.** (c)는 최후수단이며 반드시 사유를 ADR 또는 커밋 본문에 남긴다.
- 포팅 델타는 **`:web`(또는 `:teavm`) 모듈 한 곳 + core에 표시된 소수 hook**에만 모은다.
  여기저기 흩뿌리지 않는다.

### 2-2. 포팅이지 재작성이 아니다
- upstream이 이미 하는 것을 다시 구현하지 않는다. upstream API 표면을 그대로 따른다.
- 막히면 "어떻게 새로 만들까"가 아니라 **"YosefLm fork는 이걸 어떻게 했나"**를 먼저 본다
  (`~/Projects/src/unciv-web-yosef`). 패턴을 가져올 땐 출처 커밋/파일을 명시한다.

### 2-3. upstream sync 규약
- 우리 클론의 `origin`(=upstream)은 read-only. 작업은 `sejong_teavm_web`에서.
- upstream 갱신 반영은 **merge**(rebase 아님 — 회사 repo와 동일 정책, 로컬 커밋 silent
  drop 방지). `git fetch origin && git merge origin/master`.
- 새 작업 브랜치는 항상 upstream과 동기화된 시점에서 분기 → 첫 충돌 없이 시작.

### 2-4. 데이터 캡처 레이어는 additive로
- task 25 본 목적 = agentic GUI trajectory(frame/state/action) 캡처. 이건 **순수 추가
  레이어**(`window.unciv` 브리지 등)로, 게임 로직을 건드리지 않고 얹는다. 캡처 때문에
  upstream 동작이 바뀌면 안 된다.

---

## 3. 의존성 핀 규약 (snapshot 지옥의 교훈)

포팅의 최대 시간낭비는 **moving-target 의존성**이었다. gdx-teavm은
`backend-teavm:-SNAPSHOT`처럼 베이스가 빈 리터럴 snapshot을 쓰는데, 이건 시점마다
다른 jar로 해석되고(아티팩트 skew: backend-teavm 20260117 vs asset-loader 20260206 →
`TeaBlob`→`WebBlob` rename 같은 binary 비호환), central sonatype에서 정리되면 아예
resolve가 안 된다.

- **규칙: `-SNAPSHOT` 리터럴 금지. 반드시 핀 가능한 좌표(timestamped 버전 또는 jitpack
  commit 좌표)로 고정한다.**
- 의존성 버전을 바꾸면 **빌드 thrash 금지** — 1회 시도 후 안 되면 read-only 진단(메타데이터
  조회)으로 전환하고 상태를 저장한다 (No-Experimental-Hacks 정책).
- 알려진 좌표 진단 경로: ① sonatype maven-snapshots의 `backend-teavm` metadata, ②
  jitpack `com.github.xpenatan.gdx-teavm:backend-teavm:<commit>` on-demand, ③ YosefLm
  fork의 실제 resolved classpath (그들 컨테이너에서 동작 확인된 좌표 = 정답).

---

## 4. 빌드 & 배포

빌드는 `~/Projects/src/Unciv`(또는 YosefLm 클론)에서, 산출물만 이 폴더로 복사한다.

```bash
# 환경: 사내 머신은 JDK 21 + 사내 Palo Alto root가 cacerts에 import되어 있어야 함
#       (reference_mac_jvm_build_toolchain 참조)
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
cd ~/Projects/src/Unciv
./gradlew :web:webBuildJs        # 또는 webBuildWasm — app.js 비제로면 M1 성공
```

- **빌드는 컨테이너가 canonical** (YosefLm `scripts/web/in-container.sh` + devcontainer
  Dockerfile = JDK21/node20/playwright). 사내 MITM 때문에 host 빌드가 막히면 컨테이너로.
- 배포 = 빌드 산출물(`dist/` 또는 `webapp/`의 `index.html` + `app.js`/wasm + `assets/`)을
  이 폴더(`kingsj0405.github.io/unciv/`)로 복사 → `kingsj0405.github.io` repo에 push하면
  GitHub Pages가 그대로 서빙. **빌드 단계 없음**(tridichess와 동일).
- assets는 base64 인라인이 아니라 정적 파일로 둔다(게임 에셋 32MB+, 인라인 비현실적).

---

## 5. 코드 / 문서 스타일

- **코드/식별자/파일명: 영어. 문서/주석/커밋/대화: 한국어.** (tridichess와 동일)
- 포팅 코드의 주석은 **WHY만** — 특히 "이건 web에서 X가 없어서 우회" 류의 비자명한
  플랫폼 제약. WHAT 설명 금지.
- 우리가 추가한 web hook에는 `// web-port:` 주석 마커를 달아 upstream 코드와 시각적으로
  구분한다 (나중에 sync/grep 용이).

---

## 6. 협업 루프 & QA

### 6-1. 큰 변경: Question → Options → Decision → Draft → Approval
판단 기준 "되돌리기 어려운가?" YES → 옵션 2~3개 + 트레이드오프 제시 후 대기.
의존성 좌표 변경, upstream 파일 수정, 모듈 구조 변경은 항상 여기 해당.

### 6-2. QA 워크플로 (마일스톤/스프린트 종료 시)
```markdown
## QA 요청 — <마일스톤>
### 실행 방법
(로컬 서버 URL 또는 https://yangspace.co.kr/unciv/)
### 변경 요약
- (한 줄)
### 확인 체크리스트 (5~10분)
[ ] 1. (구체 행동) → (기대 결과)
[ ] 2. (회귀) 이전 동작 유지
### 일부러 확인 안 한 것 / 알려진 한계
- (범위 밖 / 의도된 stub)
```
피드백 라벨: `BLOCKER`/`MAJOR`/`MINOR`/`NIT`/`NOTE`. `BLOCKER` 0 + `MAJOR` 합의 시 종료.

### 6-3. 커밋
- 사용자가 "커밋해줘" 명시할 때만. scope 형식: `web/launcher`, `web/build`, `core/hook` 등.
- 우리 fork(`web` remote)에만 push. upstream(`origin`)엔 절대 push 금지.

---

## 7. 현재 상태 & 단일 블로커 (세션 복귀용)

- **M0 spike = GO(조건부)** 완료. TeaVM이 Unciv 전체 그래프 dependency analysis 완주,
  reflection/Kotlin 에러 0건(우려 블로커 반증). 막는 건 JDK-API gap 5버킷뿐.
- **M1 = TeaVM 재-GO 확정.** B1(coroutines)이 지배 블로커였으나 YosefLm fork가 coroutines
  stock으로 통과 → 구조적 벽 아닌 **아티팩트 문제**로 판명.
- **🛑 현재 단일 블로커 = gdx-teavm snapshot 좌표 미해석** (§3). TLS/인증서는 무혐의 확정.
  `-SNAPSHOT` 리터럴을 핀 가능한 좌표로 확정 → host/컨테이너 빌드 재개 → `app.js` 비제로
  검증이 **최소 QA의 첫 게이트.**

### 다음 마일스톤
- **M1** Bootable(메뉴→맵→1턴, `app.js` 비제로) → **M2** agentic JS 브리지(`window.unciv`
  getState/dispatch/captureFrame, Playwright PoC) → **M3** 이 폴더로 정적 배포 →
  **M4** 헤드리스 N탭 data flywheel + replay 뷰어.

---

## 8. 참고 문서 (이 순서로 우선 참조)

1. 이 파일 (§7 현재 상태부터)
2. `docs/` (이 폴더) — 포팅 결정 기록 / 마일스톤 보고
3. 레시피 레퍼런스: `~/Projects/src/unciv-web-yosef`의 `plan.md` / `progress.md`
   (그들이 겪은 snapshot/API skew 전부 로그로 남아있음 — 막히면 여기부터)
4. 회사 repo task 트래킹(active 25): `exaone_individual/docs/260523-1332-KST-unciv-gui-trajectory/`
   — 상세 plan/report-progress. **작업 추적은 거기, 개발 규약은 여기.**
5. gdx-teavm 공식: https://github.com/xpenatan/gdx-teavm
