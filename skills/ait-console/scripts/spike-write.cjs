#!/usr/bin/env node
'use strict';
/**
 * ait-console v3.0.0 WRITE-flow spike (today-lucky-draw / miniAppId 41019).
 *
 * Captures DOM selectors + network API for the release state machine:
 *   1) 앱 정보/에셋 편집 (icon/screenshot/thumbnail file inputs, save)
 *   2) 버전 업로드 (.ait file input)
 *   3) 출시하기 페이지 (테스트, "푸시로 보내기" -> 실제 클릭 허용, 검토 요청)
 *   4) 검토 요청 폼 (출시노트/업데이트노트 — DOM만, 제출 금지)
 *   5) 출시하기 버튼 활성/비활성 감지
 *
 * SAFETY (hard rules, enforced in code):
 *   - 검토 요청 "제출" 버튼 클릭 금지
 *   - 실제 "출시하기" 클릭 금지
 *   - 허용된 실제 클릭: 테스트 버튼, "푸시로 보내기"
 * Tokens/cookies/credentials are never printed; password fields masked pre-shot.
 *
 * Usage: AIT_CONSOLE_ID=.. AIT_CONSOLE_PW=.. node spike-write.cjs
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
const APP = 41019; // today-lucky-draw
const APP_BASE = `${ORIGIN}/workspace/${WS}/mini-app/${APP}`;
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

const SENSITIVE_KEY_RE = /token|secret|password|passwd|auth|cookie|session|credential|signature|otp|pin|code/i;
const SKIP_URL_RE = /\.(png|jpe?g|gif|svg|woff2?|ttf|otf|css|ico|mp4|webp|js|map)(\?|$)/i;
const SKIP_HOST_RE = /hackle|hotjar|channel\.io|sentry|google|gstatic|doubleclick|facebook|datadog|amplitude/i;

fs.mkdirSync(SHOTS_DIR, { recursive: true });
fs.mkdirSync(DUMPS_DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- masking + schema
function maskUrl(raw) {
  try { const u = new URL(raw); for (const [k] of u.searchParams) if (SENSITIVE_KEY_RE.test(k)) u.searchParams.set(k, '[masked]'); return u.toString(); }
  catch { return raw; }
}
function looksLikeToken(s) { return typeof s === 'string' && s.length > 24 && /^[A-Za-z0-9_\-./+=]+$/.test(s); }
function schema(v, depth = 0, key = '') {
  if (v === null) return 'null';
  if (Array.isArray(v)) return depth >= 4 ? `array(n=${v.length})` : (v.length ? [`array(n=${v.length})`, schema(v[0], depth + 1)] : 'array(empty)');
  const t = typeof v;
  if (t === 'object') { if (depth >= 4) return 'object'; const o = {}; for (const k of Object.keys(v).slice(0, 40)) o[k] = schema(v[k], depth + 1, k); return o; }
  if (t === 'string') { if (SENSITIVE_KEY_RE.test(key) || looksLikeToken(v)) return `string(len=${v.length})[masked]`; return v.length <= 48 ? `string:"${v}"` : `string(len=${v.length}):"${v.slice(0, 28)}…"`; }
  if (t === 'number' || t === 'boolean') return `${t}:${v}`;
  return t;
}

// ---------------------------------------------------------------- network capture
const netLog = [];
let pageName = 'pre';
function attachNet(ctx) {
  ctx.on('requestfinished', async (req) => {
    try {
      const url = req.url(); const type = req.resourceType();
      if (!['xhr', 'fetch', 'document', 'other'].includes(type)) return;
      if (SKIP_URL_RE.test(url)) return;
      const host = new URL(url).host;
      if (SKIP_HOST_RE.test(host) || !/toss\.im/.test(host)) return;
      const h = await req.allHeaders().catch(() => ({}));
      const e = {
        page: pageName, method: req.method(), url: maskUrl(url), resourceType: type,
        kind: ['GET', 'HEAD', 'OPTIONS'].includes(req.method()) ? 'read' : 'write',
        auth: {
          authorizationHeader: !!h['authorization'],
          authorizationPrefix: h['authorization'] ? h['authorization'].slice(0, 6) : null,
          cookieHeader: !!h['cookie'],
          hasTBIZAUTH: h['cookie'] ? /(^|;\s*)TBIZAUTH=/.test(h['cookie']) : false,
        },
      };
      const post = req.postData();
      if (post) { try { e.requestBodySchema = schema(JSON.parse(post)); } catch { e.requestBodySchema = /multipart|form-data/i.test(h['content-type'] || '') ? `multipart/form-data(len=${post.length})` : `non-json(len=${post.length})`; } }
      const res = await req.response();
      if (res) {
        e.status = res.status();
        const ct = ((await res.allHeaders().catch(() => ({})))['content-type'] || '').split(';')[0];
        e.contentType = ct;
        if (/json/.test(ct)) { const b = await res.body().catch(() => null); if (b && b.length < 300 * 1024) { try { e.responseBodySchema = schema(JSON.parse(b.toString('utf8'))); } catch {} } }
      }
      netLog.push(e);
    } catch { /* never break page */ }
  });
}
function flushNet() {
  fs.writeFileSync(path.join(DUMPS_DIR, 'netlog.json'), JSON.stringify(netLog, null, 2));
  const api = netLog.filter((e) => e.resourceType === 'xhr' || e.resourceType === 'fetch');
  console.log(`[net] captured ${netLog.length} (${api.length} xhr/fetch) -> dumps-write/netlog.json`);
}

// ---------------------------------------------------------------- dump
async function dump(page, name) {
  pageName = name;
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  for (let i = 0; i < 8; i++) { const len = await page.evaluate(() => document.body ? document.body.innerText.trim().length : 0).catch(() => 0); if (len > 50) break; await sleep(1500); }
  await sleep(2000);
  const info = await page.evaluate(() => {
    const attr = (el, names) => { const o = {}; for (const n of names) { const v = el.getAttribute(n); if (v != null) o[n] = v; } return o; };
    const desc = (el) => ({ tag: el.tagName.toLowerCase(), text: (el.innerText || el.value || '').trim().slice(0, 100), disabled: el.disabled === true || el.getAttribute('aria-disabled') === 'true' || el.getAttribute('disabled') != null, ...attr(el, ['id', 'name', 'type', 'placeholder', 'aria-label', 'aria-disabled', 'role', 'href', 'data-testid', 'data-tid', 'for', 'accept', 'multiple', 'maxlength', 'contenteditable', 'class']) });
    const q = (sel) => Array.from(document.querySelectorAll(sel)).map(desc);
    const inputs = q('input').map((i) => (i.type === 'password' ? { ...i, text: '[masked]' } : i));
    return {
      url: location.href, title: document.title,
      bodyTextHead: document.body ? document.body.innerText.slice(0, 4000) : '',
      buttons: q('button, [role="button"]'),
      links: q('a[href]'),
      inputs, fileInputs: q('input[type="file"]'),
      textareas: q('textarea'), editables: q('[contenteditable="true"]'),
      selects: q('select, [role="combobox"], [role="listbox"], [role="switch"]'),
      labels: q('label'),
      dialogs: q('[role="dialog"], [role="alertdialog"]').map((d) => ({ ...d, text: (d.text || '').slice(0, 200) })),
    };
  }).catch((e) => ({ error: String(e), url: page.url() }));
  fs.writeFileSync(path.join(DUMPS_DIR, `${name}.json`), JSON.stringify(info, null, 2));
  await page.evaluate(() => document.querySelectorAll('input[type=password]').forEach((i) => { i.value = '••••'; })).catch(() => {});
  await page.screenshot({ path: path.join(SHOTS_DIR, `${name}.png`), fullPage: true }).catch(() => {});
  console.log(`[dump] ${name}: ${info.url || '?'} (btn=${(info.buttons || []).length} file=${(info.fileInputs || []).length} ta=${(info.textareas || []).length} dlg=${(info.dialogs || []).length})`);
  return info;
}

// ---------------------------------------------------------------- login (reused)
const ID_SELECTORS = ['input[type="email"]', 'input[name*="id" i]', 'input[name*="email" i]', 'input[placeholder*="이메일"]', 'input[placeholder*="ID" i]', 'input[aria-label*="이메일"]'];
function isLoggedIn(url) { return url.startsWith('https://apps-in-toss.toss.im') && !/sign-in|sign-up/.test(url) && url !== `${ORIGIN}/`; }
function creds() { if (process.env.AIT_CONSOLE_ID && process.env.AIT_CONSOLE_PW) return { id: process.env.AIT_CONSOLE_ID, pw: process.env.AIT_CONSOLE_PW }; try { const c = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '.appintoss', 'credentials.json'), 'utf8')); if (c.id && c.pw) return c; } catch { /* no file */ } return null; }
async function formLogin(page) {
  const pw = page.locator('input[type="password"]').first();
  if (!(await pw.count())) return false;
  const c = creds(); if (!c) { console.error('[login] 자격증명 없음 — 수동 대기'); return false; }
  console.error('[login] 세션 만료 — 자동 로그인');
  let idok = false;
  for (const s of ID_SELECTORS) { const f = page.locator(s).first(); if (await f.count()) { await f.fill(c.id).catch(() => {}); if ((await f.inputValue().catch(() => '')) === c.id) { idok = true; break; } } }
  if (!idok) { const f = page.locator('input:not([type=password]):not([type=checkbox]):not([type=hidden])').first(); if (await f.count()) await f.fill(c.id).catch(() => {}); }
  await pw.fill(c.pw).catch(() => {});
  const sb = page.locator('button[type="submit"]').first();
  if (await sb.count()) await sb.click().catch(() => {});
  else await pw.press('Enter').catch(() => {});
  const body = await page.evaluate(() => document.body ? document.body.innerText : '').catch(() => '');
  if (/추가\s*인증|2단계|2차\s*인증|휴대폰\s*인증|인증\s*번호|OTP/i.test(body)) console.error('브라우저에서 추가 인증을 완료해주세요 (최대 5분 대기)');
  return true;
}
async function waitLogin(page) {
  const start = Date.now();
  while (Date.now() - start < LOGIN_TIMEOUT_MS) {
    if (isLoggedIn(page.url())) return true;
    if (page.url() === `${ORIGIN}/` || /sign-up/.test(page.url())) { await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}); await sleep(3000); if (isLoggedIn(page.url())) return true; }
    await sleep(3000);
  }
  return false;
}

// ---------------------------------------------------------------- safe click helpers
const FORBIDDEN_RE = /검토\s*요청|출시하기|제출|등록(?!하기 가이드)|발행|승인 요청/; // never click submit/release/review-request
async function clickAllowed(page, label, { exact = false } = {}) {
  if (FORBIDDEN_RE.test(label)) { console.log(`[guard] BLOCKED click "${label}" (쓰기 제출/출시/검토요청 금지)`); return false; }
  const before = page.url();
  const loc = page.getByText(label, { exact }).first();
  if (!(await loc.count().catch(() => 0))) { console.log(`[click] not found: "${label}"`); return false; }
  await loc.scrollIntoViewIfNeeded().catch(() => {});
  await loc.click({ timeout: 6000 }).catch((e) => console.log(`[click-err] ${label}: ${e.message}`));
  await sleep(3000);
  console.log(`[click] "${label}" -> ${page.url()}${page.url() !== before ? ' (nav)' : ''}`);
  return true;
}

// ---------------------------------------------------------------- main
(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1440, height: 1200 } });
  attachNet(ctx);
  const page = ctx.pages()[0] || (await ctx.newPage());

  // session
  await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(1500);
  if (!isLoggedIn(page.url())) { if (await formLogin(page)) await waitLogin(page); }

  // 0) app overview / sidebar
  await page.goto(`${APP_BASE}/home`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await dump(page, '00-app-home');

  // 1) 앱 정보 / 에셋 편집
  await page.goto(`${APP_BASE}/meta`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await dump(page, '10-meta-view');
  // try entering edit mode via a non-destructive "편집"/"수정" button (save NOT clicked)
  for (const t of ['편집', '수정', '정보 수정', '에셋', '기본 정보']) {
    const loc = page.getByRole('button', { name: t }).first();
    if (await loc.count().catch(() => 0)) { await loc.click({ timeout: 5000 }).catch(() => {}); await sleep(2500); await dump(page, `11-meta-edit-${t}`); break; }
  }

  // 2) 버전 업로드 / 출시 페이지 (app-build)
  await page.goto(`${APP_BASE}/app-build`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await dump(page, '20-app-build');
  // open version-register form (capture DOM only; never submit)
  for (const t of ['버전 등록', '버전 추가', '업로드']) {
    const loc = page.getByRole('button', { name: t }).first();
    if (await loc.count().catch(() => 0) && !FORBIDDEN_RE.test(t)) { await loc.click({ timeout: 5000 }).catch(() => {}); await sleep(3000); await dump(page, `21-version-register-form`); break; }
  }
  // close any opened dialog without submitting
  await page.keyboard.press('Escape').catch(() => {});
  await sleep(1000);

  // 3) 출시하기 / 테스트 / 푸시로 보내기 (real click allowed for test+push only)
  await page.goto(`${APP_BASE}/app-build`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(2000);
  // capture "출시하기" button enabled/disabled state for cron signal
  const releaseState = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('button, [role="button"]').forEach((b) => {
      const t = (b.innerText || '').trim();
      if (/출시하기|테스트|푸시로 보내기|검토 요청|롤백/.test(t)) {
        out.push({ text: t.split('\n')[0], disabled: b.disabled === true || b.getAttribute('aria-disabled') === 'true' || b.getAttribute('disabled') != null, cls: b.className, testid: b.getAttribute('data-testid') });
      }
    });
    return out;
  }).catch(() => []);
  fs.writeFileSync(path.join(DUMPS_DIR, '30-release-buttons-state.json'), JSON.stringify(releaseState, null, 2));
  console.log('[release-buttons]', JSON.stringify(releaseState));

  // try real "테스트" then "푸시로 보내기"
  let pushSent = false;
  if (releaseState.some((b) => /테스트/.test(b.text) && !b.disabled)) {
    await clickAllowed(page, '테스트', { exact: false });
    await dump(page, '31-after-test-click');
  }
  // look for "푸시로 보내기"
  const pushLoc = page.getByText('푸시로 보내기', { exact: false }).first();
  if (await pushLoc.count().catch(() => 0)) {
    console.log('[push] "푸시로 보내기" 발견 — 실제 클릭(승인됨)');
    await pushLoc.scrollIntoViewIfNeeded().catch(() => {});
    await pushLoc.click({ timeout: 6000 }).catch((e) => console.log(`[push-err] ${e.message}`));
    await sleep(4000);
    pushSent = true;
    await dump(page, '32-after-push');
    // a confirm dialog may appear; capture it, click confirm if it is purely the push confirm
    const dlg = await page.$$eval('[role="dialog"],[role="alertdialog"]', (els) => els.map((e) => (e.innerText || '').slice(0, 300))).catch(() => []);
    if (dlg.length) {
      console.log('[push] 확인 다이얼로그:', JSON.stringify(dlg).slice(0, 300));
      for (const t of ['보내기', '확인', '발송']) {
        const c = page.getByRole('button', { name: t }).first();
        if (await c.count().catch(() => 0) && !FORBIDDEN_RE.test(t)) { await c.click({ timeout: 5000 }).catch(() => {}); await sleep(3000); await dump(page, '33-after-push-confirm'); break; }
      }
    }
  } else {
    console.log('[push] "푸시로 보내기" 미발견 (버전/테스트 선행조건 필요 가능)');
  }
  fs.writeFileSync(path.join(DUMPS_DIR, 'push-result.json'), JSON.stringify({ pushSent }, null, 2));

  // 4) 검토 요청 폼 — open dialog to capture release-note form DOM, NEVER submit
  await page.goto(`${APP_BASE}/app-build`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(2000);
  const reviewBtn = page.getByText('검토 요청', { exact: false }).first();
  if (await reviewBtn.count().catch(() => 0)) {
    const isDisabled = await reviewBtn.evaluate((b) => b.disabled === true || b.getAttribute('aria-disabled') === 'true' || b.getAttribute('disabled') != null).catch(() => true);
    console.log(`[review] "검토 요청" 버튼 disabled=${isDisabled}`);
    if (!isDisabled) {
      // clicking the button opens the note form (it does NOT itself submit); submit button inside is FORBIDDEN
      await reviewBtn.click({ timeout: 6000 }).catch((e) => console.log(`[review-err] ${e.message}`));
      await sleep(3000);
      await dump(page, '40-review-request-form');
      console.log('[review] 폼 DOM 캡처 완료 — 제출 버튼은 클릭하지 않음');
      await page.keyboard.press('Escape').catch(() => {});
    } else {
      console.log('[review] 비활성 — 폼 열 수 없음(테스트/업로드 선행 필요 추정)');
    }
  } else {
    console.log('[review] "검토 요청" 버튼 미발견');
  }

  flushNet();
  await ctx.close();
  console.log('[done] write-flow spike 완료 (검토요청 제출/출시 클릭 없음)');
})().catch((e) => { console.error('[fatal]', e.message); flushNet(); process.exit(1); });
