'use strict';
/**
 * ait-console API client (cookie-session console REST).
 *
 * Uses a Playwright persistent context (shares the logged-in TBIZAUTH cookie
 * session) and `context.request` to call the console REST API directly —
 * no Bearer token, cookie session only (see references/console-dom-map.md §1).
 *
 * READ: GET endpoints from the dom-map §2 inventory.
 * WRITE: only the endpoints captured in dom-map §3-W ("캡처된 write API 목록"):
 *   deployments/initialize -> presigned S3 PUT -> deployments/complete,
 *   bundles/test-push, bundles/test-links.
 * Credentials / cookies / tokens / presigned URLs are NEVER printed.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// dom-map §3-W: deploymentId must be UUIDv7 (time-ordered). v4 rejected with errorCode 4000.
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

function generateDeploymentId() { return uuidv7(); }

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('/tmp/ait-console-spike/node_modules/playwright'));
}

// Profile dir is overridable for testing (AIT_CONSOLE_PROFILE) so a throwaway
// profile can be used without touching the live session profile.
const PROFILE_DIR = process.env.AIT_CONSOLE_PROFILE || '/Users/hobeen/.appintoss-console/profile';
const ORIGIN = 'https://apps-in-toss.toss.im';
const CONSOLE_URL = `${ORIGIN}/workspace`;
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;
const DOM_MAP = path.join(__dirname, '..', '..', 'references', 'console-dom-map.md');
// storageState persists the auth cookie (TBIZAUTH is httpOnly/session, so it is
// NOT kept by the persistent profile on its own). File is chmod 600 + gitignored.
const STATE_PATH = path.join(path.dirname(PROFILE_DIR), 'state.json');
// 2FA / extra-auth markers: only escalate to a visible window when these appear.
const TWO_FA_RE = /추가\s*인증|2단계|2차\s*인증|휴대폰\s*인증|문자\s*인증|인증\s*번호|인증\s*요청|OTP|verification|verify\s*your/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- SSOT: dom-map
// Parse the API inventory table in console-dom-map.md and resolve the base path
// + endpoint patterns from there, so URLs live in one place (the dom-map).
function loadEndpoints() {
  let base = `${ORIGIN}/console/api-public/v3/appsintossconsole`;
  const md = (() => {
    try { return fs.readFileSync(DOM_MAP, 'utf8'); } catch { return ''; }
  })();
  const baseMatch = md.match(/베이스 경로:\s*`([^`]+)`/);
  if (baseMatch) base = baseMatch[1];

  // Pull GET/POST/PUT path patterns out of the inventory tables
  // (§2 read inventory + §3-W "캡처된 write API 목록", backtick-wrapped).
  const patterns = new Set();
  const re = /`(?:GET|POST|PUT)\s+(\/[^`]+)`/g;
  let m;
  while ((m = re.exec(md)) !== null) {
    // a single backtick cell may hold two patterns separated by " / "
    for (const part of m[1].split(/\s+\/\s+(?=\.\.\.|\/)/)) {
      patterns.add(part.trim().replace(/^\.\.\./, ''));
    }
  }
  const has = (suffix) => [...patterns].some((p) => p.endsWith(suffix));
  // Verify the endpoints we rely on are actually documented in the SSOT.
  const required = ['/workspaces', '/mini-app', '/bundles', '/bundles/deployed', '/impression/category-list'];
  const missing = required.filter((s) => !has(s));
  // Write endpoints captured in §3-W — verified against the SSOT before any write call.
  const requiredWrite = [
    '/deployments/initialize', '/deployments/complete', '/bundles/test-push',
    '/resource/{ws}/upload', '/mini-app/{app}/draft', '/mini-app/review',
  ];
  const missingWrite = requiredWrite.filter((s) => !has(s));
  return {
    base,
    patterns: [...patterns],
    missing,
    missingWrite,
    url: {
      workspaces: () => `${base}/workspaces`,
      apps: (ws) => `${base}/workspaces/${ws}/mini-app`,
      appDetail: (ws, app) => `${base}/workspaces/${ws}/mini-app/${app}`,
      bundles: (ws, app) => `${base}/workspaces/${ws}/mini-app/${app}/bundles`,
      deployed: (ws, app) => `${base}/workspaces/${ws}/mini-app/${app}/bundles/deployed`,
      deployInit: (ws, app) => `${base}/workspaces/${ws}/mini-app/${app}/deployments/initialize`,
      deployComplete: (ws, app) => `${base}/workspaces/${ws}/mini-app/${app}/deployments/complete`,
      testPush: (ws, app) => `${base}/workspaces/${ws}/mini-app/${app}/bundles/test-push`,
      testLinks: (ws, app) => `${base}/workspaces/${ws}/mini-app/${app}/bundles/test-links`,
      resourceUpload: (ws) => `${base}/resource/${ws}/upload`,
      categoryList: () => `${base}/impression/category-list`,
      draft: (ws, app) => `${base}/workspaces/${ws}/mini-app/${app}/draft`,
      appInfoReview: (ws) => `${base}/workspaces/${ws}/mini-app/review`,
    },
  };
}

const EP = loadEndpoints();

// ---------------------------------------------------------------- credentials
function loadCredentials() {
  if (process.env.AIT_CONSOLE_ID && process.env.AIT_CONSOLE_PW) {
    return { id: process.env.AIT_CONSOLE_ID, pw: process.env.AIT_CONSOLE_PW };
  }
  const credPath = path.join(__dirname, '..', '..', '..', '..', '.appintoss', 'credentials.json');
  try {
    const c = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    if (c.id && c.pw) return c;
  } catch { /* no file */ }
  return null;
}

// ---------------------------------------------------------------- login (reused spike logic)
const ID_SELECTORS = [
  'input[type="email"]',
  'input[name*="id" i]',
  'input[name*="email" i]',
  'input[placeholder*="이메일"]',
  'input[placeholder*="ID" i]',
  'input[aria-label*="이메일"]',
];
const SUBMIT_TEXT_RE = /^(log ?in|sign ?in|로그인|확인|계속|continue)$/i;

function isConsoleLoggedInUrl(url) {
  return url.startsWith('https://apps-in-toss.toss.im') && !/sign-in|sign-up/.test(url) && url !== `${ORIGIN}/`;
}

async function tryFormLogin(page, creds) {
  const pwField = page.locator('input[type="password"]').first();
  if (!(await pwField.count())) return false;
  if (!creds) {
    console.error('[login] 자격증명 없음(AIT_CONSOLE_ID/PW env 또는 .appintoss/credentials.json) — 수동 로그인 대기');
    return false;
  }
  console.error('[login] 세션 만료 — id/pw 폼 자동 입력 시도');
  let idFilled = false;
  for (const sel of ID_SELECTORS) {
    const f = page.locator(sel).first();
    if (await f.count()) {
      await f.fill(creds.id).catch(() => {});
      if ((await f.inputValue().catch(() => '')) === creds.id) { idFilled = true; break; }
    }
  }
  if (!idFilled) {
    const f = page.locator('input:not([type="password"]):not([type="checkbox"]):not([type="hidden"])').first();
    if (await f.count()) await f.fill(creds.id).catch(() => {});
  }
  await pwField.fill(creds.pw).catch(() => {});
  const submitBtn = page.locator('button[type="submit"]').first();
  if (await submitBtn.count()) {
    await submitBtn.click().catch(() => {});
  } else {
    const candidates = page.locator('button, [role="button"]');
    const n = await candidates.count();
    let clicked = false;
    for (let i = 0; i < n; i++) {
      const txt = ((await candidates.nth(i).innerText().catch(() => '')) || '').trim();
      if (SUBMIT_TEXT_RE.test(txt)) { await candidates.nth(i).click().catch(() => {}); clicked = true; break; }
    }
    if (!clicked) await pwField.press('Enter').catch(() => {});
  }
  return true;
}

async function waitForLogin(page) {
  const start = Date.now();
  while (Date.now() - start < LOGIN_TIMEOUT_MS) {
    const url = page.url();
    if (isConsoleLoggedInUrl(url)) return true;
    if (url === `${ORIGIN}/` || /apps-in-toss\.toss\.im\/sign-up/.test(url)) {
      await page.goto(CONSOLE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      await sleep(3000);
      if (isConsoleLoggedInUrl(page.url())) return true;
    }
    await sleep(3000);
  }
  return false;
}

// ---------------------------------------------------------------- session
// The console returns HTTP 200 even when unauthenticated; auth is signalled
// only by the envelope (resultType "SUCCESS" vs "FAIL" errorCode 4010).
async function probeAuth(request) {
  try {
    const res = await request.get(EP.url.workspaces(), { failOnStatusCode: false });
    const json = await res.json().catch(() => null);
    return !!(json && json.resultType === 'SUCCESS');
  } catch {
    return false;
  }
}

async function launchCtx(headless) {
  const opts = { headless, viewport: { width: 1280, height: 800 } };
  // Restore the saved auth cookie if we have one (reduces re-login frequency).
  try {
    if (fs.existsSync(STATE_PATH)) opts.storageState = STATE_PATH;
  } catch { /* no state yet */ }
  return chromium.launchPersistentContext(PROFILE_DIR, opts);
}

// Persist the auth cookie to STATE_PATH with 0600 perms. Never logs contents.
async function saveState(ctx) {
  try {
    await ctx.storageState({ path: STATE_PATH });
    fs.chmodSync(STATE_PATH, 0o600);
  } catch (e) {
    console.error('[session] storageState 저장 실패(무시):', e.message);
  }
}

// 2FA / extra-auth detection: after submitting the password we are still
// unauthenticated AND the page shows an OTP/verification step (or stays on the
// sign-in origin). Ambiguous cases fall through to `true` (conservative: prefer
// a visible window over silently hanging).
async function needsHeadedFor2fa(page) {
  const url = page.url();
  const onAuthOrigin = /business\.toss\.im|sign-in|sign-up/.test(url);
  const bodyText = await page
    .evaluate(() => (document.body ? document.body.innerText : ''))
    .catch(() => '');
  if (TWO_FA_RE.test(bodyText)) return true;
  // Still on the auth origin but no recognizable 2FA text -> ambiguous: be safe.
  if (onAuthOrigin) return true;
  return false;
}

// Headless-first session, escalates to a visible window ONLY for 2FA:
//   1. Launch headless; probe auth. If the restored/profile cookie is valid,
//      return immediately (zero windows).
//   2. If unauthenticated, stay HEADLESS and auto-fill env credentials. Re-probe:
//      - SUCCESS  -> save storageState, return (headless login, still zero windows).
//      - 2FA seen -> relaunch HEADED so the user can complete the extra step.
//   3. Headed fallback: wait up to 5 min for the user, then save state + return.
// AIT_CONSOLE_HEADED=1 forces headed from the start (debug).
async function ensureSession() {
  if (EP.missing.length) {
    throw new Error(`dom-map SSOT에 필수 엔드포인트 누락: ${EP.missing.join(', ')}`);
  }
  const forceHeaded = process.env.AIT_CONSOLE_HEADED === '1';
  const creds = loadCredentials();

  // --- attempt 1: headless (unless forced headed) ---
  let ctx = await launchCtx(!forceHeaded);
  let page = ctx.pages()[0] || (await ctx.newPage());
  await page.goto(CONSOLE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(1500);

  if (await probeAuth(ctx.request)) {
    await saveState(ctx);
    return { ctx, request: ctx.request };
  }

  // --- attempt 2: headless login with env credentials ---
  if (!forceHeaded) {
    const started = await tryFormLogin(page, creds);
    if (started) {
      // Poll for auth; meanwhile watch for a 2FA step.
      let escalate = false;
      for (let i = 0; i < 6; i++) {
        await sleep(2500);
        if (await probeAuth(ctx.request)) {
          await saveState(ctx);
          return { ctx, request: ctx.request };
        }
        if (await needsHeadedFor2fa(page)) { escalate = true; break; }
      }
      if (escalate) {
        console.error('[session] 추가 인증(2FA) 감지 — headed 창으로 재기동해 사용자 대기');
        await ctx.close();
        ctx = await launchCtx(false);
        page = ctx.pages()[0] || (await ctx.newPage());
        await page.goto(CONSOLE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
        await sleep(1500);
        if (!(await probeAuth(ctx.request))) {
          const restarted = await tryFormLogin(page, creds);
          if (restarted) await waitForLogin(page);
          await sleep(1500);
        }
      }
    }
  } else {
    // forced headed: plain login + wait
    const started = await tryFormLogin(page, creds);
    if (started) await waitForLogin(page);
    await sleep(1500);
  }

  if (await probeAuth(ctx.request)) {
    await saveState(ctx);
    return { ctx, request: ctx.request };
  }
  await ctx.close();
  throw new Error('세션 확보 실패 — 로그인 미완료 또는 자격증명 무효');
}

// ---------------------------------------------------------------- read API
function unwrap(json) {
  // console envelope: { resultType:"SUCCESS", success:{...} }
  if (json && typeof json === 'object' && 'success' in json) return json.success;
  return json;
}

async function getJson(request, url) {
  const res = await request.get(url, { failOnStatusCode: false });
  const json = await res.json().catch(() => null);
  const short = url.replace(`${EP.base}`, '');
  if (!res.ok()) throw new Error(`GET ${short} -> HTTP ${res.status()}`);
  if (!json || json.resultType !== 'SUCCESS') {
    const code = json && json.error ? json.error.errorCode : '?';
    throw new Error(`GET ${short} -> ${json ? json.resultType : 'no-json'} (errorCode ${code})`);
  }
  return unwrap(json);
}

async function listWorkspaces(request) {
  const data = await getJson(request, EP.url.workspaces());
  return Array.isArray(data) ? data : [];
}

async function listApps(request, ws) {
  const data = await getJson(request, EP.url.apps(ws));
  return Array.isArray(data) ? data : [];
}

async function getAppVersions(request, ws, app) {
  const data = await getJson(request, EP.url.bundles(ws, app));
  // { contents:[...], totalPage, currentPage }
  if (data && Array.isArray(data.contents)) return data.contents;
  return Array.isArray(data) ? data : [];
}

async function getDeployed(request, ws, app) {
  try {
    return await getJson(request, EP.url.deployed(ws, app));
  } catch {
    return null; // app with no deployed bundle yet
  }
}

// App detail: { isBeforeFirstReview, hasApproved, hasInReview, hasDraft, miniApp:{...} }
// hasApproved is the 게이트 A signal (dom-map §3-W: 앱 정보 검토 승인 선행 조건).
async function getAppDetail(request, ws, app) {
  return getJson(request, EP.url.appDetail(ws, app));
}

// Category master tree (dom-map §3-W 단계0-B): [{ categoryGroup, categoryList:[{id,name,isSelectable,subCategoryList}] }].
async function getCategoryList(request) {
  const data = await getJson(request, EP.url.categoryList());
  return Array.isArray(data) ? data : [];
}

// Draft readback (dom-map 단계0-B: 미니앱 형태 평탄 객체 + impression + savedAt).
// Returns null when no draft exists (errorCode mini-app-draft.NotFound).
async function getDraft(request, ws, app) {
  try {
    return await getJson(request, EP.url.draft(ws, app));
  } catch {
    return null;
  }
}

// Resolve appName (slug) -> { workspace, app } across all workspaces, or null.
async function findApp(request, appName) {
  for (const ws of await listWorkspaces(request)) {
    const apps = await listApps(request, ws.id);
    const target = apps.find((a) => a.appName === appName);
    if (target) return { workspace: ws, app: target };
  }
  return null;
}

// ---------------------------------------------------------------- write API (dom-map §3-W 캡처분)
// Only endpoints actually captured in console-dom-map.md §3-W are implemented here.
// Anything not captured (검토 제출, 출시하기 등) is NOT implemented — no guessed URLs.

function assertWriteDocumented(step) {
  if (EP.missingWrite.length) {
    throw new Error(
      `[${step}] dom-map SSOT에 write 엔드포인트 누락: ${EP.missingWrite.join(', ')} — console-dom-map.md 갱신 필요`
    );
  }
}

async function postJson(request, url, body, step) {
  const res = await request.post(url, { data: body, failOnStatusCode: false });
  const json = await res.json().catch(() => null);
  const short = url.replace(`${EP.base}`, '');
  if (!res.ok()) throw new Error(`[${step}] POST ${short} -> HTTP ${res.status()}`);
  if (!json || json.resultType !== 'SUCCESS') {
    const code = json && json.error ? json.error.errorCode : '?';
    throw new Error(`[${step}] POST ${short} -> ${json ? json.resultType : 'no-json'} (errorCode ${code})`);
  }
  return unwrap(json);
}

async function putJson(request, url, body, step) {
  const res = await request.put(url, { data: body, failOnStatusCode: false });
  const json = await res.json().catch(() => null);
  const short = url.replace(`${EP.base}`, '');
  if (!res.ok()) throw new Error(`[${step}] PUT ${short} -> HTTP ${res.status()}`);
  if (!json || json.resultType !== 'SUCCESS') {
    const code = json && json.error ? json.error.errorCode : '?';
    throw new Error(`[${step}] PUT ${short} -> ${json ? json.resultType : 'no-json'} (errorCode ${code})`);
  }
  return unwrap(json);
}

// Asset upload (dom-map §3-W 단계0-A): POST /resource/{ws}/upload, multipart —
// file part field name MUST be `resource` (실측 확정; 다른 필드명은 errorCode 4000).
// Returns the issued static URL (https://static.toss.im/appsintoss/{ws}/<uuid>.<ext>).
async function uploadResource(request, ws, filePath, imageType) {
  assertWriteDocumented('resource/upload');
  const step = `resource-upload:${imageType}`;
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  const res = await request.post(EP.url.resourceUpload(ws), {
    multipart: {
      resource: { name: path.basename(filePath), mimeType, buffer: fs.readFileSync(filePath) },
    },
    failOnStatusCode: false,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok()) throw new Error(`[${step}] POST /resource/{ws}/upload -> HTTP ${res.status()}`);
  if (!json || json.resultType !== 'SUCCESS' || typeof json.success !== 'string') {
    const code = json && json.error ? json.error.errorCode : '?';
    throw new Error(`[${step}] POST /resource/{ws}/upload -> ${json ? json.resultType : 'no-json'} (errorCode ${code})`);
  }
  return json.success;
}

// App-info draft save (dom-map §3-W 단계0-B): PUT mini-app/{app}/draft.
// payload = { miniApp:{...}, impression:{ keywordList, categoryIds[], subCategoryIds[], isGameCategory } }
// (impression 쓰기 형식은 평탄 ID 배열 — categoryPaths/categoryList는 read 전용, PUT에 넣으면 무시됨).
async function saveDraft(request, ws, app, payload) {
  assertWriteDocumented('mini-app/draft');
  return putJson(request, EP.url.draft(ws, app), payload, 'mini-app/draft');
}

// App-info review submit (dom-map §3-W 단계0-B): POST mini-app/review.
// payload = { workspaceId, miniApp:{...images THUMBNAIL 먼저...}, impression:{keywordList,categoryIds,subCategoryIds} }
// readback: GET /mini-app/{app} -> hasInReview=true, hasDraft=false 전이.
async function submitAppInfoReview(request, ws, _app, payload) {
  assertWriteDocumented('mini-app/review');
  return postJson(request, EP.url.appInfoReview(ws), payload, 'mini-app/review');
}

// Upload 3-step (dom-map §3-W 단계1) — step 1: initialize.
// Returns { uploadUrl(presigned S3 — 서명 포함이라 절대 로그 금지), deployment{versionName,...} }.
async function initializeDeployment(request, ws, app, deploymentId) {
  assertWriteDocumented('deployments/initialize');
  return postJson(request, EP.url.deployInit(ws, app), { deploymentId }, 'deployments/initialize');
}

// Upload 3-step — step 2: PUT the .ait bytes to the presigned S3 URL.
// The presigned URL carries its own query-string signature (no console cookie needed).
async function uploadBundleToPresignedUrl(request, uploadUrl, filePath) {
  const buf = fs.readFileSync(filePath);
  const res = await request.put(uploadUrl, {
    data: buf,
    // presigned 서명 content-type=application/zip 일치 필수(octet-stream→403), dom-map §3-W 단계1
    headers: { 'content-type': 'application/zip' },
    timeout: 10 * 60 * 1000,
    failOnStatusCode: false,
  });
  // Never include uploadUrl in errors/logs — it embeds the S3 signature.
  if (!res.ok()) throw new Error(`[S3 PUT] presigned 업로드 실패 -> HTTP ${res.status()}`);
}

// Upload 3-step — step 3: complete (server then builds BUILDING -> CREATED).
async function completeDeployment(request, ws, app, deploymentId) {
  assertWriteDocumented('deployments/complete');
  return postJson(request, EP.url.deployComplete(ws, app), { deploymentId }, 'deployments/complete');
}

// Test push (dom-map §3-W 단계2): real device push; flips the bundle isTested false->true.
async function sendTestPush(request, ws, app, deploymentId) {
  assertWriteDocumented('bundles/test-push');
  return postJson(request, EP.url.testPush(ws, app), { deploymentId }, 'bundles/test-push');
}

// QR / deeplink for the test build (read).
async function getTestLinks(request, ws, app) {
  return getJson(request, EP.url.testLinks(ws, app));
}

module.exports = {
  uuidv7,
  generateDeploymentId,
  ensureSession,
  listWorkspaces,
  listApps,
  getAppVersions,
  getDeployed,
  getAppDetail,
  getCategoryList,
  getDraft,
  findApp,
  uploadResource,
  saveDraft,
  submitAppInfoReview,
  initializeDeployment,
  uploadBundleToPresignedUrl,
  completeDeployment,
  sendTestPush,
  getTestLinks,
  endpoints: EP,
};
