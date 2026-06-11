#!/usr/bin/env node
'use strict';
// fixed-cost-keeper(41246) 카테고리 저장: impression/category-list 조회 → PUT draft(categoryIds/subCategoryIds) → readback.
const fs = require('fs');
const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/tmp/ait-console-spike/node_modules/playwright')); }
const ORIGIN = 'https://apps-in-toss.toss.im';
const B = ORIGIN + '/console/api-public/v3/appsintossconsole';
const WS = 27931, FCK = 41246;
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
  const req = ctx.request;
  console.log('[login] OK');

  // 1) category master (frontend bundle 실측 엔드포인트)
  const mr = await req.get(B + '/impression/category-list', { failOnStatusCode: false });
  const mj = await mr.json().catch(() => null);
  console.log('[category-list]', mr.status(), mj && mj.resultType);
  fs.writeFileSync(OUT + '/cat-master.json', JSON.stringify(mj, null, 2));
  if (!mj || mj.resultType !== 'SUCCESS') { console.log('[fatal] category-list 실패', JSON.stringify(mj).slice(0, 300)); await ctx.close(); process.exit(2); }
  const tree = mj.success;
  console.log('[master shape]', JSON.stringify(tree).slice(0, 1200));

  // 2) 마스터에서 생활>편의>도구, 생활>정보>기타 유효성 확인
  const life = tree.find((g) => g.categoryGroup && g.categoryGroup.name === '생활');
  const conv = life && life.categoryList.find((c) => c.id === 3820 && c.isSelectable);
  const info = life && life.categoryList.find((c) => c.id === 3882 && c.isSelectable);
  const subTool = conv && conv.subCategoryList.find((s) => s.id === 76 && s.isSelectable);
  const subEtc = info && info.subCategoryList.find((s) => s.id === 60 && s.isSelectable);
  if (!conv || !info || !subTool || !subEtc) { console.log('[fatal] 마스터에서 대상 카테고리 미발견'); await ctx.close(); process.exit(3); }
  console.log('[target] 생활(7) > 편의(3820) > 도구(76), 생활(7) > 정보(3882) > 기타(60)');

  // 3) GET draft → miniApp 그대로 + impression 을 write 형식(categoryIds/subCategoryIds)으로 PUT
  const DRAFT = `${B}/workspaces/${WS}/mini-app/${FCK}/draft`;
  let r = await req.get(DRAFT, { failOnStatusCode: false });
  let j = await r.json();
  const draft = j.success;
  const body = {
    miniApp: draft.miniApp,
    impression: {
      keywordList: (draft.impression && draft.impression.keywordList) || [],
      categoryIds: [3820, 3882],
      subCategoryIds: [76, 60],
    },
  };
  const pr = await req.put(DRAFT, { headers: { 'content-type': 'application/json' }, data: body, failOnStatusCode: false });
  const pj = await pr.json().catch(() => null);
  console.log('[PUT draft] status=' + pr.status() + ' resultType=' + (pj && pj.resultType) + (pj && pj.error ? ' err=' + pj.error.errorCode + ':' + pj.error.reason : ''));

  // 4) readback
  await sleep(1500);
  r = await req.get(DRAFT, { failOnStatusCode: false });
  j = await r.json();
  const imp = (j.success && j.success.impression) || {};
  console.log('[readback impression]', JSON.stringify(imp).slice(0, 1200));
  const paths = imp.categoryPaths || [];
  const ok = paths.length >= 1;
  console.log('[READBACK 카테고리]', ok ? 'OK(' + paths.length + '개: ' + paths.map((p) => (p.group ? p.group.name : '?') + '>' + (p.category ? p.category.name : '?') + '>' + (p.subCategory ? p.subCategory.name : '-')).join(', ') + ')' : '미반영');
  fs.writeFileSync(OUT + '/cat-fix-readback.json', JSON.stringify(j.success, null, 2));

  await ctx.close();
  process.exit(ok ? 0 : 4);
})().catch((e) => { console.error('[fatal]', e.message); process.exit(1); });
