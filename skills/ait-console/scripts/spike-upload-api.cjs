#!/usr/bin/env node
'use strict';
/**
 * ait-console WRITE spike — 순수 API 업로드(3-step) + S3 PUT content-type 검증.
 * App: fixed-cost-keeper (ws 27931 / miniApp 41246).
 *   .ait: /Users/hobeen/study/appintoss/fixed-cost-keeper/app/fixed-cost-keeper.ait
 *
 * 목적: DOM 없이 deployments/initialize -> presigned S3 PUT -> complete 를 직접 호출하고,
 *       presigned PUT의 Content-Type 이슈(application/octet-stream 403 가능성)를 실측한다.
 * 그 다음 bundles/test-push 로 테스트 푸시 발송(승인됨).
 *
 * 세션: persistent profile(쿠키 TBIZAUTH). API FAIL 시 sign-in 강제 재로그인.
 * Tokens/cookies/credentials/presigned URL 값 미출력.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/tmp/ait-console-spike/node_modules/playwright')); }

const PROFILE_DIR = '/Users/hobeen/.appintoss-console/profile';
const DUMPS_DIR = '/tmp/ait-console-spike/dumps-write';
const ORIGIN = 'https://apps-in-toss.toss.im';
const WS = 27931, APP = 41246;
const BASE = `${ORIGIN}/console/api-public/v3/appsintossconsole/workspaces/${WS}/mini-app/${APP}`;
const AIT_PATH = '/Users/hobeen/study/appintoss/fixed-cost-keeper/app/fixed-cost-keeper.ait';
const SIGNIN_URL = 'https://business.toss.im/account/sign-in?client_id=4uktpjgqd0cp9txybqzuxc2y6w0cuupb&redirect_uri=https%3A%2F%2Fapps-in-toss.toss.im%2Fsign-up&state=%2Fworkspace';
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;
fs.mkdirSync(DUMPS_DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 콘솔은 시간순 UUIDv7 deploymentId를 요구(v4는 errorCode 4000 거부). 직접 생성.
function uuidv7() {
  const ts = Date.now();
  const b = crypto.randomBytes(16);
  b[0] = (ts / 2 ** 40) & 0xff; b[1] = (ts / 2 ** 32) & 0xff; b[2] = (ts / 2 ** 24) & 0xff;
  b[3] = (ts / 2 ** 16) & 0xff; b[4] = (ts / 2 ** 8) & 0xff; b[5] = ts & 0xff;
  b[6] = (b[6] & 0x0f) | 0x70; // version 7
  b[8] = (b[8] & 0x3f) | 0x80; // variant
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function creds() { if (process.env.AIT_CONSOLE_ID && process.env.AIT_CONSOLE_PW) return { id: process.env.AIT_CONSOLE_ID, pw: process.env.AIT_CONSOLE_PW }; try { const c = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '.appintoss', 'credentials.json'), 'utf8')); if (c.id && c.pw) return c; } catch {} return null; }
function isLoggedIn(u) { return /^https:\/\/apps-in-toss\.toss\.im/.test(u) && !/sign-in|sign-up/.test(u) && u !== `${ORIGIN}/`; }
async function apiAlive(ctx) { try { const r = await ctx.request.get(`${ORIGIN}/console/api-public/v3/appsintossconsole/workspaces`, { failOnStatusCode: false }); const j = await r.json().catch(() => null); return !!(j && j.resultType === 'SUCCESS'); } catch (e) { return false; } }
async function login(page) {
  const pw = page.locator('input[type=password]').first();
  if (!(await pw.count())) return;
  const c = creds(); if (!c) { console.error('[login] 자격증명 없음'); return; }
  const idf = page.locator('input:not([type=password]):not([type=checkbox]):not([type=hidden])').first();
  await idf.fill(c.id).catch(() => {});
  await pw.fill(c.pw).catch(() => {});
  const sb = page.locator('button[type=submit]').first();
  if (await sb.count()) await sb.click().catch(() => {}); else await pw.press('Enter').catch(() => {});
  const start = Date.now();
  while (Date.now() - start < LOGIN_TIMEOUT_MS) { if (isLoggedIn(page.url())) return; if (page.url() === `${ORIGIN}/` || /sign-up/.test(page.url())) { await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded' }).catch(() => {}); await sleep(3000); if (isLoggedIn(page.url())) return; } await sleep(3000); }
}
async function ensureLogin(ctx, page) {
  if (await apiAlive(ctx)) return true;
  console.error('[login] 세션 만료 — sign-in 강제 로그인');
  await page.goto(SIGNIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(2500); await login(page); await sleep(2000);
  return apiAlive(ctx);
}

async function postJson(ctx, url, body) {
  const r = await ctx.request.post(url, { headers: { 'content-type': 'application/json' }, data: body, failOnStatusCode: false });
  const j = await r.json().catch(() => null);
  return { status: r.status(), json: j };
}
async function getBundles(ctx) { const r = await ctx.request.get(`${BASE}/bundles`, { failOnStatusCode: false }); const j = await r.json().catch(() => null); if (!j || j.resultType !== 'SUCCESS') return { error: j ? j.resultType : 'no-json' }; return (j.success && j.success.contents || []).map((v) => ({ versionName: v.versionName, reviewStatus: v.reviewStatus, isTested: v.isTested, deployed: v.deployed, sdkVersion: v.sdkVersion })); }

// presigned PUT with a given content-type via Playwright request (separate from cookie session)
async function s3Put(ctx, url, buf, contentType) {
  const headers = {};
  if (contentType !== null) headers['content-type'] = contentType;
  const r = await ctx.request.fetch(url, { method: 'PUT', headers, data: buf, failOnStatusCode: false });
  const status = r.status();
  let bodyHead = '';
  if (status >= 300) { bodyHead = (await r.text().catch(() => '')).slice(0, 300).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
  return { status, bodyHead };
}

(async () => {
  if (!fs.existsSync(AIT_PATH)) { console.error('[fatal] .ait 없음:', AIT_PATH); process.exit(2); }
  const buf = fs.readFileSync(AIT_PATH);
  console.log(`[ait] ${AIT_PATH} (${buf.length} bytes)`);

  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true });
  const page = ctx.pages()[0] || (await ctx.newPage());
  await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(1500);
  if (!(await ensureLogin(ctx, page))) { console.log('[fatal] 세션 확보 실패'); await ctx.close(); process.exit(1); }

  console.log('[bundles:before]', JSON.stringify(await getBundles(ctx)));

  // STEP 1: initialize
  const deploymentId = uuidv7();
  const init = await postJson(ctx, `${BASE}/deployments/initialize`, { deploymentId });
  console.log('[initialize] status', init.status, 'resultType', init.json && init.json.resultType);
  if (!init.json || init.json.resultType !== 'SUCCESS') { console.log('[fatal] initialize 실패', JSON.stringify(init.json).slice(0, 200)); await ctx.close(); process.exit(1); }
  const uploadUrl = init.json.success.uploadUrl;
  const dep = init.json.success.deployment;
  console.log('[initialize] versionName', dep && dep.versionName, '| uploadUrl host', (() => { try { return new URL(uploadUrl).host; } catch (e) { return '?'; } })());
  // presigned 서명에 포함된 헤더 추출(값 아님, 메타만) — SignatureDoesNotMatch 디버깅용
  try {
    const q = new URL(uploadUrl).searchParams;
    const signed = q.get('X-Amz-SignedHeaders');
    console.log('[presign] X-Amz-SignedHeaders=' + signed + ' | algo=' + q.get('X-Amz-Algorithm') + ' | hasExpires=' + !!q.get('X-Amz-Expires'));
  } catch {}

  // STEP 2: presigned S3 PUT.
  // 실측 확정: presigned 서명 헤더 = "content-type;host", 콘솔이 .ait 를 application/zip 으로 서명·전송.
  // -> PUT Content-Type 은 반드시 "application/zip" (octet-stream/empty/none 은 SignatureDoesNotMatch 403).
  const ctResults = [];
  const tryTypes = ['application/zip'];
  let putOk = false, usedCT = null, finalDeploymentId = deploymentId, finalUploadUrl = uploadUrl, finalDep = dep;
  for (let ti = 0; ti < tryTypes.length; ti++) {
    const ct = tryTypes[ti];
    let url = finalUploadUrl;
    if (ti > 0) { // re-initialize with a NEW deploymentId for a fresh presigned URL
      const ndid = uuidv7();
      const re = await postJson(ctx, `${BASE}/deployments/initialize`, { deploymentId: ndid });
      if (re.json && re.json.resultType === 'SUCCESS') { url = re.json.success.uploadUrl; finalDeploymentId = ndid; finalDep = re.json.success.deployment; }
    }
    const res = await s3Put(ctx, url, buf, ct);
    const label = ct === null ? '(no content-type header)' : (ct === '' ? '(empty content-type)' : ct);
    console.log(`[s3 PUT] content-type=${label} -> HTTP ${res.status}${res.bodyHead ? ' | ' + res.bodyHead.slice(0, 120) : ''}`);
    ctResults.push({ contentType: label, status: res.status, bodyHead: res.bodyHead });
    if (res.status >= 200 && res.status < 300) { putOk = true; usedCT = label; break; }
  }
  const deploymentId2 = finalDeploymentId; const dep2 = finalDep;
  fs.writeFileSync(path.join(DUMPS_DIR, 's3-content-type-results.json'), JSON.stringify({ deploymentIdLen: deploymentId.length, results: ctResults, putOk, usedCT }, null, 2));

  if (!putOk) { console.log('[fatal] S3 PUT 모든 content-type 실패 — complete 생략'); await ctx.close(); process.exit(1); }

  // STEP 3: complete
  const comp = await postJson(ctx, `${BASE}/deployments/complete`, { deploymentId: deploymentId2 });
  console.log('[complete] status', comp.status, 'resultType', comp.json && comp.json.resultType);

  // readback build
  let built = null;
  for (let i = 0; i < 8; i++) { const b = await getBundles(ctx); const v = Array.isArray(b) ? b.find((x) => x.versionName === (dep2 && dep2.versionName)) : null; console.log(`[poll ${i}]`, v ? JSON.stringify(v) : '(없음)'); if (v && v.sdkVersion) { built = v; break; } await sleep(5000); }
  console.log('[bundles:after]', JSON.stringify(await getBundles(ctx)));

  // test-push (승인됨)
  let pushed = false, tested = false;
  const tp = await postJson(ctx, `${BASE}/bundles/test-push`, { deploymentId: deploymentId2 });
  console.log('[test-push] status', tp.status, 'resultType', tp.json && tp.json.resultType);
  pushed = tp.json && tp.json.resultType === 'SUCCESS';
  for (let i = 0; i < 6; i++) { const b = await getBundles(ctx); const v = Array.isArray(b) ? b.find((x) => x.versionName === (dep2 && dep2.versionName)) : null; if (v && v.isTested) { tested = true; break; } await sleep(4000); }
  console.log('[test-push] isTested=' + tested);

  fs.writeFileSync(path.join(DUMPS_DIR, 'upload-api-result.json'), JSON.stringify({ versionName: dep2 && dep2.versionName, putContentType: usedCT, built, pushed, tested }, null, 2));
  await ctx.close();
  console.log('[done] upload-api spike 완료');
})().catch((e) => { console.error('[fatal]', e.message); process.exit(1); });
