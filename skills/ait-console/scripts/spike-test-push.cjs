#!/usr/bin/env node
'use strict';
/**
 * ait-console WRITE spike — STEP 2: 테스트 발송 ("푸시로 보내기") 실제 수행 + 캡처.
 * App: today-lucky-draw (ws 27931 / miniApp 41019), version 20260611-1 (CREATED, isTested=false).
 *
 * 사용자 본인이 전체 자율 권한 부여 → 실제 테스트 푸시를 발송하며 API/DOM 캡처.
 * 캡처: 테스트 버튼 클릭 흐름, "푸시로 보내기" 발송 API(method+URL+req/res), isTested 전환.
 *
 * 이 스크립트는 검토 요청 제출/출시는 하지 않음(다음 단계 스크립트에서).
 * Tokens/cookies/credentials never printed.
 */
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/tmp/ait-console-spike/node_modules/playwright')); }

const PROFILE_DIR = '/Users/hobeen/.appintoss-console/profile';
const SHOTS_DIR = '/tmp/ait-console-spike/shots-write';
const DUMPS_DIR = '/tmp/ait-console-spike/dumps-write';
const ORIGIN = 'https://apps-in-toss.toss.im';
const WS = 27931, APP = 41019;
const APP_BUILD = `${ORIGIN}/workspace/${WS}/mini-app/${APP}/app-build`;
const BUNDLES = `${ORIGIN}/console/api-public/v3/appsintossconsole/workspaces/${WS}/mini-app/${APP}/bundles`;
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

const SENSITIVE_KEY_RE = /token|secret|password|passwd|auth|cookie|session|credential|signature|otp|pin|code/i;
const SKIP_URL_RE = /\.(png|jpe?g|gif|svg|woff2?|ttf|otf|css|ico|mp4|webp|js|map)(\?|$)/i;
const SKIP_HOST_RE = /hackle|hotjar|channel\.io|sentry|gstatic|doubleclick|facebook|datadog|amplitude/i;
fs.mkdirSync(SHOTS_DIR, { recursive: true }); fs.mkdirSync(DUMPS_DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function maskUrl(raw) { try { const u = new URL(raw); for (const [k] of u.searchParams) if (SENSITIVE_KEY_RE.test(k)) u.searchParams.set(k, '[masked]'); return u.toString(); } catch { return raw; } }
function looksTok(s) { return typeof s === 'string' && s.length > 24 && /^[A-Za-z0-9_\-./+=]+$/.test(s); }
function schema(v, d = 0, k = '') {
  if (v === null) return 'null';
  if (Array.isArray(v)) return d >= 4 ? `array(n=${v.length})` : (v.length ? [`array(n=${v.length})`, schema(v[0], d + 1)] : 'array(empty)');
  const t = typeof v;
  if (t === 'object') { if (d >= 4) return 'object'; const o = {}; for (const kk of Object.keys(v).slice(0, 40)) o[kk] = schema(v[kk], d + 1, kk); return o; }
  if (t === 'string') { if (SENSITIVE_KEY_RE.test(k) || looksTok(v)) return `string(len=${v.length})[masked]`; return v.length <= 60 ? `string:"${v}"` : `string(len=${v.length}):"${v.slice(0, 30)}…"`; }
  if (t === 'number' || t === 'boolean') return `${t}:${v}`; return t;
}
const netLog = []; let pageName = 'pre';
function attachNet(ctx) {
  ctx.on('requestfinished', async (req) => {
    try {
      const url = req.url(), type = req.resourceType();
      if (!['xhr', 'fetch', 'document', 'other'].includes(type)) return;
      if (SKIP_URL_RE.test(url)) return;
      const host = new URL(url).host;
      if (SKIP_HOST_RE.test(host) || !/toss\.im/.test(host)) return;
      const h = await req.allHeaders().catch(() => ({}));
      const e = { page: pageName, method: req.method(), url: maskUrl(url), resourceType: type, kind: ['GET', 'HEAD', 'OPTIONS'].includes(req.method()) ? 'read' : 'write', contentTypeReq: (h['content-type'] || '').split(';')[0], auth: { authorizationHeader: !!h['authorization'], cookieHeader: !!h['cookie'], hasTBIZAUTH: h['cookie'] ? /(^|;\s*)TBIZAUTH=/.test(h['cookie']) : false } };
      const post = req.postData();
      if (post) { try { e.requestBodySchema = schema(JSON.parse(post)); } catch { e.requestBodySchema = /multipart|form-data/i.test(h['content-type'] || '') ? `multipart(len=${post.length})` : `non-json(len=${post.length})`; } }
      const res = await req.response();
      if (res) { e.status = res.status(); const ct = ((await res.allHeaders().catch(() => ({})))['content-type'] || '').split(';')[0]; e.contentType = ct; if (/json/.test(ct)) { const b = await res.body().catch(() => null); if (b && b.length < 300 * 1024) { try { e.responseBodySchema = schema(JSON.parse(b.toString('utf8'))); } catch {} } } }
      netLog.push(e);
    } catch {}
  });
}
function flushNet(tag) { const f = path.join(DUMPS_DIR, `netlog-${tag}.json`); fs.writeFileSync(f, JSON.stringify(netLog, null, 2)); console.log(`[net] ${netLog.length} -> ${f}`); }

async function dump(page, name) {
  pageName = name;
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  for (let i = 0; i < 8; i++) { const len = await page.evaluate(() => document.body ? document.body.innerText.trim().length : 0).catch(() => 0); if (len > 50) break; await sleep(1500); }
  await sleep(1500);
  const info = await page.evaluate(() => {
    const attr = (el, ns) => { const o = {}; for (const n of ns) { const v = el.getAttribute(n); if (v != null) o[n] = v; } return o; };
    const desc = (el) => ({ tag: el.tagName.toLowerCase(), text: (el.innerText || el.value || '').trim().slice(0, 120), disabled: el.disabled === true || el.getAttribute('aria-disabled') === 'true' || el.getAttribute('disabled') != null, ...attr(el, ['id', 'name', 'type', 'placeholder', 'aria-label', 'role', 'href', 'data-testid', 'accept', 'maxlength', 'contenteditable', 'class']) });
    const q = (s) => Array.from(document.querySelectorAll(s)).map(desc);
    return { url: location.href, title: document.title, bodyTextHead: document.body ? document.body.innerText.slice(0, 4000) : '', buttons: q('button,[role=button]'), inputs: q('input').map((i) => i.type === 'password' ? { ...i, text: '[masked]' } : i), fileInputs: q('input[type=file]'), textareas: q('textarea'), editables: q('[contenteditable=true]'), dialogs: q('[role=dialog],[role=alertdialog]').map((d) => ({ ...d, text: (d.text || '').slice(0, 600) })) };
  }).catch((e) => ({ error: String(e), url: page.url() }));
  fs.writeFileSync(path.join(DUMPS_DIR, `${name}.json`), JSON.stringify(info, null, 2));
  await page.screenshot({ path: path.join(SHOTS_DIR, `${name}.png`), fullPage: true }).catch(() => {});
  console.log(`[dump] ${name}: btn=${(info.buttons || []).length} ta=${(info.textareas || []).length} dlg=${(info.dialogs || []).length}`);
  return info;
}

const ID_SELECTORS = ['input[type=email]', 'input[name*="id" i]', 'input[name*="email" i]', 'input[placeholder*="이메일"]', 'input[placeholder*="ID" i]'];
function isLoggedIn(u) { return u.startsWith('https://apps-in-toss.toss.im') && !/sign-in|sign-up/.test(u) && u !== `${ORIGIN}/`; }
function creds() { if (process.env.AIT_CONSOLE_ID && process.env.AIT_CONSOLE_PW) return { id: process.env.AIT_CONSOLE_ID, pw: process.env.AIT_CONSOLE_PW }; try { const c = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '.appintoss', 'credentials.json'), 'utf8')); if (c.id && c.pw) return c; } catch { /* no file */ } return null; }
async function login(page) {
  const pw = page.locator('input[type=password]').first();
  if (!(await pw.count())) return;
  const c = creds(); if (!c) { console.error('[login] 자격증명 없음'); return; }
  console.error('[login] 세션 만료 — 자동 로그인');
  let ok = false;
  for (const s of ID_SELECTORS) { const f = page.locator(s).first(); if (await f.count()) { await f.fill(c.id).catch(() => {}); if ((await f.inputValue().catch(() => '')) === c.id) { ok = true; break; } } }
  if (!ok) { const f = page.locator('input:not([type=password]):not([type=checkbox]):not([type=hidden])').first(); if (await f.count()) await f.fill(c.id).catch(() => {}); }
  await pw.fill(c.pw).catch(() => {});
  const sb = page.locator('button[type=submit]').first();
  if (await sb.count()) await sb.click().catch(() => {}); else await pw.press('Enter').catch(() => {});
  const start = Date.now();
  while (Date.now() - start < LOGIN_TIMEOUT_MS) { if (isLoggedIn(page.url())) return; if (page.url() === `${ORIGIN}/` || /sign-up/.test(page.url())) { await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded' }).catch(() => {}); await sleep(3000); if (isLoggedIn(page.url())) return; } await sleep(3000); }
}
async function readBundles(ctx) { const r = await ctx.request.get(BUNDLES, { failOnStatusCode: false }).catch(() => null); if (!r) return null; const j = await r.json().catch(() => null); if (!j || j.resultType !== 'SUCCESS') return { error: j ? j.resultType : 'no-json' }; const list = (j.success && j.success.contents) || []; return list.map((v) => ({ versionName: v.versionName, reviewStatus: v.reviewStatus, isTested: v.isTested, deployed: v.deployed, sdkVersion: v.sdkVersion })); }

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1440, height: 1200 } });
  attachNet(ctx);
  const page = ctx.pages()[0] || (await ctx.newPage());
  await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(1500);
  if (!isLoggedIn(page.url())) await login(page);

  console.log('[bundles:before]', JSON.stringify(await readBundles(ctx)));

  await page.goto(APP_BUILD, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await dump(page, '30c-build-before-test');

  // click "테스트"
  const testBtn = page.getByRole('button', { name: '테스트' }).first();
  if (!(await testBtn.count().catch(() => 0))) { console.log('[test] 테스트 버튼 미발견'); flushNet('test-push'); await ctx.close(); return; }
  await testBtn.click({ timeout: 6000 }).catch((e) => console.log('[test-err]', e.message));
  await sleep(3500);
  const afterTest = await dump(page, '31c-after-test-click');
  console.log('[test] 클릭 후 dialog/buttons:', JSON.stringify((afterTest.dialogs || []).map((d) => (d.text || '').slice(0, 120))));
  console.log('[test] 버튼:', (afterTest.buttons || []).map((b) => (b.text || '').split('\n')[0]).filter(Boolean).slice(0, 25).join(' | '));

  // find "푸시로 보내기" (may be in a dialog / new view) and CLICK for real
  let pushClicked = false;
  for (const label of ['푸시로 보내기', '푸시 보내기', '테스트 푸시', '내 기기로 보내기', '보내기']) {
    const loc = page.getByText(label, { exact: false }).first();
    if (await loc.count().catch(() => 0)) {
      console.log(`[push] "${label}" 발견 — 실제 클릭(승인됨)`);
      await loc.scrollIntoViewIfNeeded().catch(() => {});
      await loc.click({ timeout: 6000 }).catch((e) => console.log('[push-err]', e.message));
      await sleep(4000);
      pushClicked = true;
      await dump(page, '32c-after-push-click');
      // confirm dialog?
      const dlg = await page.$$eval('[role=dialog],[role=alertdialog]', (els) => els.map((e) => (e.innerText || '').slice(0, 300))).catch(() => []);
      if (dlg.length) { console.log('[push] 확인 다이얼로그:', JSON.stringify(dlg).slice(0, 300)); for (const t of ['보내기', '확인', '발송', '푸시 보내기']) { const c = page.getByRole('button', { name: t }).first(); if (await c.count().catch(() => 0)) { const dis = await c.evaluate((b) => b.disabled === true || b.getAttribute('aria-disabled') === 'true').catch(() => true); if (!dis) { await c.click({ timeout: 5000 }).catch(() => {}); console.log(`[push] 확인 버튼 "${t}" 클릭`); await sleep(4000); await dump(page, '33c-after-push-confirm'); break; } } } }
      break;
    }
  }
  if (!pushClicked) console.log('[push] "푸시로 보내기" 류 버튼 미발견 — 31c dump로 흐름 분석 필요');

  // poll isTested transition
  let tested = false;
  for (let i = 0; i < 8; i++) { const b = await readBundles(ctx); const v = Array.isArray(b) ? b.find((x) => x.versionName === '20260611-1') : null; console.log(`[poll ${i}] isTested=${v && v.isTested} review=${v && v.reviewStatus}`); if (v && v.isTested) { tested = true; break; } await sleep(5000); }
  console.log('[bundles:after]', JSON.stringify(await readBundles(ctx)));
  fs.writeFileSync(path.join(DUMPS_DIR, 'test-push-result.json'), JSON.stringify({ pushClicked, isTested: tested }, null, 2));

  flushNet('test-push');
  await ctx.close();
  console.log('[done] test-push spike 완료');
})().catch((e) => { console.error('[fatal]', e.message); flushNet('test-push'); process.exit(1); });
