#!/usr/bin/env node
'use strict';
/**
 * ait-console — single entry-point CLI for the appintoss console automation.
 *
 * Usage:
 *   node ait-console.cjs <subcommand> [args...]
 *   node ait-console.cjs help        # full subcommand list (동작/스캐폴드 구분)
 *
 * SSOT: all endpoints come from references/console-dom-map.md via lib/api.cjs
 * (no hardcoded URLs here). Write commands print an announceWrite summary
 * before executing and verify the result via API readback. Uncaptured write
 * flows (외부 심사 게이트로 미캡처) are scaffolds that fail loudly with a
 * "console-dom-map.md 갱신 필요(게이트 통과 후 재캡처)" marker — guessed
 * selectors/URLs are never used.
 *
 * Exit codes:
 *   0  success / READY
 *   1  runtime failure (단계명은 메시지 prefix — 자동 재시도 없음)
 *   2  bad arguments
 *   3  release-status not READY (대기/미승인)
 *   4  watch 대기 만료 (--max 도달)
 */
const fs = require('fs');
const path = require('path');
const api = require('./lib/api.cjs');
const { asyncWatch, parseInterval } = require('./lib/watch.cjs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- table helpers
const APP_TYPE_KO = { NON_GAME: '비게임', GAME: '게임' };

/** Right-pad a string to column width, treating CJK chars as width 2. */
function pad(s, w) {
  s = String(s == null ? '' : s);
  let width = 0;
  for (const ch of s) width += /[ᄀ-ᇿ⺀-꓏가-힣豈-﫿＀-￯]/.test(ch) ? 2 : 1;
  const padLen = Math.max(0, w - width);
  return s + ' '.repeat(padLen);
}

/** Print a simple fixed-width table to stdout. */
function table(headers, rows, widths) {
  console.log(headers.map((h, i) => pad(h, widths[i])).join('  '));
  console.log(widths.map((w) => '-'.repeat(w)).join('  '));
  for (const r of rows) {
    console.log(r.map((c, i) => pad(c, widths[i])).join('  '));
  }
}

// ---------------------------------------------------------------- arg helpers
function parseArgs(rest) {
  const pos = [];
  const flags = {};
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = rest[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      pos.push(a);
    }
  }
  return { pos, flags };
}

function usageExit(msg, example) {
  console.error(`[error] ${msg}`);
  if (example) console.error(`  예: ${example}`);
  process.exit(2);
}

// ---------------------------------------------------------------- common write helpers

/** Print a summary of an impending write action (no confirmation wait — fully automated). */
function announceWrite(action, fields) {
  console.log(`\n[write] ${action} — 실행 전 요약 (확인 대기 없음)`);
  for (const [k, v] of Object.entries(fields)) console.log(`  - ${k}: ${v}`);
  console.log('');
}

/** Resolve appName across workspaces or throw with a step-prefixed error. */
async function resolveApp(request, appName) {
  const found = await api.findApp(request, appName);
  if (!found) throw new Error(`[resolve-app] 앱 "${appName}"을 찾을 수 없습니다.`);
  return { ws: found.workspace.id, appId: found.app.miniAppId, app: found.app };
}

/** Latest bundle first (regTs descending; ISO/numeric both compare fine as strings). */
function sortLatestFirst(versions) {
  return versions.slice().sort((a, b) => String(b.regTs || '').localeCompare(String(a.regTs || '')));
}

// ---------------------------------------------------------------- read subcommands
async function cmdApps(request) {
  console.log('\n================ 워크스페이스 ================\n');
  const workspaces = await api.listWorkspaces(request);
  table(
    ['workspaceId', 'name', 'reviewState', 'licenseType'],
    workspaces.map((w) => [w.id, w.name, w.reviewState || '-', w.licenseType || '-']),
    [12, 20, 12, 16]
  );

  for (const ws of workspaces) {
    const apps = await api.listApps(request, ws.id);
    console.log(
      `\n\n================ 앱 (워크스페이스 ${ws.id} · ${ws.name}) — ${apps.length}개 ================\n`
    );

    // Fetch deployed version per app concurrently (read-only).
    const deployedList = await Promise.all(
      apps.map((a) => api.getDeployed(request, ws.id, a.miniAppId))
    );

    table(
      ['appName', 'displayName', '유형', '현재출시버전(memo)', 'reviewStatus'],
      apps.map((a, i) => {
        const dep = deployedList[i];
        // memo = 개발자가 deploy 시 남긴 시맨틱 버전(노출용). versionName과 병기.
        const released = dep
          ? (dep.memo ? `${dep.versionName} (${dep.memo})` : dep.versionName)
          : '(미출시)';
        return [
          a.appName,
          a.title,
          APP_TYPE_KO[a.appType] || a.appType || '-',
          released,
          dep ? dep.reviewStatus : (a.status || '-'),
        ];
      }),
      [16, 18, 8, 22, 12]
    );

    console.log('\n---------------- 앱별 버전 내역 (최근 5개) ----------------');
    for (const a of apps) {
      const versions = await api.getAppVersions(request, ws.id, a.miniAppId);
      console.log(`\n[${a.appName}] ${a.title} — 총 ${versions.length}개 버전`);
      if (!versions.length) {
        console.log('  (버전 없음)');
        continue;
      }
      table(
        ['versionName', 'sdkVersion', 'reviewStatus', 'deployed', 'memo'],
        versions.slice(0, 5).map((v) => [
          v.versionName,
          v.sdkVersion || '-',
          v.reviewStatus || '-',
          v.deployed ? 'YES' : 'no',
          v.memo || '-',
        ]),
        [16, 11, 14, 9, 10]
      );
    }
  }
  console.log('\n[done] read-only API 호출 완료 (쓰기 호출 없음)');
}

async function cmdVersions(request, appName) {
  const workspaces = await api.listWorkspaces(request);
  let found = false;
  for (const ws of workspaces) {
    const apps = await api.listApps(request, ws.id);
    const target = apps.find((a) => a.appName === appName);
    if (!target) continue;
    found = true;
    const versions = await api.getAppVersions(request, ws.id, target.miniAppId);
    console.log(
      `\n[${target.appName}] ${target.title} (워크스페이스 ${ws.id} · ${ws.name}) — 총 ${versions.length}개 버전\n`
    );
    if (!versions.length) {
      console.log('  (버전 없음)');
      break;
    }
    // 현재 출시본 1줄 요약 (memo = deploy 시 남긴 시맨틱 버전).
    const live = versions.find((v) => v.deployed);
    if (live) {
      console.log(`현재 출시: ${live.versionName} (memo: ${live.memo || '-'})\n`);
    } else {
      console.log('현재 출시: (출시본 없음)\n');
    }
    table(
      ['versionName', 'sdkVersion', 'reviewStatus', 'deployed', 'memo'],
      versions.map((v) => [
        // deployed=YES 행은 ★[출시중] 마커로 강조.
        v.deployed ? `★ ${v.versionName}` : `  ${v.versionName}`,
        v.sdkVersion || '-',
        v.reviewStatus || '-',
        v.deployed ? '[출시중]' : 'no',
        v.memo || '-',
      ]),
      [18, 11, 14, 9, 10]
    );
    break;
  }
  if (!found) {
    console.error(`[error] 앱 "${appName}"을 찾을 수 없습니다.`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------- upload (캡처 API — 실동작)
// dom-map §3-W 단계1: initialize -> presigned S3 PUT -> complete, 이후 bundles readback.
async function cmdUpload(request, appName, bundlePath, flags) {
  const { ws, appId } = await resolveApp(request, appName);
  const stat = fs.statSync(bundlePath);
  announceWrite('upload (테스트 버전 업로드 — initialize → presigned S3 PUT → complete)', {
    앱: `${appName} (ws ${ws} / miniApp ${appId})`,
    번들: `${bundlePath} (${(stat.size / 1024 / 1024).toFixed(2)}MB)`,
    효과: '새 버전 생성(PREPARE→BUILDING→CREATED). 검토 요청/출시는 수행하지 않음',
  });

  // deploymentId: --deployment-id <uuid> 주입 또는 UUIDv7 자동 생성 (v4는 errorCode 4000)
  const deploymentId = (flags && flags['deployment-id']) ? flags['deployment-id'] : api.generateDeploymentId();
  // step 1/3: initialize — presigned uploadUrl + versionName 발급
  const init = await api.initializeDeployment(request, ws, appId, deploymentId);
  const versionName = init && init.deployment ? init.deployment.versionName : null;
  if (!init || !init.uploadUrl || !versionName) {
    throw new Error('[deployments/initialize] 응답에 uploadUrl/deployment.versionName 없음');
  }
  console.log(`[upload 1/3] initialize 완료 — versionName=${versionName} (uploadUrl은 서명 포함이라 미출력)`);

  // step 2/3: presigned S3 PUT (.ait 바이트)
  await api.uploadBundleToPresignedUrl(request, init.uploadUrl, bundlePath);
  console.log(`[upload 2/3] S3 PUT 완료 (${stat.size} bytes)`);

  // step 3/3: complete — 서버 빌드 시작
  await api.completeDeployment(request, ws, appId, deploymentId);
  console.log('[upload 3/3] complete 완료 — 서버 빌드 시작(BUILDING→CREATED)');

  // readback: bundles에 새 versionName 등장 + 빌드 상태 폴링(최대 ~3분)
  let bundle = null;
  for (let i = 0; i < 36; i++) {
    const versions = await api.getAppVersions(request, ws, appId);
    bundle = versions.find((v) => v.versionName === versionName) || null;
    if (bundle && bundle.reviewStatus !== 'PREPARE' && bundle.reviewStatus !== 'BUILDING') break;
    await sleep(5000);
  }
  if (!bundle) throw new Error(`[upload-readback] bundles에 versionName=${versionName} 미등장`);
  console.log(
    `[readback] versionName=${versionName} reviewStatus=${bundle.reviewStatus} ` +
    `sdkVersion=${bundle.sdkVersion || '-'} isTested=${bundle.isTested}`
  );
  if (bundle.reviewStatus === 'PREPARE' || bundle.reviewStatus === 'BUILDING') {
    console.log('[readback] 빌드 아직 진행 중 — 이후 `versions` 서브커맨드로 CREATED 전이 확인 가능');
  }
  console.log(`[done] upload 완료 — 다음 단계: node ait-console.cjs test-send ${appName}`);
}

// ---------------------------------------------------------------- test-send (캡처 API — 실동작)
// dom-map §3-W 단계2: POST bundles/test-push {deploymentId} → 단말 푸시 + isTested=true 전이.
async function cmdTestSend(request, appName, deploymentIdArg) {
  const { ws, appId } = await resolveApp(request, appName);
  const versions = await api.getAppVersions(request, ws, appId);
  if (!versions.length) throw new Error('[resolve-version] 업로드된 버전이 없습니다 — 먼저 upload 실행');
  let target;
  if (deploymentIdArg) {
    target = versions.find((v) => v.deploymentId === deploymentIdArg);
    if (!target) throw new Error(`[resolve-version] deploymentId "${deploymentIdArg}" 버전을 찾을 수 없습니다.`);
  } else {
    target = sortLatestFirst(versions)[0]; // 최신 버전
  }
  if (target.reviewStatus === 'PREPARE' || target.reviewStatus === 'BUILDING') {
    throw new Error(
      `[test-send] versionName=${target.versionName} 빌드 미완료(reviewStatus=${target.reviewStatus}) — CREATED 전이 후 재실행`
    );
  }
  if (!target.deploymentId) {
    throw new Error('[test-send] 대상 버전에 deploymentId 없음 — bundles 응답 스키마 확인 필요(dom-map 갱신)');
  }

  announceWrite('test-send (테스트 푸시 실제 발송 — 등록된 단말로 푸시 전송)', {
    앱: `${appName} (ws ${ws} / miniApp ${appId})`,
    버전: `${target.versionName} (reviewStatus=${target.reviewStatus}, isTested=${target.isTested})`,
    deploymentId: `${String(target.deploymentId).slice(0, 8)}…`,
    효과: '실제 단말 푸시 발송 + isTested=true 전이(검토 요청 버튼 활성 조건)',
  });

  await api.sendTestPush(request, ws, appId, target.deploymentId);
  console.log('[test-send] bundles/test-push 호출 성공 — isTested 전이 확인 중');

  // readback: isTested false -> true (dom-map 실측: 즉시 전이)
  let tested = !!target.isTested;
  for (let i = 0; i < 8 && !tested; i++) {
    const after = await api.getAppVersions(request, ws, appId);
    const v = after.find((x) => x.versionName === target.versionName);
    if (v && v.isTested) {
      tested = true;
      break;
    }
    await sleep(5000);
  }
  if (!tested) throw new Error('[test-send-readback] isTested=true 전이 미확인');
  console.log(`[done] test-send 완료 — versionName=${target.versionName} isTested=true`);
}

// ---------------------------------------------------------------- set-app-info (캡처 API — 실동작)
// dom-map §3-W 단계0-A/0-B: resource upload(multipart `resource`) → draft PUT(JSON)
// → GET draft readback 검증. 앱정보 검수 제출(POST mini-app/review)은 --submit 명시 시에만.

/** Parse 부제/상세설명/카테고리 1순위/검색키워드 from docs/APP-SPEC.md. */
function parseAppSpec(docsDir) {
  const specPath = path.join(docsDir, 'APP-SPEC.md');
  if (!fs.existsSync(specPath)) throw new Error(`[app-spec] APP-SPEC.md 없음: ${specPath}`);
  const md = fs.readFileSync(specPath, 'utf8');
  const cell = (re) => {
    const m = md.match(re);
    return m ? m[1].trim() : null;
  };
  const subtitle = cell(/\|\s*부제[^|]*\|\s*([^|\n]+)\|/);
  const category = cell(/\|\s*카테고리[^|]*1순위[^|]*\|\s*([^|\n]+)\|/);
  const keywordsRaw = cell(/\|\s*검색\s*키워드[^|]*\|\s*([^|\n]+)\|/);
  const keywords = keywordsRaw ? keywordsRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];
  // 상세 설명: '### 상세 설명' 헤딩부터 다음 구분선/헤딩 전까지
  const dm = md.match(/^###\s*상세\s*설명[^\n]*\n([\s\S]*?)(?=\n---|\n#)/m);
  const detail = dm ? dm[1].trim() : null;
  const missing = [];
  if (!subtitle) missing.push('부제');
  if (!detail) missing.push('상세 설명');
  if (!category) missing.push('카테고리 1순위');
  if (!keywords.length) missing.push('검색 키워드');
  if (missing.length) throw new Error(`[app-spec] APP-SPEC.md 파싱 실패 — 누락: ${missing.join(', ')} (${specPath})`);
  return { subtitle, detail, category, keywords };
}

const ASSET_FILES = [
  { file: 'icon.png', kind: 'ICON' },
  { file: 'screenshot-1.png', kind: 'PREVIEW' },
  { file: 'screenshot-2.png', kind: 'PREVIEW' },
  { file: 'screenshot-3.png', kind: 'PREVIEW' },
  { file: 'thumbnail.png', kind: 'THUMBNAIL' },
];

/** Resolve docs/assets files (icon · screenshot-1~3 · thumbnail) or throw with the missing list. */
function resolveAssets(docsDir) {
  const dir = path.join(docsDir, 'assets');
  const missing = ASSET_FILES.filter((a) => !fs.existsSync(path.join(dir, a.file))).map((a) => a.file);
  if (missing.length) throw new Error(`[assets] docs/assets 결손: ${missing.join(', ')} (${dir})`);
  return ASSET_FILES.map((a) => ({ ...a, path: path.join(dir, a.file) }));
}

/**
 * Map an APP-SPEC category label (e.g. "생활·쇼핑 · 생활") onto the console master
 * (impression/category-list). Write form = flat ID arrays (dom-map 단계0-B);
 * 생활(7) 그룹은 categoryIds+subCategoryIds 둘 다 필수(프론트 Zl 검증 규칙).
 * Returns { group, category, subCategory|null } or null when no segment matches.
 */
function mapCategory(master, specText) {
  const norm = (s) => String(s).replace(/\s+/g, '');
  const segs = [...new Set(String(specText).split(/[·>/,]/).map(norm).filter(Boolean))];
  for (const g of master) {
    if (!g.categoryGroup || !g.categoryGroup.isSelectable) continue;
    for (const c of g.categoryList || []) {
      if (!c.isSelectable || !segs.includes(norm(c.name))) continue;
      const subs = (c.subCategoryList || []).filter((s) => s.isSelectable);
      if (!subs.length) return { group: g.categoryGroup, category: c, subCategory: null };
      const sub = subs.find((s) => segs.includes(norm(s.name))) || (subs.length === 1 ? subs[0] : null);
      if (sub) return { group: g.categoryGroup, category: c, subCategory: sub };
    }
  }
  return null;
}

function printCategoryCandidates(master) {
  console.error('[category] 선택 가능한 카테고리 후보 (category-list 마스터):');
  for (const g of master) {
    if (!g.categoryGroup || !g.categoryGroup.isSelectable) continue;
    for (const c of g.categoryList || []) {
      if (!c.isSelectable) continue;
      const subs = (c.subCategoryList || []).filter((s) => s.isSelectable).map((s) => s.name);
      console.error(`  - ${g.categoryGroup.name} > ${c.name}${subs.length ? ` > [${subs.join(', ')}]` : ''}`);
    }
  }
}

async function cmdSetAppInfo(request, appName, flags) {
  const docsDir = typeof flags.docs === 'string' ? flags.docs : path.join(process.cwd(), 'docs');
  const spec = parseAppSpec(docsDir);
  const assets = resolveAssets(docsDir);
  const { ws, appId } = await resolveApp(request, appName);

  // 1) 카테고리 매핑 (read 전용 — 실패 시 어떤 쓰기도 없이 중단)
  const master = await api.getCategoryList(request);
  const mapped = mapCategory(master, spec.category);
  if (!mapped) {
    console.error(`[category] APP-SPEC 카테고리 "${spec.category}" 매핑 실패 — 후보 출력 후 중단(쓰기 없음)`);
    printCategoryCandidates(master);
    process.exit(1);
  }
  const categoryIds = [mapped.category.id].slice(0, 2);
  const subCategoryIds = (mapped.subCategory ? [mapped.subCategory.id] : []).slice(0, 2);
  const isGameCategory = mapped.group.name === '게임';
  const catLabel = `${mapped.group.name}>${mapped.category.name}${mapped.subCategory ? `>${mapped.subCategory.name}` : ''}`;

  announceWrite(`set-app-info (에셋 업로드 + 앱 정보 draft 저장${flags.submit ? ' + 앱정보 검수 제출' : ''})`, {
    앱: `${appName} (ws ${ws} / miniApp ${appId})`,
    docs: docsDir,
    부제: spec.subtitle,
    상세설명: `${spec.detail.length}자`,
    카테고리: `"${spec.category}" → ${catLabel} (categoryIds=[${categoryIds}], subCategoryIds=[${subCategoryIds}])`,
    키워드: `${spec.keywords.length}개 — ${spec.keywords.join(', ')}`,
    에셋: assets.map((a) => a.file).join(', '),
    검수제출: flags.submit
      ? 'POST mini-app/review 실행 (--submit 명시됨)'
      : '안 함 — draft 저장+검증까지만 (검수 제출은 --submit 명시 필요)',
  });

  // 2) 에셋 업로드 → 발급 static URL 수집
  let iconUri = null;
  let thumbnailUrl = null;
  const previewUrls = [];
  for (const a of assets) {
    const u = await api.uploadResource(request, ws, a.path, a.kind);
    if (a.kind === 'ICON') iconUri = u;
    else if (a.kind === 'THUMBNAIL') thumbnailUrl = u;
    else previewUrls.push(u);
    console.log(`[assets] ${a.file} 업로드 완료 (${a.kind})`);
  }
  console.log(`\n[icon] 발급 iconUri: ${iconUri}`);
  console.log('[icon] granite.config.ts 의 brand.icon 을 위 콘솔 발급 static URL로 갱신하세요 (brand.icon 은 콘솔 발급 URL 필수).\n');

  // 3) 병합 베이스: GET draft (없으면 앱 상세 miniApp) — dom-map 단계0-B 병합 패턴
  const draftBase = await api.getDraft(request, ws, appId);
  let baseMiniApp = draftBase ? (draftBase.miniApp || draftBase) : null;
  if (!baseMiniApp || !baseMiniApp.miniAppId) {
    const detail = await api.getAppDetail(request, ws, appId);
    baseMiniApp = detail && detail.miniApp;
  }
  if (!baseMiniApp) throw new Error('[set-app-info] 병합 베이스(draft/앱 상세 miniApp) 조회 실패');

  const images = [
    { imageType: 'THUMBNAIL', imageUrl: thumbnailUrl, orientation: 'HORIZONTAL', displayOrder: 0, backgroundColor: null, backgroundTheme: null },
    ...previewUrls.map((u, i) => ({ imageType: 'PREVIEW', imageUrl: u, orientation: 'VERTICAL', displayOrder: i + 1, backgroundColor: null, backgroundTheme: null })),
  ];
  const miniApp = {
    ...baseMiniApp,
    description: spec.subtitle,
    detailDescription: spec.detail,
    iconUri,
    images,
  };
  delete miniApp.impression; // impression 은 PUT 바디 별도 키(평탄 ID 배열 쓰기 형식)
  const impression = { keywordList: spec.keywords, categoryIds, subCategoryIds, isGameCategory };

  // 4) PUT draft → GET draft readback 항목별 검증
  await api.saveDraft(request, ws, appId, { miniApp, impression });
  console.log('[draft] PUT mini-app/draft 저장 완료 — readback 검증 시작');
  const rb = await api.getDraft(request, ws, appId);
  if (!rb) throw new Error('[draft-readback] 저장 직후 GET draft 실패(draft 미존재)');
  const rbApp = rb.miniApp || rb; // readback은 미니앱 형태 평탄 객체(+impression/savedAt)
  const rbImp = rbApp.impression || rb.impression || {};
  const rbImages = rbApp.images || [];
  const rbPreview = rbImages.filter((i) => i.imageType === 'PREVIEW');
  const rbThumb = rbImages.filter((i) => i.imageType === 'THUMBNAIL');
  const rbPaths = rbImp.categoryPaths || [];
  const rbCatIds = rbPaths.map((p) => p.category && p.category.id);
  const rbSubIds = rbPaths.map((p) => p.subCategory && p.subCategory.id).filter((x) => x != null);
  const rbKeywords = rbImp.keywordList || [];
  const checks = [
    ['부제(description)', rbApp.description === spec.subtitle, JSON.stringify(rbApp.description)],
    ['상세설명(detailDescription)', rbApp.detailDescription === spec.detail, `${String(rbApp.detailDescription || '').length}자`],
    ['iconUri', rbApp.iconUri === iconUri, rbApp.iconUri || '(없음)'],
    [`키워드 ${spec.keywords.length}개`, rbKeywords.length === spec.keywords.length, `${rbKeywords.length}개 — ${rbKeywords.join(', ')}`],
    [
      `카테고리 ${catLabel}`,
      categoryIds.every((id) => rbCatIds.includes(id)) && subCategoryIds.every((id) => rbSubIds.includes(id)),
      rbPaths.map((p) => `${p.group ? p.group.name : '?'}>${p.category ? p.category.name : '?'}${p.subCategory ? `>${p.subCategory.name}` : ''}`).join(' + ') || '(없음)',
    ],
    [`images PREVIEW ${previewUrls.length}장`, rbPreview.length === previewUrls.length, `${rbPreview.length}장`],
    ['images THUMBNAIL 1장', rbThumb.length === 1, `${rbThumb.length}장`],
  ];
  let failed = 0;
  console.log('\n[draft-readback] 항목별 검증:');
  for (const [name, ok, actual] of checks) {
    console.log(`  ${ok ? 'OK ' : 'FAIL'}  ${name} — ${actual}`);
    if (!ok) failed++;
  }
  if (failed) throw new Error(`[draft-readback] ${failed}개 항목 누락/불일치 — 위 FAIL 항목 참조`);
  console.log(`[draft-readback] 전 항목 반영 확인 (savedAt=${rb.savedAt || '-'})`);

  // 5) 검수 제출은 --submit 명시 시에만 (안전 규칙 — 기본은 draft 저장+검증까지)
  if (!flags.submit) {
    console.log('\n[done] set-app-info 완료 — draft 저장+readback 검증까지 수행.');
    console.log('       앱정보 검수 제출은 --submit 명시 필요: node ait-console.cjs set-app-info ' + appName + ' --submit');
    return;
  }

  // dom-map 단계0-B 검토 제출 바디: images는 THUMBNAIL 먼저, impression은 평탄 ID 배열
  announceWrite('set-app-info --submit (앱정보 검수 제출 — POST mini-app/review)', {
    앱: `${appName} (ws ${ws} / miniApp ${appId})`,
    효과: '앱 정보가 토스 심사로 제출됨(hasInReview=true 전이) — 이후 app-approval-watch로 승인 대기',
  });
  const reviewPayload = {
    workspaceId: ws,
    miniApp: {
      miniAppId: appId,
      title: rbApp.title,
      titleEn: rbApp.titleEn,
      iconUri: rbApp.iconUri,
      status: rbApp.status,
      appName: rbApp.appName,
      minAge: rbApp.minAge,
      maxAge: rbApp.maxAge,
      darkModeIconUri: rbApp.darkModeIconUri,
      csEmail: rbApp.csEmail,
      csContract: rbApp.csContract,
      csChatUri: rbApp.csChatUri,
      description: rbApp.description,
      detailDescription: rbApp.detailDescription,
      specialCategory: rbApp.specialCategory,
      ...(isGameCategory && rbApp.gameInfo ? { gameInfo: rbApp.gameInfo } : {}),
      images: [...rbThumb, ...rbPreview],
    },
    impression: { keywordList: spec.keywords, categoryIds, subCategoryIds },
  };
  await api.submitAppInfoReview(request, ws, appId, reviewPayload);
  console.log('[review] POST mini-app/review 제출 완료 — hasInReview 전이 확인 중');
  const after = await api.getAppDetail(request, ws, appId);
  console.log(`[review-readback] hasInReview=${!!(after && after.hasInReview)} hasDraft=${!!(after && after.hasDraft)}`);
  if (!(after && after.hasInReview)) throw new Error('[review-readback] hasInReview=true 전이 미확인');
  console.log(`[done] set-app-info --submit 완료 — 다음: node ait-console.cjs app-approval-watch ${appName}`);
}

// ---------------------------------------------------------------- release-status (read 전용 — 안전)
// dom-map §3-W 단계5: 출시 가능 = bundle reviewStatus==="APPROVED" && deployed===false
//                    + 보조 게이트 mini-app hasApproved===true (게이트 A).
const IN_REVIEW_RE = /IN_REVIEW|REVIEWING|검토/;

const VERDICT_KO = { READY: '출시 가능', WAITING: '대기', NOT_READY: '미승인' };

async function checkReleaseStatus(request, ws, appId) {
  const [detail, versions] = await Promise.all([
    api.getAppDetail(request, ws, appId),
    api.getAppVersions(request, ws, appId),
  ]);
  const hasApproved = !!(detail && detail.hasApproved);
  const hasInReview = !!(detail && detail.hasInReview);
  const candidate = versions.find((v) => v.reviewStatus === 'APPROVED' && v.deployed === false);
  const inReview = versions.find((v) => !v.deployed && IN_REVIEW_RE.test(String(v.reviewStatus)));
  let verdict;
  let reason;
  if (candidate && hasApproved) {
    verdict = 'READY';
    reason = `버전 ${candidate.versionName} APPROVED & 미배포 & 앱 정보 승인 완료`;
  } else if (candidate && !hasApproved) {
    verdict = 'WAITING';
    reason = `버전 ${candidate.versionName} APPROVED이나 앱 정보(meta) 미승인 — 게이트 A 대기`;
  } else if (inReview) {
    verdict = 'WAITING';
    reason = `심사 대기 — ${inReview.versionName} reviewStatus=${inReview.reviewStatus}`;
  } else {
    verdict = 'NOT_READY';
    reason = '미승인 — APPROVED & 미배포 버전 없음';
  }
  return { ready: verdict === 'READY', verdict, reason, hasApproved, hasInReview, candidate, versions, detail };
}

/**
 * Determine which watcher is currently active for the app.
 * Returns one of:
 *   'app-approval-watch' — 앱 정보 미승인, 버전 심사 대기 단계
 *   'release-watch'      — 앱 정보 승인 완료, 버전 심사 대기 단계
 *   'READY'              — 출시 가능 (release-watch 완료 판정 상태)
 *   'NONE'               — 버전 없음 / 플로우 미진입
 */
function resolveWatcherPhase(st) {
  if (st.ready) return 'READY';
  if (!st.hasApproved && st.hasInReview) return 'app-approval-watch';
  if (st.hasApproved && (st.candidate || st.versions.some((v) => !v.deployed && IN_REVIEW_RE.test(String(v.reviewStatus))))) return 'release-watch';
  if (!st.hasApproved && !st.hasInReview && st.versions.length) return 'app-approval-watch';
  return 'NONE';
}

async function cmdReleaseStatus(request, appName) {
  const { ws, appId } = await resolveApp(request, appName);
  const st = await checkReleaseStatus(request, ws, appId);
  const phase = resolveWatcherPhase(st);
  console.log(`\n[release-status] ${appName} (ws ${ws} / miniApp ${appId}) — read 전용(클릭 없음)\n`);

  // 게이트 A: 앱 정보(meta) 승인 상태
  const gateAStatus = st.hasApproved ? 'APPROVED' : (st.hasInReview ? 'IN_REVIEW(심사중)' : 'NOT_SUBMITTED');
  console.log(
    `게이트 A — 앱 정보(meta): hasApproved=${st.hasApproved}` +
    ` hasInReview=${st.hasInReview}` +
    ` [${gateAStatus}]\n`
  );

  if (!st.versions.length) {
    console.log('버전: (없음)');
  } else {
    table(
      ['versionName', 'reviewStatus', 'deployed', 'isTested', 'sdkVersion'],
      st.versions.map((v) => [
        v.versionName,
        v.reviewStatus || '-',
        v.deployed ? 'YES' : 'no',
        v.isTested ? 'YES' : 'no',
        v.sdkVersion || '-',
      ]),
      [16, 14, 9, 9, 11]
    );
  }

  console.log(`\n판정: ${st.verdict} (${VERDICT_KO[st.verdict]}) — ${st.reason}`);

  // 현재 어느 watcher 차례인지 명시
  const phaseMsg = {
    'app-approval-watch': '현재 단계: app-approval-watch 대기 (앱 정보 hasApproved=true 기다리는 중)',
    'release-watch':      '현재 단계: release-watch 대기 (버전 심사 APPROVED 기다리는 중)',
    'READY':              '현재 단계: READY — release-watch 완료, 출시 가능',
    'NONE':               '현재 단계: 플로우 미진입 (버전 없음 또는 초기 상태)',
  }[phase];
  console.log(phaseMsg);
  console.log('체인 순서: app-approval-watch → submit-review → release-watch → release');

  return st.ready ? 0 : 3;
}

// ---------------------------------------------------------------- release (감지=동작 / 클릭=스캐폴드)
// 감지(release-status 게이트 재확인)까지는 캡처분으로 동작.
// 실제 "출시하기" 클릭 API/DOM은 미캡처(dom-map §3-W 단계5: 버튼 미노출 — APPROVED 게이트 차단).
async function cmdRelease(request, appName) {
  const { ws, appId } = await resolveApp(request, appName);
  const st = await checkReleaseStatus(request, ws, appId);
  if (!st.ready) {
    throw new Error(`[release] 출시 불가 상태(${st.verdict}) — ${st.reason}. 클릭하지 않고 중단`);
  }
  announceWrite('release (출시하기 — 실제 출시 확정)', {
    앱: `${appName} (ws ${ws} / miniApp ${appId})`,
    버전: `${st.candidate.versionName} (reviewStatus=APPROVED, deployed=false)`,
  });
  throw new Error(
    '[release] 출시하기 클릭 API 미캡처 — reviewStatus=APPROVED 게이트 통과 후 재캡처하여 ' +
    'console-dom-map.md(§3-W 단계5) 갱신 필요. 추측 셀렉터/URL로 강행하지 않습니다.'
  );
}

// ---------------------------------------------------------------- submit-review (게이트 검사=동작 / 제출=스캐폴드)
// 게이트 검사(isTested·게이트 A hasApproved)는 캡처분으로 동작.
// 출시노트 폼/검토 제출 API는 미캡처(dom-map §3-W 단계4: 게이트 A 차단 상태에서 spike 종료).
async function cmdSubmitReview(request, appName) {
  const { ws, appId } = await resolveApp(request, appName);
  const [detail, versions] = await Promise.all([
    api.getAppDetail(request, ws, appId),
    api.getAppVersions(request, ws, appId),
  ]);
  const latest = sortLatestFirst(versions)[0];
  console.log(`[submit-review] ${appName} (ws ${ws} / miniApp ${appId}) — 게이트 검사`);
  console.log(
    `  게이트 A — 앱 정보(meta): hasApproved=${!!(detail && detail.hasApproved)}` +
    ` hasInReview=${!!(detail && detail.hasInReview)}`
  );
  console.log(
    `  최신 버전: ${latest ? `${latest.versionName} (reviewStatus=${latest.reviewStatus}, isTested=${latest.isTested})` : '(없음)'}`
  );
  if (!latest) throw new Error('[submit-review] 업로드된 버전 없음 — upload 선행 필요');
  if (!latest.isTested) {
    throw new Error('[submit-review] isTested=false — test-send 선행 필요(검토 요청 버튼 활성 조건)');
  }
  if (!(detail && detail.hasApproved)) {
    throw new Error(
      '[submit-review] 게이트 A 차단 — 앱 정보(meta) 미승인. 앱 정보 검토 승인(hasApproved=true) 후 재시도. ' +
      '출시노트 폼/제출 API는 게이트 통과 후 재캡처하여 console-dom-map.md(§3-W 단계4) 갱신 필요'
    );
  }
  throw new Error(
    '[submit-review] 검토 제출 API/출시노트 폼 미캡처(spike가 게이트 A에 차단된 채 종료) — ' +
    '게이트 통과 상태에서 재캡처하여 console-dom-map.md(§3-W 단계4) 갱신 필요. 추측 셀렉터/URL로 강행하지 않습니다.'
  );
}

// ---------------------------------------------------------------- release-watch (asyncWatch 기반)
// 안전 규칙: 사용자 "출시해라" 개시 체인(또는 명시 설정)에서만 기동 — --confirm-release 필수.
// check = release-status(API 우선), onReady = release 1회(실패 시 재시도 금지).
async function cmdReleaseWatch(request, appName, flags) {
  const { ws, appId } = await resolveApp(request, appName);
  const intervalMs = parseInterval(flags.interval); // 기본 1h
  const max = flags.max !== undefined ? parseInt(flags.max, 10) : null;
  if (max !== null && (!Number.isFinite(max) || max < 1)) {
    throw new Error('[release-watch] --max 는 1 이상의 정수여야 합니다');
  }
  console.log(
    `[release-watch] ${appName} 기동 — interval=${intervalMs}ms, max=${max === null ? '무제한' : max} ` +
    '(check=release-status API, onReady=release 1회)'
  );
  const result = await asyncWatch({
    name: `release-watch:${appName}`,
    intervalMs,
    max,
    check: async () => {
      const st = await checkReleaseStatus(request, ws, appId);
      return { ready: st.ready, reason: `${st.verdict} — ${st.reason}` };
    },
    // 주의: 현재 release의 "출시하기 클릭"은 미캡처 스캐폴드 — READY 도달 시
    // 게이트 재확인·announceWrite까지 수행 후 재캡처 안내와 함께 중단된다.
    // release-watch는 --confirm-release로 사용자가 이미 개시 승인한 체인임.
    onReady: () => cmdRelease(request, appName),
  });
  if (result.status === 'ready') {
    console.log(`[release-watch] 완료 — release 실행됨 (poll ${result.polls}회)`);
    return 0;
  }
  if (result.status === 'expired') {
    console.error(`[release-watch] 대기 만료 — max ${max} 도달 (poll ${result.polls}회)`);
    return 4;
  }
  console.error(`[release-watch] 중단(${result.status}, 재시도 없음): ${result.error}`);
  return 1;
}

// ---------------------------------------------------------------- app-approval-watch (asyncWatch 기반)
// 안전 규칙: read 전용 폴링 — 사용자 개시 불요(클릭 없음).
// check = getAppDetail.hasApproved (API 직접, DOM 불필요).
// onReady = "승인 완료" 로그 + "버전 검토 요청 가능" 안내.
// --then-submit-review 플래그가 있으면 submit-review 체인을 시도하나,
// submit-review가 아직 게이트 통과 후 미캡처 상태이므로 "dom-map 갱신 필요" 마커로 안전 중단.
async function cmdAppApprovalWatch(request, appName, flags) {
  const { ws, appId } = await resolveApp(request, appName);
  const intervalMs = parseInterval(flags.interval); // default 1h
  const max = flags.max !== undefined ? parseInt(flags.max, 10) : null;
  if (max !== null && (!Number.isFinite(max) || max < 1)) {
    throw new Error('[app-approval-watch] --max 는 1 이상의 정수여야 합니다');
  }
  console.log(
    `[app-approval-watch] ${appName} 기동 — interval=${intervalMs}ms, max=${max === null ? '무제한' : max} ` +
    '(check=getAppDetail.hasApproved API, onReady=승인 안내 로그)'
  );
  const result = await asyncWatch({
    name: `app-approval-watch:${appName}`,
    intervalMs,
    max,
    check: async () => {
      const detail = await api.getAppDetail(request, ws, appId);
      const hasApproved = !!(detail && detail.hasApproved);
      const hasInReview = !!(detail && detail.hasInReview);
      return {
        ready: hasApproved,
        reason: hasApproved
          ? 'hasApproved=true — 앱 정보 승인 완료'
          : `hasApproved=false hasInReview=${hasInReview} — 앱 정보 미승인(대기)`,
      };
    },
    onReady: async () => {
      console.log(`[app-approval-watch] 앱 정보 승인 완료(hasApproved=true) — ${appName}`);
      console.log('[app-approval-watch] 다음 단계: 버전 검토 요청(submit-review) 가능');
      console.log(`  node ait-console.cjs submit-review ${appName}`);
      if (flags['then-submit-review']) {
        // submit-review is still a scaffold (gate A blocked during spike); halt safely.
        throw new Error(
          '[app-approval-watch --then-submit-review] submit-review 폼/API 미캡처 — ' +
          '게이트 A 통과 상태에서 재캡처하여 console-dom-map.md(§3-W 단계4) 갱신 필요. ' +
          '추측 셀렉터/URL로 강행하지 않습니다.'
        );
      }
    },
  });
  if (result.status === 'ready') {
    console.log(`[app-approval-watch] 완료 — 앱 정보 승인 감지 (poll ${result.polls}회)`);
    return 0;
  }
  if (result.status === 'expired') {
    console.error(`[app-approval-watch] 대기 만료 — max ${max} 도달 (poll ${result.polls}회)`);
    return 4;
  }
  if (result.status === 'onready-failed') {
    // --then-submit-review scaffold halt: exit 1 but with clear marker
    console.error(`[app-approval-watch] onReady 중단(재시도 없음): ${result.error}`);
    return 1;
  }
  console.error(`[app-approval-watch] 중단(${result.status}, 재시도 없음): ${result.error}`);
  return 1;
}

// ---------------------------------------------------------------- scaffolds (미캡처 — 게이트로 차단)
function scaffoldExit(name, lines) {
  console.error(`[${name}] 미구현(스캐폴드) — 추측 셀렉터/URL로 강행하지 않습니다.`);
  for (const l of lines) console.error(`  ${l}`);
  process.exit(1);
}

// ---------------------------------------------------------------- help
function printHelp() {
  console.log(`
ait-console — appintoss 콘솔 CLI (단일 진입점)

사용법:
  node ait-console.cjs <subcommand> [args...]

read (즉시 동작):
  apps                            워크스페이스 + 앱 목록 표 출력
  versions <appName>              특정 앱의 전체 버전 내역 표 출력
  release-status <appName>        출시 가능 판정(READY/WAITING/NOT_READY) — read 전용, 클릭 없음
                                  exit 0=READY, 3=READY 아님

write (캡처 API — 실동작):
  set-app-info <appName> [--docs <dir>] [--submit]
                                  앱 정보 등록 — docs/APP-SPEC.md(부제·상세·카테고리·키워드) 파싱
                                  + docs/assets(icon·screenshot-1~3·thumbnail) 업로드 → draft 저장(PUT)
                                  → GET draft readback 항목별 검증. 발급 iconUri 출력(granite.config 갱신용)
                                  기본은 draft 저장+검증까지만 — **앱정보 검수 제출은 --submit 명시 필요**
                                  --docs 생략 시 cwd/docs 사용. 카테고리 매핑 실패 시 후보 출력 후 중단
  upload <appName> <bundle.ait>   테스트 버전 업로드 (initialize → presigned S3 PUT → complete)
                                  업로드 후 versionName readback 검증
  test-send <appName> [deploymentId]
                                  테스트 푸시 실발송(bundles/test-push) → isTested=true 확인
                                  deploymentId 생략 시 최신 버전 대상

watch (lib/watch.cjs asyncWatch 기반 — 기본 1시간 폴링):
  app-approval-watch <appName> [--interval 1h] [--max N] [--then-submit-review]
                                  앱 정보 hasApproved 폴링 → true 시 "버전 검토 요청 가능" 안내
                                  read 전용 폴링(클릭 없음) — 사용자 개시 불요
                                  --then-submit-review: 승인 후 submit-review 체인 시도
                                    (현재 미캡처 상태라 "dom-map 갱신 필요" 마커로 안전 중단)
                                  exit 4=대기 만료(--max 도달)
                                  체인: app-approval-watch → submit-review → release-watch → release
  release-watch <appName> --confirm-release [--interval 1h] [--max N]
                                  release-status 폴링 → READY 시 release 1회 실행
                                  안전 규칙: 사용자 "출시해라" 개시 체인에서만(--confirm-release 필수)
                                  exit 4=대기 만료(--max 도달)

scaffold (외부 심사 게이트로 미캡처 — 실행 시 안내 후 exit 1):
  register                        앱 등록 — 폼 셀렉터/API 미캡처(dom-map 갱신 필요)
  submit-review <appName> --confirm
                                  검토 요청 — 게이트 검사(게이트A·isTested)는 동작, 제출 API 미캡처
                                  --confirm 필수(코드 강제) — 없으면 exit 2
  release <appName> --confirm     출시하기 — 감지(release-status)는 동작, 클릭 API는 APPROVED 게이트 통과 후 재캡처
                                  --confirm 필수(코드 강제) — 없으면 exit 2
  ad-apply <appName>              광고 unit ID 신청 — 신청 플로우 미캡처
  ad-id-watch <appName>           광고 ID 발급 감지 watcher — 감지 신호 미캡처
  template-watch <appName>        기능성 템플릿 심사 감지 watcher — 감지 신호 미캡처

  help | -h                       이 도움말 출력

exit codes: 0 성공/READY · 1 실패(자동 재시도 없음) · 2 인자 오류 · 3 NOT_READY/대기 · 4 watch 대기 만료
`);
}

// ---------------------------------------------------------------- main
(async () => {
  const [, , sub, ...rest] = process.argv;

  if (!sub || sub === 'help' || sub === '-h') {
    printHelp();
    process.exit(0);
  }

  const { pos, flags } = parseArgs(rest);

  // ---- scaffolds: 세션 불필요 — 즉시 명확한 마커와 함께 중단 (dom-map §3-W·부록 참조)
  if (sub === 'register') {
    scaffoldExit('register', [
      '캡처된 부분: 진입 경로 /workspace/{ws}/mini-app + "등록하기" 버튼 (dom-map §3①)',
      '미확인: 등록 폼 입력 필드(이름·appName·유형)·제출 API — read-only spike에서 쓰기 생성 플로우 미진입',
      '조치: console-dom-map.md 갱신 필요(게이트 통과 후 재캡처)',
    ]);
  }
  if (sub === 'ad-apply') {
    // Gate: ad-apply requires app approval (hasApproved=true) — resolve app and check before scaffold exit.
    if (!pos[0]) usageExit('ad-apply 서브커맨드에는 <appName> 인자가 필요합니다.', 'node ait-console.cjs ad-apply my-app');
    const { ctx: _gateCtx, request: _gateReq } = await api.ensureSession();
    let _gateApproved = false;
    try {
      const _gateFound = await api.findApp(_gateReq, pos[0]);
      if (!_gateFound) {
        console.error(`[ad-apply] 앱 "${pos[0]}"을 찾을 수 없습니다.`);
        await _gateCtx.close();
        process.exit(1);
      }
      const _gateDetail = await api.getAppDetail(_gateReq, _gateFound.workspace.id, _gateFound.app.miniAppId);
      _gateApproved = !!(_gateDetail && _gateDetail.hasApproved);
    } finally {
      await _gateCtx.close();
    }
    if (!_gateApproved) {
      console.error('[ad-apply] 광고 신청은 앱 승인(hasApproved=true) 후 가능 — app-approval-watch로 승인 대기 후 재시도');
      process.exit(3);
    }
    scaffoldExit('ad-apply', [
      '미확인: 광고 unit ID 신청 페이지 진입 경로·신청 폼 DOM/API — write spike에서 미캡처',
      '조치: console-dom-map.md 갱신 필요(게이트 통과 후 재캡처)',
    ]);
  }
  if (sub === 'ad-id-watch') {
    scaffoldExit('ad-id-watch', [
      '미확인: 광고 ID 발급 감지 신호(API/DOM) — dom-map "비동기 상태 감지" 절 부재',
      '구현 예정: asyncWatch(lib/watch.cjs) 기반 — check=발급 감지, onReady=실 광고 ID config 주입→재빌드→테스트 재배포',
      '안전 규칙: 사용자 개시 또는 명시 설정에서만 기동',
      '조치: console-dom-map.md 갱신 필요(게이트 통과 후 재캡처)',
    ]);
  }
  if (sub === 'template-watch') {
    scaffoldExit('template-watch', [
      '미확인: 기능성 메시지 템플릿 심사 통과(2~3영업일) 감지 신호 — dom-map에 미캡처',
      '구현 예정: asyncWatch(lib/watch.cjs) 기반 — check=심사 통과 감지, onReady=발송 활성화 알림(실발송 없음)',
      '안전 규칙: 사용자 개시 또는 명시 설정에서만 기동',
      '조치: console-dom-map.md 갱신 필요(게이트 통과 후 재캡처)',
    ]);
  }

  // ---- 인자 검증 (세션 기동 전)
  const KNOWN = ['apps', 'versions', 'set-app-info', 'upload', 'test-send', 'release-status', 'release', 'submit-review', 'release-watch', 'app-approval-watch'];
  if (!KNOWN.includes(sub)) {
    console.error(`[error] 알 수 없는 서브커맨드: "${sub}"`);
    printHelp();
    process.exit(2);
  }
  if (sub !== 'apps' && !pos[0]) {
    usageExit(`${sub} 서브커맨드에는 <appName> 인자가 필요합니다.`, `node ait-console.cjs ${sub} my-fin-cal`);
  }
  if (sub === 'set-app-info' && flags.docs === true) {
    usageExit('--docs 플래그에는 <dir> 값이 필요합니다.', 'node ait-console.cjs set-app-info my-app --docs ./docs');
  }
  if (sub === 'upload') {
    if (!pos[1]) usageExit('upload 서브커맨드에는 <bundle.ait> 인자가 필요합니다.', 'node ait-console.cjs upload my-app ./dist/my-app.ait');
    if (!fs.existsSync(pos[1])) usageExit(`번들 파일 없음: ${pos[1]}`);
    if (!pos[1].endsWith('.ait')) usageExit(`번들은 .ait 파일이어야 합니다(콘솔 accept=".ait"): ${pos[1]}`);
  }
  if (sub === 'release-watch' && flags['confirm-release'] !== true) {
    usageExit(
      'release-watch는 사용자 "출시해라" 개시 체인에서만 기동합니다 — --confirm-release 플래그 필수(자동 출시 금지 안전 규칙).',
      'node ait-console.cjs release-watch my-app --confirm-release --interval 1h --max 72'
    );
  }
  if (sub === 'submit-review' && !flags.confirm) {
    console.error(
      '[submit-review] 검토 요청은 사용자 명시 승인 필요 — --confirm 플래그(또는 \'출시해라\' 체인)에서만 실행'
    );
    process.exit(2);
  }
  if (sub === 'release' && !flags.confirm) {
    console.error(
      '[release] 출시는 사용자 명시 승인 필요 — --confirm 플래그(또는 \'출시해라\' 체인)에서만 실행'
    );
    process.exit(2);
  }

  // ---- 세션 + 디스패치
  const { ctx, request } = await api.ensureSession();
  let exitCode = 0;
  try {
    if (sub === 'apps') await cmdApps(request);
    else if (sub === 'versions') await cmdVersions(request, pos[0]);
    else if (sub === 'set-app-info') await cmdSetAppInfo(request, pos[0], flags);
    else if (sub === 'upload') await cmdUpload(request, pos[0], pos[1], flags);
    else if (sub === 'test-send') await cmdTestSend(request, pos[0], pos[1]);
    else if (sub === 'release-status') exitCode = await cmdReleaseStatus(request, pos[0]);
    else if (sub === 'release') await cmdRelease(request, pos[0]);
    else if (sub === 'submit-review') await cmdSubmitReview(request, pos[0]);
    else if (sub === 'release-watch') exitCode = await cmdReleaseWatch(request, pos[0], flags);
    else if (sub === 'app-approval-watch') exitCode = await cmdAppApprovalWatch(request, pos[0], flags);
  } finally {
    await ctx.close();
  }
  process.exit(exitCode);
})().catch((e) => {
  console.error('[fatal]', e.message);
  console.error('자동 재시도하지 않습니다 — 실패 단계는 메시지 prefix 참조.');
  process.exit(1);
});
