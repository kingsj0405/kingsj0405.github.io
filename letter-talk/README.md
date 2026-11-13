# 세종양 에세이 레터 - 독자 담벼락 (Letter Talk)

세종양의 비정기 에세이 레터 독자들을 위한 익명 소통 라운지입니다.
로그인이나 계정 가입 없이 누구나 따뜻하고 솔직한 한마디를 남길 수 있습니다.

## 시스템 구조
- **호스팅**: GitHub Pages (`https://yangspace.co.kr/letter-talk/`)
- **실시간 읽기 (Read)**: Google Sheets Visualization API (`gviz/tq`)
  - 스프레드시트: `세종양 에세이 레터 - 독자 담벼락` (`1GkxkeIewJVFi_WfGjG-KFdkLUvb__CZhFV4zEdUdzj4`)
- **실시간 쓰기 (Write)**: Google Forms (`1tFRAKP0qP7px1OFeoSuBmbB6A0FVlrDKI91jj67Hb2s`)
  - 무인증 `no-cors` 비동기 전송 + Optimistic Local UI
- **인터랙션**:
  - 독자 공감 하트(❤️) 로컬 상태 유지
  - 에세이 호수별 필터링
  - 6대 반응 이모지 (♨️ ☕ 🔥 💡 🐑 ㅋㅋㅋ)
