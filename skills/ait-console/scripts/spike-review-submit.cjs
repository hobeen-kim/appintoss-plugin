#!/usr/bin/env node
'use strict';
/**
 * ait-console WRITE spike — STEP 3: 검토 요청 제출 (실제) + 출시노트 폼 캡처.
 * App: today-lucky-draw (ws 27931 / miniApp 41019), version 20260611-1 (isTested=true).
 *
 * 사용자 본인 전체 자율 권한 → "검토 요청" 클릭 → 출시노트 작성 → 최종 제출(토스 심사 트리거).
 * 캡처: 출시노트 폼 DOM(textarea/제출 버튼), 제출 API(method+URL+req/res), reviewStatus 전환.
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

// 출시노트(최초 출시) — 느낌표/과장/부정나열 없이 3~6줄, 앱 소개.
const RELEASE_NOTE = [
  '매일 가벼운 소비 미션을 뽑아 하루를 시작할 수 있어요.',
  '뽑은 미션은 카드 형태로 모아 두고 나중에 다시 확인할 수 있어요.',
  '복잡한 설정 없이 화면을 넘기며 바로 사용할 수 있도록 구성했어요.',
  '작은 소비 습관을 즐겁게 이어 가도록 돕는 것이 목표예요.',
].join('\n');

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
      const e = { page: pageName, method: req.method(), url: maskUrl(url), resourceType: type, kind: ['GET', 'HEAD', 'OPTIONS'].includes(req.method()) ? 'read' : 'write', auth: { authorizationHeader: !!h['authorization'], cookieHeader: !!h['cookie'], hasTBIZAUTH: h['cookie'] ? /(^|;\s*)TBIZAUTH=/.test(h['cookie']) : false } };
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
    const desc = (el) => ({ tag: el.tagName.toLowerCase(), text: (el.innerText || el.value || '').trim().slice(0, 120), disabled: el.disabled === true || el.getAttribute('aria-disabled') === 'true' || el.getAttribute('disabled') != null, ...attr(el, ['id', 'name', 'type', 'placeholder', 'aria-label', 'role', 'data-testid', 'maxlength', 'contenteditable', 'class']) });
    const q = (s) => Array.from(document.querySelectorAll(s)).map(desc);
    return { url: location.href, title: document.title, bodyTextHead: document.body ? document.body.innerText.slice(0, 4000) : '', buttons: q('button,[role=button]'), inputs: q('input').map((i) => i.type === 'password' ? { ...i, text: '[masked]' } : i), textareas: q('textarea'), editables: q('[contenteditable=true]'), dialogs: q('[role=dialog],[role=alertdialog]').map((d) => ({ ...d, text: (d.text || '').slice(0, 600) })) };
  }).catch((e) => ({ error: String(e), url: page.url() }));
  fs.writeFileSync(path.join(DUMPS_DIR, `${name}.json`), JSON.stringify(info, null, 2));
  await page.screenshot({ path: path.join(SHOTS_DIR, `${name}.png`), fullPage: true }).catch(() => {});
  console.log(`[dump] ${name}: btn=${(info.buttons || []).length} ta=${(info.textareas || []).length} editable=${(info.editables || []).length} dlg=${(info.dialogs || []).length}`);
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
async function readBundles(ctx) { const r = await ctx.request.get(BUNDLES, { failOnStatusCode: false }).catch(() => null); if (!r) return null; const j = await r.json().catch(() => null); if (!j || j.resultType !== 'SUCCESS') return { error: j ? j.resultType : 'no-json' }; const list = (j.success && j.success.contents) || []; return list.map((v) => ({ versionName: v.versionName, reviewStatus: v.reviewStatus, isTested: v.isTested, deployed: v.deployed, releaseNote: v.releaseNote ? `len=${v.releaseNote.length}` : null })); }

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1440, height: 1300 } });
  attachNet(ctx);
  const page = ctx.pages()[0] || (await ctx.newPage());
  await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(1500);
  if (!isLoggedIn(page.url())) await login(page);
  console.log('[bundles:before]', JSON.stringify(await readBundles(ctx)));

  await page.goto(APP_BUILD, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await dump(page, '40c-build-before-review');

  // 검토 요청 클릭 (isTested=true 이면 활성)
  const reviewBtn = page.getByRole('button', { name: '검토 요청' }).first();
  if (!(await reviewBtn.count().catch(() => 0))) { console.log('[review] 버튼 미발견'); flushNet('review'); await ctx.close(); return; }
  const dis = await reviewBtn.evaluate((b) => b.disabled === true || b.getAttribute('aria-disabled') === 'true' || b.getAttribute('disabled') != null).catch(() => true);
  console.log('[review] 버튼 disabled=' + dis);
  if (dis) { console.log('[review] 비활성 — isTested 미반영? 중단'); flushNet('review'); await ctx.close(); return; }

  await reviewBtn.click({ timeout: 6000 }).catch((e) => console.log('[review-err]', e.message));
  await sleep(3500);
  const form = await dump(page, '41c-release-note-form');
  console.log('[form] textareas:', JSON.stringify((form.textareas || []).map((t) => ({ ph: t.placeholder, ml: t.maxlength, al: t['aria-label'] }))));
  console.log('[form] editables:', (form.editables || []).length);
  console.log('[form] dialog:', JSON.stringify((form.dialogs || []).map((d) => (d.text || '').slice(0, 200))));
  console.log('[form] buttons:', (form.buttons || []).map((b) => (b.text || '').split('\n')[0]).filter(Boolean).slice(0, 20).join(' | '));

  // 출시노트 입력: textarea 우선, 없으면 contenteditable
  let filled = false;
  const ta = page.locator('textarea').first();
  if (await ta.count().catch(() => 0)) { await ta.click().catch(() => {}); await ta.fill(RELEASE_NOTE).catch((e) => console.log('[fill-err]', e.message)); const v = await ta.inputValue().catch(() => ''); filled = v.length > 10; console.log('[form] textarea 입력 len=' + v.length); }
  if (!filled) { const ed = page.locator('[contenteditable=true]').first(); if (await ed.count().catch(() => 0)) { await ed.click().catch(() => {}); await ed.fill(RELEASE_NOTE).catch(() => {}); filled = true; console.log('[form] contenteditable 입력'); } }
  await sleep(1000);
  await dump(page, '42c-note-filled');

  // 최종 제출: dialog 내 제출/확인 버튼 (검토 요청/제출/확인). 실제 제출(승인됨).
  let submitted = false;
  for (const label of ['검토 요청하기', '제출하기', '제출', '검토 요청', '확인', '신청']) {
    // pick a button that lives inside the dialog and is enabled
    const loc = page.locator('[role=dialog]').getByRole('button', { name: label }).first();
    const cnt = await loc.count().catch(() => 0);
    const target = cnt ? loc : page.getByRole('button', { name: label }).last();
    if (!(await target.count().catch(() => 0))) continue;
    const tdis = await target.evaluate((b) => b.disabled === true || b.getAttribute('aria-disabled') === 'true').catch(() => true);
    if (tdis) { console.log(`[submit] "${label}" 비활성 — skip`); continue; }
    console.log(`[submit] "${label}" 클릭 — 검토 요청 최종 제출(승인됨)`);
    await target.click({ timeout: 6000 }).catch((e) => console.log('[submit-err]', e.message));
    await sleep(4000);
    await dump(page, '43c-after-submit');
    submitted = true;
    // possible confirm dialog
    const dlg = await page.$$eval('[role=dialog],[role=alertdialog]', (els) => els.map((e) => (e.innerText || '').slice(0, 200))).catch(() => []);
    if (dlg.length) { for (const t of ['확인', '제출', '검토 요청하기', '신청']) { const c = page.getByRole('button', { name: t }).last(); if (await c.count().catch(() => 0)) { const cd = await c.evaluate((b) => b.disabled === true || b.getAttribute('aria-disabled') === 'true').catch(() => true); if (!cd) { await c.click({ timeout: 5000 }).catch(() => {}); console.log(`[submit] 확인 "${t}" 클릭`); await sleep(4000); await dump(page, '44c-after-confirm'); break; } } } }
    break;
  }
  if (!submitted) console.log('[submit] 제출 버튼 미발견/비활성 — 폼 dump(41c/42c) 확인 필요');

  // reviewStatus transition
  for (let i = 0; i < 6; i++) { const b = await readBundles(ctx); console.log(`[poll ${i}]`, JSON.stringify(b)); const v = Array.isArray(b) ? b.find((x) => x.versionName === '20260611-1') : null; if (v && v.reviewStatus !== 'CREATED') break; await sleep(5000); }
  fs.writeFileSync(path.join(DUMPS_DIR, 'review-result.json'), JSON.stringify({ submitted, releaseNote: RELEASE_NOTE, after: await readBundles(ctx) }, null, 2));

  flushNet('review');
  await ctx.close();
  console.log('[done] review-submit spike 완료');
})().catch((e) => { console.error('[fatal]', e.message); flushNet('review'); process.exit(1); });
