#!/usr/bin/env node
/**
 * T19 spike: Apps in Toss Developer Center (console) login + DOM survey.
 * Read-only survey. NEVER clicks submit/deploy/send/save buttons
 * (only exception: the login form's own submit button).
 *
 * Usage:
 *   node spike-console.cjs                 # login (auto-fill if AIT_CONSOLE_ID/PW env set) + traversal
 *   node spike-console.cjs <url> [<url>..] # dump specific pages (already logged in)
 *
 * Credentials: AIT_CONSOLE_ID / AIT_CONSOLE_PW env vars, or .appintoss/credentials.json.
 * Tokens/cookies are NEVER written in full — presence + prefix(6) only.
 */
const path = require('path');
const fs = require('fs');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('/tmp/ait-console-spike/node_modules/playwright'));
}

const PROFILE_DIR = '/Users/hobeen/.appintoss-console/profile';
const SHOTS_DIR = '/tmp/ait-console-spike/shots';
const DUMPS_DIR = '/tmp/ait-console-spike/dumps';
const CONSOLE_URL = 'https://apps-in-toss.toss.im/workspace';
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_TRAVERSE_PAGES = 20;
const NAV_KEYWORD_RE = /배포|메시지|발송|고객센터|버전|검수|스토어|출시|등록|문의|통계|release|deploy|message|version|support|store/i;
const SENSITIVE_KEY_RE = /token|secret|password|passwd|auth|cookie|session|credential|signature|otp|pin/i;
const SKIP_URL_RE = /\.(png|jpe?g|gif|svg|woff2?|ttf|otf|css|ico|mp4|webp|js|map)(\?|$)/i;
const SKIP_HOST_RE = /hackle|hotjar|channel\.io|sentry|google|gstatic|doubleclick|facebook|datadog|amplitude/i;

fs.mkdirSync(SHOTS_DIR, { recursive: true });
fs.mkdirSync(DUMPS_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- credentials
function loadCredentials() {
  if (process.env.AIT_CONSOLE_ID && process.env.AIT_CONSOLE_PW) {
    return { id: process.env.AIT_CONSOLE_ID, pw: process.env.AIT_CONSOLE_PW };
  }
  const credPath = path.join(__dirname, '..', '..', '..', '.appintoss', 'credentials.json');
  try {
    const c = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    if (c.id && c.pw) return c;
  } catch { /* no file */ }
  return null;
}

// ---------------------------------------------------------------- masking
function maskUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    for (const [k] of u.searchParams) {
      if (SENSITIVE_KEY_RE.test(k)) u.searchParams.set(k, '[masked]');
    }
    return u.toString();
  } catch {
    return rawUrl;
  }
}

function looksLikeToken(s) {
  return typeof s === 'string' && s.length > 24 && /^[A-Za-z0-9_\-./+=]+$/.test(s);
}

function summarizeSchema(v, depth = 0, keyName = '') {
  if (v === null) return 'null';
  if (Array.isArray(v)) {
    if (depth >= 4) return `array(n=${v.length})`;
    return v.length === 0 ? 'array(empty)' : [`array(n=${v.length})`, summarizeSchema(v[0], depth + 1)];
  }
  const t = typeof v;
  if (t === 'object') {
    if (depth >= 4) return 'object';
    const o = {};
    for (const k of Object.keys(v).slice(0, 40)) o[k] = summarizeSchema(v[k], depth + 1, k);
    return o;
  }
  if (t === 'string') {
    if (SENSITIVE_KEY_RE.test(keyName) || looksLikeToken(v)) return `string(len=${v.length})[masked]`;
    return v.length <= 40 ? `string:"${v}"` : `string(len=${v.length}):"${v.slice(0, 24)}…"`;
  }
  if (t === 'number' || t === 'boolean') return `${t}:${v}`;
  return t;
}

// ---------------------------------------------------------------- network capture
const netLog = [];
let currentPageName = 'pre';

function attachNetworkCapture(ctx) {
  ctx.on('requestfinished', async (request) => {
    try {
      const url = request.url();
      const type = request.resourceType();
      if (!['xhr', 'fetch', 'document', 'other'].includes(type)) return;
      if (SKIP_URL_RE.test(url)) return;
      const host = new URL(url).host;
      if (SKIP_HOST_RE.test(host)) return;
      if (!/toss\.im/.test(host)) return;

      const headers = await request.allHeaders().catch(() => ({}));
      const authHeader = headers['authorization'];
      const cookieHeader = headers['cookie'];
      const entry = {
        page: currentPageName,
        method: request.method(),
        url: maskUrl(url),
        resourceType: type,
        kind: ['GET', 'HEAD', 'OPTIONS'].includes(request.method()) ? 'read' : 'write',
        auth: {
          authorizationHeader: !!authHeader,
          authorizationPrefix: authHeader ? authHeader.slice(0, 6) : null,
          cookieHeader: !!cookieHeader,
          cookieNames: cookieHeader
            ? cookieHeader.split(';').map((c) => c.split('=')[0].trim()).filter(Boolean)
            : [],
        },
      };
      const post = request.postData();
      if (post) {
        try {
          entry.requestBodySchema = summarizeSchema(JSON.parse(post));
        } catch {
          entry.requestBodySchema = `non-json(len=${post.length})`;
        }
      }
      const response = await request.response();
      if (response) {
        entry.status = response.status();
        const ct = (await response.allHeaders().catch(() => ({})))['content-type'] || '';
        entry.contentType = ct.split(';')[0];
        if (/json/.test(ct)) {
          const body = await response.body().catch(() => null);
          if (body && body.length < 300 * 1024) {
            try {
              entry.responseBodySchema = summarizeSchema(JSON.parse(body.toString('utf8')));
            } catch { /* not json */ }
          } else if (body) {
            entry.responseBodySchema = `json(too-large=${body.length}b)`;
          }
        }
      }
      netLog.push(entry);
    } catch { /* never break the page on capture errors */ }
  });
}

function flushNetLog() {
  fs.writeFileSync(path.join(DUMPS_DIR, 'netlog.json'), JSON.stringify(netLog, null, 2));
  const apiOnly = netLog.filter((e) => e.resourceType === 'xhr' || e.resourceType === 'fetch');
  console.log(`[net] captured ${netLog.length} entries (${apiOnly.length} xhr/fetch) -> dumps/netlog.json`);
}

// ---------------------------------------------------------------- dump
async function maskPasswordFields(page) {
  await page.evaluate(() => {
    document.querySelectorAll('input[type="password"]').forEach((i) => { i.value = '••••••••'; });
  }).catch(() => {});
}

async function dumpPage(page, name) {
  currentPageName = name;
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  // allow SPA render: poll until body has meaningful text (max 20s)
  for (let i = 0; i < 10; i++) {
    const len = await page.evaluate(() => (document.body ? document.body.innerText.trim().length : 0)).catch(() => 0);
    if (len > 50) break;
    await sleep(2000);
  }
  await sleep(2500);
  const info = await page.evaluate(() => {
    const attr = (el, names) => {
      const o = {};
      for (const n of names) {
        const v = el.getAttribute(n);
        if (v) o[n] = v;
      }
      return o;
    };
    const describe = (el) => ({
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || el.value || '').trim().slice(0, 120),
      ...attr(el, ['id', 'name', 'type', 'placeholder', 'aria-label', 'role', 'href', 'data-testid', 'data-tid', 'for', 'class', 'accept', 'maxlength', 'contenteditable']),
    });
    const q = (sel) => Array.from(document.querySelectorAll(sel)).map(describe);
    const inputs = q('input').map((i) => (i.type === 'password' ? { ...i, text: '[masked]' } : i));
    return {
      url: location.href,
      title: document.title,
      bodyTextHead: document.body ? document.body.innerText.slice(0, 3000) : '',
      links: q('a[href]'),
      buttons: q('button, [role="button"]'),
      inputs,
      textareas: q('textarea'),
      selects: q('select, [role="combobox"], [role="listbox"]'),
      labels: q('label'),
      editables: q('[contenteditable="true"]'),
      iframes: Array.from(document.querySelectorAll('iframe')).map((f) => ({ src: f.src, name: f.name, id: f.id })),
    };
  }).catch((e) => ({ error: String(e), url: page.url() }));
  fs.writeFileSync(path.join(DUMPS_DIR, `${name}.json`), JSON.stringify(info, null, 2));
  await maskPasswordFields(page);
  await page.screenshot({ path: path.join(SHOTS_DIR, `${name}.png`), fullPage: false }).catch(() => {});
  console.log(`[dump] ${name}: ${info.url || '?'} (links=${(info.links || []).length}, inputs=${(info.inputs || []).length}, buttons=${(info.buttons || []).length})`);
  return info;
}

// ---------------------------------------------------------------- login
const ID_SELECTORS = [
  'input[type="email"]',
  'input[name*="id" i]',
  'input[name*="email" i]',
  'input[placeholder*="이메일"]',
  'input[placeholder*="ID" i]',
  'input[aria-label*="이메일"]',
];
const SUBMIT_TEXT_RE = /^(log ?in|sign ?in|로그인|확인|계속|continue)$/i;

function detect2faText(bodyText) {
  return /추가\s*인증|2단계|2차\s*인증|휴대폰\s*인증|문자\s*인증|인증\s*번호|인증\s*요청|OTP|verification|verify\s*your/i.test(bodyText || '');
}

async function tryFormLogin(page, creds) {
  const pwField = page.locator('input[type="password"]').first();
  if (!(await pwField.count())) return { formFound: false };
  console.log('[login] id/pw 폼 감지 — 자동 입력 시도');
  if (!creds) {
    console.log('[login] 자격증명 없음(AIT_CONSOLE_ID/PW env 또는 .appintoss/credentials.json) — 수동 로그인 대기');
    return { formFound: true, filled: false };
  }
  let idFilled = false;
  for (const sel of ID_SELECTORS) {
    const f = page.locator(sel).first();
    if (await f.count()) {
      await f.fill(creds.id).catch(() => {});
      if ((await f.inputValue().catch(() => '')) === creds.id) { idFilled = true; break; }
    }
  }
  if (!idFilled) {
    // fallback: first visible text input that is not the password field
    const f = page.locator('input:not([type="password"]):not([type="checkbox"]):not([type="hidden"])').first();
    if (await f.count()) {
      await f.fill(creds.id).catch(() => {});
      idFilled = (await f.inputValue().catch(() => '')) === creds.id;
    }
  }
  await pwField.fill(creds.pw).catch(() => {});
  console.log(`[login] 입력 완료 (id=${idFilled ? 'ok' : 'FAILED'}, pw=ok) — 제출 시도`);

  let submitted = false;
  const submitBtn = page.locator('button[type="submit"]').first();
  if (await submitBtn.count()) {
    await submitBtn.click().catch(() => {});
    submitted = true;
  } else {
    const candidates = page.locator('button, [role="button"]');
    const n = await candidates.count();
    for (let i = 0; i < n; i++) {
      const txt = ((await candidates.nth(i).innerText().catch(() => '')) || '').trim();
      if (SUBMIT_TEXT_RE.test(txt)) {
        await candidates.nth(i).click().catch(() => {});
        submitted = true;
        break;
      }
    }
  }
  if (!submitted) {
    await pwField.press('Enter').catch(() => {});
    submitted = true;
  }
  await sleep(6000);
  const bodyText = await page.evaluate(() => (document.body ? document.body.innerText : '')).catch(() => '');
  if (detect2faText(bodyText)) {
    console.log('브라우저에서 추가 인증을 완료해주세요 (최대 5분 대기)');
  }
  return { formFound: true, filled: true, submitted };
}

function isConsoleLoggedInUrl(url) {
  return url.startsWith('https://apps-in-toss.toss.im') && !/sign-in|sign-up/.test(url) && url !== 'https://apps-in-toss.toss.im/';
}

async function waitForLogin(page) {
  const start = Date.now();
  let lastUrl = '';
  while (Date.now() - start < LOGIN_TIMEOUT_MS) {
    const url = page.url();
    if (url !== lastUrl) {
      console.log(`[poll] url: ${url}`);
      lastUrl = url;
    }
    if (isConsoleLoggedInUrl(url)) {
      console.log(`[login] 콘솔 origin 복귀 감지 — 로그인 완료로 판단: ${url}`);
      return true;
    }
    // some flows land on console root with a "콘솔 바로가기" link
    if (url === 'https://apps-in-toss.toss.im/' || /apps-in-toss\.toss\.im\/sign-up/.test(url)) {
      await page.goto(CONSOLE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      await sleep(3000);
      if (isConsoleLoggedInUrl(page.url())) {
        console.log(`[login] 콘솔 진입 확인: ${page.url()}`);
        return true;
      }
    }
    await sleep(5000);
  }
  console.log('[login] 5분 timeout — 로그인 미완료 상태로 진행');
  return false;
}

// ---------------------------------------------------------------- workspace selector
// /workspace shows workspace cards (non-anchor). Click the first card to enter.
async function enterWorkspaceIfSelector(page) {
  if (!/\/workspace\/?$/.test(page.url().split('?')[0].split('#')[0])) return false;
  const lines = await page.evaluate(() =>
    document.body.innerText.split('\n').map((s) => s.trim()).filter(Boolean)
  ).catch(() => []);
  const deny = /워크스페이스 만들기|님의 워크스페이스|관리하고 운영|새로운/;
  for (const line of lines) {
    if (deny.test(line) || line.length > 30) continue;
    const before = page.url();
    const el = page.getByText(line, { exact: true }).first();
    if (!(await el.count().catch(() => 0))) continue;
    await el.click().catch(() => {});
    await sleep(4000);
    if (page.url() !== before) {
      console.log(`[workspace] 카드 "${line}" 클릭 -> ${page.url()}`);
      return true;
    }
  }
  console.log('[workspace] 진입할 워크스페이스 카드 못 찾음');
  return false;
}

// ---------------------------------------------------------------- traversal (read-only)
function slug(s) {
  return s.replace(/^https?:\/\//, '').replace(/[^a-z0-9가-힣]+/gi, '_').slice(0, 70);
}

function collectNavHrefs(info, baseUrl) {
  const out = [];
  for (const l of info.links || []) {
    if (!l.href) continue;
    let abs;
    try { abs = new URL(l.href, baseUrl).toString(); } catch { continue; }
    if (!abs.startsWith('https://apps-in-toss.toss.im')) continue;
    if (/sign-in|sign-up|logout|sign-out/.test(abs)) continue;
    const matched = NAV_KEYWORD_RE.test(l.text || '') || NAV_KEYWORD_RE.test(abs) || /\/workspace\//.test(abs);
    if (matched) out.push({ href: abs.split('#')[0], text: (l.text || '').slice(0, 40) });
  }
  return out;
}

// Console nav is button/card based (role="menuitem", clickable cards), not <a>.
// Click read-only navigation targets by visible text and dump after each.
const SWEEP_MENU = ['앱', '멤버', 'API 키'];
const SWEEP_TAB_RE = /버전|배포|출시|스토어|검수|메시지|발송|고객센터|문의|기본 정보|앱 정보|히스토리|통계|리뷰/;
const WRITE_TEXT_RE = /제출|배포하기|발송|등록하기|저장|삭제|발행|업로드|강제/;

async function clickByTextSafe(page, text) {
  if (WRITE_TEXT_RE.test(text)) return false; // never trigger write actions
  const before = page.url();
  const loc = page.getByText(text, { exact: true }).first();
  if (!(await loc.count().catch(() => 0))) return false;
  await loc.scrollIntoViewIfNeeded().catch(() => {});
  await loc.click({ timeout: 5000 }).catch(() => {});
  await sleep(3000);
  return page.url() !== before || true;
}

async function operationalSweep(page) {
  console.log('[sweep] 운영 영역 순회 시작 (읽기 전용)');
  const homeUrl = page.url();

  // 1) Top menu items (앱/멤버/API 키)
  for (const m of SWEEP_MENU) {
    if (await clickByTextSafe(page, m)) {
      await dumpPage(page, `s-menu-${slug(m)}`);
    }
    await page.goto(homeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await sleep(2000);
  }

  // 2) Enter the first app card -> capture version/deploy/store/review tabs
  const appHome = await dumpPage(page, 's-app-list');
  const cardTitles = (appHome.bodyTextHead || '')
    .split('\n').map((s) => s.trim())
    .filter((s) => s && /계산기|봉투|상식|소비|영끌|할 말/.test(s));
  const firstCard = cardTitles[0];
  if (firstCard && (await clickByTextSafe(page, firstCard))) {
    await dumpPage(page, 's-app-detail');
    const detailUrl = page.url();
    console.log(`[sweep] 앱 상세 진입: ${detailUrl}`);
    // Sidebar nav items are button[role="menuitem"]. Click each read-only section.
    const menuTexts = await page.$$eval('button[role="menuitem"], [role="menuitem"]', (els) =>
      els.map((e) => (e.innerText || '').split('\n')[0].trim()).filter(Boolean)
    ).catch(() => []);
    const targets = [...new Set(menuTexts)].filter(
      (t) => SWEEP_TAB_RE.test(t) && !WRITE_TEXT_RE.test(t)
    );
    console.log(`[sweep] 사이드바 섹션 후보: ${targets.join(' | ')}`);
    let i = 0;
    for (const t of targets) {
      i++;
      if (i > 14) break;
      const before = page.url();
      const item = page.locator('[role="menuitem"]', { hasText: t }).first();
      if (!(await item.count().catch(() => 0))) continue;
      await item.click({ timeout: 5000 }).catch(() => {});
      await sleep(3500);
      await dumpPage(page, `s-tab-${String(i).padStart(2, '0')}-${slug(t)}`);
      if (page.url() === before) {
        // section may render in-place without URL change; that's fine, network captured
      }
    }
  } else {
    console.log('[sweep] 앱 카드 진입 실패 — 앱 상세 미확인');
  }
  await page.goto(homeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
}

async function traverse(page, startInfo) {
  const visited = new Set([page.url().split('#')[0]]);
  const queue = collectNavHrefs(startInfo, page.url());
  let count = 0;
  while (queue.length > 0 && count < MAX_TRAVERSE_PAGES) {
    const { href, text } = queue.shift();
    if (visited.has(href)) continue;
    visited.add(href);
    count++;
    console.log(`[traverse ${count}/${MAX_TRAVERSE_PAGES}] "${text}" -> ${href}`);
    await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch((e) => console.log(`[goto-err] ${e.message}`));
    const info = await dumpPage(page, `t-${String(count).padStart(2, '0')}-${slug(href)}`);
    for (const next of collectNavHrefs(info, page.url())) {
      if (!visited.has(next.href) && !queue.some((q) => q.href === next.href)) queue.push(next);
    }
  }
  console.log(`[traverse] ${count} pages visited, ${queue.length} left in queue (cap=${MAX_TRAVERSE_PAGES})`);
}

// ---------------------------------------------------------------- main
(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1440, height: 900 },
  });
  attachNetworkCapture(ctx);
  const page = ctx.pages()[0] || (await ctx.newPage());
  const urls = process.argv.slice(2);

  if (urls.length > 0) {
    for (let i = 0; i < urls.length; i++) {
      console.log(`[goto] ${urls[i]}`);
      await page.goto(urls[i], { waitUntil: 'domcontentloaded', timeout: 60000 }).catch((e) => console.log(`[goto-err] ${e.message}`));
      await dumpPage(page, `arg-${String(i).padStart(2, '0')}-${slug(urls[i])}`);
    }
  } else {
    await page.goto(CONSOLE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await dumpPage(page, '00-initial');

    let loggedIn = isConsoleLoggedInUrl(page.url());
    if (!loggedIn) {
      const creds = loadCredentials();
      const res = await tryFormLogin(page, creds);
      if (!res.formFound) console.log('[login] id/pw 폼 없음 — QR/앱 인증 플로우로 추정, 수동 로그인 대기');
      loggedIn = await waitForLogin(page);
    } else {
      console.log('[login] 기존 세션 유효 — 로그인 생략');
    }
    let info = await dumpPage(page, loggedIn ? '01-after-login' : '01-login-timeout');

    if (loggedIn) {
      if (await enterWorkspaceIfSelector(page)) {
        info = await dumpPage(page, '02-workspace-home');
      }
      await operationalSweep(page).catch((e) => console.log(`[sweep-err] ${e.message}`));
      await traverse(page, info);
    }
  }

  flushNetLog();
  await ctx.close();
  console.log('[done]');
})().catch((e) => {
  console.error('[fatal]', e);
  flushNetLog();
  process.exit(1);
});
