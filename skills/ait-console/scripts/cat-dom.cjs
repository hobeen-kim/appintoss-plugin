#!/usr/bin/env node
'use strict';
// 카테고리 DOM 선택 단독 시도 (편집 진입 강화). fixed-cost-keeper(41246).
const fs = require('fs'); const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/tmp/ait-console-spike/node_modules/playwright')); }
const ORIGIN = 'https://apps-in-toss.toss.im', B = ORIGIN + '/console/api-public/v3/appsintossconsole';
const SIGNIN = 'https://business.toss.im/account/sign-in?client_id=4uktpjgqd0cp9txybqzuxc2y6w0cuupb&redirect_uri=https%3A%2F%2Fapps-in-toss.toss.im%2Fsign-up&state=%2Fworkspace';
const DUMPS = '/tmp/ait-console-spike/dumps-write', SHOTS = '/tmp/ait-console-spike/shots-write';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function creds() { return { id: process.env.AIT_CONSOLE_ID, pw: process.env.AIT_CONSOLE_PW }; }
async function alive(ctx) { try { const r = await ctx.request.get(B + '/workspaces', { failOnStatusCode: false }); const j = await r.json().catch(() => null); return j && j.resultType === 'SUCCESS'; } catch (e) { return false; } }
const net = [];
(async () => {
  const ctx = await chromium.launchPersistentContext('/Users/hobeen/.appintoss-console/profile', { headless: true, viewport: { width: 1440, height: 2000 } });
  ctx.on('requestfinished', async (req) => { try { const u = req.url(); if (!/toss\.im\/console/.test(new URL(u).host + new URL(u).pathname) || req.method() === 'GET') return; const e = { method: req.method(), path: new URL(u).pathname }; const post = req.postData(); if (post) { if (/categor/i.test(post)) e.cat = (JSON.stringify(JSON.parse(post)).match(/categor\w*":[^]]*?]/i) || [''])[0].slice(0, 200); } const res = await req.response(); if (res) e.status = res.status(); net.push(e); } catch {} });
  const p = ctx.pages()[0] || (await ctx.newPage());
  await p.goto(ORIGIN + '/workspace', { waitUntil: 'domcontentloaded' }).catch(() => {}); await sleep(1500);
  for (let a = 0; a < 2 && !(await alive(ctx)); a++) { await p.goto(SIGNIN, { waitUntil: 'domcontentloaded' }).catch(() => {}); await sleep(2500); const pw = p.locator('input[type=password]').first(); if (await pw.count()) { const c = creds(); await p.locator('input:not([type=password]):not([type=checkbox]):not([type=hidden])').first().fill(c.id); await pw.fill(c.pw); await p.locator('button[type=submit]').first().click(); for (let i = 0; i < 40; i++) { await sleep(3000); const u = p.url(); if (/apps-in-toss/.test(u) && !/sign-in|sign-up/.test(u) && u !== ORIGIN + '/') break; if (u === ORIGIN + '/' || /sign-up/.test(u)) await p.goto(ORIGIN + '/workspace', { waitUntil: 'domcontentloaded' }).catch(() => {}); } } await sleep(2000); }
  console.log('[login]', await alive(ctx));
  await p.goto(ORIGIN + '/workspace/27931/mini-app/41246/meta', { waitUntil: 'domcontentloaded' }).catch(() => {});
  for (let i = 0; i < 15; i++) { const t = await p.evaluate(() => document.body ? document.body.innerText : '').catch(() => ''); if (t && !/잠시만 기다려주세요/.test(t) && /수정하기/.test(t)) break; await sleep(2000); }
  // 편집 진입 강화: 클릭 후 최대 30s 체크박스5 등장 대기, 최대 5회
  let inEdit = false;
  for (let a = 0; a < 5 && !inEdit; a++) {
    const loc = p.getByRole('button', { name: '수정하기' }).first();
    if (await loc.count().catch(() => 0)) { await loc.click({ timeout: 6000 }).catch(() => {}); }
    for (let i = 0; i < 20; i++) { await sleep(1500); if ((await p.locator('input[type=checkbox]').count().catch(() => 0)) >= 5) { inEdit = true; break; } }
    if (!inEdit) { await p.goto(ORIGIN + '/workspace/27931/mini-app/41246/meta', { waitUntil: 'domcontentloaded' }).catch(() => {}); await sleep(3000); }
  }
  console.log('[edit]', inEdit);
  if (!inEdit) { console.log('[fatal] 편집 진입 실패'); await ctx.close(); process.exit(2); }
  p.setDefaultTimeout(9000);
  // "카테고리" 라벨 근처의 추가하기 클릭: 본문에서 카테고리 섹션 추가하기 후보 전부 시도
  await p.evaluate(() => { const el = Array.from(document.querySelectorAll('*')).find((e) => e.textContent && /미니앱 홈에서 노출될 카테고리/.test(e.textContent) && e.children.length < 5); if (el) el.scrollIntoView(); }).catch(() => {});
  await sleep(800);
  const adds = p.getByRole('button', { name: '추가하기' });
  const na = await adds.count().catch(() => 0);
  console.log('[add buttons]', na);
  let opened = false;
  for (let i = 0; i < na && !opened; i++) {
    await adds.nth(i).click({ timeout: 5000 }).catch(() => {});
    await sleep(2000);
    const opts = await p.evaluate(() => Array.from(document.querySelectorAll('[role=option],[role=menuitem],[role=dialog] *')).map((e) => (e.innerText || '').trim()).filter((t) => t && t.length < 16 && /생활|재무|쇼핑|콘텐츠|교통|건강|교육|여행|음식|금융/.test(t))).catch(() => []);
    if (opts.length) { console.log(`[add ${i}] 카테고리 옵션:`, JSON.stringify([...new Set(opts)].slice(0, 20))); opened = true; }
    else { await p.keyboard.press('Escape').catch(() => {}); await sleep(500); }
  }
  await p.screenshot({ path: path.join(SHOTS, 'cat-dom-open.png'), fullPage: true }).catch(() => {});
  if (opened) {
    for (const g of ['생활', '생활·쇼핑']) { const o = p.getByText(g, { exact: true }).first(); if (await o.count().catch(() => 0)) { await o.click().catch(() => {}); await sleep(1500); console.log('[cat] "' + g + '"'); break; } }
    const lv2 = await p.evaluate(() => Array.from(document.querySelectorAll('[role=option],[role=menuitem],[role=dialog] *')).map((e) => (e.innerText || '').trim()).filter((t) => t && t.length < 16)).catch(() => []);
    console.log('[lv2]', JSON.stringify([...new Set(lv2)].slice(0, 25)));
    for (const c2 of ['정보', '편의', '가계부', '도구', '기타']) { const o = p.getByText(c2, { exact: true }).first(); if (await o.count().catch(() => 0)) { await o.click().catch(() => {}); await sleep(1200); console.log('[cat2] "' + c2 + '"'); break; } }
    const lv3 = await p.evaluate(() => Array.from(document.querySelectorAll('[role=option],[role=menuitem],[role=dialog] *')).map((e) => (e.innerText || '').trim()).filter((t) => t && t.length < 16)).catch(() => []);
    console.log('[lv3]', JSON.stringify([...new Set(lv3)].slice(0, 25)));
    for (const c3 of ['기타', '도구', '정보']) { const o = p.getByText(c3, { exact: true }).first(); if (await o.count().catch(() => 0)) { await o.click().catch(() => {}); await sleep(1000); console.log('[cat3] "' + c3 + '"'); break; } }
    for (const t of ['확인', '완료', '선택', '적용', '추가']) { const c = p.locator('[role=dialog]').getByRole('button', { name: t }).first(); if (await c.count().catch(() => 0)) { await c.click().catch(() => {}); console.log('[modal] "' + t + '"'); break; } }
    await sleep(1500);
    const save = p.getByRole('button', { name: '임시저장' }).first();
    if (await save.count().catch(() => 0)) { await save.click().catch(() => {}); await sleep(3500); console.log('[save]'); }
  }
  // readback
  const r = await ctx.request.get(B + '/workspaces/27931/mini-app/41246/draft', { failOnStatusCode: false }); const j = await r.json();
  const cp = (j.success.impression || {}).categoryPaths || [];
  console.log('[readback categoryPaths]', cp.length, JSON.stringify(cp).slice(0, 200));
  fs.writeFileSync(path.join(DUMPS, 'cat-dom-net.json'), JSON.stringify(net, null, 2));
  await ctx.close();
  console.log('[done] cat-dom');
})().catch((e) => { console.error('[fatal]', e.message); process.exit(1); });
