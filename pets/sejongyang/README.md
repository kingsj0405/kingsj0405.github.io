# 세종양 — Codex Pet

세종양은 세종대왕의 익선관과 붉은 곤룡포를 입은 Codex-compatible v2 animated pet입니다.

미리보기와 공유 링크: **[yangspace.co.kr/pets/sejongyang](https://yangspace.co.kr/pets/sejongyang/)**

## Codex로 설치

다음 문장을 Codex 작업에 붙여넣으세요.

> https://yangspace.co.kr/pets/sejongyang/codex-pet.json 에서 세종양 Codex 펫을 설치해줘. manifest에 적힌 SHA-256을 확인하고 pet.json과 spritesheet.webp를 로컬 Codex pets 디렉터리에 설치한 뒤, 선택하고 깨우는 방법을 알려줘.

배포에는 설치 프로그램이나 실행 코드가 없습니다. Codex는 다음 두 파일만 내려받고 검증하면 됩니다.

| 파일 | 용도 | SHA-256 |
| --- | --- | --- |
| [`pet.json`](https://yangspace.co.kr/pets/sejongyang/pet.json) | 펫 메타데이터 | `30df6f4fde68f305766920d4d67107d88710311a84525324da7d57a6858b11f7` |
| [`spritesheet.webp`](https://yangspace.co.kr/pets/sejongyang/spritesheet.webp) | 1536×2288 투명 v2 애니메이션 아틀라스 | `6707f8527a389fbca3828ab42512abef16161e05dcde28a165df554c10ee9769` |

기계 판독용 배포 manifest는 [`codex-pet.json`](https://yangspace.co.kr/pets/sejongyang/codex-pet.json)입니다.

## 수동 설치

두 파일을 로컬 Codex pet 디렉터리의 같은 폴더에 놓습니다.

```text
~/.codex/pets/sejongyang/
├── pet.json
└── spritesheet.webp
```

그다음 **Codex → Settings → Pets**에서 **Refresh**를 누르고 **세종양**을 선택해 깨우세요.

## Pet contract

- ID: `sejongyang`
- Display name: `세종양`
- Sprite version: `2`
- Atlas: transparent WebP, `1536×2288`
- Cell size: `192×208`
- Layout: 8 columns × 11 rows
- Standard animations: idle, running right, running left, waving, jumping, failed, waiting, running, review
- Extended animations: 16 clockwise look directions
