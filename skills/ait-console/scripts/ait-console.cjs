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
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const api = require('./lib/api.cjs');
const { asyncWatch, parseInterval } = require('./lib/watch.cjs');

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

// ---------------------------------------------------------------- upload (공식 ait deploy CLI 래퍼)
// raw S3 3-step(initialize→presigned PUT→complete)은 표면상 CREATED여도 콘솔이
// 번들을 못 읽어 AccessDenied 발생 → 폐기(lib/api.cjs DEPRECATED 주석 참조).
// 공식 경로: <projectDir>/node_modules/.bin/ait deploy [--location <.ait>]
// (-m/--memo 는 CLI 버전에 따라 미지원 — `ait deploy --help`로 감지해 지원 시에만 부착)
// — 앱 프로젝트 디렉터리를 cwd로 실행(granite.config 사용). 인증은 API 키 토큰
// (`ait token add --api-key <key>`, 토큰은 ~/.ait/credentials 저장).

function execFileP(file, args, opts) {
  return new Promise((resolve) => {
    execFile(file, args, { maxBuffer: 32 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
      resolve({ err, stdout: String(stdout || ''), stderr: String(stderr || '') });
    });
  });
}

/** ~/.ait/credentials 존재 + 비어있지 않음 = 배포 토큰 등록됨. */
function hasDeployToken() {
  try {
    return fs.statSync(path.join(os.homedir(), '.ait', 'credentials')).size > 0;
  } catch {
    return false;
  }
}

/** Strip ANSI escapes + spinner carriage returns for output parsing. */
function stripAnsi(s) {
  return String(s).replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '').replace(/\r/g, '\n');
}

async function cmdUpload(projectDir, flags) {
  const aitBin = path.join(projectDir, 'node_modules', '.bin', 'ait');
  if (!fs.existsSync(aitBin)) {
    throw new Error(`[upload] ait CLI 없음: ${aitBin} — 앱 프로젝트 의존성 설치(node_modules) 필요`);
  }

  // memo: --memo > 앱 package.json version > "auto"
  let memo = typeof flags.memo === 'string' ? flags.memo : null;
  if (!memo) {
    try {
      memo = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8')).version || 'auto';
    } catch {
      memo = 'auto';
    }
  }

  // 토큰 체크: 없으면 env AIT_DEPLOY_API_KEY로 자동 등록, 그것도 없으면 NEEDS_CONTEXT(exit 2).
  if (!hasDeployToken()) {
    const apiKey = process.env.AIT_DEPLOY_API_KEY;
    if (apiKey) {
      // API 키 값은 로그·파일에 절대 기록하지 않는다(저장은 ait가 ~/.ait에 수행).
      console.log('[upload] 배포 토큰 없음 — AIT_DEPLOY_API_KEY 환경변수로 `ait token add` 자동 등록 시도');
      const reg = await execFileP(aitBin, ['token', 'add', '--api-key', apiKey], { cwd: projectDir });
      if (reg.err || !hasDeployToken()) {
        const tail = stripAnsi(reg.stderr || reg.stdout).trim().split('\n').filter(Boolean).pop() || '원인 미상';
        throw new Error(`[upload] ait token add 실패 — ${tail}`);
      }
      console.log('[upload] 토큰 등록 완료 (~/.ait/credentials)');
    } else {
      console.log(
        '[upload] NEEDS_CONTEXT: 배포 토큰이 없습니다. 콘솔에서 발급한 API 키가 필요합니다. ' +
        'AIT_DEPLOY_API_KEY 환경변수로 키를 주고 재실행하거나, `ait token add`로 등록하세요.'
      );
      process.exit(2);
    }
  }

  const bundle = typeof flags.bundle === 'string' ? path.resolve(flags.bundle) : null;
  announceWrite('upload (공식 ait deploy — 테스트 버전 배포)', {
    프로젝트: projectDir,
    번들: bundle || '(ait 기본 — projectDir 내 .ait, granite.config 기준)',
    memo,
    효과: '새 테스트 버전 배포(deeplink 발급). 검토 요청/출시는 수행하지 않음',
  });

  // issue #1: live ait deploy signature has no -m/--memo — attaching it on an
  // unsupported CLI fails every upload with `Unknown Syntax Error: Unsupported option name ("-m")`.
  // Detect support from `ait deploy --help` (stdout+stderr, stripAnsi) and attach only when present.
  const helpOut = await execFileP(aitBin, ['deploy', '--help'], { cwd: projectDir });
  const memoSupported = /(^|[\s[(,])(--memo|-m)\b/.test(stripAnsi(`${helpOut.stdout}\n${helpOut.stderr}`));
  if (!memoSupported) {
    console.log('[upload] 주의: 현재 ait CLI는 memo 미지원 — 콘솔 메모 미입력(콘솔 versionName으로 식별)');
  }
  const args = ['deploy', ...(bundle ? ['--location', bundle] : []), ...(memoSupported ? ['-m', memo] : [])];
  console.log(`[upload] ait ${args.join(' ')} (cwd=${projectDir})`);
  const r = await execFileP(aitBin, args, { cwd: projectDir, timeout: 10 * 60 * 1000 });
  if (r.err) {
    // Merge stdout+stderr, strip ANSI/spinner, and show the last meaningful lines.
    const combined = stripAnsi(`${r.stdout}\n${r.stderr}`);
    const meaningful = combined
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !/배포 중|Deploying|⠋|⠙|⠹|⠸|⠼|⠴|⠦|⠧|⠇|⠏/.test(l));
    const tail = meaningful.slice(-8);
    if (tail.length) {
      console.error('[upload] ait deploy 출력:');
      for (const l of tail) console.error(`  ${l}`);
    }
    const tailStr = tail.join(' ');
    if (/4097|이미 해당 앱 번들/.test(tailStr)) {
      console.error(
        '[upload] 동일 번들이 이미 업로드됨(4097) — 코드 변경 후 ait build로 새 번들을 빌드한 뒤 재배포하세요.' +
        ' (콘솔은 동일 .ait 중복 업로드를 거부합니다.)' +
        '\n[upload] 힌트: 빌드 전 npm version patch --no-git-tag-version 으로 버전을 올리는 것을 권장합니다(pipeline/SKILL.md 빌드 전 버전 범프 원칙).'
      );
    } else {
      console.error(`[upload] ait deploy 실패 (exit ${r.err.code != null ? r.err.code : r.err.signal || '?'})`);
    }
    process.exit(1);
  }

  // 진행 스피너 줄이 많을 수 있으므로 deeplink는 마지막 매치만 파싱.
  const out = stripAnsi(`${r.stdout}\n${r.stderr}`);
  const links = out.match(/intoss-private:\/\/[^\s'"]+/g) || [];
  const deeplink = links.length ? links[links.length - 1] : null;
  const idMatch = deeplink ? deeplink.match(/_deploymentId=([\w-]+)/) : null;
  const deploymentId = idMatch ? idMatch[1] : null;

  const lines = out.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const l of lines.slice(-4)) console.log(`[ait] ${l}`);
  if (!deeplink) {
    throw new Error('[upload] ait deploy 출력에서 deeplink(intoss-private://) 미발견 — 위 출력 확인 필요');
  }
  console.log(`\n[done] upload 완료 — memo=${memo}`);
  console.log(`  deeplink: ${deeplink}`);
  console.log(`  deploymentId: ${deploymentId || '(파싱 실패)'}`);
  console.log('  다음 단계: node ait-console.cjs test-send <appName>');
}

// ---------------------------------------------------------------- register (캡처 API — REST 2-step)
// dom-map §3-W 단계0: POST mini-app/entry-eligibility-check {idea}(판정 로그만, 등록을 막지 않음)
// → POST mini-app {title, appName, appType} → miniAppId. appName 중복 시 건너뜀(멱등).

/** Derive an appName slug (영문 소문자 규칙) from the title; '' when not derivable. */
function deriveAppName(title) {
  return String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function cmdRegister(request, { title, appName, appType, idea }) {
  // 멱등성: 동일 appName 존재 시 생성하지 않고 정상 종료 (dom-map 단계0: 사전 GET /mini-app 중복 검사 권장)
  const existing = await api.findApp(request, appName);
  if (existing) {
    console.log(`[register] 이미 등록됨 (miniAppId ${existing.app.miniAppId}) — 건너뜀`);
    return;
  }
  const workspaces = await api.listWorkspaces(request);
  if (!workspaces.length) throw new Error('[register] 워크스페이스 없음 — 콘솔에서 워크스페이스 생성 필요');
  const ws = workspaces[0].id;

  announceWrite('register (앱 생성 — REST 2-step)', {
    워크스페이스: `${ws} (${workspaces[0].name})`,
    title,
    appName,
    appType,
    idea: `${idea.length}자 — "${idea.split('\n')[0].slice(0, 40)}"`,
    효과: 'entry-eligibility-check 판정 로그(차단 없음) 후 POST mini-app으로 앱 생성',
  });

  const elig = await api.checkEntryEligibility(request, ws, idea);
  console.log(
    `[register] eligibility-check: decision=${(elig && elig.decision) || '-'}` +
    ` finalMessage=${(elig && elig.finalMessage) || '-'} (등록을 차단하지 않음)`
  );

  const miniAppId = await api.createApp(request, ws, { title, appName, appType });
  console.log(`[done] register 완료 — miniAppId ${miniAppId} (title="${title}", appName=${appName}, appType=${appType})`);
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

// ---------------------------------------------------------------- release-watch (asyncWatch 기반)
// 안전 규칙: 사용자 "출시해라" 개시 체인(또는 명시 설정)에서만 기동 — --confirm-release 필수.
// check = release-status(API 우선), onReady = 수동 출시 안내 출력(출시 클릭 없음 — 출시는 수동).
async function cmdReleaseWatch(ctx, request, appName, flags) {
  const { ws, appId } = await resolveApp(request, appName);
  const intervalMs = parseInterval(flags.interval); // 기본 1h
  const max = flags.max !== undefined ? parseInt(flags.max, 10) : null;
  if (max !== null && (!Number.isFinite(max) || max < 1)) {
    throw new Error('[release-watch] --max 는 1 이상의 정수여야 합니다');
  }
  console.log(
    `[release-watch] ${appName} 기동 — interval=${intervalMs}ms, max=${max === null ? '무제한' : max} ` +
    '(check=release-status API, onReady=수동 출시 안내)'
  );
  const result = await asyncWatch({
    name: `release-watch:${appName}`,
    intervalMs,
    max,
    check: async () => {
      const st = await checkReleaseStatus(request, ws, appId);
      return { ready: st.ready, reason: `${st.verdict} — ${st.reason}` };
    },
    // 출시는 자동화 경계 밖(수동 영역) — READY 도달 시 클릭 없이 수동 출시 안내만 출력한다.
    onReady: async () => {
      console.log(
        '[release-watch] 출시 가능 감지 — 출시는 수동입니다. 콘솔 → 앱 → 버전 → "출시하기" 버튼을 직접 클릭하세요'
      );
    },
  });
  if (result.status === 'ready') {
    console.log(`[release-watch] 완료 — 수동 출시 안내 출력 (poll ${result.polls}회)`);
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
// --then-submit-review 플래그가 있어도 submit-review는 파괴적 동작(--confirm 강제)이라
// 자동 체인하지 않고 명시 실행 안내와 함께 안전 중단.
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
        // submit-review is destructive (--confirm enforced) — never auto-chain it.
        throw new Error(
          '[app-approval-watch --then-submit-review] submit-review는 파괴적 동작 — 자동 체인 금지. ' +
          `사용자 명시 실행 필요: node ait-console.cjs submit-review ${appName} --confirm --note "<출시 노트>"`
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

// ---------------------------------------------------------------- manual (수동 수행 영역 — 안내 후 exit 0)
// 콘솔 자동화 경계 재설계: 아래 5종은 자동화하지 않는다 — 무엇을/어디서/왜 수동인지 안내 후 정상 종료(exit 0).
const MANUAL_CMDS = ['set-app-info', 'test-send', 'submit-review', 'cancel-review', 'release'];

const MANUAL_GUIDES = {
  'set-app-info': {
    what: '앱 정보·에셋 입력',
    where: '콘솔 → 앱 → 앱 정보 → 수정하기',
    why: '앱 정보 등록은 수동 정책',
  },
  'test-send': {
    what: '테스트 푸시 발송',
    where: '버전 페이지 해당 버전 행 "테스트"',
    why: '단말 실검증은 사용자 수행',
  },
  'submit-review': {
    what: '검토 요청 + 출시노트 입력',
    where: '버전 행 "검토 요청" → 모달',
    why: '심사 제출은 사용자 결정',
  },
  'cancel-review': {
    what: '요청 취소',
    where: '검토중 버전 행 "요청 취소"',
    why: '파괴적 동작',
  },
  'release': {
    what: '출시',
    where: '버전 페이지 "출시하기" (APPROVED 후 노출)',
    why: '출시는 사용자 최종 결정',
  },
};

/** announceWrite-style manual guidance — 무엇을/콘솔 메뉴 경로/왜 수동인지 출력 후 exit 0. */
function manualExit(sub) {
  const g = MANUAL_GUIDES[sub];
  console.log(`\n[manual] ${sub} — 수동 수행 영역 (자동화하지 않음)`);
  console.log(`  - 무엇을: ${g.what}`);
  console.log(`  - 콘솔 경로: ${g.where}`);
  console.log(`  - 왜 수동: ${g.why}`);
  console.log('  상세 체크리스트: docs/REPORT-v{version}.md §🙋 사용자가 해야 할 것');
  process.exit(0);
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
  register --title "<앱이름>" --idea "<앱 소개>" [--type GAME|NON_GAME] [--app-name <슬러그>] [--dry-run]
                                  앱 등록 — REST 2-step: entry-eligibility-check(판정 로그만, 차단 없음)
                                  → POST mini-app 생성(miniAppId 보고). 동일 appName 존재 시 건너뜀(멱등)
                                  --idea 10자 이상 필수 · --type 기본 NON_GAME(GAME|NON_GAME만 허용)
                                  --app-name 생략 시 title에서 영문 소문자 슬러그 도출(미도출 시 지정 필요)
                                  --dry-run: 세션/브라우저 기동 없이 payload·호출 엔드포인트만 출력 후 exit 0
  set-app-info <appName>          MANUAL — 콘솔 직접 수행(실행 시 안내만 출력)
                                  앱 정보·에셋 입력: 콘솔 → 앱 → 앱 정보 → 수정하기
  upload <projectDir> [--memo <메모>] [--bundle <.ait>]
                                  공식 ait deploy 래퍼 — 테스트 버전 배포(API 키 토큰 인증)
                                  raw S3 3-step은 콘솔 AccessDenied로 폐기. 앱 프로젝트 디렉터리를
                                  cwd로 node_modules/.bin/ait deploy 실행, deeplink·deploymentId 보고
                                  토큰 없으면: AIT_DEPLOY_API_KEY env로 자동 등록, env도 없으면 exit 2(요청)
                                  --memo 미지정 시 앱 package.json version 또는 "auto"
                                  memo는 ait deploy --help에서 -m/--memo 지원 감지 시에만 부착(미지원 CLI 호환)
  test-send <appName>             MANUAL — 콘솔 직접 수행(실행 시 안내만 출력)
                                  테스트 푸시 발송: 버전 페이지 해당 버전 행 "테스트"
  submit-review <appName>         MANUAL — 콘솔 직접 수행(실행 시 안내만 출력)
                                  검토 요청 + 출시노트 입력: 버전 행 "검토 요청" → 모달
  release <appName>               MANUAL — 콘솔 직접 수행(실행 시 안내만 출력)
                                  출시: 버전 페이지 "출시하기" (APPROVED 후 노출)
  cancel-review <appName>         MANUAL — 콘솔 직접 수행(실행 시 안내만 출력)
                                  요청 취소: 검토중 버전 행 "요청 취소"

watch (lib/watch.cjs asyncWatch 기반 — 기본 1시간 폴링):
  app-approval-watch <appName> [--interval 1h] [--max N] [--then-submit-review]
                                  앱 정보 hasApproved 폴링 → true 시 "버전 검토 요청 가능" 안내
                                  read 전용 폴링(클릭 없음) — 사용자 개시 불요
                                  --then-submit-review: submit-review는 파괴적(--confirm 강제)이라
                                    자동 체인하지 않고 명시 실행 안내와 함께 안전 중단
                                  exit 4=대기 만료(--max 도달)
                                  체인: app-approval-watch → submit-review → release-watch → release
  release-watch <appName> --confirm-release [--interval 1h] [--max N]
                                  release-status 폴링 → READY 시 수동 출시 안내 출력(출시 클릭 없음)
                                  안전 규칙: 사용자 "출시해라" 개시 체인에서만(--confirm-release 필수)
                                  exit 4=대기 만료(--max 도달)

scaffold (외부 심사 게이트로 미캡처 — 실행 시 안내 후 exit 1):
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
  const KNOWN = ['apps', 'versions', 'register', 'set-app-info', 'upload', 'test-send', 'release-status', 'release', 'submit-review', 'cancel-review', 'release-watch', 'app-approval-watch'];
  if (!KNOWN.includes(sub)) {
    console.error(`[error] 알 수 없는 서브커맨드: "${sub}"`);
    printHelp();
    process.exit(2);
  }
  // ---- MANUAL 5종: 수동 수행 영역 — 세션/브라우저 기동 없이 안내 후 종료 (exit 0)
  if (MANUAL_CMDS.includes(sub)) {
    manualExit(sub);
    return;
  }
  if (sub !== 'apps' && sub !== 'register' && !pos[0]) {
    usageExit(`${sub} 서브커맨드에는 <appName> 인자가 필요합니다.`, `node ait-console.cjs ${sub} my-fin-cal`);
  }
  // ---- register: 인자 검증 + --dry-run 조기 디스패치 (세션/브라우저 기동 전 — upload 패턴)
  let registerArgs = null;
  if (sub === 'register') {
    if (typeof flags.title !== 'string' || !flags.title.trim()) {
      usageExit(
        'register 서브커맨드에는 --title "<앱 이름>" 인자가 필요합니다.',
        'node ait-console.cjs register --title "고정비지킴이" --idea "<10자 이상 앱 소개>"'
      );
    }
    if (typeof flags.idea !== 'string' || flags.idea.trim().length < 10) {
      usageExit(
        'register 서브커맨드에는 --idea "<앱 소개>" (10자 이상) 인자가 필요합니다.',
        'node ait-console.cjs register --title "고정비지킴이" --idea "매달 나가는 고정비를 한눈에 관리하는 앱"'
      );
    }
    const appType = typeof flags.type === 'string' ? flags.type : 'NON_GAME';
    if (!['GAME', 'NON_GAME'].includes(appType)) {
      usageExit(
        `--type 은 GAME 또는 NON_GAME 만 허용합니다 (입력값: ${flags.type}).`,
        'node ait-console.cjs register --title "고정비지킴이" --idea "..." --type NON_GAME'
      );
    }
    const appName = typeof flags['app-name'] === 'string' ? flags['app-name'] : deriveAppName(flags.title);
    registerArgs = { title: flags.title, appName, appType, idea: flags.idea };
    if (flags['dry-run']) {
      console.log('[register] --dry-run — 세션/브라우저 기동 없이 payload 미리보기만 출력 (쓰기 호출 없음)');
      console.log('  payload:');
      console.log(`    - title: ${registerArgs.title}`);
      console.log(`    - appName: ${registerArgs.appName || '(title에서 미도출 — 실제 실행 시 --app-name 지정 필요)'}`);
      console.log(`    - appType: ${registerArgs.appType}`);
      console.log(`    - idea: ${registerArgs.idea}`);
      console.log('  호출 예정 엔드포인트 (REST 2-step):');
      console.log('    1. POST /workspaces/{ws}/mini-app/entry-eligibility-check  body {idea}');
      console.log('    2. POST /workspaces/{ws}/mini-app  body {title, appName, appType}');
      process.exit(0);
    }
    if (!registerArgs.appName) {
      usageExit(
        'appName을 title에서 도출할 수 없습니다(영문 소문자 규칙) — --app-name <영문 소문자 슬러그>를 지정하세요.',
        'node ait-console.cjs register --title "고정비지킴이" --app-name fixed-cost-keeper --idea "..."'
      );
    }
  }
  // ---- upload: 공식 ait deploy 래퍼 — 콘솔 세션 불필요(API 키 토큰 인증), 여기서 디스패치
  if (sub === 'upload') {
    const projectDir = path.resolve(pos[0]);
    if (!fs.existsSync(projectDir) || !fs.statSync(projectDir).isDirectory()) {
      usageExit(`앱 프로젝트 디렉터리 없음: ${projectDir}`, 'node ait-console.cjs upload /path/to/app --memo "1.0.0"');
    }
    if (flags.memo === true) usageExit('--memo 플래그에는 <메모> 값이 필요합니다.', 'node ait-console.cjs upload /path/to/app --memo "1.0.0"');
    if (flags.bundle !== undefined) {
      if (flags.bundle === true) usageExit('--bundle 플래그에는 <.ait 경로> 값이 필요합니다.');
      if (!fs.existsSync(flags.bundle)) usageExit(`번들 파일 없음: ${flags.bundle}`);
      if (!String(flags.bundle).endsWith('.ait')) usageExit(`번들은 .ait 파일이어야 합니다: ${flags.bundle}`);
    }
    await cmdUpload(projectDir, flags);
    process.exit(0);
  }
  if (sub === 'release-watch' && flags['confirm-release'] !== true) {
    usageExit(
      'release-watch는 사용자 "출시해라" 개시 체인에서만 기동합니다 — --confirm-release 플래그 필수(자동 출시 금지 안전 규칙).',
      'node ait-console.cjs release-watch my-app --confirm-release --interval 1h --max 72'
    );
  }
  // ---- 세션 + 디스패치
  const { ctx, request } = await api.ensureSession();
  let exitCode = 0;
  try {
    if (sub === 'apps') await cmdApps(request);
    else if (sub === 'versions') await cmdVersions(request, pos[0]);
    else if (sub === 'register') await cmdRegister(request, registerArgs);
    else if (sub === 'release-status') exitCode = await cmdReleaseStatus(request, pos[0]);
    else if (sub === 'release-watch') exitCode = await cmdReleaseWatch(ctx, request, pos[0], flags);
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
