# Playwright 캡처 표준 스니펫

모든 에셋은 Playwright headless 렌더로 캡처하고 sips로 실측 검증한다. 캡처 시 `waitUntil: 'networkidle'`로 dev 서버 응답을 기다리고, `document.fonts.ready`로 폰트 로딩을 기다린다.

## 1. 앱 화면 예시 (636×1048, 실제 화면)

viewport 318×524 + deviceScaleFactor 2 → @2x로 636×1048 PNG 산출. **fullPage 캡처가 아니다**(viewport 영역만 캡처해야 정확히 636×1048이 나온다). 비주얼 QA 페이즈에서 이미 캡처한 스크린샷이 있으면 재활용한다.

```js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 318, height: 524 },
    deviceScaleFactor: 2, // @2x → 636×1048
  });

  const routes = [
    { url: 'http://localhost:5173/',        out: 'docs/assets/screenshot-1.png' },
    { url: 'http://localhost:5173/detail',  out: 'docs/assets/screenshot-2.png' },
    { url: 'http://localhost:5173/profile', out: 'docs/assets/screenshot-3.png' },
  ];

  for (const r of routes) {
    await page.goto(r.url, { waitUntil: 'networkidle' }); // dev 서버 대기
    await page.evaluate(() => document.fonts.ready);       // 폰트 로딩 대기
    await page.screenshot({ path: r.out });                // fullPage 아님 → viewport = 636×1048
  }

  await browser.close();
})();
```

## 2. 아이콘 / 썸네일 (로컬 HTML 파일)

해당 픽셀 viewport로 로컬 HTML 파일을 열어 캡처한다. deviceScaleFactor는 1로 두고 viewport를 목표 픽셀과 동일하게 설정한다.

```js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();

  // 아이콘: 600×600
  const iconPage = await browser.newPage({
    viewport: { width: 600, height: 600 },
    deviceScaleFactor: 1,
  });
  await iconPage.goto('file://' + path.resolve('icon.html'), { waitUntil: 'networkidle' });
  await iconPage.evaluate(() => document.fonts.ready);
  await iconPage.locator('.icon').screenshot({ path: 'docs/assets/icon.png' });

  // 썸네일: 1932×828
  const thumbPage = await browser.newPage({
    viewport: { width: 1932, height: 828 },
    deviceScaleFactor: 1,
  });
  await thumbPage.goto('file://' + path.resolve('thumbnail.html'), { waitUntil: 'networkidle' });
  await thumbPage.evaluate(() => document.fonts.ready);
  await thumbPage.locator('.thumb').screenshot({ path: 'docs/assets/thumbnail.png' });

  await browser.close();
})();
```

## 3. sips 실측 검증

캡처 후 각 PNG의 실제 픽셀 크기를 반드시 확인한다. 규격과 다르면 viewport·deviceScaleFactor를 점검하고 재렌더한다.

```bash
sips -g pixelWidth -g pixelHeight docs/assets/icon.png         # 600 × 600
sips -g pixelWidth -g pixelHeight docs/assets/screenshot-1.png # 636 × 1048
sips -g pixelWidth -g pixelHeight docs/assets/screenshot-2.png # 636 × 1048
sips -g pixelWidth -g pixelHeight docs/assets/screenshot-3.png # 636 × 1048
sips -g pixelWidth -g pixelHeight docs/assets/thumbnail.png    # 1932 × 828
```
