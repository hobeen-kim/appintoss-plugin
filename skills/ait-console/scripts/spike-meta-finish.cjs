#!/usr/bin/env node
'use strict';
/**
 * 앱 정보 등록 마무리: 미충족 필드(카테고리 하위/썸네일/스크린샷/검색키워드) 채우고 검수 제출.
 * edit 페이지는 단일 스크롤 폼(step 파라미터는 표시용). fixed-cost-keeper(41246).
 * 인덱스 기준(step1-detail 실측): file[7]=스크린샷(.png), file[8]=썸네일(.jpg,jpeg,png), text[9]=검색키워드, checkbox[10..14]=약관5.
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
const EDIT_URL = `${ORIGIN}/workspace/${WS}/mini-app/${APP}/meta/edit?step=1`;
const ASSET_DIR = '/Users/hobeen/study/appintoss/fixed-cost-keeper/docs/assets';
const SIGNIN = 'https://business.toss.im/account/sign-in?client_id=4uktpjgqd0cp9txybqzuxc2y6w0cuupb&redirect_uri=https%3A%2F%2Fapps-in-toss.toss.im%2Fsign-up&state=%2Fworkspace';
const KEYWORDS = ['고정비', '월세', '보험료', '구독료', '결제일', '가계부', '지출관리', '리마인더', '알림', '고정지출'];
const SENSITIVE_KEY_RE = /token|secret|password|auth|cookie|session|credential|signature|code/i;
fs.mkdirSync(DUMPS_DIR, { recursive: true }); fs.mkdirSync(SHOTS_DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function creds() { if (process.env.AIT_CONSOLE_ID && process.env.AIT_CONSOLE_PW) return { id: process.env.AIT_CONSOLE_ID, pw: process.env.AIT_CONSOLE_PW }; try { const c = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '.appintoss', 'credentials.json'), 'utf8')); if (c.id && c.pw) return c; } catch {} return null; }
async function alive(ctx) { try { const r = await ctx.request.get(`${ORIGIN}/console/api-public/v3/appsintossconsole/workspaces`, { failOnStatusCode: false }); const j = await r.json().catch(() => null); return !!(j && j.resultType === 'SUCCESS'); } catch (e) { return false; } }
const netLog = [];
function maskUrl(raw){try{const u=new URL(raw);for(const[k]of u.searchParams)if(SENSITIVE_KEY_RE.test(k))u.searchParams.set(k,'[masked]');return u.toString();}catch(e){return raw;}}
function attachNet(ctx){ctx.on('requestfinished',async(req)=>{try{const url=req.url(),t=req.resourceType();if(!['xhr','fetch'].includes(t))return;if(!/toss\.im\/console/.test(new URL(url).host+new URL(url).pathname))return;const h=await req.allHeaders().catch(()=>({}));const e={method:req.method(),pathname:new URL(url).pathname,ct:(h['content-type']||'').split(';')[0]};const post=req.postData();if(post){try{e.reqKeys=Object.keys(JSON.parse(post).miniApp||JSON.parse(post));}catch {e.reqKeys=/multipart/i.test(h['content-type']||'')?'multipart':'?';}}const res=await req.response();if(res)e.status=res.status();if(e.method!=='GET')netLog.push(e);}catch {}});}
async function dump(page, name) { await sleep(1200); const info = await page.evaluate(() => ({ url: location.href, body: document.body ? document.body.innerText.slice(0, 1500) : '', btns: Array.from(document.querySelectorAll('button,[role=button]')).map((b) => (b.innerText || '').split('\n')[0].trim()).filter(Boolean), dialogs: Array.from(document.querySelectorAll('[role=dialog],[role=alertdialog]')).map((d) => (d.innerText || '').slice(0, 200)) })).catch(() => ({})); fs.writeFileSync(path.join(DUMPS_DIR, `${name}.json`), JSON.stringify(info, null, 2)); await page.screenshot({ path: path.join(SHOTS_DIR, `${name}.png`), fullPage: true }).catch(() => {}); return info; }

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1440, height: 1800 } });
  attachNet(ctx);
  const page = ctx.pages()[0] || (await ctx.newPage());
  await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await sleep(1500);
  for (let a = 0; a < 2 && !(await alive(ctx)); a++) { await page.goto(SIGNIN, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {}); await sleep(2500); const pw = page.locator('input[type=password]').first(); if (await pw.count().catch(() => 0)) { const c = creds(); await page.locator('input:not([type=password]):not([type=checkbox]):not([type=hidden])').first().fill(c.id).catch(() => {}); await pw.fill(c.pw).catch(() => {}); await page.locator('button[type=submit]').first().click().catch(() => {}); for (let i = 0; i < 40; i++) { await sleep(3000); const u = page.url(); if (/apps-in-toss/.test(u) && !/sign-in|sign-up/.test(u) && u !== `${ORIGIN}/`) break; if (u === `${ORIGIN}/` || /sign-up/.test(u)) await page.goto(`${ORIGIN}/workspace`, { waitUntil: 'domcontentloaded' }).catch(() => {}); } } await sleep(2000); }
  if (!(await alive(ctx))) { console.log('[fatal] 세션 확보 실패'); await ctx.close(); process.exit(1); }
  console.log('[login] OK');

  // /meta → "수정하기" 로 편집 진입(직접 edit URL goto 는 빈 화면이 됨)
  await page.goto(`${ORIGIN}/workspace/${WS}/mini-app/${APP}/meta`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  for (let i = 0; i < 15; i++) { const t = await page.evaluate(() => document.body ? document.body.innerText : '').catch(() => ''); if (t && !/잠시만 기다려주세요/.test(t) && /수정하기|앱 정보/.test(t)) break; await sleep(2000); }
  let inEdit = false;
  for (let attempt = 0; attempt < 4 && !inEdit; attempt++) { const loc = page.getByRole('button', { name: '수정하기' }).first(); if (await loc.count().catch(() => 0)) await loc.click({ timeout: 5000 }).catch(() => {}); for (let i = 0; i < 6; i++) { await sleep(1500); if ((await page.locator('input[type=checkbox]').count().catch(() => 0)) >= 5) { inEdit = true; break; } } }
  console.log('[edit] 진입=' + inEdit);
  page.setDefaultTimeout(9000);

  // 1) 검색 키워드 (input[placeholder*=키워드]) — 입력+Enter, 추가 후 본문에 칩 생기는지
  try {
    const kw = page.locator('input[placeholder*="키워드"]').first();
    if (await kw.count().catch(() => 0)) { for (const k of KEYWORDS) { await kw.fill(k).catch(() => {}); await kw.press('Enter').catch(() => {}); await sleep(400); } console.log('[kw] 입력'); }
  } catch (e) { console.log('[kw] skip', e.message); }

  // 2) 카테고리: "추가하기"(카테고리 영역) → 대분류/하위 "선택하기"
  try {
    // 카테고리 영역의 추가하기는 본문 상 첫 추가하기
    const add = page.getByRole('button', { name: '추가하기' }).first();
    if (await add.count().catch(() => 0)) { await add.click().catch(() => {}); await sleep(1500);
      // 모달/드롭다운에서 대분류·하위 선택
      for (const opt of ['생활·쇼핑', '생활']) { const o = page.getByText(opt, { exact: true }).first(); if (await o.count({ timeout: 2000 }).catch(() => 0)) { await o.click().catch(() => {}); await sleep(800); } }
      for (const t of ['확인', '완료', '선택', '적용', '추가']) { const c = page.locator('[role=dialog]').getByRole('button', { name: t }).first(); if (await c.count({ timeout: 1500 }).catch(() => 0)) { await c.click().catch(() => {}); break; } }
      await sleep(1500); console.log('[cat] 시도');
    }
    // 하위 카테고리 "선택하기" 버튼들 처리
    const selBtns = page.getByRole('button', { name: '선택하기' });
    const ns = await selBtns.count().catch(() => 0);
    for (let i = 0; i < ns; i++) { await selBtns.nth(i).click({ timeout: 4000 }).catch(() => {}); await sleep(1000); const opt = page.getByText('생활', { exact: true }).first(); if (await opt.count({ timeout: 1500 }).catch(() => 0)) { await opt.click().catch(() => {}); await sleep(700); } }
    console.log('[cat] 선택하기 ' + ns + '개 처리');
  } catch (e) { console.log('[cat] skip', e.message); }

  // 3) 에셋: 스크린샷(.png file, 로고/다크로고 제외) + 썸네일(.jpg accept)
  try {
    const shots = ['screenshot-1.png', 'screenshot-2.png', 'screenshot-3.png'].map((f) => `${ASSET_DIR}/${f}`);
    for (const sp of shots) { const cur = page.locator('input[type=file]'); const cnt = await cur.count().catch(() => 0); let tgt = -1; for (let i = 0; i < cnt; i++) { const acc = await cur.nth(i).getAttribute('accept').catch(() => ''); if (/png/i.test(acc) && !/jpg/i.test(acc)) { const ph = await cur.nth(i).getAttribute('placeholder').catch(() => ''); if (!/600/.test(ph || '')) { tgt = i; } } } if (tgt < 0) { for (let i = 2; i < cnt; i++) { const acc = await cur.nth(i).getAttribute('accept').catch(() => ''); if (/png/i.test(acc) && !/jpg/i.test(acc)) { tgt = i; break; } } } if (tgt < 0) break; await cur.nth(tgt).setInputFiles(sp).catch(() => {}); await sleep(4000); console.log('[shot] set idx' + tgt); }
    const th = page.locator('input[type=file][accept*="jpg"]').first();
    if (await th.count().catch(() => 0)) { await th.setInputFiles(`${ASSET_DIR}/thumbnail.png`).catch(() => {}); await sleep(4000); console.log('[thumb] set'); }
  } catch (e) { console.log('[asset] skip', e.message); }

  // 4) 약관 체크박스 5개
  try { const boxes = page.locator('input[type=checkbox]'); const nb = await boxes.count().catch(() => 0); for (let i = 0; i < nb; i++) { const c = await boxes.nth(i).isChecked().catch(() => false); if (!c) { await boxes.nth(i).click({ force: true, timeout: 3000 }).catch(() => {}); await sleep(250); } } console.log('[terms] ' + nb + '개 처리'); } catch (e) { console.log('[terms] skip', e.message); }

  await sleep(1500);
  const f1 = await dump(page, '80-finish-filled');
  // 임시저장으로 draft 반영
  const save = page.getByRole('button', { name: '임시저장' }).first();
  if (await save.count().catch(() => 0)) { await save.click().catch(() => {}); await sleep(3500); console.log('[save] 임시저장'); }

  // 검토 요청하기
  let submitted = false;
  const rq = page.getByRole('button', { name: '검토 요청하기' }).first();
  if (await rq.count().catch(() => 0)) {
    const dis = await rq.evaluate((b) => b.disabled === true || b.getAttribute('aria-disabled') === 'true').catch(() => true);
    console.log('[submit] 검토 요청하기 disabled=' + dis);
    if (!dis) {
      await rq.click().catch(() => {}); await sleep(2500); await dump(page, '81-confirm-dialog');
      const conf = page.getByRole('button', { name: '요청하기' }).last();
      if (await conf.count().catch(() => 0)) { await conf.click().catch(() => {}); await sleep(5000); submitted = true; await dump(page, '82-after-request'); console.log('[submit] 요청하기 클릭'); }
    } else {
      // 무엇이 비었는지 본문 검증 메시지 출력
      const miss = (f1.body || '').match(/[^\n]*(추가해 주세요|입력해 주세요|선택해 주세요|미입력)[^\n]*/g);
      console.log('[submit] 비활성 — 미충족:', JSON.stringify(miss ? miss.slice(0, 8) : []));
    }
  }
  console.log('[submit] submitted=' + submitted);

  await sleep(2000);
  // hasInReview 확인
  const r = await ctx.request.get(`${ORIGIN}/console/api-public/v3/appsintossconsole/workspaces/${WS}/mini-app/${APP}`, { failOnStatusCode: false });
  const j = await r.json().catch(() => null); const s = (j && j.success) || {};
  console.log('[flags] ' + JSON.stringify({ hasApproved: s.hasApproved, hasInReview: s.hasInReview, hasDraft: s.hasDraft, status: s.miniApp && s.miniApp.status }));

  fs.writeFileSync(path.join(DUMPS_DIR, 'meta-finish-net.json'), JSON.stringify(netLog, null, 2));
  await ctx.close();
  console.log('[done] meta-finish 완료');
})().catch((e) => { console.error('[fatal]', e.message); fs.writeFileSync(path.join(DUMPS_DIR, 'meta-finish-net.json'), JSON.stringify(netLog, null, 2)); process.exit(1); });
