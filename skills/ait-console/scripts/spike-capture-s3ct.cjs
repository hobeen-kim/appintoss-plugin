#!/usr/bin/env node
'use strict';
/**
 * DOM 업로드를 수행하면서 S3 presigned PUT의 실제 Content-Type을 캡처한다.
 * (콘솔이 .ait에 어떤 content-type으로 서명·전송하는지 확정 → API 업로드의 SignatureDoesNotMatch 해결)
 * App: fixed-cost-keeper (ws 27931 / miniApp 41246).
 */
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/tmp/ait-console-spike/node_modules/playwright')); }

const PROFILE_DIR = '/Users/hobeen/.appintoss-console/profile';
const DUMPS_DIR = '/tmp/ait-console-spike/dumps-write';
const ORIGIN = 'https://apps-in-toss.toss.im';
const WS = 27931, APP = 41246;
const APP_BUILD = `${ORIGIN}/workspace/${WS}/mini-app/${APP}/app-build`;
const AIT_PATH = '/Users/hobeen/study/appintoss/fixed-cost-keeper/app/fixed-cost-keeper.ait';
const SIGNIN_URL = 'https://business.toss.im/account/sign-in?client_id=4uktpjgqd0cp9txybqzuxc2y6w0cuupb&redirect_uri=https%3A%2F%2Fapps-in-toss.toss.im%2Fsign-up&state=%2Fworkspace';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function creds() { if (process.env.AIT_CONSOLE_ID && process.env.AIT_CONSOLE_PW) return { id: process.env.AIT_CONSOLE_ID, pw: process.env.AIT_CONSOLE_PW }; try { const c = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '.appintoss', 'credentials.json'), 'utf8')); if (c.id && c.pw) return c; } catch {} return null; }
async function alive(ctx) { try { const r = await ctx.request.get(`${ORIGIN}/console/api-public/v3/appsintossconsole/workspaces`, { failOnStatusCode: false }); const j = await r.json().catch(() => null); return !!(j && j.resultType === 'SUCCESS'); } catch (e) { return false; } }

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true });
  const page = ctx.pages()[0] || (await ctx.newPage());

  // capture S3 PUT request headers (the signed Content-Type) — value of file irrelevant, header only
  const s3puts = [];
  page.on('request', (req) => {
    try { if (req.method() === 'PUT' && /amazonaws\.com/.test(req.url())) { const h = req.headers(); s3puts.push({ host: new URL(req.url()).host, contentType: h['content-type'] || '(none)', signedHeaders: new URL(req.url()).searchParams.get('X-Amz-SignedHeaders') }); } } catch {}
  });

  await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(1500);
  if (!(await alive(ctx))) {
    await page.goto(SIGNIN_URL, { waitUntil: 'domcontentloaded' }).catch(() => {}); await sleep(2500);
    const pw = page.locator('input[type=password]').first();
    if (await pw.count()) { const c = creds(); await page.locator('input:not([type=password]):not([type=checkbox]):not([type=hidden])').first().fill(c.id); await pw.fill(c.pw); await page.locator('button[type=submit]').first().click(); for (let i = 0; i < 40; i++) { await sleep(3000); const u = page.url(); if (/apps-in-toss/.test(u) && !/sign-in|sign-up/.test(u) && u !== `${ORIGIN}/`) break; if (u === `${ORIGIN}/` || /sign-up/.test(u)) await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded' }).catch(() => {}); } }
  }

  await page.goto(APP_BUILD, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  for (let i = 0; i < 15; i++) { const t = await page.evaluate(() => document.body ? document.body.innerText : '').catch(() => ''); if (t && !/잠시만 기다려주세요/.test(t)) break; await sleep(2000); }

  // open register form
  for (const label of ['+ 등록하기', '등록하기', '버전 등록', '첫 버전']) {
    const loc = page.getByText(label, { exact: false }).first();
    if (await loc.count().catch(() => 0)) { await loc.click({ timeout: 6000 }).catch(() => {}); await sleep(3000); if (await page.$('input[type=file]')) break; }
  }
  const fi = page.locator('input[type=file]').first();
  if (!(await fi.count().catch(() => 0))) { console.log('[fatal] file input 미발견'); await ctx.close(); process.exit(1); }
  await fi.setInputFiles(AIT_PATH).catch((e) => console.log('[set-err]', e.message));
  await sleep(6000);
  // click 등록 to start upload (this triggers initialize + S3 PUT + complete)
  for (const label of ['등록', '업로드', '확인']) { const loc = page.getByRole('button', { name: label }).first(); if (await loc.count().catch(() => 0)) { const dis = await loc.evaluate((b) => b.disabled === true || b.getAttribute('aria-disabled') === 'true').catch(() => true); if (!dis) { await loc.click({ timeout: 6000 }).catch(() => {}); console.log(`[upload] "${label}" 클릭`); break; } } }
  await sleep(15000);

  console.log('[S3 PUT captured]', JSON.stringify(s3puts));
  fs.writeFileSync(path.join(DUMPS_DIR, 's3-put-headers.json'), JSON.stringify(s3puts, null, 2));
  await ctx.close();
  console.log('[done] s3ct capture 완료');
})().catch((e) => { console.error('[fatal]', e.message); process.exit(1); });
