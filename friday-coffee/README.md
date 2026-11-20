# 금요커피클럽 · Friday Coffee Club

매주 금요일, 한 테이블에 모이는 크로스 인더스트리 리더들의 **멤버 영입 심사 · 아젠다 보드** 프로토타입입니다. (이전 이름: 프론티어 AX 살롱 / Frontier AX Salon)

- 라이브: <https://yangspace.co.kr/friday-coffee/> (→ <https://kingsj0405.github.io/friday-coffee/>)
- 이전 주소: <https://yangspace.co.kr/frontier-ax-salon/> → 쿼리 파라미터(`?pass=`, `?letter=`, `?tab=`)를 그대로 넘겨 새 주소로 이동
- 위치: `kingsj0405/kingsj0405.github.io` 저장소의 `friday-coffee/` 폴더 (사이트의 다른 단일 HTML 앱과 같은 방식)
- 비공개 게이트 비밀번호: 슬랙 공지 참고 (저장소·페이지·커밋에 평문으로 두지 않음. 페이지에는 `sha256(비밀번호)` 해시만 들어가고, 레터 본문은 그 비밀번호로만 풀리는 AES-256-GCM 암호문으로 싣습니다. 게이트는 `?pass=<비밀번호>` 파라미터 자동 입장을 지원)
- 슬랙 워크스페이스: <https://friday-coffee.slack.com> (이름 `금요커피클럽`, 이전 주소 frontier-ax-salon.slack.com → 자동 리다이렉트)
  - 초대 링크: <https://join.slack.com/t/friday-coffee/invite/zt-4glb3daoj-2yi0jv2kcIdY5bI5kCmgKw> (2026-12-13 만료)
  - 채널: `#금요-커피레터` (레터 1·2·3호 아카이브), `#ax-만들어본것` (멤버들이 AX로 만든 것 공유)
- 멤버 추천 폼: <https://docs.google.com/forms/d/e/1FAIpQLSfJS5zf9_3jRfcZE5dof_74AlKwbTlK-wtPDYIyDF7qwoDkEw/viewform>

## 무엇을 하는 보드인가

크로스 인더스트리 리더 모임(테크리더 · CFO · VC · 변호사)의 운영 규칙을 웹으로 옮긴 것입니다.
핵심은 하나입니다. **새 멤버는 10명 전원이 찬성해야만 들어옵니다.**

| 기능 | 설명 |
| --- | --- |
| 💬 의견 교류 보드 | 기본 탭. 아젠다와 멤버 심사 안건을 한 목록에 모아 상태 배지(논의 중·확정·가이드라인)·한 줄 요약·댓글 수와 함께 아코디언으로 보여 줍니다. 실시간 검색, 논의 중/확정/전체 필터, `+ 주제 발제`, 대시보드 4카드(가장 뜨거운 주제·논의 중·모인 의견·멤버 10인) |
| ✨ AI 익명 합의안 | 펼친 카드마다 ① 공통 합의점 ② 남은 쟁점·조건 ③ 제안 합의안(초안). 발언자 이름을 지운 LLM용 프롬프트 복사, 규칙 기반 초안, HuggingFace 엔드포인트 연결 시 실시간 도출 |
| 🗳️ 멤버 영입 심사 | 후보자 카드 · 추천인 · 이력 요약 · 실시간 합의 게이지 · 찬성/조건부 찬성/비토 · 멤버별 투표 현황 |
| ☕ 금요 커피 레터 | **별도 페이지**로 분리: [1호](/friday-coffee/letter-1/) · [2호](/friday-coffee/letter-2/) · [3호](/friday-coffee/letter-3/). 보드에는 탭이 없고 마스트헤드·푸터의 링크로만 이동합니다. 같은 비밀번호·같은 인증 세션을 씁니다 |
| 📜 클럽 그라운드룰 | 크로스 인더스트리 원칙 · 100% 만장일치제 · Chatham House Rule |

주소 파라미터는 그대로 유지됩니다: `?pass=<비밀번호>`(자동 입장), `?tab=board|gate|rules`(`topics`·`letters`는 `board`로 연결).
기존 레터 공유 링크 `?letter=1` / `?letter=2` / `?letter=3`(또는 `?vol=1`·`?vol=2`·`?vol=3`)로 들어오면 단독 페이지 `letter-1/`·`letter-2/`·`letter-3/`로 자동 이동하며, `?pass=` 값도 함께 넘깁니다.

### 4개 페이지 구조

| 경로 | 내용 | 비밀번호 게이트 |
| --- | --- | --- |
| `/friday-coffee/` | 의견 교류 · 10/10 만장일치 거수기 · HF Pro AI 익명 합의안 · 그라운드룰 · 멤버 10인 | 슬랙 공지 |
| `/friday-coffee/letter-1/` | 금요 커피 레터 1호 단독 (전문·3줄 요약·화두·어록·Claude 아티팩트) | 슬랙 공지 (보드 인증 세션 공유) |
| `/friday-coffee/letter-2/` | 금요 커피 레터 2호 단독 | 슬랙 공지 (보드 인증 세션 공유) |
| `/friday-coffee/letter-3/` | 금요 커피 레터 3호 단독 (최신호) | 슬랙 공지 (보드 인증 세션 공유) |

네 페이지는 `assets/salon.css` 하나를 공유하고, 인증은 같은 오리진의 `localStorage`(`frontier_ax_auth_v2` + `frontier_ax_pass`) 한 곳에 남습니다. 보드에서 한 번 인증하면 레터 페이지는 게이트 없이 바로 열립니다. 비밀번호가 바뀌면 `AUTH_KEY` 버전을 올려 예전 세션이 자동으로 잠기게 합니다(현재 `_v2`).

### 익명 합의 도출 (HuggingFace 연결)

기본 연결은 금요커피클럽 전용 HuggingFace Space(`https://bismute-friday-coffee-consensus.hf.space/v1/chat/completions`, 모델 `Qwen/Qwen3.5-35B-A3B`)이고, 브라우저에서는 패스코드만 실려 나갑니다. 정적 HTML에는 API 키를 넣지 않습니다. 푸터의 `AI 합의 도출 연결`(또는 카드 안 `AI 연결`)에서 **OpenAI 호환 엔드포인트 URL · 모델 ID · HF 토큰**을 넣으면 토큰은 그 브라우저의 `localStorage`에만 남고, 합의안 도출 시 브라우저에서 직접 `POST` 합니다(엔드포인트가 CORS를 허용해야 함). 연결하지 않으면 같은 데이터로 **규칙 기반 초안**을 만들고, **LLM용 익명 프롬프트**를 복사해 어디서든 돌릴 수 있습니다.

- 입력: 안건 요약·핵심 쟁점, 익명 처리된 댓글(참여자 1..N), 입장 집계(찬성/보류/반대 또는 찬성/조건부/비토/검토 중)
- 출력(JSON): `{ "agreed": [...], "open": [...], "draft": "..." }` — 코드블록·설명이 섞여도 파싱합니다.

### 합의 규칙

- 찬성 8/10으로는 아무도 들어오지 못합니다. 남은 1명이 비토하면 카드가 **오프라인 커피 미팅**으로 넘어갑니다.
- `조건부 찬성`은 찬성으로 계산되지만, 조건이 카드에 남습니다.
- 10/10이 되면 `영입 확정 — 다음 금요일 오프라인 커피클럽 초청` 배지가 붙고 합의율이 100%가 됩니다.

## 디자인 시스템

`assets/salon.css` 상단 `:root`에 토큰을 정의하고, 네 페이지의 모든 화면을 그 토큰 위에서 조립합니다. 같은 규격이 게이트·헤더·탭·카드·레터·모달에 그대로 적용됩니다.

**표면 (Surface)** — 두 개의 평면만 씁니다. 페이지는 웜 오프화이트(`--bg #faf9f7`), 보드는 순백(`--surface #ffffff`). 카드 안쪽은 `--surface-2 #f6f4f0`로 한 단계만 들어갑니다.

**선 (Line)** — 그림자 대신 1px 헤어라인. `--border #e7e2da` / `--border-strong #d7d0c5`.

**텍스트 위계 (Text)** — `--text #191512` → `--text-2 #5a5349` → `--text-3 #786f63` → `--text-4 #8d8579`. 본문 14–15px, 메타 11.5–12.5px, 제목 16/18/20/24/34px.

**커피 액센트 (Coffee-club accent)** — 에스프레소 잉크 `--ink #221b15`(주요 버튼), 캐러멜 `--accent #9c6b3c` / `--accent-strong #7b5129`(링크·라벨·강조선), `--accent-soft #f7f0e7`.

**기능색 (Semantic)** — 찬성 `--yes #1f7a4d`, 조건부 `--cond #b0741c`, 비토 `--veto #b0342a`, 검토 중 `--track #e7e2da`. 각각 soft 배경과 line 색을 한 쌍으로 씁니다.

**간격·모서리·그림자** — 4→56px 스케일(`--sp-1`…`--sp-9`), 모서리 6/10/14/18px(`--r-sm`…`--r-xl`), 그림자는 `--shadow-xs`(카드) / `--shadow-md`(모달) 두 단계만.

**타이포** — 본문 Pretendard Variable, 워드마크와 레터 제목만 Noto Serif KR. 그라데이션·글로우·색 배지 남발을 걷어내고 헤어라인과 여백으로 위계를 만듭니다.

## 기술

- 정적 HTML 4장(`index.html` · `letter-1/index.html` · `letter-2/index.html` · `letter-3/index.html`) + 공유 CSS 1장(`assets/salon.css`) · Lucide 아이콘 · vanilla JS
- 레터 본문은 `letters.json`이 유일한 원본이고 `tools/build-letter-pages.py`가 단독 페이지들을 만들어 냅니다. 내용을 고칠 때는 `letters.json`을 고치고 `FC_PASSCODE=... python3 tools/build-letter-pages.py`를 다시 돌립니다(비밀번호는 환경변수나 `/tmp/fc_new_pass.txt`에서 읽고, 출력물에는 SHA-256 해시와 AES-256-GCM 암호문만 남깁니다).
- 투표·댓글·합의안 상태는 브라우저 `localStorage`에만 저장됩니다(서버 없음). 푸터의 `보드 초기화`로 저장된 투표·댓글을 지우고 초기 상태(실제 안건만)로 되돌립니다.
- 예제·더미 데이터(가짜 후보자·가짜 아젠다·가짜 댓글·예시 합의안)는 모두 걷어냈습니다. 보드는 실제 안건만 보여 줍니다.

## 로컬에서 보기

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## 파일

```
friday-coffee/
  index.html              # 보드 앱 (의견 교류 · 거수기 · 그라운드룰)
  assets/salon.css        # 네 페이지 공유 디자인 시스템
  letter-1/index.html     # 금요 커피 레터 1호 단독
  letter-2/index.html     # 금요 커피 레터 2호 단독
  letter-3/index.html     # 금요 커피 레터 3호 단독
  README.md
letters.json              # 레터 본문 원본 (1·2·3호)
tools/build-letter-pages.py   # letters.json -> letter-1/ · letter-2/ · letter-3/
```

## 배포

```bash
repos/deploy-friday-coffee.sh
```

- `index.html` · `README.md` · `assets/salon.css` · `letter-1/index.html` · `letter-2/index.html` · `letter-3/index.html` → `kingsj0405/kingsj0405.github.io` 의 `friday-coffee/`
- `redirect/index.html` → 같은 저장소의 `frontier-ax-salon/` (기존 링크 유지용 리다이렉트)
- 로컬 스테이징 사본: `/workspace/deploy/friday-coffee/` 와 `friday-coffee.zip`
- 스크립트가 먼저 `tools/build-letter-pages.py`를 돌려 레터 페이지를 `letters.json`에서 다시 만듭니다.

## 참고

- 광록 님의 「그라운드룰 보드」(groundrules-14c.pages.dev) 구조에서 출발했습니다.
- 보드에는 실제 멤버 10인 명단, 금요 커피 레터 1·2호, 그라운드룰, 그리고 실제 영입 심사 안건(황태완 님 추천)만 올라갑니다. 영입 심사와 확정은 금요일 오프라인 커피클럽에서 이뤄집니다.
