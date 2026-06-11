#!/usr/bin/env node
'use strict';
// 카테고리 DOM 선택 시 발생하는 API(또는 PUT draft impression) 캡처. fixed-cost-keeper(41246).
const fs = require('fs'); const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/tmp/ait-console-spike/node_modules/playwright')); }
const ORIGIN = 'https://apps-in-toss.toss.im', B = ORIGIN + '/console/api-public/v3/appsintossconsole';
const SIGNIN = 'https://business.toss.im/account/sign-in?client_id=4uktpjgqd0cp9txybqzuxc2y6w0cuupb&redirect_uri=https%3A%2F%2Fapps-in-toss.toss.im%2Fsign-up&state=%2Fworkspace';
const DUMPS = '/tmp/ait-console-spike/dumps-write';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function creds() { return { id: process.env.AIT_CONSOLE_ID, pw: process.env.AIT_CONSOLE_PW }; }
async function alive(ctx) { try { const r = await ctx.request.get(B + '/workspaces', { failOnStatusCode: false }); const j = await r.json().catch(() => null); return j && j.resultType === 'SUCCESS'; } catch (e) { return false; } }
const net = [];
(async () => {
  const ctx = await chromium.launchPersistentContext('/Users/hobeen/.appintoss-console/profile', { headless: true, viewport: { width: 1440, height: 1800 } });
  ctx.on('requestfinished', async (req) => { try { const u = req.url(); if (!/toss\.im\/console/.test(new URL(u).host + new URL(u).pathname)) return; if (req.method() === 'GET') return; const e = { method: req.method(), path: new URL(u).pathname }; const post = req.postData(); if (post) { try { const b = JSON.parse(post); e.bodyKeys = Object.keys(b); if (b.impression) e.impressionKeys = Object.keys(b.impression); if (/category|impression/i.test(post)) e.catSnippet = JSON.stringify(b).match(/categor[^}]{0,200}/i); } catch { e.body = post.slice(0, 80); } } const res = await req.response(); if (res) e.status = res.status(); net.push(e); } catch {} });
  const p = ctx.pages()[0] || (await ctx.newPage());
  await p.goto(ORIGIN + '/workspace', { waitUntil: 'domcontentloaded' }).catch(() => {}); await sleep(1500);
  for (let a = 0; a < 2 && !(await alive(ctx)); a++) { await p.goto(SIGNIN, { waitUntil: 'domcontentloaded' }).catch(() => {}); await sleep(2500); const pw = p.locator('input[type=password]').first(); if (await pw.count()) { const c = creds(); await p.locator('input:not([type=password]):not([type=checkbox]):not([type=hidden])').first().fill(c.id); await pw.fill(c.pw); await p.locator('button[type=submit]').first().click(); for (let i = 0; i < 40; i++) { await sleep(3000); const u = p.url(); if (/apps-in-toss/.test(u) && !/sign-in|sign-up/.test(u) && u !== ORIGIN + '/') break; if (u === ORIGIN + '/' || /sign-up/.test(u)) await p.goto(ORIGIN + '/workspace', { waitUntil: 'domcontentloaded' }).catch(() => {}); } } await sleep(2000); }
  console.log('[login]', await alive(ctx));
  await p.goto(ORIGIN + '/workspace/27931/mini-app/41246/meta', { waitUntil: 'domcontentloaded' }).catch(() => {});
  for (let i = 0; i < 12; i++) { const t = await p.evaluate(() => document.body ? document.body.innerText : '').catch(() => ''); if (t && !/잠시만 기다려주세요/.test(t) && /수정하기/.test(t)) break; await sleep(2000); }
  let inEdit = false;
  for (let a = 0; a < 4 && !inEdit; a++) { const loc = p.getByRole('button', { name: '수정하기' }).first(); if (await loc.count().catch(() => 0)) await loc.click({ timeout: 5000 }).catch(() => {}); for (let i = 0; i < 6; i++) { await sleep(1500); if ((await p.locator('input[type=checkbox]').count().catch(() => 0)) >= 5) { inEdit = true; break; } } }
  console.log('[edit]', inEdit);
  p.setDefaultTimeout(9000);
  // 카테고리 추가하기 (첫 번째) → 드롭다운 스크롤하여 '생활' 찾기
  const add = p.getByRole('button', { name: '추가하기' }).first();
  if (await add.count().catch(() => 0)) { await add.click().catch(() => {}); await sleep(2000); }
  // 옵션 전체 텍스트 + '생활' 클릭 시도
  const opts1 = await p.evaluate(() => Array.from(document.querySelectorAll('[role=option],[role=menuitem],li,button')).map((e) => (e.innerText || '').trim()).filter((t) => t && t.length < 16)).catch(() => []);
  console.log('[opts-lvl1]', JSON.stringify([...new Set(opts1)].slice(0, 30)));
  for (const g of ['생활', '생활·쇼핑', '재무·보험', '재무']) { const o = p.getByText(g, { exact: true }).first(); if (await o.count().catch(() => 0)) { await o.click().catch(() => {}); await sleep(1500); console.log('[cat] 대분류 "' + g + '" 클릭'); break; } }
  const opts2 = await p.evaluate(() => Array.from(document.querySelectorAll('[role=option],[role=menuitem],li,button')).map((e) => (e.innerText || '').trim()).filter((t) => t && t.length < 16)).catch(() => []);
  console.log('[opts-lvl2]', JSON.stringify([...new Set(opts2)].slice(0, 30)));
  for (const c2 of ['정보', '편의', '가계부', '도구', '기타']) { const o = p.getByText(c2, { exact: true }).first(); if (await o.count().catch(() => 0)) { await o.click().catch(() => {}); await sleep(1200); console.log('[cat] 중분류 "' + c2 + '" 클릭'); break; } }
  const opts3 = await p.evaluate(() => Array.from(document.querySelectorAll('[role=option],[role=menuitem],li,button')).map((e) => (e.innerText || '').trim()).filter((t) => t && t.length < 16)).catch(() => []);
  console.log('[opts-lvl3]', JSON.stringify([...new Set(opts3)].slice(0, 30)));
  for (const c3 of ['기타', '도구', '정보']) { const o = p.getByText(c3, { exact: true }).first(); if (await o.count().catch(() => 0)) { await o.click().catch(() => {}); await sleep(1000); console.log('[cat] 소분류 "' + c3 + '" 클릭'); break; } }
  // 모달 확인
  for (const t of ['확인', '완료', '선택', '적용', '추가']) { const c = p.locator('[role=dialog]').getByRole('button', { name: t }).first(); if (await c.count().catch(() => 0)) { await c.click().catch(() => {}); console.log('[cat] 모달 "' + t + '"'); break; } }
  await sleep(2000);
  // 임시저장 → impression PUT 캡처
  const save = p.getByRole('button', { name: '임시저장' }).first();
  if (await save.count().catch(() => 0)) { await save.click().catch(() => {}); await sleep(3500); }
  fs.writeFileSync(path.join(DUMPS, 'cat-capture-net.json'), JSON.stringify(net, null, 2));
  const puts = net.filter((e) => e.method === 'PUT' && /draft/.test(e.path));
  console.log('[draft PUTs]', JSON.stringify(puts.map((e) => ({ status: e.status, impKeys: e.impressionKeys, cat: e.catSnippet }))));
  // readback
  const r = await ctx.request.get(B + '/workspaces/27931/mini-app/41246/draft', { failOnStatusCode: false }); const j = await r.json();
  console.log('[readback categoryPaths]', JSON.stringify((j.success.impression || {}).categoryPaths));
  await ctx.close();
  console.log('[done] cat-capture');
})().catch((e) => { console.error('[fatal]', e.message); fs.writeFileSync('/tmp/ait-console-spike/dumps-write/cat-capture-net.json', JSON.stringify(net, null, 2)); process.exit(1); });
