#!/usr/bin/env node
'use strict';
/**
 * ait-console WRITE spike — 에셋(아이콘) 업로드 캡처 + 실제 업로드.
 * App: fixed-cost-keeper (ws 27931 / miniApp 41246).
 *   icon: /Users/hobeen/study/appintoss/fixed-cost-keeper/docs/assets/icon.png (600x600)
 *
 * 목적: 앱 정보(meta) 편집 화면의 아이콘 file input 셀렉터 + 업로드 엔드포인트
 *       (presigned? 직접 POST?) + 발급되는 static.toss.im URL 추출.
 * 발급 URL은 stdout 의 [ICON_URL=...] 한 줄로만 출력(granite 반영용). dom-map엔 패턴만.
 * 저장(저장 버튼)은 누르지 않음 — 업로드로 발급되는 URL 캡처가 목적(메타 저장은 별도 위험).
 */
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/tmp/ait-console-spike/node_modules/playwright')); }

const PROFILE_DIR = '/Users/hobeen/.appintoss-console/profile';
const DUMPS_DIR = '/tmp/ait-console-spike/dumps-write';
const SHOTS_DIR = '/tmp/ait-console-spike/shots-write';
const ORIGIN = 'https://apps-in-toss.toss.im';
const WS = 27931, APP = 41246;
const META_URL = `${ORIGIN}/workspace/${WS}/mini-app/${APP}/meta`;
const ICON_PATH = '/Users/hobeen/study/appintoss/fixed-cost-keeper/docs/assets/icon.png';
const SIGNIN_URL = 'https://business.toss.im/account/sign-in?client_id=4uktpjgqd0cp9txybqzuxc2y6w0cuupb&redirect_uri=https%3A%2F%2Fapps-in-toss.toss.im%2Fsign-up&state=%2Fworkspace';
const SENSITIVE_KEY_RE = /token|secret|password|passwd|auth|cookie|session|credential|signature|otp|pin|code/i;
const SKIP_HOST_RE = /hackle|hotjar|channel\.io|sentry|gstatic|doubleclick|facebook|datadog|amplitude/i;
fs.mkdirSync(DUMPS_DIR, { recursive: true }); fs.mkdirSync(SHOTS_DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function creds() { if (process.env.AIT_CONSOLE_ID && process.env.AIT_CONSOLE_PW) return { id: process.env.AIT_CONSOLE_ID, pw: process.env.AIT_CONSOLE_PW }; try { const c = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '.appintoss', 'credentials.json'), 'utf8')); if (c.id && c.pw) return c; } catch {} return null; }
async function alive(ctx) { try { const r = await ctx.request.get(`${ORIGIN}/console/api-public/v3/appsintossconsole/workspaces`, { failOnStatusCode: false }); const j = await r.json().catch(() => null); return !!(j && j.resultType === 'SUCCESS'); } catch (e) { return false; } }

function maskUrl(raw) { try { const u = new URL(raw); for (const [k] of u.searchParams) if (SENSITIVE_KEY_RE.test(k)) u.searchParams.set(k, '[masked]'); return u.toString(); } catch (e) { return raw; } }
function schema(v, d = 0, k = '') {
  if (v === null) return 'null';
  if (Array.isArray(v)) return d >= 4 ? `array(n=${v.length})` : (v.length ? [`array(n=${v.length})`, schema(v[0], d + 1)] : 'array(empty)');
  const t = typeof v;
  if (t === 'object') { if (d >= 4) return 'object'; const o = {}; for (const kk of Object.keys(v).slice(0, 40)) o[kk] = schema(v[kk], d + 1, kk); return o; }
  if (t === 'string') { if (SENSITIVE_KEY_RE.test(k)) return `string(len=${v.length})[masked]`; return v.length <= 80 ? `string:"${v}"` : `string(len=${v.length}):"${v.slice(0, 40)}…"`; }
  if (t === 'number' || t === 'boolean') return `${t}:${v}`; return t;
}
const netLog = [];
function attachNet(ctx) {
  ctx.on('requestfinished', async (req) => {
    try {
      const url = req.url(), type = req.resourceType();
      if (!['xhr', 'fetch', 'document', 'other'].includes(type)) return;
      const host = new URL(url).host;
      if (SKIP_HOST_RE.test(host)) return;
      const isToss = /toss\.im/.test(host); const isS3 = /amazonaws\.com/.test(host);
      if (!isToss && !isS3) return;
      const h = await req.allHeaders().catch(() => ({}));
      const e = { method: req.method(), url: maskUrl(url), resourceType: type, contentTypeReq: (h['content-type'] || '').split(';')[0], signedHeaders: isS3 ? new URL(url).searchParams.get('X-Amz-SignedHeaders') : undefined };
      const post = req.postData();
      if (post) { try { e.requestBodySchema = schema(JSON.parse(post)); } catch (x) { e.requestBodySchema = /multipart|form-data/i.test(h['content-type'] || '') ? `multipart(len=${post.length})` : `non-json(len=${post.length})`; } }
      const res = await req.response();
      if (res) { e.status = res.status(); const ct = ((await res.allHeaders().catch(() => ({})))['content-type'] || '').split(';')[0]; if (/json/.test(ct)) { const b = await res.body().catch(() => null); if (b && b.length < 200 * 1024) { try { e.responseBodySchema = schema(JSON.parse(b.toString('utf8'))); const j = JSON.parse(b.toString('utf8')); const flat = JSON.stringify(j); const m = flat.match(/https:\/\/static\.toss\.im\/[^"\\]+\.(png|jpg|jpeg|webp)/i); if (m) e.issuedStaticUrl = m[0]; } catch {} } } }
      netLog.push(e);
    } catch {}
  });
}

async function dump(page, name) {
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  for (let i = 0; i < 8; i++) { const len = await page.evaluate(() => document.body ? document.body.innerText.trim().length : 0).catch(() => 0); if (len > 50 && !/잠시만 기다려주세요/.test(await page.evaluate(() => document.body ? document.body.innerText : '').catch(() => ''))) break; await sleep(1500); }
  await sleep(1500);
  const info = await page.evaluate(() => {
    const attr = (el, ns) => { const o = {}; for (const n of ns) { const v = el.getAttribute(n); if (v != null) o[n] = v; } return o; };
    const desc = (el) => ({ tag: el.tagName.toLowerCase(), text: (el.innerText || '').trim().slice(0, 80), ...attr(el, ['id', 'name', 'type', 'placeholder', 'aria-label', 'role', 'data-testid', 'accept', 'class']) });
    const q = (s) => Array.from(document.querySelectorAll(s)).map(desc);
    return { url: location.href, bodyTextHead: document.body ? document.body.innerText.slice(0, 2500) : '', buttons: q('button,[role=button]'), fileInputs: q('input[type=file]'), images: Array.from(document.querySelectorAll('img')).slice(0, 20).map((i) => i.src).filter((s) => /static\.toss|appsintoss/.test(s)) };
  }).catch((e) => ({ error: String(e) }));
  fs.writeFileSync(path.join(DUMPS_DIR, `${name}.json`), JSON.stringify(info, null, 2));
  await page.screenshot({ path: path.join(SHOTS_DIR, `${name}.png`), fullPage: true }).catch(() => {});
  console.log(`[dump] ${name}: btn=${(info.buttons || []).length} file=${(info.fileInputs || []).length}`);
  return info;
}

(async () => {
  if (!fs.existsSync(ICON_PATH)) { console.error('[fatal] icon 없음', ICON_PATH); process.exit(2); }
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1440, height: 1300 } });
  attachNet(ctx);
  const page = ctx.pages()[0] || (await ctx.newPage());
  await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(1500);
  if (!(await alive(ctx))) {
    await page.goto(SIGNIN_URL, { waitUntil: 'domcontentloaded' }).catch(() => {}); await sleep(2500);
    const pw = page.locator('input[type=password]').first();
    if (await pw.count()) { const c = creds(); await page.locator('input:not([type=password]):not([type=checkbox]):not([type=hidden])').first().fill(c.id); await pw.fill(c.pw); await page.locator('button[type=submit]').first().click(); for (let i = 0; i < 40; i++) { await sleep(3000); const u = page.url(); if (/apps-in-toss/.test(u) && !/sign-in|sign-up/.test(u) && u !== `${ORIGIN}/`) break; if (u === `${ORIGIN}/` || /sign-up/.test(u)) await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded' }).catch(() => {}); } }
  }

  await page.goto(META_URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  const meta = await dump(page, '60-meta-view');
  console.log('[meta] body head:', (meta.bodyTextHead || '').slice(0, 200).replace(/\n+/g, ' / '));

  // enter edit mode if needed (아이콘 변경/편집 버튼)
  for (const t of ['편집', '수정', '아이콘 변경', '기본 정보 수정', '앱 정보 수정']) {
    const loc = page.getByRole('button', { name: t }).first();
    if (await loc.count().catch(() => 0)) { await loc.click({ timeout: 5000 }).catch(() => {}); await sleep(2500); console.log(`[edit] "${t}" 진입`); break; }
  }
  const edit = await dump(page, '61-meta-edit');
  console.log('[edit] fileInputs:', JSON.stringify(edit.fileInputs));

  // upload icon to the first image file input (accept image)
  let setOk = false;
  const fileInputs = page.locator('input[type=file]');
  const nfi = await fileInputs.count().catch(() => 0);
  console.log(`[icon] file inputs on page: ${nfi}`);
  for (let i = 0; i < nfi; i++) {
    const accept = await fileInputs.nth(i).getAttribute('accept').catch(() => '');
    if (accept && !/image|png|jpg|jpeg|\*/i.test(accept)) continue;
    await fileInputs.nth(i).setInputFiles(ICON_PATH).catch((e) => console.log('[set-err]', e.message));
    console.log(`[icon] setInputFiles on input[${i}] accept=${accept}`);
    setOk = true;
    await sleep(8000);
    break;
  }
  await dump(page, '62-after-icon-set');

  // collect issued static URL from network
  await sleep(3000);
  const issued = netLog.filter((e) => e.issuedStaticUrl).map((e) => e.issuedStaticUrl);
  const s3puts = netLog.filter((e) => e.method === 'PUT' && /amazonaws/.test(e.url));
  const uploadApis = netLog.filter((e) => e.method !== 'GET' && /toss\.im\/console/.test(new URL(e.url).host + new URL(e.url).pathname) && /asset|image|icon|upload|file|media|resource/i.test(e.url));
  fs.writeFileSync(path.join(DUMPS_DIR, 'asset-upload-net.json'), JSON.stringify({ issued, s3puts: s3puts.map((e) => ({ contentType: e.contentTypeReq, signedHeaders: e.signedHeaders, status: e.status })), uploadApis: uploadApis.map((e) => ({ method: e.method, path: new URL(e.url).pathname, status: e.status, reqCT: e.contentTypeReq, reqBody: e.requestBodySchema, res: e.responseBodySchema })) }, null, 2));
  console.log('[asset] uploadApis:', JSON.stringify(uploadApis.map((e) => e.method + ' ' + new URL(e.url).pathname + ' -> ' + e.status)));
  console.log('[asset] s3 PUTs:', JSON.stringify(s3puts.map((e) => ({ ct: e.contentTypeReq, status: e.status }))));
  if (issued.length) console.log('[ICON_URL=' + issued[issued.length - 1] + ']');
  else console.log('[icon] 발급 static URL 미캡처 — 62 dump의 images 확인');

  fs.writeFileSync(path.join(DUMPS_DIR, 'asset-upload-net-full.json'), JSON.stringify(netLog.filter((e) => e.method !== 'GET' || e.issuedStaticUrl), null, 2));
  await ctx.close();
  console.log('[done] asset-upload spike 완료 (저장 버튼 미클릭)');
})().catch((e) => { console.error('[fatal]', e.message); process.exit(1); });
