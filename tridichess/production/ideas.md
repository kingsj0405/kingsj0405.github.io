# Ideas

QA `NOTE` 또는 자유 발상. 결함이 아닌 "있으면 좋겠다" 항목.

각 항목 1~3줄. 채택 시 backlog.md 또는 마일스톤으로 승격.

## 후보

### 멀티플레이 + 리더보드 + 리플레이 (2026-05-12 제안)

**목표:** 친구·외부 사용자와 온라인 대국 + ELO 랭킹 + 과거 기보 다시보기.

**아키텍처 옵션:**

| 옵션 | Stack | 장점 | 단점 |
|------|-------|------|------|
| **A. Firebase (Firestore + Auth)** ⭐ 추천 | Firebase JS SDK, Firestore realtime, Firebase Auth (Google) | "딸깍" 수준 — 백엔드 코드 0, realtime sync 자동, 무료 tier 충분 (hobby), GitHub Pages 정적 배포와 궁합 | Vendor lock-in, 복잡 쿼리 약함, ELO 등 server logic 은 Cloud Functions 필요 (유료 가능성) |
| B. Supabase | Postgres + Realtime + Auth | SQL 쿼리, open source, self-host 가능 | Firebase 보다 setup 살짝 더, Cloud Functions 대신 Edge Functions |
| C. Cloudflare Workers + KV/D1 | Workers (서버리스), D1 (SQLite) | 매우 빠름, 글로벌, 무료 tier 관대 | Auth 별도 (Auth0 등), Realtime 직접 구현 필요 (Durable Objects + WebSocket) |
| D. 직접 Node 서버 | Express + Socket.io + Postgres | 완전 제어 | 호스팅 비용/관리, GitHub Pages 정적 배포 깨짐 |

**추천 — Firebase 단계별 도입:**
1. **Phase 1 — Auth + 기보 저장**: Firebase Auth (Google 로그인) + Firestore 에 완료 게임의 `moveHistory` JSON 저장. 기존 `serialize.js` 그대로 활용.
2. **Phase 2 — 리플레이**: Firestore 게임 목록 페이지 → 클릭 시 `jumpToHistory` 로 한 수씩 재생.
3. **Phase 3 — 비동기 멀티플레이 (correspondence)**: Firestore realtime listener 로 상대 수 polling. 턴 기반이라 WebSocket 불필요.
4. **Phase 4 — ELO**: Cloud Function on game-complete → 양쪽 rating 갱신. 표준 ELO (K=32) 시작.
5. **Phase 5 — 리더보드**: Firestore `users` collection query (rating desc, limit 100).

**구현 고려사항:**
- 치팅 방지: 클라이언트가 move history 전체 전송 → 서버 측 합법성 재검증 필요. `src/rules/` 가 Three.js 의존 없음 → Cloud Function 에서 그대로 import 가능 (ES Modules).
- 게임 ID: `gameId-{timestamp}-{uuid}` 같은 unique key. Firestore doc.
- 사이드 결정: 매칭 시 랜덤 또는 ELO 기반.
- 시간 제한: 일단 turn-based, 시간 없음. 추후 chess clock.

**예상 작업량:** Phase 1+2 만 (~4시간), 멀티플레이 까지 (~10시간), ELO + 리더보드 (~6시간).
**비용:** Firebase Spark (무료) tier 로 hobby 수준 충분. Blaze (유료) 는 Cloud Functions 호출량 기준이지만 무료 quota 안에서 운영 가능.

## 검토 후 폐기

(아직 없음)
