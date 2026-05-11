# M5 — Visual Overhaul (계획서)

> 작성일: 2026-05-12
> 상태: PLANNED (실행 보류 — 현재 M4 진행 중)
> 참고 이미지: `startrek_3dchess2~5.jpg` (Franklin Mint, 변형 세트들)

---

## 1. 현재 3D 뷰 진단

`tridichess_debug.png` 기준 문제점:

| 요소 | 현재 | 문제 |
|------|------|------|
| Piece | Canvas Sprite (원 + 유니코드 문자) | 평면, 장난감처럼 보임. 빛 안 받음 |
| Plate | 어두운 BoxGeometry (흑색) | 무드 부족, transparency 없음, 그리드 라인 없음 |
| Spine | 단순 cylinder | Franklin Mint 의 S-curve / 곡선 spine 없음 |
| Base | 회색 원기둥 | 의미 없음, Starfleet 로고 없음 |
| Lighting | Ambient + spot + rim point | 단조로움. 금속/유리 반사 부족 |
| Color | 보드 dark blue-gray, piece 흰/빨강 단색 | 사이드바 cyan accent 와 어울리지만 visual richness 부족 |
| 좌표 라벨 | 작은 텍스트 떠다님 | 가독성·미관 둘 다 약함 |

사이드바 (cyan accent / monospace 로그 / hex 분위기) 의 톤은 좋음. 3D 뷰가 그 톤을 못 따라가는 게 핵심.

---

## 2. 참고 이미지 정리

| 이미지 | 톤 | 차용 요소 |
|--------|------|-----------|
| `startrek_3dchess2.jpg` | 보라·금속 (gold + silver pieces) | Brass spine, Starfleet base, 투명 자색 plate |
| `startrek_3dchess3.jpg` | 자홍 (pink/magenta) + 거미줄 | Spider-web 방사선 격자, 크롬 spine, 함선 base |
| `startrek_3dchess4.jpg` | 빨강·흰색 sparkle + 클래식 staunton | 반짝이는 plate, S-curve 검정 spine |
| **`startrek_3dchess5.jpg`** ⭐ | **블루 cyan grid + spider-web + spaceship feel** | **메인 영감원** |

### 5.jpg 의 매력 (우리 cyan accent 와 정합)
- 보드: 진한 cyan/blue + 흰 반투명 격자, **방사선 (spider-web) 패턴**
- Piece: gold/silver 메탈릭 staunton 실루엣 (작고 깔끔)
- 분위기: 우주선/SF — 우리 프로젝트 톤과 완벽히 맞음

---

## 3. M5 작업 분해

### Phase M5-1: Plate 리디자인 (~3시간)
- `THREE.PlaneGeometry` + 커스텀 ShaderMaterial 또는 CanvasTexture
- Cyan 격자 + 방사선 (spider-web) 라인 — 절차적 텍스처
- 알파 0.4~0.6 의 acrylic look, edge 라이트 효과
- 보드 마다 약간씩 hue 차이 (W·N·B 미세 구분 가능)

### Phase M5-2: Piece 3D geometry (~5시간) — 가장 큰 작업
- 6 piece 타입의 **저폴리 staunton 메시** (Three.js 절차적 생성 또는 GLTF 임포트)
  - 옵션 A: 절차적 (CylinderGeometry + LatheGeometry 조합)
  - 옵션 B: GLTF asset (외부 무료 모델, 라이선스 확인 필요)
- `MeshStandardMaterial` 금속 반사 (백=실버/gold-tinted white, 흑=차콜)
- 사이즈: 셀의 70%, 높이는 piece 별 상이 (K 가장 큼)
- Selected/Hint 시 발광 (emissive)

### Phase M5-3: Spine + Base (~2시간)
- S-curve 또는 spiral 곡선: `THREE.TubeGeometry` + `Curve` 클래스
- Brass 또는 chrome metallic (사이드바 cyan 과 어울리는 silver/cyan 메탈)
- Base: `LatheGeometry` 로 함선 받침 형태
- 옵션: Starfleet delta 로고 texture (저작권 회피 시 추상 도형)

### Phase M5-4: 환경 + 라이팅 (~2시간)
- HDR environment map (sky/dark space)
- Three lights: key + rim + fill
- 메탈 반사 위해 `envMapIntensity` 조정
- Bloom post-processing (cyan glow)
- Fog 보강 — 거리감

### Phase M5-5: 사이드바와 톤 통합 (~1시간)
- 3D 뷰 background: dark navy + cyan 그라데이션 (사이드바와 연속감)
- 좌표 라벨: 작고 monospace, cyan accent
- Last-move 주황 highlight 그대로 유지 (좋음)
- 종합 카메라 조정

### Phase M5-6: 성능/QA (~2시간)
- Piece 3D 가 fps 영향 검증 (32 piece × draw call → instancing 고려)
- 모바일 대응
- 회귀: 클릭/하이라이트/AB 등 기능 정상

**총 예상: 15~17 시간** (제법 큰 milestone)

---

## 4. 분리 권장 이유

- 코드 위치: `src/renderer/` 만 변경. 게임 로직 무관
- 기능 회귀 위험 적음 (rendering only)
- 별도 PR / commit 으로 시각적 변화만 격리 → review 쉬움
- 진행 중 게임 기능 (M4 등) 동시 진행 가능

---

## 5. 의존성 / 선결

- 외부 asset (GLTF piece) 사용 시: 라이선스 명시 + ADR 추가
- HDR 환경맵 사용 시: 파일 크기 (~1MB) — `assets/hdr/` 폴더 + lazy load
- 모바일 GPU 부담 측정 후 mobile fallback (sprite 모드 유지)

---

## 6. 후속 milestone 이후 진입 조건

- M4 (Attack Board) 완료 또는 D-3 까지 안정화
- 다른 critical bug 없음
- 사용자 우선순위 확정

---

## 7. 즉시 적용 가능한 "작은 개선" (M5 본격 전)

만약 M5 본격 전에 빠른 wins:
- Plate alpha 증가 (좀 더 투명하게) — 30분
- 사이드바 cyan accent 색을 plate edge 에 반영 — 30분
- Ambient light 색을 약간 cyan tint — 15분
- Piece sprite 의 원 외곽선 두께 줄이기 — 15분

이 정도는 M4 진행 중 자투리 시간에도 가능.

---

## 8. 결정 보류 사항

- GLTF vs 절차적 piece geometry (라이선스/품질/사이즈 trade-off)
- HDR 환경맵 도입 여부
- Starfleet 로고 사용 가능 여부 (저작권)

---

*M4 끝나거나 사용자가 우선순위 변경 시 본격 진입.*
