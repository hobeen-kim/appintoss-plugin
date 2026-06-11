#!/usr/bin/env node
'use strict';
/**
 * ait-console WRITE spike — STEP: 앱 등록(create) 플로우 캡처 + 실제 등록.
 * 워크스페이스 27931에서 '등록하기' → 신규 앱 생성.
 *   appName: fixed-cost-keeper / displayName: 고정비지킴이 / 유형: 비게임
 *
 * 사용자 본인 전체 자율 권한 부여 → 실제 앱 생성 수행하며 register API/DOM 캡처.
 * Tokens/cookies/credentials never printed.
 *
 * 동작: 등록 폼 진입 → 필드 채움(이름/appName/유형) → 폼 DOM dump → 제출 → 생성 API/응답 캡처.
 * 안전장치: 제출 직전 폼을 반드시 dump. 등록 외 다른 쓰기는 하지 않음.
 */
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/tmp/ait-console-spike/node_modules/playwright')); }

const PROFILE_DIR = '/Users/hobeen/.appintoss-console/profile';
const SHOTS_DIR = '/tmp/ait-console-spike/shots-write';
const DUMPS_DIR = '/tmp/ait-console-spike/dumps-write';
const ORIGIN = 'https://apps-in-toss.toss.im';
const WS = 27931;
const APPS_URL = `${ORIGIN}/workspace/${WS}/mini-app`;
const APPS_API = `${ORIGIN}/console/api-public/v3/appsintossconsole/workspaces/${WS}/mini-app`;
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

// 등록 간소화 폼 필수: 앱 이름 / 앱 소개(10자 이상, 특수문자는 : · ? 만) / appName / 유형.
const NEW = { appName: 'fixed-cost-keeper', displayName: '고정비지킴이', intro: '매달 나가는 고정비를 한곳에서 정리하고 관리하는 앱이에요' };

const SENSITIVE_KEY_RE = /token|secret|password|passwd|auth|cookie|session|credential|signature|otp|pin|code/i;
const SKIP_URL_RE = /\.(png|jpe?g|gif|svg|woff2?|ttf|otf|css|ico|mp4|webp|js|map)(\?|$)/i;
const SKIP_HOST_RE = /hackle|hotjar|channel\.io|sentry|gstatic|doubleclick|facebook|datadog|amplitude/i;
fs.mkdirSync(SHOTS_DIR, { recursive: true }); fs.mkdirSync(DUMPS_DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function maskUrl(raw) { try { const u = new URL(raw); for (const [k] of u.searchParams) if (SENSITIVE_KEY_RE.test(k)) u.searchParams.set(k, '[masked]'); return u.toString(); } catch (e) { return raw; } }
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
      if (post) { try { e.requestBodySchema = schema(JSON.parse(post)); } catch (x) { e.requestBodySchema = /multipart|form-data/i.test(h['content-type'] || '') ? `multipart(len=${post.length})` : `non-json(len=${post.length})`; } }
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
    const desc = (el) => ({ tag: el.tagName.toLowerCase(), text: (el.innerText || el.value || '').trim().slice(0, 120), value: (el.value || '').slice(0, 80), checked: el.checked === true, disabled: el.disabled === true || el.getAttribute('aria-disabled') === 'true' || el.getAttribute('disabled') != null, ...attr(el, ['id', 'name', 'type', 'placeholder', 'aria-label', 'role', 'data-testid', 'maxlength', 'contenteditable', 'class']) });
    const q = (s) => Array.from(document.querySelectorAll(s)).map(desc);
    return { url: location.href, title: document.title, bodyTextHead: document.body ? document.body.innerText.slice(0, 4000) : '', buttons: q('button,[role=button]'), inputs: q('input').map((i) => i.type === 'password' ? { ...i, value: '[masked]' } : i), textareas: q('textarea'), selects: q('select,[role=radio],[role=radiogroup],[role=switch],[role=combobox]'), labels: q('label'), dialogs: q('[role=dialog],[role=alertdialog]').map((d) => ({ ...d, text: (d.text || '').slice(0, 700) })) };
  }).catch((e) => ({ error: String(e), url: page.url() }));
  fs.writeFileSync(path.join(DUMPS_DIR, `${name}.json`), JSON.stringify(info, null, 2));
  await page.screenshot({ path: path.join(SHOTS_DIR, `${name}.png`), fullPage: true }).catch(() => {});
  console.log(`[dump] ${name}: btn=${(info.buttons || []).length} input=${(info.inputs || []).length} sel=${(info.selects || []).length} dlg=${(info.dialogs || []).length}`);
  return info;
}

const ID_SELECTORS = ['input[type=email]', 'input[name*="id" i]', 'input[name*="email" i]', 'input[placeholder*="이메일"]', 'input[placeholder*="ID" i]'];
function isLoggedIn(u) { return /^https:\/\/apps-in-toss\.toss\.im/.test(u) && !/sign-in|sign-up/.test(u) && u !== `${ORIGIN}/`; }
function creds() { if (process.env.AIT_CONSOLE_ID && process.env.AIT_CONSOLE_PW) return { id: process.env.AIT_CONSOLE_ID, pw: process.env.AIT_CONSOLE_PW }; try { const c = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '.appintoss', 'credentials.json'), 'utf8')); if (c.id && c.pw) return c; } catch {} return null; }
const SIGNIN_URL = 'https://business.toss.im/account/sign-in?client_id=4uktpjgqd0cp9txybqzuxc2y6w0cuupb&redirect_uri=https%3A%2F%2Fapps-in-toss.toss.im%2Fsign-up&state=%2Fworkspace';
async function apiAlive(ctx) { try { const r = await ctx.request.get(`${ORIGIN}/console/api-public/v3/appsintossconsole/workspaces`, { failOnStatusCode: false }); const j = await r.json().catch(() => null); return !!(j && j.resultType === 'SUCCESS'); } catch (e) { return false; } }
async function ensureLogin(ctx, page) {
  // SPA shows /workspace shell even when the session is dead -> probe the API, not the URL.
  if (await apiAlive(ctx)) return true;
  console.error('[login] 세션 만료 — sign-in 페이지로 강제 로그인');
  await page.goto(SIGNIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(2500);
  await login(page);
  await sleep(2000);
  return apiAlive(ctx);
}
async function login(page) {
  const pw = page.locator('input[type=password]').first();
  if (!(await pw.count())) return;
  const c = creds(); if (!c) { console.error('[login] 자격증명 없음'); return; }
  let ok = false;
  for (const s of ID_SELECTORS) { const f = page.locator(s).first(); if (await f.count()) { await f.fill(c.id).catch(() => {}); if ((await f.inputValue().catch(() => '')) === c.id) { ok = true; break; } } }
  if (!ok) { const f = page.locator('input:not([type=password]):not([type=checkbox]):not([type=hidden])').first(); if (await f.count()) await f.fill(c.id).catch(() => {}); }
  await pw.fill(c.pw).catch(() => {});
  const sb = page.locator('button[type=submit]').first();
  if (await sb.count()) await sb.click().catch(() => {}); else await pw.press('Enter').catch(() => {});
  const start = Date.now();
  while (Date.now() - start < LOGIN_TIMEOUT_MS) { if (isLoggedIn(page.url())) return; if (page.url() === `${ORIGIN}/` || /sign-up/.test(page.url())) { await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded' }).catch(() => {}); await sleep(3000); if (isLoggedIn(page.url())) return; } await sleep(3000); }
}
async function listApps(ctx) { const r = await ctx.request.get(APPS_API, { failOnStatusCode: false }).catch(() => null); if (!r) return null; const j = await r.json().catch(() => null); if (!j || j.resultType !== 'SUCCESS') return { error: j ? j.resultType : 'no-json' }; return (j.success || []).map((a) => ({ miniAppId: a.miniAppId, appName: a.appName, title: a.title, status: a.status, appType: a.appType })); }

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1440, height: 1300 } });
  attachNet(ctx);
  const page = ctx.pages()[0] || (await ctx.newPage());
  await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(1500);
  if (!(await ensureLogin(ctx, page))) { console.log('[fatal] 세션 확보 실패'); flushNet('register'); await ctx.close(); process.exit(1); }

  const before = await listApps(ctx);
  console.log('[apps:before]', JSON.stringify(before));
  if (Array.isArray(before) && before.some((a) => a.appName === NEW.appName)) { console.log(`[abort] appName "${NEW.appName}" 이미 존재 — 중단(중복)`); flushNet('register'); await ctx.close(); return; }

  await page.goto(APPS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  // wait for the apps list to finish loading ("잠시만 기다려주세요" 사라질 때까지)
  for (let i = 0; i < 15; i++) { const t = await page.evaluate(() => document.body ? document.body.innerText : '').catch(() => ''); if (t && !/잠시만 기다려주세요/.test(t) && /등록|나의 앱|앱이 없/.test(t)) break; await sleep(2000); }
  await dump(page, '50-apps-list');

  // click 등록하기 (button text or any clickable with that label)
  let reg = page.getByRole('button', { name: '등록하기' }).first();
  if (!(await reg.count().catch(() => 0))) reg = page.getByText('등록하기', { exact: false }).first();
  if (!(await reg.count().catch(() => 0))) { console.log('[register] 등록하기 버튼 미발견'); flushNet('register'); await ctx.close(); return; }
  await reg.click({ timeout: 6000 }).catch((e) => console.log('[reg-err]', e.message));
  await sleep(3500);
  const form = await dump(page, '51-register-form');
  console.log('[form] url:', form.url);
  console.log('[form] inputs:', JSON.stringify((form.inputs || []).map((i) => ({ ph: i.placeholder, al: i['aria-label'], name: i.name, type: i.type, id: (i.id || '').slice(0, 14) }))));
  console.log('[form] selects/radios:', JSON.stringify((form.selects || []).map((s) => ({ role: s.role, text: (s.text || '').slice(0, 30), al: s['aria-label'] }))));
  console.log('[form] labels:', (form.labels || []).map((l) => l.text).filter(Boolean).slice(0, 15).join(' | '));
  console.log('[form] buttons:', (form.buttons || []).map((b) => (b.text || '').split('\n')[0]).filter(Boolean).slice(0, 15).join(' | '));

  // 폼 필드는 모달 내 text input의 DOM 순서: [0]=앱 이름, [1]=appName.
  // 라벨 for/aria 연결이 없어 순서 기반 채움이 가장 안정적.
  const scope0 = (await page.locator('[role=dialog]').count().catch(() => 0)) ? page.locator('[role=dialog]') : page;
  const textInputs = scope0.locator('input[type=text], input:not([type])');
  const nText = await textInputs.count().catch(() => 0);
  let filledName = false, filledAppName = false;
  console.log(`[form] text inputs = ${nText}`);
  // 실측 폼 순서: [0]=앱 소개(AI분석용, 10자+, 특수문자 :·? 만), [1]=앱 이름, [2]=appName.
  if (nText >= 1) { await textInputs.nth(0).fill(NEW.intro).catch(() => {}); const v = await textInputs.nth(0).inputValue().catch(() => ''); console.log(`[fill] [0] 앱 소개 = "${NEW.intro}" (len=${v.length}) ok=${v === NEW.intro}`); }
  if (nText >= 2) { await textInputs.nth(1).fill(NEW.displayName).catch(() => {}); filledName = (await textInputs.nth(1).inputValue().catch(() => '')) === NEW.displayName; console.log(`[fill] [1] 앱 이름 = "${NEW.displayName}" ok=${filledName}`); }
  if (nText >= 3) { await textInputs.nth(2).fill(NEW.appName).catch(() => {}); filledAppName = (await textInputs.nth(2).inputValue().catch(() => '')) === NEW.appName; console.log(`[fill] [2] appName = "${NEW.appName}" ok=${filledAppName}`); }
  // app type 비게임 (radiogroup)
  let typePicked = false;
  const radioNonGame = scope0.getByRole('radio', { name: '비게임' }).first();
  if (await radioNonGame.count().catch(() => 0)) { await radioNonGame.click().catch(() => {}); typePicked = await radioNonGame.isChecked().catch(() => false); }
  if (!typePicked) { const loc = scope0.getByText('비게임', { exact: true }).first(); if (await loc.count().catch(() => 0)) { await loc.click().catch(() => {}); typePicked = true; } }
  console.log(`[type] 비게임 선택 = ${typePicked}`);
  console.log(`[fill-summary] name=${filledName} appName=${filledAppName} type=${typePicked}`);
  await sleep(1000);
  await dump(page, '52-register-filled');

  if (process.env.PROBE_ONLY === '1') { console.log('[probe] PROBE_ONLY=1 — 폼 캡처만, 제출 생략'); flushNet('register-probe'); await ctx.close(); console.log('[done] register PROBE 완료'); return; }

  // submit: find enabled submit button (등록/확인/생성/만들기/다음)
  let submitted = false;
  for (const label of ['만들기', '등록하기', '등록', '생성', '확인', '다음', '완료']) {
    const scope = await page.locator('[role=dialog]').count().catch(() => 0) ? page.locator('[role=dialog]') : page;
    const loc = scope.getByRole('button', { name: label }).last();
    if (!(await loc.count().catch(() => 0))) continue;
    // 폼 검증 통과까지 활성화 대기 (최대 10s)
    let dis = true;
    for (let i = 0; i < 5; i++) { dis = await loc.evaluate((b) => b.disabled === true || b.getAttribute('aria-disabled') === 'true').catch(() => true); if (!dis) break; await sleep(2000); }
    if (dis) { console.log(`[submit] "${label}" 비활성(검증 미통과) skip`); continue; }
    console.log(`[submit] "${label}" 클릭 — 앱 등록 제출`);
    await loc.click({ timeout: 6000 }).catch((e) => console.log('[submit-err]', e.message));
    await sleep(4000);
    await dump(page, '53-after-submit');
    submitted = true;
    // possible confirm/next dialog
    const dlg = await page.$$eval('[role=dialog],[role=alertdialog]', (els) => els.map((e) => (e.innerText || '').slice(0, 200))).catch(() => []);
    if (dlg.length) { console.log('[submit] post-dialog:', JSON.stringify(dlg).slice(0, 200)); for (const t of ['확인', '등록', '완료', '다음']) { const c = page.getByRole('button', { name: t }).last(); if (await c.count().catch(() => 0)) { const cd = await c.evaluate((b) => b.disabled === true || b.getAttribute('aria-disabled') === 'true').catch(() => true); if (!cd) { await c.click({ timeout: 5000 }).catch(() => {}); console.log(`[submit] 확인 "${t}"`); await sleep(4000); await dump(page, '54-after-confirm'); break; } } } }
    break;
  }
  if (!submitted) console.log('[submit] 제출 버튼 미발견/비활성 — 51/52 dump 확인 필요');

  // readback
  for (let i = 0; i < 5; i++) { const after = await listApps(ctx); const created = Array.isArray(after) ? after.find((a) => a.appName === NEW.appName) : null; console.log(`[apps:after ${i}]`, created ? JSON.stringify(created) : '(아직 없음)'); if (created) { fs.writeFileSync(path.join(DUMPS_DIR, 'register-result.json'), JSON.stringify({ submitted, created }, null, 2)); break; } await sleep(4000); }

  flushNet('register');
  await ctx.close();
  console.log('[done] register spike 완료');
})().catch((e) => { console.error('[fatal]', e.message); flushNet('register'); process.exit(1); });
