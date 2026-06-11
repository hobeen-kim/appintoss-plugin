#!/usr/bin/env node
'use strict';
// READ-ONLY probe: category master + my-fin-cal(22545) vs fixed-cost-keeper(41246) draft/detail.
const fs = require('fs');
const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/tmp/ait-console-spike/node_modules/playwright')); }
const ORIGIN = 'https://apps-in-toss.toss.im';
const B = ORIGIN + '/console/api-public/v3/appsintossconsole';
const WS = 27931, FIN = 22545, FCK = 41246;
const OUT = '/tmp/ait-console-spike/dumps-write';
const SIGNIN = 'https://business.toss.im/account/sign-in?client_id=4uktpjgqd0cp9txybqzuxc2y6w0cuupb&redirect_uri=https%3A%2F%2Fapps-in-toss.toss.im%2Fsign-up&state=%2Fworkspace';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function creds() {
  if (process.env.AIT_CONSOLE_ID && process.env.AIT_CONSOLE_PW) return { id: process.env.AIT_CONSOLE_ID, pw: process.env.AIT_CONSOLE_PW };
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '.appintoss', 'credentials.json'), 'utf8'));
}
async function alive(ctx) { try { const r = await ctx.request.get(B + '/workspaces', { failOnStatusCode: false }); const j = await r.json().catch(() => null); return !!(j && j.resultType === 'SUCCESS'); } catch { return false; } }
async function login() {
  const ctx = await chromium.launchPersistentContext('/Users/hobeen/.appintoss-console/profile', { headless: true });
  const p = ctx.pages()[0] || (await ctx.newPage());
  await p.goto(ORIGIN + '/workspace', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(1500);
  for (let a = 0; a < 2 && !(await alive(ctx)); a++) {
    await p.goto(SIGNIN, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await sleep(2500);
    const pw = p.locator('input[type=password]').first();
    if (await pw.count().catch(() => 0)) {
      const c = creds();
      await p.locator('input:not([type=password]):not([type=checkbox]):not([type=hidden])').first().fill(c.id).catch(() => {});
      await pw.fill(c.pw).catch(() => {});
      await p.locator('button[type=submit]').first().click().catch(() => {});
      for (let i = 0; i < 40; i++) { await sleep(3000); const u = p.url(); if (/apps-in-toss/.test(u) && !/sign-in|sign-up/.test(u) && u !== ORIGIN + '/') break; if (u === ORIGIN + '/' || /sign-up/.test(u)) await p.goto(ORIGIN + '/workspace', { waitUntil: 'domcontentloaded' }).catch(() => {}); }
    }
    await sleep(2000);
  }
  if (!(await alive(ctx))) { await ctx.close(); throw new Error('세션 확보 실패'); }
  return ctx;
}

(async () => {
  const ctx = await login();
  const request = ctx.request;
  console.log('[login] OK');
  const get = async (p) => {
    const r = await request.get(B + p, { failOnStatusCode: false });
    const j = await r.json().catch(() => null);
    return { status: r.status(), resultType: j && j.resultType, body: j };
  };

  // 1) category master
  const master = await get(`/workspaces/${WS}/mini-app/categories`);
  console.log('[categories master]', master.status, master.resultType);
  fs.writeFileSync(OUT + '/cat-master.json', JSON.stringify(master.body, null, 2));
  if (master.body && master.body.success) {
    const s = master.body.success;
    console.log('[master shape]', Array.isArray(s) ? `array(n=${s.length}) first=` + JSON.stringify(s[0]).slice(0, 400) : JSON.stringify(s).slice(0, 600));
  }

  // 2) my-fin-cal draft + detail impression
  for (const [name, app] of [['my-fin-cal', FIN], ['fixed-cost-keeper', FCK]]) {
    const draft = await get(`/workspaces/${WS}/mini-app/${app}/draft`);
    const detail = await get(`/workspaces/${WS}/mini-app/${app}`);
    const dImp = draft.body && draft.body.success && draft.body.success.impression;
    const mImp = detail.body && detail.body.success && detail.body.success.miniApp && detail.body.success.miniApp.impression;
    console.log(`[${name}] draft=${draft.status}/${draft.resultType} detail=${detail.status}/${detail.resultType}`);
    console.log(`[${name}] draft.impression=`, JSON.stringify(dImp).slice(0, 800));
    console.log(`[${name}] detail.miniApp.impression=`, JSON.stringify(mImp).slice(0, 800));
    fs.writeFileSync(`${OUT}/cat-${name}-draft.json`, JSON.stringify(draft.body, null, 2));
    fs.writeFileSync(`${OUT}/cat-${name}-detail.json`, JSON.stringify(detail.body, null, 2));
  }

  // 3) candidate read endpoints for per-app category
  for (const p of [
    `/workspaces/${WS}/mini-app/${FCK}/categories`,
    `/workspaces/${WS}/mini-app/${FCK}/category`,
    `/workspaces/${WS}/mini-app/${FCK}/impression`,
    `/workspaces/${WS}/mini-app/${FCK}/draft/impression`,
    `/workspaces/${WS}/mini-app/${FIN}/impression`,
  ]) {
    const r = await get(p);
    console.log('[probe]', p, '->', r.status, r.resultType, r.body && r.body.error ? r.body.error.errorCode : '', JSON.stringify(r.body && r.body.success).slice(0, 200));
  }

  await ctx.close();
  console.log('[done]');
})().catch((e) => { console.error('[fatal]', e.message); process.exit(1); });
