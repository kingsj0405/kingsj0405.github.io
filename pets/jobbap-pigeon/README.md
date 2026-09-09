# 조빱 비둘기 · Codex Pet

흰 볏과 멍한 눈으로 고개를 갸웃하는 조빱 비둘기입니다.

[미리보기와 다운로드](https://yangspace.co.kr/pets/jobbap-pigeon/)

## Codex로 설치

아래 문장을 Codex에 보내주세요.

> https://yangspace.co.kr/pets/jobbap-pigeon/codex-pet.json 에서 조빱 비둘기 Codex 펫을 설치해줘. 파일의 SHA-256을 확인하고 pet.json과 spritesheet.webp를 Codex pets 폴더에 함께 설치해줘.

배포 manifest의 파일 크기와 SHA-256을 검증한 뒤 두 파일을 같은 폴더에 놓습니다. 이미 같은 ID의 펫이 있으면 기존 파일을 보관한 뒤 교체합니다.

```text
~/.codex/pets/jobbap-pigeon/
├── pet.json
└── spritesheet.webp
```

`CODEX_HOME`을 별도로 지정했다면 해당 폴더 아래의 `pets/jobbap-pigeon/`을 사용합니다. ZIP에는 위 두 파일만 들어 있습니다. 별도의 설치 프로그램은 없습니다.

## 파일

- [설치 ZIP](jobbap-pigeon-v2-pet.zip)
- [파일 크기와 SHA-256 manifest](codex-pet.json)
- [pet.json](pet.json)
- [spritesheet.webp](spritesheet.webp)
- [전체 동작표](contact-sheet.png)

Sprite version 2, 투명 WebP 1536×2288, 192×208 셀의 8열×11행입니다. 기본·좌우 이동·인사·점프·실패·기다림·작업·검토의 아홉 동작과 시계 방향 16방향 시선이 들어 있습니다. 000°는 위, 090°는 화면 오른쪽, 180°는 아래, 270°는 화면 왼쪽입니다.

## 제작과 출처

사용자가 제공한 짤툰 비둘기 캐릭터 그림을 기준으로 내장 imagegen에서 기본 모습과 동작을 생성하고, 프레임 추출과 투명 배경 정리 및 v2 검수를 거쳤습니다. 흰 볏, 청회색의 긴 목, 둥근 회색 배, 검은 선으로 그린 발과 뾰족한 꼬리를 유지하도록 요청했습니다. 표정과 동작은 원본 그림의 멍한 인상을 바탕으로 한 제작상의 해석입니다.

- [짤툰 공식 새대갈 특별편](https://www.youtube.com/watch?v=uzlGXdFO5zo)
- [짤툰! 짐승친구들 단행본 소개](https://www.yes24.com/product/goods/115181418)
- [「조빱 비둘기」 영상 제목을 확인한 보조 자료](https://www.speakrj.com/audit/report/UCszFjh7CEfwDb7UUGb4RzCQ/youtube/media-stats)

비공식 팬 펫입니다. 원작 캐릭터의 권리는 원작자에게 있으며, 공식 배포나 제휴를 의미하지 않습니다.
