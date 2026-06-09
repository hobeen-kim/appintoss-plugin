---
name: ait-assets
description: 앱인토스 콘솔 제출 에셋(앱 아이콘·화면 예시·썸네일) 자동 생성. 규격과 headless 렌더 절차 정의. 파이프라인 Phase 7에서 visual-qa 에이전트가 사용.
---

# 앱인토스 콘솔 제출 에셋 생성 가이드

앱인토스 콘솔에 미니앱을 제출할 때 필요한 스토어 에셋(앱 아이콘, 앱 화면 예시, 앱 썸네일)을 headless 브라우저 렌더로 자동 생성한다. 모든 에셋은 콘솔이 요구하는 정확한 픽셀 규격을 만족해야 하며, 생성 후 실측 검증을 거친다.

## 1. 에셋 규격 표 (확정 수치, 임의 변경 금지)

| 에셋 | 규격 | 수량 | 생성 방식 |
|------|------|------|-----------|
| 앱 아이콘 | 600×600 PNG | 1장 | SVG/HTML 템플릿 디자인 → headless 브라우저 렌더 |
| 앱 화면 예시 | 세로형 636×1048 PNG | 3장 (실제 화면 필수) | Playwright viewport 318×524 + deviceScaleFactor 2 (@2x = 636×1048) 캡처. 비주얼 QA 페이즈 스크린샷 재활용 |
| 앱 썸네일(배너) | 1932×828 PNG | 1장 | HTML/CSS 컴포지션(브랜드 배경 + 앱명 + 한줄 카피 + 심볼, **스크린샷·폰 목업 금지**) → 렌더 |

참고: 콘솔은 화면 예시로 **세로형 636×1048** 또는 **가로형 1504×741**만 허용한다. 본 파이프라인은 세로형 636×1048로 고정한다.

## 2. 산출 경로

모든 에셋은 프로젝트의 `docs/assets/` 디렉토리에 저장한다.

- `docs/assets/icon.png` — 앱 아이콘 (600×600)
- `docs/assets/screenshot-1.png` ~ `docs/assets/screenshot-3.png` — 앱 화면 예시 (각 636×1048)
- `docs/assets/thumbnail.png` — 앱 썸네일 (1932×828)

## 3. 디자인 원칙

- **brand primaryColor 활용**: 앱의 `granite.config.ts`에 정의된 brand primaryColor를 배경/강조색으로 사용한다.
- **TDS 톤앤매너**: 토스 디자인 시스템(TDS)의 톤앤매너를 따른다. 과한 장식 금지, 여백과 위계 중심.
- **텍스트 가독성**: 썸네일 카피는 24자 이내로 작성한다. 배경과 충분한 대비를 확보한다.
- **썸네일은 창의적 브랜드 표현**: 배너에 스크린샷·폰 목업을 넣지 않는다 (화면 캡처는 '화면 예시'가 담당). 단순 그라데이션+중앙 텍스트는 금지 — 비대칭 레이아웃·추상 도형·떠다니는 칩·큰 타이포·깊이감 중 2가지 이상으로 시선을 끈다 (`references/thumbnail-composition.md` 창의성 원칙).
- **아이콘 심볼 크기**: 아이콘 심볼은 600 캔버스의 70% 이상(한 변 420px+)을 차지해야 한다. 작게 박혀 배경만 넓은 아이콘 금지.
- **아이콘은 단순 심볼 + 배경**: 복잡한 일러스트 대신 단순 심볼과 단색/그라데이션 배경으로 구성한다.

## 4. 생성 절차

1. **아이콘 HTML/SVG 작성** — `references/icon-template.md`를 참조해 600×600 아이콘 마크업을 만든다.
2. **Playwright로 각 규격 렌더·캡처** — `references/playwright-capture.md`의 표준 스니펫으로 아이콘·화면 예시·썸네일을 캡처한다.
3. **sips로 실측 검증** — 각 PNG의 실제 픽셀 크기를 확인한다.
   ```bash
   sips -g pixelWidth -g pixelHeight docs/assets/icon.png
   sips -g pixelWidth -g pixelHeight docs/assets/screenshot-1.png
   sips -g pixelWidth -g pixelHeight docs/assets/thumbnail.png
   ```
4. **불일치 시 재렌더** — 규격과 다르면 viewport·deviceScaleFactor를 점검하고 재렌더한다.

## 5. references

- `references/icon-template.md` — 600×600 아이콘 HTML/SVG 템플릿과 캡처 스니펫
- `references/thumbnail-composition.md` — 1932×828 썸네일 HTML/CSS 컴포지션 템플릿(브랜드 전용, 스크린샷 없음)과 캡처 스니펫
- `references/playwright-capture.md` — Playwright 캡처 표준 스니펫(화면 예시/아이콘/썸네일) 및 sips 검증

## 6. 규격 불확실 시

번들 문서가 stale일 수 있다. 규격이 불확실하면 공홈 조회(https://developers-apps-in-toss.toss.im/)를 우선하라. 콘솔 UI가 요구하는 픽셀 수치가 본 문서와 다르면 공홈/콘솔 표기를 따르되, 변경 사항을 본 스킬에 반영한다.
