#!/usr/bin/env node
'use strict';
/**
 * 앱 정보(meta) 편집 폼 구조 정밀 탐색 (PROBE — 입력/저장/제출 안 함).
 * fixed-cost-keeper (ws 27931 / miniApp 41246) 의 /meta "수정하기" 폼 전체 셀렉터 캡처.
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
const SIGNIN_URL = 'https://business.toss.im/account/sign-in?client_id=4uktpjgqd0cp9txybqzuxc2y6w0cuupb&redirect_uri=https%3A%2F%2Fapps-in-toss.toss.im%2Fsign-up&state=%2Fworkspace';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function creds() { if (process.env.AIT_CONSOLE_ID && process.env.AIT_CONSOLE_PW) return { id: process.env.AIT_CONSOLE_ID, pw: process.env.AIT_CONSOLE_PW }; try { const c = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '.appintoss', 'credentials.json'), 'utf8')); if (c.id && c.pw) return c; } catch {} return null; }
async function alive(ctx) { try { const r = await ctx.request.get(`${ORIGIN}/console/api-public/v3/appsintossconsole/workspaces`, { failOnStatusCode: false }); const j = await r.json().catch(() => null); return !!(j && j.resultType === 'SUCCESS'); } catch (e) { return false; } }

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1440, height: 1600 } });
  const page = ctx.pages()[0] || (await ctx.newPage());
  await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(1500);
  if (!(await alive(ctx))) {
    await page.goto(SIGNIN_URL, { waitUntil: 'domcontentloaded' }).catch(() => {}); await sleep(2500);
    const pw = page.locator('input[type=password]').first();
    if (await pw.count()) { const c = creds(); await page.locator('input:not([type=password]):not([type=checkbox]):not([type=hidden])').first().fill(c.id); await pw.fill(c.pw); await page.locator('button[type=submit]').first().click(); for (let i = 0; i < 40; i++) { await sleep(3000); const u = page.url(); if (/apps-in-toss/.test(u) && !/sign-in|sign-up/.test(u) && u !== `${ORIGIN}/`) break; if (u === `${ORIGIN}/` || /sign-up/.test(u)) await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded' }).catch(() => {}); } }
  }
  await page.goto(META_URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  for (let i = 0; i < 12; i++) { const t = await page.evaluate(() => document.body ? document.body.innerText : '').catch(() => ''); if (t && !/잠시만 기다려주세요/.test(t)) break; await sleep(2000); }
  // enter edit
  for (const t of ['수정하기', '수정', '편집']) { const loc = page.getByRole('button', { name: t }).first(); if (await loc.count().catch(() => 0)) { await loc.click({ timeout: 5000 }).catch(() => {}); await sleep(3000); console.log(`[edit] "${t}"`); break; } }
  await sleep(2000);
  const info = await page.evaluate(() => {
    const attr = (el, ns) => { const o = {}; for (const n of ns) { const v = el.getAttribute(n); if (v != null) o[n] = v; } return o; };
    const desc = (el) => ({ tag: el.tagName.toLowerCase(), text: (el.innerText || el.value || '').trim().slice(0, 60), value: (el.value || '').slice(0, 60), ...attr(el, ['id', 'name', 'type', 'placeholder', 'aria-label', 'role', 'data-testid', 'accept', 'maxlength', 'contenteditable', 'class']) });
    const q = (s) => Array.from(document.querySelectorAll(s)).map(desc);
    // label/section context: list visible labels and headings
    const labels = Array.from(document.querySelectorAll('label, h2, h3, [class*=label], [class*=title]')).map((e) => (e.innerText || '').trim()).filter((t) => t && t.length < 40).slice(0, 60);
    return { url: location.href, inputs: q('input'), textareas: q('textarea'), fileInputs: q('input[type=file]'), selects: q('select,[role=combobox],[role=listbox],[role=radiogroup]'), buttons: q('button,[role=button]').filter((b) => b.text), labels };
  }).catch((e) => ({ error: String(e) }));
  fs.writeFileSync(path.join(DUMPS_DIR, '70-meta-edit-full.json'), JSON.stringify(info, null, 2));
  await page.screenshot({ path: path.join(SHOTS_DIR, '70-meta-edit-full.png'), fullPage: true }).catch(() => {});
  console.log('[probe] inputs=' + (info.inputs || []).length + ' textareas=' + (info.textareas || []).length + ' files=' + (info.fileInputs || []).length + ' selects=' + (info.selects || []).length);
  console.log('[labels]', (info.labels || []).join(' | '));
  console.log('[textareas]', JSON.stringify((info.textareas || []).map((t) => ({ ph: t.placeholder, ml: t.maxlength }))));
  console.log('[file accepts]', JSON.stringify((info.fileInputs || []).map((f) => f.accept)));
  console.log('[buttons]', (info.buttons || []).map((b) => b.text.split('\n')[0]).filter(Boolean).slice(0, 25).join(' | '));
  await ctx.close();
  console.log('[done] meta-probe 완료');
})().catch((e) => { console.error('[fatal]', e.message); process.exit(1); });
