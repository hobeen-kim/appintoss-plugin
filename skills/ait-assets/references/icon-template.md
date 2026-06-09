# 앱 아이콘 템플릿 (600×600)

콘솔이 아이콘 모서리를 자동 마스킹하므로 **둥근 모서리를 직접 넣지 않는다**(정사각 풀블리드). 배경은 brand primaryColor 단색 또는 그라데이션, 중앙에 단순 심볼을 배치한다.

**심볼 크기 규칙 (중요)**: 심볼은 600 캔버스에서 **최소 한 변 420px 이상(전체의 70%+)**을 차지해야 한다. 작게 박혀 배경만 넓은 아이콘은 금지. 안전 여백은 좌우상하 각 ~60~90px(약 10~15%)만 남긴다. SVG `viewBox`를 꽉 채우도록 path를 그리고, `.symbol` 박스도 크게 잡는다.

## 창의성 가이드 (단조로운 단색 심볼 금지)

외부 이미지 생성은 쓰지 않고 **SVG로 직접** 그리되, 밋밋한 흰색 도형 하나로 끝내지 않는다. 아래 중 **2가지 이상**을 적용해 깊이·완성도를 높인다 (단, 콘솔이 작게 표시하므로 **단순·고대비** 유지 — 과한 디테일 금지):

1. **그라데이션 심볼/배경** — `<linearGradient>`/`<radialGradient>`로 심볼이나 배경에 단계감.
2. **다중 레이어** — 메인 심볼 + 보조 도형(뒤 레이어 반투명, 액센트 컬러)으로 입체.
3. **액센트 컬러 1개** — 흰색 일변도 대신 brand 보색/포인트 컬러를 한 곳에.
4. **음각/양각** — 배경에서 심볼을 빼내거나(knockout), 그림자/하이라이트 path로 깊이.
5. **컨셉 직결 모티프** — 앱 정체성을 1초에 읽히는 형태 (가계부=동전/지폐, 운세=별/카드, 일정=달력 등). 추상 도형 남발 금지.

```html
<!-- 예: 그라데이션 배경 + 다중 레이어 + 액센트 (가계부 동전 모티프) -->
<svg class="symbol" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#e8f0ff"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="40" fill="rgba(255,255,255,0.18)"/>  <!-- 뒤 레이어 -->
  <circle cx="50" cy="50" r="32" fill="url(#g)"/>                  <!-- 메인 -->
  <path d="M50 32 v36 M40 42 h20 M40 58 h20" stroke="var(--brand)" stroke-width="6" stroke-linecap="round"/>
  <circle cx="50" cy="50" r="32" fill="none" stroke="var(--accent,#ffd54a)" stroke-width="3"/> <!-- 액센트 링 -->
</svg>
```
`--accent`는 thumbnail과 동일 포인트 컬러를 쓰면 아이콘·배너 톤이 일관된다.

## HTML + SVG 템플릿

`icon.html`로 저장한다. `--brand`를 앱의 granite.config.ts primaryColor로 교체한다.

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <style>
    :root {
      --brand: #3182f6;        /* granite.config.ts primaryColor */
      --brand-2: #1b64da;      /* 그라데이션 종점 (단색이면 --brand와 동일) */
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 600px; height: 600px; }
    .icon {
      width: 600px;
      height: 600px;
      display: flex;
      align-items: center;
      justify-content: center;
      /* 단색: background: var(--brand); */
      background: linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%);
      /* 둥근 모서리 없음 — 콘솔이 마스킹 */
    }
    .symbol { width: 440px; height: 440px; }  /* 600의 ~73% — 심볼이 캔버스를 채운다 */
  </style>
</head>
<body>
  <div class="icon">
    <!-- 단순 심볼: 단색 흰색 path 1~2개. viewBox(0~100)를 거의 꽉 채운다(여백 ~6) -->
    <svg class="symbol" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 6 L94 31 V69 L50 94 L6 69 V31 Z" fill="#ffffff"/>
      <path d="M50 34 L70 45 V61 L50 72 L30 61 V45 Z" fill="var(--brand)"/>
    </svg>
  </div>
</body>
</html>
```

## Playwright 캡처 스니펫

```js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 600, height: 600 },
    deviceScaleFactor: 1, // 600px viewport에서 1배 = 600×600
  });
  await page.goto('file://' + require('path').resolve('icon.html'), {
    waitUntil: 'networkidle',
  });
  await page.evaluate(() => document.fonts.ready); // 폰트 로딩 대기
  await page.locator('.icon').screenshot({ path: 'docs/assets/icon.png' });
  await browser.close();
})();
```

캡처 후 실측 검증:

```bash
sips -g pixelWidth -g pixelHeight docs/assets/icon.png   # 600 × 600 확인
```
