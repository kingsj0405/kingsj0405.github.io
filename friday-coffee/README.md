# 금요커피클럽 · Friday Coffee Club

매주 금요일, 한 테이블에 모이는 크로스 인더스트리 리더들의 **멤버 영입 심사 · 아젠다 보드** 프로토타입입니다. (이전 이름: 프론티어 AX 살롱 / Frontier AX Salon)

- 라이브: <https://yangspace.co.kr/friday-coffee/> (→ <https://kingsj0405.github.io/friday-coffee/>)
- 이전 주소: <https://yangspace.co.kr/frontier-ax-salon/> → 쿼리 파라미터(`?pass=`, `?letter=`, `?tab=`)를 그대로 넘겨 새 주소로 이동
- 위치: `kingsj0405/kingsj0405.github.io` 저장소의 `friday-coffee/` 폴더 (사이트의 다른 단일 HTML 앱과 같은 방식)
- 비공개 게이트 비밀번호: `fx2026` (또는 `?pass=fx2026` 파라미터로 자동 입장 가능)
- 슬랙 워크스페이스: <https://friday-coffee.slack.com> (이름 `금요커피클럽`, 이전 주소 frontier-ax-salon.slack.com → 자동 리다이렉트)
  - 초대 링크: <https://join.slack.com/t/friday-coffee/invite/zt-4glb3daoj-2yi0jv2kcIdY5bI5kCmgKw> (2026-12-13 만료)
  - 채널: `#금요-커피레터` (레터 1·2호 아카이브), `#ax-만들어본것` (멤버들이 AX로 만든 것 공유)
- 멤버 추천 폼: <https://docs.google.com/forms/d/e/1FAIpQLSfJS5zf9_3jRfcZE5dof_74AlKwbTlK-wtPDYIyDF7qwoDkEw/viewform>

## 무엇을 하는 보드인가

크로스 인더스트리 리더 모임(테크리더 · CFO · VC · 변호사)의 운영 규칙을 웹으로 옮긴 것입니다.
핵심은 하나입니다. **새 멤버는 10명 전원이 찬성해야만 들어옵니다.**

| 기능 | 설명 |
| --- | --- |
| 🗳️ 멤버 영입 심사 | 후보자 카드 · 추천인 · 이력 요약 · 실시간 합의 게이지 · 찬성/조건부 찬성/비토 · 멤버별 투표 현황 |
| ☕ 금요 커피 레터 | 매주 금요일 테이블 기록 아카이브 (1·2호) · 공유 링크 복사 |
| 💬 AX 아젠다 토론 | 이번 주 테이블 안건 3건 · 핵심 쟁점 · 현장 사례 · 댓글 스레드 |
| 📜 클럽 그라운드룰 | 크로스 인더스트리 원칙 · 100% 만장일치제 · Chatham House Rule |

### 합의 규칙

- 찬성 8/10으로는 아무도 들어오지 못합니다. 남은 1명이 비토하면 카드가 **오프라인 커피 미팅**으로 넘어갑니다.
- `조건부 찬성`은 찬성으로 계산되지만, 조건이 카드에 남습니다.
- 10/10이 되면 `영입 확정 — 다음 금요일 오프라인 커피클럽 초청` 배지가 붙고 합의율이 100%가 됩니다.

## 디자인 시스템

`index.html` 상단 `:root`에 토큰을 정의하고, 모든 화면을 그 토큰 위에서 조립합니다. 같은 규격이 게이트·헤더·탭·카드·레터·모달에 그대로 적용됩니다.

**표면 (Surface)** — 두 개의 평면만 씁니다. 페이지는 웜 오프화이트(`--bg #faf9f7`), 보드는 순백(`--surface #ffffff`). 카드 안쪽은 `--surface-2 #f6f4f0`로 한 단계만 들어갑니다.

**선 (Line)** — 그림자 대신 1px 헤어라인. `--border #e7e2da` / `--border-strong #d7d0c5`.

**텍스트 위계 (Text)** — `--text #191512` → `--text-2 #5a5349` → `--text-3 #786f63` → `--text-4 #8d8579`. 본문 14–15px, 메타 11.5–12.5px, 제목 16/18/20/24/34px.

**커피 액센트 (Coffee-club accent)** — 에스프레소 잉크 `--ink #221b15`(주요 버튼), 캐러멜 `--accent #9c6b3c` / `--accent-strong #7b5129`(링크·라벨·강조선), `--accent-soft #f7f0e7`.

**기능색 (Semantic)** — 찬성 `--yes #1f7a4d`, 조건부 `--cond #b0741c`, 비토 `--veto #b0342a`, 검토 중 `--track #e7e2da`. 각각 soft 배경과 line 색을 한 쌍으로 씁니다.

**간격·모서리·그림자** — 4→56px 스케일(`--sp-1`…`--sp-9`), 모서리 6/10/14/18px(`--r-sm`…`--r-xl`), 그림자는 `--shadow-xs`(카드) / `--shadow-md`(모달) 두 단계만.

**타이포** — 본문 Pretendard Variable, 워드마크와 레터 제목만 Noto Serif KR. 그라데이션·글로우·색 배지 남발을 걷어내고 헤어라인과 여백으로 위계를 만듭니다.

## 기술

- 단일 HTML 파일 · 자체 CSS 디자인 시스템(토큰 기반, Tailwind CDN 제거) · Lucide 아이콘 · vanilla JS
- 빌드 파이프라인 없음. 정적 파일을 그대로 서빙합니다.
- 투표·댓글 상태는 브라우저 `localStorage`에만 저장됩니다(서버 없음). 데모 데이터는 푸터의 `데모 상태 초기화`로 되돌립니다.

## 로컬에서 보기

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## 파일

```
friday-coffee/
  index.html    # 앱 전체 (HTML + CSS + JS)
  README.md
```

## 배포

```bash
repos/deploy-friday-coffee.sh
```

- `index.html` · `README.md` → `kingsj0405/kingsj0405.github.io` 의 `friday-coffee/`
- `redirect/index.html` → 같은 저장소의 `frontier-ax-salon/` (기존 링크 유지용 리다이렉트)

## 참고

- 광록 님의 「그라운드룰 보드」(groundrules-14c.pages.dev) 구조에서 출발했습니다.
- 화면의 멤버·후보자 정보는 데모 데이터입니다. 실제 영입 심사와 확정은 금요일 오프라인 커피클럽에서 이뤄집니다.
