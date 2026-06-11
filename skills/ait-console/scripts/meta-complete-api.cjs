#!/usr/bin/env node
'use strict';
/**
 * 앱 정보 완성 (API 기반 + readback). fixed-cost-keeper(41246).
 * 현재 draft 누락분: impression.categoryPaths(카테고리), impression.keywordList(키워드10), 썸네일 이미지.
 *
 * 1) GET draft → 현재 miniApp/impression 로드
 * 2) 썸네일 업로드(POST resource/{ws}/upload, multipart) → URL 발급
 * 3) PUT draft 로 categoryPaths + keywordList + images(PREVIEW 유지 + THUMBNAIL 추가) 병합
 * 4) GET draft readback → 항목별 검증
 * categoryPaths: my-fin-cal 실측 형식 재사용(생활(7) > 정보(3882) > 기타(60), 생활 > 편의(3820) > 도구(76))
 */
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/tmp/ait-console-spike/node_modules/playwright')); }
const ORIGIN = 'https://apps-in-toss.toss.im';
const WS = 27931, APP = 41246;
const B = `${ORIGIN}/console/api-public/v3/appsintossconsole`;
const DRAFT = `${B}/workspaces/${WS}/mini-app/${APP}/draft`;
const UPLOAD = `${B}/resource/${WS}/upload`;
const THUMB = '/Users/hobeen/study/appintoss/fixed-cost-keeper/docs/assets/thumbnail.png';
const SIGNIN = 'https://business.toss.im/account/sign-in?client_id=4uktpjgqd0cp9txybqzuxc2y6w0cuupb&redirect_uri=https%3A%2F%2Fapps-in-toss.toss.im%2Fsign-up&state=%2Fworkspace';
const DUMPS = '/tmp/ait-console-spike/dumps-write';
const KEYWORDS = ['고정비', '월세', '보험료', '구독료', '결제일', '가계부', '지출관리', '리마인더', '알림', '고정지출'];
// my-fin-cal 실측 유효 조합 (생활 그룹 id=7)
const G = { id: 7, name: '생활', isSelectable: true, isGameCategory: false };
const CAT_INFO = { id: 3882, name: '정보', isSelectable: true };
const CAT_CONV = { id: 3820, name: '편의', isSelectable: true };
const CATEGORY_PATHS = [
  { group: G, category: CAT_INFO, subCategory: { id: 60, name: '기타', isSelectable: true }, categoryGroup: G, isGameCategory: false },
  { group: G, category: CAT_CONV, subCategory: { id: 76, name: '도구', isSelectable: true }, categoryGroup: G, isGameCategory: false },
];
// my-fin-cal 실측 categoryList 구조 정확 복제 (categoryGroup+category, isSelectable)
const CATEGORY_LIST = [
  { categoryGroup: { id: 7, name: '생활', isSelectable: true }, category: { id: 3882, name: '정보', isSelectable: true } },
  { categoryGroup: { id: 7, name: '생활', isSelectable: true }, category: { id: 3820, name: '편의', isSelectable: true } },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function creds() { if (process.env.AIT_CONSOLE_ID && process.env.AIT_CONSOLE_PW) return { id: process.env.AIT_CONSOLE_ID, pw: process.env.AIT_CONSOLE_PW }; try { const c = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '.appintoss', 'credentials.json'), 'utf8')); if (c.id && c.pw) return c; } catch {} return null; }
async function alive(ctx) { try { const r = await ctx.request.get(`${B}/workspaces`, { failOnStatusCode: false }); const j = await r.json().catch(() => null); return !!(j && j.resultType === 'SUCCESS'); } catch (e) { return false; } }

(async () => {
  const ctx = await chromium.launchPersistentContext('/Users/hobeen/.appintoss-console/profile', { headless: true });
  const p = ctx.pages()[0] || (await ctx.newPage());
  await p.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(1500);
  for (let a = 0; a < 2 && !(await alive(ctx)); a++) { await p.goto(SIGNIN, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {}); await sleep(2500); const pw = p.locator('input[type=password]').first(); if (await pw.count().catch(() => 0)) { const c = creds(); await p.locator('input:not([type=password]):not([type=checkbox]):not([type=hidden])').first().fill(c.id).catch(() => {}); await pw.fill(c.pw).catch(() => {}); await p.locator('button[type=submit]').first().click().catch(() => {}); for (let i = 0; i < 40; i++) { await sleep(3000); const u = p.url(); if (/apps-in-toss/.test(u) && !/sign-in|sign-up/.test(u) && u !== `${ORIGIN}/`) break; if (u === `${ORIGIN}/` || /sign-up/.test(u)) await p.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded' }).catch(() => {}); } } await sleep(2000); }
  if (!(await alive(ctx))) { console.log('[fatal] 세션 실패'); await ctx.close(); process.exit(1); }
  console.log('[login] OK');

  // 1) GET draft
  let r = await ctx.request.get(DRAFT, { failOnStatusCode: false });
  let j = await r.json();
  const draft = j.success;
  const miniApp = draft.miniApp;
  console.log('[draft:before] images=' + (miniApp.images || []).length + ' keywords=' + ((draft.impression && draft.impression.keywordList) || []).length + ' categoryPaths=' + ((draft.impression && draft.impression.categoryPaths) || []).length);

  // 2) 썸네일: 이미 있으면 재사용, 없으면 업로드(multipart 필드명="resource" 확정).
  let thumbUrl = (miniApp.images || []).find((i) => i.imageType === 'THUMBNAIL');
  thumbUrl = thumbUrl ? thumbUrl.imageUrl : null;
  if (!thumbUrl) {
    const up = await ctx.request.post(UPLOAD, { multipart: { resource: { name: 'thumbnail.png', mimeType: 'image/png', buffer: fs.readFileSync(THUMB) } }, failOnStatusCode: false });
    const uj = await up.json().catch(() => null);
    thumbUrl = uj && uj.resultType === 'SUCCESS' && typeof uj.success === 'string' ? uj.success : null;
    console.log('[thumb] upload status=' + up.status() + ' issued=' + !!thumbUrl);
  } else console.log('[thumb] 기존 썸네일 재사용');
  if (!thumbUrl) { console.log('[fatal] 썸네일 업로드 실패'); await ctx.close(); process.exit(2); }

  // 3) images 병합: 기존 PREVIEW 유지 + THUMBNAIL 추가(중복 제거)
  const images = (miniApp.images || []).filter((im) => im.imageType !== 'THUMBNAIL');
  images.push({ imageType: 'THUMBNAIL', imageUrl: thumbUrl, orientation: 'HORIZONTAL', displayOrder: 0, backgroundColor: null, backgroundTheme: null });

  const body = {
    miniApp: {
      ...miniApp,
      images,
    },
    impression: {
      ...(draft.impression || {}),
      categoryList: CATEGORY_LIST,
      categoryPaths: CATEGORY_PATHS,
      keywordList: KEYWORDS,
    },
  };
  // PUT draft
  let pr = await ctx.request.put(DRAFT, { headers: { 'content-type': 'application/json' }, data: body, failOnStatusCode: false });
  let pj = await pr.json().catch(() => null);
  console.log('[PUT draft] status=' + pr.status() + ' resultType=' + (pj && pj.resultType) + (pj && pj.error ? ' err=' + pj.error.errorCode + ':' + pj.error.reason : ''));

  // 4) readback
  await sleep(1500);
  r = await ctx.request.get(DRAFT, { failOnStatusCode: false }); j = await r.json();
  const d2 = j.success; const m2 = d2.miniApp; const imp2 = d2.impression || {};
  const kw = imp2.keywordList || [];
  const cats = (imp2.categoryPaths && imp2.categoryPaths.length ? imp2.categoryPaths : imp2.categoryList) || [];
  console.log('[readback impression keys]', Object.keys(imp2).join(','), '| categoryList=' + ((imp2.categoryList || []).length) + ' categoryPaths=' + ((imp2.categoryPaths || []).length));
  const imgs = m2.images || [];
  const thumbOk = imgs.some((i) => i.imageType === 'THUMBNAIL');
  const previewN = imgs.filter((i) => i.imageType === 'PREVIEW').length;
  const verify = {
    부제: m2.description === '고정비 한눈에 결제일 알림' ? 'OK' : '미반영:' + m2.description,
    상세설명: (m2.detailDescription || '').length > 200 ? 'OK(len=' + m2.detailDescription.length + ')' : '미반영',
    카테고리: cats.length >= 1 ? 'OK(' + cats.length + '개: ' + cats.map((c) => (c.group ? c.group.name : '?') + '>' + (c.category ? c.category.name : '?')).join(',') + ')' : '미반영',
    검색키워드: kw.length === 10 ? 'OK(10개)' : '미반영(' + kw.length + '개)',
    스크린샷: previewN >= 3 ? 'OK(' + previewN + '장)' : '미반영(' + previewN + '장)',
    썸네일: thumbOk ? 'OK' : '미반영',
    영어이름: m2.titleEn === 'Fixed Cost Keeper' ? 'OK' : '미반영',
    아이콘: m2.iconUri ? 'OK' : '미반영',
  };
  console.log('[READBACK] ' + JSON.stringify(verify, null, 0));
  fs.writeFileSync(path.join(DUMPS, 'meta-readback.json'), JSON.stringify({ verify, keywords: kw, categoryCount: cats.length, images: imgs.map((i) => i.imageType) }, null, 2));

  await ctx.close();
  console.log('[done] meta-complete-api 완료');
})().catch((e) => { console.error('[fatal]', e.message); process.exit(1); });
