#!/usr/bin/env node
'use strict';
/**
 * render-flow — 화면 흐름도 HTML을 단일 PNG로 렌더한다.
 *
 * 표준: skills/ait-submit/references/screen-flow-guide.md
 * 흐름도는 `@page{size}` 커스텀 단일 캔버스라 A4 페이징이 없다 —
 * `.page` 요소의 실제 크기를 재서 그 크기 그대로 캡처한다.
 *
 * 사용:
 *   node render-flow.cjs <flow.html> [--out <out.png>] [--scale 2] [--pdf]
 *
 * 기본 출력: 입력 html과 같은 폴더의 동명 .png
 * 이미지(../qa-screens/*.png) 상대경로 로딩을 위해 file:// URL로 연다.
 */
const fs = require('fs');
const path = require('path');

const { execFileSync } = require('child_process');

/** playwright 해결: 로컬 → 전역 npm root → 콘솔 스파이크 캐시 순. 없으면 null (Chrome 폴백). */
function loadChromium() {
  const tries = ['playwright'];
  try { tries.push(require('path').join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'playwright')); } catch {}
  tries.push('/tmp/ait-console-spike/node_modules/playwright');
  for (const t of tries) {
    try { return require(t).chromium; } catch {}
  }
  return null;
}

/** Chrome headless 폴백 — playwright가 없을 때 스크린샷만 뽑는다(경고 진단은 생략). */
const CHROME_PATHS = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter(Boolean);

function renderWithChrome(htmlPath, outPath, scale) {
  const bin = CHROME_PATHS.find((p) => fs.existsSync(p));
  if (!bin) return false;
  // .page 크기를 소스에서 추출 (없으면 @page size)
  const src = fs.readFileSync(htmlPath, 'utf8');
  const m = src.match(/\.page\s*\{[^}]*?width:\s*(\d+)px[^}]*?height:\s*(\d+)px/s)
        || src.match(/@page\s*\{\s*size:\s*(\d+)px\s+(\d+)px/);
  if (!m) { console.error('[fatal] .page 크기를 찾지 못했다 — 골격의 `.page{width:..px;height:..px}` 확인'); return false; }
  const [w, h] = [Number(m[1]), Number(m[2])];
  execFileSync(bin, ['--headless', '--disable-gpu', '--hide-scrollbars',
    `--force-device-scale-factor=${scale}`, `--window-size=${w},${h}`,
    `--screenshot=${outPath}`, 'file://' + htmlPath], { stdio: 'ignore' });
  console.log(`[ok] PNG ${outPath} (${w}×${h} @${scale}x, Chrome headless 폴백 — 결손 진단은 생략됨)`);
  return true;
}

const chromium = loadChromium();

function parseArgs(argv) {
  const a = { scale: 2, pdf: false };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--out') a.out = argv[++i];
    else if (v === '--scale') a.scale = Number(argv[++i]) || 2;
    else if (v === '--pdf') a.pdf = true;
    else rest.push(v);
  }
  a.html = rest[0];
  return a;
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  if (!args.html) {
    console.error('사용법: node render-flow.cjs <flow.html> [--out <out.png>] [--scale 2] [--pdf]');
    process.exit(2);
  }
  const htmlPath = path.resolve(args.html);
  if (!fs.existsSync(htmlPath)) { console.error('[fatal] 파일 없음:', htmlPath); process.exit(1); }
  const outPath = path.resolve(args.out || htmlPath.replace(/\.html?$/i, '') + '.png');

  if (!chromium) {
    if (renderWithChrome(htmlPath, outPath, args.scale)) process.exit(0);
    console.error('[fatal] playwright·Chrome 모두 사용 불가 — `npm i -D playwright && npx playwright install chromium`');
    process.exit(2);
  }

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: args.scale, viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // 로딩 실패 추적 — 빈 프레임으로 렌더되는 사고를 막는다
  const failed = [];
  page.on('requestfailed', (r) => { if (/\.(png|jpe?g|webp|svg|woff2?)$/i.test(r.url())) failed.push(r.url()); });

  await page.goto('file://' + htmlPath, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});

  // .page 실측 크기 (없으면 body scroll 크기)
  const box = await page.evaluate(() => {
    const el = document.querySelector('.page');
    const r = (el || document.body).getBoundingClientRect();
    // .page가 있으면 그 크기가 캔버스 크기다 — body scrollHeight(=viewport 하한)를 섞지 않는다
    const w = el ? Math.ceil(r.width) : Math.ceil(document.body.scrollWidth);
    const h = el ? Math.ceil(Math.max(r.height, el.scrollHeight)) : Math.ceil(document.body.scrollHeight);
    return {
      w, h,
      hasPage: !!document.querySelector('.page'),
      frames: document.querySelectorAll('.frame').length,
      emptyFrames: Array.from(document.querySelectorAll('.frame'))
        .filter((f) => !f.querySelector('img') && f.children.length === 0).length,
      brokenImgs: Array.from(document.images).filter((i) => !i.complete || i.naturalWidth === 0).length,
    };
  });

  if (!box.hasPage) console.warn('[warn] .page 요소가 없다 — body 기준으로 캡처한다 (골격 이탈 여부 확인 필요)');
  if (box.frames === 0) console.warn('[warn] .frame 이 0개다 — 화면 슬롯이 비었는지 확인');
  if (box.emptyFrames > 0) console.warn(`[warn] 내용이 비어 있는 .frame ${box.emptyFrames}개 — 실촬 img 또는 목업 마크업 누락`);
  if (box.brokenImgs > 0) console.warn(`[warn] 로드 실패 이미지 ${box.brokenImgs}개 — qa-screens 상대경로 확인`);
  for (const u of failed.slice(0, 5)) console.warn('        실패:', u);

  await page.setViewportSize({ width: box.w, height: box.h });
  const target = (await page.$('.page')) || page;
  await target.screenshot({ path: outPath });
  console.log(`[ok] PNG ${outPath} (${box.w}×${box.h} @${args.scale}x, 화면 ${box.frames}개)`);

  if (args.pdf) {
    const pdfPath = outPath.replace(/\.png$/i, '.pdf');
    await page.pdf({ path: pdfPath, width: `${box.w}px`, height: `${box.h}px`, printBackground: true, pageRanges: '1' });
    console.log('[ok] PDF', pdfPath);
  }

  await browser.close();
  const problems = box.emptyFrames + box.brokenImgs;
  process.exit(problems > 0 ? 3 : 0);   // 3 = 렌더는 됐으나 내용 결손 있음
})().catch((e) => { console.error('[fatal]', e.message); process.exit(1); });
