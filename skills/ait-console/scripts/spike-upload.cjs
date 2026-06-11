#!/usr/bin/env node
'use strict';
/**
 * ait-console WRITE spike — STEP: version upload + downstream form capture.
 * App: today-lucky-draw (ws 27931 / miniApp 41019), currently 0 versions.
 *
 * PERFORMS (reversible / non-trigger):
 *   - upload /Users/hobeen/Downloads/today-lucky-draw.ait via the version-register form
 *   - capture the created versionName via the bundles API readback
 *   - capture downstream button states (테스트 / 푸시로 보내기 / 검토 요청 / 출시하기)
 *   - open the 검토 요청 note form and capture its DOM (textarea + submit selector)
 *
 * HARD-BLOCKED in code (NOT executed — irreversible / external trigger):
 *   - actual push send ("푸시로 보내기" confirm)
 *   - 검토 요청 FINAL submit (triggers Toss review)
 *   - "출시하기" (release) click
 * These require explicit end-user confirmation; this script only captures their DOM/API.
 *
 * Usage: AIT_CONSOLE_ID=.. AIT_CONSOLE_PW=.. node spike-upload.cjs
 */
const fs = require('fs');
const path = require('path');

let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/tmp/ait-console-spike/node_modules/playwright')); }

const PROFILE_DIR = '/Users/hobeen/.appintoss-console/profile';
const SHOTS_DIR = '/tmp/ait-console-spike/shots-write';
const DUMPS_DIR = '/tmp/ait-console-spike/dumps-write';
const ORIGIN = 'https://apps-in-toss.toss.im';
const WS = 27931;
const APP = 41019;
const APP_BUILD = `${ORIGIN}/workspace/${WS}/mini-app/${APP}/app-build`;
const AIT_PATH = '/Users/hobeen/Downloads/today-lucky-draw.ait';
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

const SENSITIVE_KEY_RE = /token|secret|password|passwd|auth|cookie|session|credential|signature|otp|pin|code/i;
const SKIP_URL_RE = /\.(png|jpe?g|gif|svg|woff2?|ttf|otf|css|ico|mp4|webp|js|map)(\?|$)/i;
const SKIP_HOST_RE = /hackle|hotjar|channel\.io|sentry|google|gstatic|doubleclick|facebook|datadog|amplitude/i;

fs.mkdirSync(SHOTS_DIR, { recursive: true });
fs.mkdirSync(DUMPS_DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------ masking + schema (same conventions as spike-write.cjs) ------
function maskUrl(raw) { try { const u = new URL(raw); for (const [k] of u.searchParams) if (SENSITIVE_KEY_RE.test(k)) u.searchParams.set(k, '[masked]'); return u.toString(); } catch { return raw; } }
function looksTok(s) { return typeof s === 'string' && s.length > 24 && /^[A-Za-z0-9_\-./+=]+$/.test(s); }
function schema(v, d = 0, k = '') {
  if (v === null) return 'null';
  if (Array.isArray(v)) return d >= 4 ? `array(n=${v.length})` : (v.length ? [`array(n=${v.length})`, schema(v[0], d + 1)] : 'array(empty)');
  const t = typeof v;
  if (t === 'object') { if (d >= 4) return 'object'; const o = {}; for (const kk of Object.keys(v).slice(0, 40)) o[kk] = schema(v[kk], d + 1, kk); return o; }
  if (t === 'string') { if (SENSITIVE_KEY_RE.test(k) || looksTok(v)) return `string(len=${v.length})[masked]`; return v.length <= 48 ? `string:"${v}"` : `string(len=${v.length}):"${v.slice(0, 28)}…"`; }
  if (t === 'number' || t === 'boolean') return `${t}:${v}`;
  return t;
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
      if (post) { try { e.requestBodySchema = schema(JSON.parse(post)); } catch { e.requestBodySchema = /multipart|form-data/i.test(h['content-type'] || '') ? `multipart/form-data(len=${post.length})` : `non-json(len=${post.length})`; } }
      const res = await req.response();
      if (res) { e.status = res.status(); const ct = ((await res.allHeaders().catch(() => ({})))['content-type'] || '').split(';')[0]; e.contentType = ct; if (/json/.test(ct)) { const b = await res.body().catch(() => null); if (b && b.length < 300 * 1024) { try { e.responseBodySchema = schema(JSON.parse(b.toString('utf8'))); } catch {} } } }
      netLog.push(e);
    } catch {}
  });
}
function flushNet() { fs.writeFileSync(path.join(DUMPS_DIR, 'netlog-upload.json'), JSON.stringify(netLog, null, 2)); const api = netLog.filter((e) => ['xhr', 'fetch'].includes(e.resourceType)); console.log(`[net] ${netLog.length} (${api.length} xhr/fetch) -> dumps-write/netlog-upload.json`); }

async function dump(page, name) {
  pageName = name;
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  for (let i = 0; i < 8; i++) { const len = await page.evaluate(() => document.body ? document.body.innerText.trim().length : 0).catch(() => 0); if (len > 50) break; await sleep(1500); }
  await sleep(1500);
  const info = await page.evaluate(() => {
    const attr = (el, ns) => { const o = {}; for (const n of ns) { const v = el.getAttribute(n); if (v != null) o[n] = v; } return o; };
    const desc = (el) => ({ tag: el.tagName.toLowerCase(), text: (el.innerText || el.value || '').trim().slice(0, 100), disabled: el.disabled === true || el.getAttribute('aria-disabled') === 'true' || el.getAttribute('disabled') != null, ...attr(el, ['id', 'name', 'type', 'placeholder', 'aria-label', 'aria-disabled', 'role', 'href', 'data-testid', 'accept', 'multiple', 'maxlength', 'contenteditable', 'class']) });
    const q = (s) => Array.from(document.querySelectorAll(s)).map(desc);
    return { url: location.href, title: document.title, bodyTextHead: document.body ? document.body.innerText.slice(0, 4000) : '', buttons: q('button,[role=button]'), inputs: q('input').map((i) => i.type === 'password' ? { ...i, text: '[masked]' } : i), fileInputs: q('input[type=file]'), textareas: q('textarea'), editables: q('[contenteditable=true]'), selects: q('select,[role=combobox],[role=switch]'), dialogs: q('[role=dialog],[role=alertdialog]').map((d) => ({ ...d, text: (d.text || '').slice(0, 400) })) };
  }).catch((e) => ({ error: String(e), url: page.url() }));
  fs.writeFileSync(path.join(DUMPS_DIR, `${name}.json`), JSON.stringify(info, null, 2));
  await page.evaluate(() => document.querySelectorAll('input[type=password]').forEach((i) => { i.value = '••••'; })).catch(() => {});
  await page.screenshot({ path: path.join(SHOTS_DIR, `${name}.png`), fullPage: true }).catch(() => {});
  console.log(`[dump] ${name}: btn=${(info.buttons || []).length} file=${(info.fileInputs || []).length} ta=${(info.textareas || []).length} dlg=${(info.dialogs || []).length}`);
  return info;
}

// ------ login ------
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

function bundlesUrl() { return `${ORIGIN}/console/api-public/v3/appsintossconsole/workspaces/${WS}/mini-app/${APP}/bundles`; }
async function readBundles(ctx) {
  const r = await ctx.request.get(bundlesUrl(), { failOnStatusCode: false }).catch(() => null);
  if (!r) return null;
  const j = await r.json().catch(() => null);
  if (!j || j.resultType !== 'SUCCESS') return { error: j ? j.resultType : 'no-json' };
  const list = (j.success && j.success.contents) || [];
  return { count: list.length, versions: list.map((v) => ({ versionName: v.versionName, sdkVersion: v.sdkVersion, reviewStatus: v.reviewStatus, deployed: v.deployed, memo: v.memo })) };
}

function buttonStates(page) {
  return page.evaluate(() => {
    const out = [];
    document.querySelectorAll('button,[role=button]').forEach((b) => {
      const t = (b.innerText || '').trim().split('\n')[0];
      if (/출시하기|테스트|푸시로 보내기|푸시|검토 요청|검토요청|롤백|등록/.test(t)) out.push({ text: t, disabled: b.disabled === true || b.getAttribute('aria-disabled') === 'true' || b.getAttribute('disabled') != null, testid: b.getAttribute('data-testid'), cls: b.className.slice(0, 40) });
    });
    return out;
  }).catch(() => []);
}

(async () => {
  if (!fs.existsSync(AIT_PATH)) { console.error('[fatal] .ait 없음:', AIT_PATH); process.exit(2); }
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1440, height: 1200 } });
  attachNet(ctx);
  const page = ctx.pages()[0] || (await ctx.newPage());

  await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(1500);
  if (!isLoggedIn(page.url())) await login(page);

  const before = await readBundles(ctx);
  console.log('[bundles:before]', JSON.stringify(before));

  // open version-register form via "+ 등록하기" / "등록하기"
  await page.goto(APP_BUILD, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await dump(page, '20b-app-build-empty');
  for (const label of ['+ 등록하기', '등록하기', '버전 등록', '첫 버전']) {
    const loc = page.getByText(label, { exact: false }).first();
    if (await loc.count().catch(() => 0)) { await loc.click({ timeout: 6000 }).catch((e) => console.log('[click-err]', e.message)); await sleep(3000); if (page.url() !== APP_BUILD || await page.$('input[type=file]')) { console.log(`[open] "${label}" -> ${page.url()}`); break; } }
  }
  const form = await dump(page, '21b-version-register-form');
  console.log('[fileInputs]', JSON.stringify(form.fileInputs));

  // actual upload: set the .ait on the file input (chooser may be hidden)
  let uploaded = false;
  const fileInput = page.locator('input[type=file]').first();
  if (await fileInput.count().catch(() => 0)) {
    await fileInput.setInputFiles(AIT_PATH).catch((e) => console.log('[upload-err]', e.message));
    console.log('[upload] .ait setInputFiles 완료 — 처리 대기');
    await sleep(8000);
    await dump(page, '22b-after-file-set');
    // some flows need an explicit "업로드"/"확인"/"등록" within the form to start; click only upload-start (NOT 검토/출시)
    for (const label of ['업로드', '확인', '등록', '저장', '다음']) {
      const loc = page.getByRole('button', { name: label }).first();
      if (await loc.count().catch(() => 0)) {
        const dis = await loc.evaluate((b) => b.disabled === true || b.getAttribute('aria-disabled') === 'true').catch(() => true);
        if (!dis) { await loc.click({ timeout: 6000 }).catch((e) => console.log('[upload-start-err]', e.message)); console.log(`[upload] "${label}" 클릭 — 업로드 시작`); await sleep(12000); break; }
      }
    }
    await dump(page, '23b-after-upload');
  } else {
    console.log('[upload] file input 미발견 — 업로드 폼 진입 실패');
  }

  // readback: did a new version appear?
  for (let i = 0; i < 6; i++) { const after = await readBundles(ctx); if (after && after.count > (before ? before.count : 0)) { uploaded = true; console.log('[bundles:after]', JSON.stringify(after)); fs.writeFileSync(path.join(DUMPS_DIR, 'bundles-after.json'), JSON.stringify(after, null, 2)); break; } await sleep(5000); }
  if (!uploaded) { const after = await readBundles(ctx); console.log('[bundles:after-final]', JSON.stringify(after)); fs.writeFileSync(path.join(DUMPS_DIR, 'bundles-after.json'), JSON.stringify(after, null, 2)); }

  // downstream button states + review-note form DOM (NO push send, NO final submit, NO release)
  await page.goto(APP_BUILD, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(3000);
  const states = await buttonStates(page);
  console.log('[release-buttons]', JSON.stringify(states));
  fs.writeFileSync(path.join(DUMPS_DIR, 'release-buttons-after-upload.json'), JSON.stringify(states, null, 2));
  await dump(page, '24b-app-build-with-version');

  // open 검토 요청 note form (capture only) — do NOT submit
  const review = page.getByText('검토 요청', { exact: false }).first();
  if (await review.count().catch(() => 0)) {
    const dis = await review.evaluate((b) => b.disabled === true || b.getAttribute('aria-disabled') === 'true' || b.getAttribute('disabled') != null).catch(() => true);
    console.log('[review] 버튼 disabled=' + dis);
    if (!dis) { await review.click({ timeout: 6000 }).catch((e) => console.log('[review-err]', e.message)); await sleep(3000); await dump(page, '40b-review-note-form'); console.log('[review] 출시노트 폼 DOM 캡처 — 제출 안 함'); await page.keyboard.press('Escape').catch(() => {}); }
  } else { console.log('[review] 버튼 미발견 (테스트 선행 필요 가능)'); }

  flushNet();
  await ctx.close();
  console.log('[done] upload spike 완료 (푸시 발송/검토 제출/출시 클릭 없음)');
})().catch((e) => { console.error('[fatal]', e.message); flushNet(); process.exit(1); });
