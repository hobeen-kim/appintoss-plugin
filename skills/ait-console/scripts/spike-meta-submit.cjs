#!/usr/bin/env node
'use strict';
/**
 * ait-console WRITE spike — 앱 정보(스토어 정보) 입력 + 에셋 5종 업로드 + (임시저장/검수 제출) 캡처.
 * fixed-cost-keeper (ws 27931 / miniApp 41246).
 *
 * 단계: /meta "수정하기" → 영어이름/부제/상세설명/이메일 입력 → 카테고리 선택 → 키워드 10개 추가
 *       → 에셋(로고·다크로고는 동일 아이콘, 스크린샷3, 썸네일) 업로드 → 임시저장 → "다음"으로 검수 단계
 *       → 검수 제출 폼/버튼 캡처 후 제출.
 * PROBE_ONLY=1 이면 입력만 하고 저장/제출 생략(폼 캡처용).
 *
 * 에셋 업로드 응답의 발급 static URL 들을 dumps-write/meta-asset-urls.json 에 기록.
 * Tokens/cookies/credentials never printed.
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
const ASSET_DIR = '/Users/hobeen/study/appintoss/fixed-cost-keeper/docs/assets';
const SIGNIN_URL = 'https://business.toss.im/account/sign-in?client_id=4uktpjgqd0cp9txybqzuxc2y6w0cuupb&redirect_uri=https%3A%2F%2Fapps-in-toss.toss.im%2Fsign-up&state=%2Fworkspace';

const DATA = {
  nameEn: 'Fixed Cost Keeper',
  subtitle: '고정비 한눈에 결제일 알림',
  description: '매달 자동으로 빠져나가는 월세, 보험료, 구독료, 대출이자를 한 화면에 모아 관리하세요. 각 항목의 결제일이 얼마나 남았는지 D-day로 한눈에 확인할 수 있어요.\n\n중요한 항목은 \'높음\' 우선순위로 상단 고정하고, 결제일 전날과 당일 토스 푸시 알림을 켜두면 깜빡하지 않고 준비할 수 있어요. 알림은 항목별로 개별 설정하니 꼭 필요한 것만 받을 수 있어요.\n\n월 총액과 연 환산액을 자동으로 계산해주기 때문에 내 고정비가 한 달에, 일 년에 얼마인지 바로 알 수 있어요.',
  email: 'hobeenkim@jubianix.com',
  keywords: ['고정비', '월세', '보험료', '구독료', '결제일', '가계부', '지출관리', '리마인더', '알림', '고정지출'],
  category: ['생활', '쇼핑'], // 생활·쇼핑 > 생활
};
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
  if (t === 'object') { if (d >= 4) return 'object'; const o = {}; for (const kk of Object.keys(v).slice(0, 50)) o[kk] = schema(v[kk], d + 1, kk); return o; }
  if (t === 'string') { if (SENSITIVE_KEY_RE.test(k)) return `string(len=${v.length})[masked]`; return v.length <= 60 ? `string:"${v}"` : `string(len=${v.length})`; }
  if (t === 'number' || t === 'boolean') return `${t}:${v}`; return t;
}
const netLog = [];
function attachNet(ctx) {
  ctx.on('requestfinished', async (req) => {
    try {
      const url = req.url(), type = req.resourceType();
      if (!['xhr', 'fetch'].includes(type)) return;
      const host = new URL(url).host;
      if (SKIP_HOST_RE.test(host) || !/toss\.im/.test(host)) return;
      if (!/\/console\//.test(new URL(url).pathname) && req.method() === 'GET') return;
      const h = await req.allHeaders().catch(() => ({}));
      const e = { method: req.method(), url: maskUrl(url), pathname: new URL(url).pathname, contentTypeReq: (h['content-type'] || '').split(';')[0] };
      const post = req.postData();
      if (post) { try { e.requestBodySchema = schema(JSON.parse(post)); } catch (x) { e.requestBodySchema = /multipart|form-data/i.test(h['content-type'] || '') ? `multipart(len=${post.length})` : `non-json(len=${post.length})`; } }
      const res = await req.response();
      if (res) { e.status = res.status(); const ct = ((await res.allHeaders().catch(() => ({})))['content-type'] || '').split(';')[0]; if (/json/.test(ct)) { const b = await res.body().catch(() => null); if (b && b.length < 200 * 1024) { try { const j = JSON.parse(b.toString('utf8')); e.responseBodySchema = schema(j); const m = JSON.stringify(j).match(/https:\/\/static\.toss\.im\/appsintoss\/[^"\\]+\.(png|jpg|jpeg|webp)/i); if (m) e.issuedUrl = m[0]; } catch {} } } }
      if (e.method !== 'GET' || e.issuedUrl) netLog.push(e);
    } catch {}
  });
}
async function dump(page, name) {
  await sleep(1500);
  const info = await page.evaluate(() => {
    const attr = (el, ns) => { const o = {}; for (const n of ns) { const v = el.getAttribute(n); if (v != null) o[n] = v; } return o; };
    const desc = (el) => ({ tag: el.tagName.toLowerCase(), text: (el.innerText || el.value || '').trim().slice(0, 80), disabled: el.disabled === true || el.getAttribute('aria-disabled') === 'true', ...attr(el, ['id', 'type', 'placeholder', 'role', 'data-testid', 'class']) });
    const q = (s) => Array.from(document.querySelectorAll(s)).map(desc);
    return { url: location.href, bodyTextHead: document.body ? document.body.innerText.slice(0, 2500) : '', buttons: q('button,[role=button]').filter((b) => b.text), textareas: q('textarea'), dialogs: q('[role=dialog],[role=alertdialog]').map((d) => ({ text: (d.text || '').slice(0, 400) })) };
  }).catch((e) => ({ error: String(e) }));
  fs.writeFileSync(path.join(DUMPS_DIR, `${name}.json`), JSON.stringify(info, null, 2));
  await page.screenshot({ path: path.join(SHOTS_DIR, `${name}.png`), fullPage: true }).catch(() => {});
  console.log(`[dump] ${name}: btn=${(info.buttons || []).length}`);
  return info;
}

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1440, height: 1600 } });
  attachNet(ctx);
  const page = ctx.pages()[0] || (await ctx.newPage());
  await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(1500);
  // 로그인(타임아웃 무제한) — API alive 기준으로 최대 2회 시도
  for (let attempt = 0; attempt < 2 && !(await alive(ctx)); attempt++) {
    await page.goto(SIGNIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {}); await sleep(2500);
    const pw = page.locator('input[type=password]').first();
    if (await pw.count().catch(() => 0)) { const c = creds(); await page.locator('input:not([type=password]):not([type=checkbox]):not([type=hidden])').first().fill(c.id).catch(() => {}); await pw.fill(c.pw).catch(() => {}); await page.locator('button[type=submit]').first().click().catch(() => {}); for (let i = 0; i < 40; i++) { await sleep(3000); const u = page.url(); if (/apps-in-toss/.test(u) && !/sign-in|sign-up/.test(u) && u !== `${ORIGIN}/`) break; if (u === `${ORIGIN}/` || /sign-up/.test(u)) await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded' }).catch(() => {}); } }
    await sleep(2000);
  }
  if (!(await alive(ctx))) { console.log('[fatal] 세션 확보 실패'); fs.writeFileSync(path.join(DUMPS_DIR, 'meta-submit-net.json'), JSON.stringify(netLog, null, 2)); await ctx.close(); process.exit(1); }
  console.log('[login] 세션 확보 OK');
  page.setDefaultTimeout(8000); // hang 방지: 로그인 이후 모든 액션 기본 8s

  await page.goto(META_URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  for (let i = 0; i < 15; i++) { const t = await page.evaluate(() => document.body ? document.body.innerText : '').catch(() => ''); if (t && !/잠시만 기다려주세요/.test(t) && /수정하기|앱 정보/.test(t)) break; await sleep(2000); }
  // "수정하기" → 편집 모드 진입을 file input(또는 textarea) 등장까지 폴링
  let inEdit = false;
  for (let attempt = 0; attempt < 4 && !inEdit; attempt++) {
    const loc = page.getByRole('button', { name: '수정하기' }).first();
    if (await loc.count().catch(() => 0)) { await loc.click({ timeout: 5000 }).catch(() => {}); }
    for (let i = 0; i < 6; i++) { await sleep(1500); if ((await page.locator('input[type=file]').count().catch(() => 0)) > 0 || (await page.locator('textarea').count().catch(() => 0)) > 0) { inEdit = true; break; } }
  }
  console.log('[edit] 편집 모드 진입=' + inEdit);
  await sleep(1500);

  const ti = page.locator('input[type=text], input:not([type]):not([type=file]):not([type=checkbox])');
  // input[1]=영어이름, [2]=부제, [4]=이메일 (probe 기준). 값 검증하며 채움.
  async function fillIdx(idx, val, label) { const f = ti.nth(idx); if (await f.count().catch(() => 0)) { await f.click().catch(() => {}); await f.fill(val).catch(() => {}); const v = await f.inputValue().catch(() => ''); console.log(`[fill] ${label}[${idx}] ok=${v === val}`); } }
  await fillIdx(1, DATA.nameEn, '영어이름');
  await fillIdx(2, DATA.subtitle, '부제');
  // 상세설명 textarea
  const ta = page.locator('textarea').first();
  if (await ta.count().catch(() => 0)) { await ta.click().catch(() => {}); await ta.fill(DATA.description).catch(() => {}); const v = await ta.inputValue().catch(() => ''); console.log(`[fill] 상세설명 len=${v.length}`); }
  await fillIdx(4, DATA.email, '이메일');

  // 검색 키워드: 입력 후 Enter (모든 액션에 짧은 timeout — hang 방지)
  try {
    const kwInput = page.locator('input[placeholder*="키워드"]').first();
    if (await kwInput.count({ timeout: 3000 }).catch(() => 0)) {
      for (const k of DATA.keywords) { await kwInput.fill(k, { timeout: 3000 }).catch(() => {}); await kwInput.press('Enter', { timeout: 3000 }).catch(() => {}); await sleep(350); }
      console.log('[fill] 키워드 10개 입력 시도');
    } else console.log('[fill] 키워드 input 미발견');
  } catch (e) { console.log('[fill] 키워드 단계 skip:', e.message); }

  // 카테고리: 키워드 추가 버튼과 텍스트가 겹칠 수 있어 best-effort (timeout 격리)
  try {
    const catAdd = page.getByRole('button', { name: '추가하기' }).last();
    if (await catAdd.count({ timeout: 3000 }).catch(() => 0)) {
      await catAdd.click({ timeout: 4000 }).catch(() => {}); await sleep(1500);
      for (const opt of DATA.category) { const o = page.getByText(opt, { exact: true }).first(); if (await o.count({ timeout: 2000 }).catch(() => 0)) { await o.click({ timeout: 3000 }).catch(() => {}); await sleep(700); } }
      console.log('[fill] 카테고리 선택 시도');
    }
  } catch (e) { console.log('[fill] 카테고리 단계 skip:', e.message); }

  // 에셋 업로드: file input 순서 [0]=로고,[1]=다크로고,[2]=스크린샷(여러장),[3]=썸네일
  const files = page.locator('input[type=file]');
  const nf = await files.count().catch(() => 0);
  console.log(`[asset] file inputs=${nf}`);
  const setFile = async (idx, p, label) => { if (idx < nf && fs.existsSync(p)) { await files.nth(idx).setInputFiles(p, { timeout: 8000 }).catch((e) => console.log(`[asset-err] ${label}`, e.message)); console.log(`[asset] ${label} set`); await sleep(5000); } };
  await setFile(0, `${ASSET_DIR}/icon.png`, '로고');
  await setFile(1, `${ASSET_DIR}/icon.png`, '다크로고');
  // screenshots: 단일 input이라 1장만 가능 → 1장 업로드 후, 추가 input이 생기면 순차 업로드
  const shots = [`${ASSET_DIR}/screenshot-1.png`, `${ASSET_DIR}/screenshot-2.png`, `${ASSET_DIR}/screenshot-3.png`];
  for (let s = 0; s < shots.length; s++) {
    const cur = page.locator('input[type=file]');
    const cnt = await cur.count().catch(() => 0);
    // 스크린샷 input은 accept=".png, .PNG" 중 로고/다크로고(idx 0,1) 다음. 매번 마지막 빈 png input 탐색.
    let target = -1;
    for (let i = 2; i < cnt; i++) { const acc = await cur.nth(i).getAttribute('accept').catch(() => ''); if (/png/i.test(acc)) { target = i; break; } }
    if (target < 0) { console.log(`[asset] 스크린샷${s + 1} input 없음`); break; }
    await cur.nth(target).setInputFiles(shots[s], { timeout: 8000 }).catch((e) => console.log(`[asset-err] 스크린샷${s + 1}`, e.message));
    console.log(`[asset] 스크린샷${s + 1} set (input[${target}])`);
    await sleep(5000);
  }
  // 썸네일: accept 에 jpg 포함된 input
  try {
    const thumb = page.locator('input[type=file][accept*="jpg"]').first();
    if (await thumb.count({ timeout: 3000 }).catch(() => 0)) { await thumb.setInputFiles(`${ASSET_DIR}/thumbnail.png`, { timeout: 8000 }).catch((e) => console.log('[asset-err] 썸네일', e.message)); console.log('[asset] 썸네일 set'); await sleep(5000); }
  } catch (e) { console.log('[asset] 썸네일 skip:', e.message); }
  await sleep(3000);

  const issued = [...new Set(netLog.filter((e) => e.issuedUrl).map((e) => e.issuedUrl))];
  fs.writeFileSync(path.join(DUMPS_DIR, 'meta-asset-urls.json'), JSON.stringify({ issued }, null, 2));
  console.log('[asset] 발급 URL 개수:', issued.length);
  issued.forEach((u) => console.log('[ASSET_URL=' + u + ']'));

  await dump(page, '71-meta-filled');

  if (process.env.PROBE_ONLY === '1') { fs.writeFileSync(path.join(DUMPS_DIR, 'meta-submit-net.json'), JSON.stringify(netLog, null, 2)); console.log('[probe] 저장/제출 생략'); await ctx.close(); console.log('[done] meta PROBE 완료'); return; }

  // 임시저장
  const tmp = page.getByRole('button', { name: '임시저장' }).first();
  if (await tmp.count().catch(() => 0)) { await tmp.click().catch(() => {}); await sleep(4000); console.log('[save] 임시저장 클릭'); await dump(page, '72-after-tempsave'); }

  // "다음" → step=1 (카테고리 및 노출) 진입
  const next = page.getByRole('button', { name: '다음' }).first();
  if (await next.count().catch(() => 0)) { await next.click({ timeout: 6000 }).catch(() => {}); await sleep(3500); console.log('[next] step1 진입'); }
  // 직접 URL 보정
  if (!/step=1/.test(page.url())) { await page.goto(`${ORIGIN}/workspace/${WS}/mini-app/${APP}/meta/edit?step=1`, { waitUntil: 'domcontentloaded' }).catch(() => {}); await sleep(3000); }
  for (let i = 0; i < 10; i++) { const t = await page.evaluate(() => document.body ? document.body.innerText : '').catch(() => ''); if (t && !/잠시만 기다려주세요/.test(t) && /카테고리|검토 요청/.test(t)) break; await sleep(1500); }

  // step=1 에셋(이 탭에도 로고/다크로고/썸네일 input) 재업로드 보장
  try {
    const sf = page.locator('input[type=file]');
    const n1 = await sf.count().catch(() => 0);
    if (n1 >= 1) { await sf.nth(0).setInputFiles(`${ASSET_DIR}/icon.png`, { timeout: 8000 }).catch(() => {}); await sleep(4000); }
    if (n1 >= 2) { await sf.nth(1).setInputFiles(`${ASSET_DIR}/icon.png`, { timeout: 8000 }).catch(() => {}); await sleep(4000); }
    const th = page.locator('input[type=file][accept*="jpg"]').first();
    if (await th.count().catch(() => 0)) { await th.setInputFiles(`${ASSET_DIR}/thumbnail.png`, { timeout: 8000 }).catch(() => {}); await sleep(4000); }
    // 스크린샷(이 탭) — 첫 png input 외 추가 png input
    for (let s = 0; s < shots.length; s++) { const cur = page.locator('input[type=file]'); const cnt = await cur.count().catch(() => 0); let tgt = -1; for (let i = 2; i < cnt; i++) { const acc = await cur.nth(i).getAttribute('accept').catch(() => ''); if (/png/i.test(acc) && !/jpg/i.test(acc)) { tgt = i; break; } } if (tgt < 0) break; await cur.nth(tgt).setInputFiles(shots[s], { timeout: 8000 }).catch(() => {}); await sleep(4000); }
    console.log('[step1] 에셋 재확인 업로드');
  } catch (e) { console.log('[step1] 에셋 skip:', e.message); }

  // 카테고리 선택: "추가하기" → 1순위 생활·쇼핑 > 생활
  try {
    const catAdd = page.getByRole('button', { name: '추가하기' }).first();
    if (await catAdd.count().catch(() => 0)) { await catAdd.click({ timeout: 4000 }).catch(() => {}); await sleep(1500); for (const opt of ['생활·쇼핑', '생활', '쇼핑']) { const o = page.getByText(opt, { exact: true }).first(); if (await o.count({ timeout: 2000 }).catch(() => 0)) { await o.click({ timeout: 3000 }).catch(() => {}); await sleep(700); } } // 모달 확인 버튼
      for (const t of ['확인', '선택', '완료', '추가']) { const c = page.locator('[role=dialog]').getByRole('button', { name: t }).first(); if (await c.count({ timeout: 1500 }).catch(() => 0)) { await c.click({ timeout: 3000 }).catch(() => {}); break; } } await sleep(1500); console.log('[step1] 카테고리 선택'); }
  } catch (e) { console.log('[step1] 카테고리 skip:', e.message); }

  // 약관/확인 체크박스 5개 모두 체크
  try {
    const boxes = page.locator('input[type=checkbox], [role=checkbox]');
    const nb = await boxes.count().catch(() => 0);
    let checked = 0;
    for (let i = 0; i < nb; i++) { const isChk = await boxes.nth(i).evaluate((e) => e.checked === true || e.getAttribute('aria-checked') === 'true').catch(() => false); if (!isChk) { await boxes.nth(i).click({ timeout: 3000 }).catch(() => {}); await sleep(300); checked++; } }
    console.log(`[step1] 체크박스 ${nb}개 중 ${checked}개 체크`);
  } catch (e) { console.log('[step1] 체크박스 skip:', e.message); }
  await sleep(1500);
  await dump(page, '73-step1-filled');

  // step1 임시저장(draft PUT 추가 반영)
  const tmp2 = page.getByRole('button', { name: '임시저장' }).first();
  if (await tmp2.count().catch(() => 0)) { await tmp2.click({ timeout: 5000 }).catch(() => {}); await sleep(3500); console.log('[save] step1 임시저장'); }

  // 검수 요청/제출 버튼 탐색 + 클릭
  let submitted = false;
  for (const label of ['검토 요청하기', '검수 요청', '검수 제출', '제출하기', '검토 요청', '제출']) {
    const loc = page.getByRole('button', { name: label }).first();
    if (!(await loc.count().catch(() => 0))) continue;
    const dis = await loc.evaluate((b) => b.disabled === true || b.getAttribute('aria-disabled') === 'true').catch(() => true);
    console.log(`[submit] "${label}" found disabled=${dis}`);
    if (dis) continue;
    await loc.click({ timeout: 6000 }).catch((e) => console.log('[submit-err]', e.message));
    await sleep(4000); await dump(page, '74-after-submit'); submitted = true;
    const dlg = await page.$$eval('[role=dialog],[role=alertdialog]', (els) => els.map((e) => (e.innerText || '').slice(0, 200))).catch(() => []);
    if (dlg.length) { console.log('[submit] dialog:', JSON.stringify(dlg).slice(0, 200)); for (const t of ['확인', '제출', '요청']) { const c = page.getByRole('button', { name: t }).last(); if (await c.count().catch(() => 0)) { const cd = await c.evaluate((b) => b.disabled === true || b.getAttribute('aria-disabled') === 'true').catch(() => true); if (!cd) { await c.click({ timeout: 5000 }).catch(() => {}); await sleep(4000); await dump(page, '75-after-confirm'); break; } } } }
    break;
  }
  console.log('[submit] submitted=' + submitted);

  fs.writeFileSync(path.join(DUMPS_DIR, 'meta-submit-net.json'), JSON.stringify(netLog, null, 2));
  await ctx.close();
  console.log('[done] meta-submit spike 완료');
})().catch((e) => { console.error('[fatal]', e.message); fs.writeFileSync(path.join(DUMPS_DIR, 'meta-submit-net.json'), JSON.stringify(netLog, null, 2)); process.exit(1); });
