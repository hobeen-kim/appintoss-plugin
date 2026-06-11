#!/usr/bin/env node
'use strict';
// 앱 정보(meta) 검토 제출. fixed-cost-keeper(41246).
// 프론트 번들 실측: POST /workspaces/{ws}/mini-app/review, 바디 = Ql() 산출
// { workspaceId, miniApp{...}, impression{ keywordList, categoryIds, subCategoryIds }, datingCheckListPdfUrl }
// 제출 후 GET /mini-app/{app} 의 hasInReview readback.
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

  // 1) 현재 draft + 상태 확인
  const dr = await req.get(`${B}/workspaces/${WS}/mini-app/${FCK}/draft`, { failOnStatusCode: false });
  const dj = await dr.json();
  const m = dj.success.miniApp;
  const imp = dj.success.impression || {};
  const det0 = await (await req.get(`${B}/workspaces/${WS}/mini-app/${FCK}`, { failOnStatusCode: false })).json();
  console.log('[before] hasApproved=' + det0.success.hasApproved + ' hasInReview=' + det0.success.hasInReview + ' hasDraft=' + det0.success.hasDraft);
  if (det0.success.hasInReview) { console.log('[skip] 이미 검토 중'); await ctx.close(); process.exit(0); }
  const catOk = (imp.categoryPaths || []).length >= 1;
  console.log('[pre-check] categoryPaths=' + (imp.categoryPaths || []).length + ' keywords=' + (imp.keywordList || []).length + ' images=' + (m.images || []).length);
  if (!catOk) { console.log('[fatal] 카테고리 미반영 상태 — 제출 중단'); await ctx.close(); process.exit(2); }

  // 2) Ql 형식 바디 조립 (images: THUMBNAIL 먼저 + PREVIEW, 프론트 Jl 직렬화 복제)
  const images = [];
  const thumb = (m.images || []).find((i) => i.imageType === 'THUMBNAIL');
  if (thumb) images.push({ imageUrl: thumb.imageUrl, imageType: 'THUMBNAIL', orientation: 'HORIZONTAL', ...(thumb.backgroundColor != null ? { backgroundColor: thumb.backgroundColor } : {}), ...(thumb.backgroundTheme != null ? { backgroundTheme: thumb.backgroundTheme } : {}) });
  for (const i of (m.images || []).filter((x) => x.imageType === 'PREVIEW')) images.push({ imageUrl: i.imageUrl, imageType: 'PREVIEW', orientation: i.orientation });
  const body = {
    workspaceId: WS,
    miniApp: {
      miniAppId: FCK,
      title: m.title,
      titleEn: m.titleEn,
      iconUri: m.iconUri,
      status: m.status || 'PREPARE',
      appName: m.appName,
      minAge: m.minAge,
      maxAge: m.maxAge,
      darkModeIconUri: m.darkModeIconUri,
      csEmail: m.csEmail,
      csContract: m.csContract,
      csChatUri: m.csChatUri,
      description: m.description,
      detailDescription: m.detailDescription,
      specialCategory: m.specialCategory,
      images,
    },
    impression: {
      keywordList: imp.keywordList || [],
      categoryIds: [3820, 3882],
      subCategoryIds: [76, 60],
    },
  };
  const sr = await req.post(`${B}/workspaces/${WS}/mini-app/review`, { headers: { 'content-type': 'application/json' }, data: body, failOnStatusCode: false });
  const sj = await sr.json().catch(() => null);
  console.log('[POST review] status=' + sr.status() + ' resultType=' + (sj && sj.resultType) + (sj && sj.error ? ' err=' + sj.error.errorCode + ':' + sj.error.reason : ''));
  fs.writeFileSync(OUT + '/meta-review-submit-result.json', JSON.stringify(sj, null, 2));
  if (!sj || sj.resultType !== 'SUCCESS') { await ctx.close(); process.exit(3); }
  console.log('[POST review success]', JSON.stringify(sj.success).slice(0, 400));

  // 3) readback: hasInReview
  await sleep(2000);
  const det1 = await (await req.get(`${B}/workspaces/${WS}/mini-app/${FCK}`, { failOnStatusCode: false })).json();
  const s1 = det1.success;
  console.log('[after] hasApproved=' + s1.hasApproved + ' hasInReview=' + s1.hasInReview + ' hasDraft=' + s1.hasDraft + ' status=' + (s1.miniApp && s1.miniApp.status));
  await ctx.close();
  process.exit(s1.hasInReview ? 0 : 4);
})().catch((e) => { console.error('[fatal]', e.message); process.exit(1); });
