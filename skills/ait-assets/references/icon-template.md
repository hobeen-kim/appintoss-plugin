# 앱 아이콘 템플릿 (600×600)

콘솔이 아이콘 모서리를 자동 마스킹하므로 **둥근 모서리를 직접 넣지 않는다**(정사각 풀블리드). 배경은 brand primaryColor 단색 또는 그라데이션, 중앙에 단순 심볼을 배치한다.

**토스블루 그라데이션 기본 금지** — 배경·심볼 컬러는 앱 팔레트에서 도출하고(토스블루는 앱 brand 실제색일 때만), 모티프도 앱 고유 메타포로 그린다.

**모티프 채움 규칙 (중요 — 컨테이너 박스가 아니라 실제 그려진 픽셀 기준)**: 배경을 제외한 **실제 렌더된 모티프의 바운딩박스**(배경색과 다른 픽셀들의 min/max x,y)가 600 캔버스 한 변의 **≥78%(≥468px)**를 차지해야 한다. `.symbol` 컨테이너 박스 크기가 아니라 **실제 그려진 형태** 기준이다. 안전 여백은 상하좌우 각 ~8~11%(50~66px)만 남긴다.

- `.symbol` 박스는 **500px(캔버스의 약 83%)**로 잡고, **SVG viewBox 안에서 path가 가장자리(여백 ≤3)까지 닿도록** 그린다. **작은 도형을 큰 viewBox 중앙에 배치하는 것 금지** — 박스를 키워도 path가 viewBox 중앙에 작게 박혀 있으면 모티프는 그대로 작다.
- **흔한 실패: 배경 여백 과다** — 모티프가 캔버스의 ~55%만 차지하고 상하좌우 여백이 ~22%씩 남아 "배경만 넓고 심볼이 작아 보이는" 아이콘. 보조 배경 도형(반투명 원 등)이 모티프보다 크거나 시선을 끌면 안 된다 — 보조 도형은 모티프 뒤에서 살짝만 보이게.

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
  <circle cx="50" cy="50" r="47" fill="rgba(255,255,255,0.18)"/>  <!-- 뒤 레이어: 모티프 뒤에서 살짝만 -->
  <circle cx="50" cy="50" r="40" fill="url(#g)"/>                  <!-- 메인: viewBox 가장자리 근처까지 -->
  <path d="M50 28 v44 M38 40 h24 M38 60 h24" stroke="var(--brand)" stroke-width="7" stroke-linecap="round"/>
  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--accent,#ffd54a)" stroke-width="3"/> <!-- 액센트 링 -->
</svg>
```
`--accent`는 thumbnail과 동일 포인트 컬러를 쓰면 아이콘·배너 톤이 일관된다. 창의성 요소를 더해도 **고대비·단순 원칙과 모티프 채움 규칙(≥78%)은 항상 우선**한다.

## HTML + SVG 템플릿

`icon.html`로 저장한다. `--brand`를 앱의 `apps-in-toss.config.ts` `brand.primaryColor`로 교체한다.

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <style>
    :root {
      --brand: #3182f6;        /* apps-in-toss.config.ts brand.primaryColor */
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
    .symbol { width: 500px; height: 500px; }  /* 600의 ~83% — 단, 실제 기준은 렌더된 모티프 바운딩박스 ≥468px */
  </style>
</head>
<body>
  <div class="icon">
    <!-- 단순 심볼: 단색 흰색 path 1~2개. viewBox(0~100)의 가장자리(여백 ≤3)까지 path가 닿게 그린다 -->
    <svg class="symbol" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 3 L97 30 V70 L50 97 L3 70 V30 Z" fill="#ffffff"/>
      <path d="M50 33 L71 45 V62 L50 74 L29 62 V45 Z" fill="var(--brand)"/>
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

## 캡처 후 실측 검증 (필수 2단계)

**1) 규격 검증** — 600×600 확인:

```bash
sips -g pixelWidth -g pixelHeight docs/assets/icon.png   # 600 × 600 확인
```

**2) fill-ratio 검증** — 비배경 픽셀(코너 배경색과 다른 픽셀)의 바운딩박스를 측정해 **폭·높이 모두 ≥468px(≥78%)**인지 확인한다. **미달이면 심볼을 키워 재렌더하고 다시 측정한다(통과까지 루프)**:

```js
// node measure-fill.js — PNG 픽셀 스캔으로 모티프 바운딩박스 측정 (npm i pngjs)
const { PNG } = require('pngjs');
const fs = require('fs');
const png = PNG.sync.read(fs.readFileSync('docs/assets/icon.png'));
const { width: W, height: H, data } = png;
const at = (x, y) => data.subarray((y * W + x) * 4, (y * W + x) * 4 + 3);
const bg = at(2, 2); // 코너 = 배경색 (그라데이션 배경이면 네 코너 모두 샘플)
const diff = (p) => Math.abs(p[0]-bg[0]) + Math.abs(p[1]-bg[1]) + Math.abs(p[2]-bg[2]) > 40;
let minX = W, minY = H, maxX = -1, maxY = -1;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
  if (diff(at(x, y))) { minX = Math.min(minX,x); minY = Math.min(minY,y); maxX = Math.max(maxX,x); maxY = Math.max(maxY,y); }
const w = maxX - minX + 1, h = maxY - minY + 1;
console.log(`motif bbox: ${w}x${h} (${(w/W*100).toFixed(1)}% x ${(h/H*100).toFixed(1)}%)`);
console.log(w >= 468 && h >= 468 ? 'PASS (>=468px)' : 'FAIL — 심볼을 키워 재렌더');
```

(pngjs가 없으면 Playwright 캡처 직후 같은 page에서 `page.evaluate`로 canvas에 그려 `getImageData` 스캔해도 된다. 그라데이션 배경은 배경 자체가 코너색과 달라질 수 있으니 diff 임계값을 60~80으로 올리거나 배경 그라데이션 양 끝색 둘 다 배경으로 취급한다.)
