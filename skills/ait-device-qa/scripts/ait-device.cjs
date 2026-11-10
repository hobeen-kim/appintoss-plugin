#!/usr/bin/env node
'use strict';
/**
 * ait-device: drive a USB-connected iPhone running the Toss app through
 * Appium (XCUITest driver) + WebDriverAgent over HTTP. The Mac mouse and
 * keyboard are never used.
 *
 * Usage:
 *   node ait-device.cjs <subcommand> [flags...]
 *   node ait-device.cjs help        # full subcommand list
 *
 * Config precedence:
 *   CLI flag > env (AIT_DEVICE_UDID, AIT_DEVICE_TEAM_ID, AIT_DEVICE_WDA_BUNDLE_ID,
 *   AIT_DEVICE_WDA_DIR, AIT_DEVICE_PORT) > ./.appintoss.json "deviceQa" object.
 *   UDID unset and exactly one connected physical iPhone: auto-selected.
 *
 * Never runs sudo, never changes xcode-select, never changes device settings,
 * never tries to unlock the device.
 *
 * Exit codes:
 *   0  success
 *   1  runtime failure (message is prefixed with the step name)
 *   2  bad arguments / missing settings
 *   3  doctor: environment not ready
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile, spawn } = require('child_process');

const XCODE_DEV_DIR = '/Applications/Xcode.app/Contents/Developer';
const TOSS_BUNDLE_ID = 'com.vivarepublica.cash';
const DEFAULT_PORT = 4723;
const CMD_TIMEOUT_MS = 20000;
const HTTP_TIMEOUT_MS = 30000;
const STATUS_TIMEOUT_MS = 3000;
// debt: session creation is capped at 60s (shell 1-minute rule); if first WDA launch exceeds it, add session_discovery based recovery
const SESSION_TIMEOUT_MS = 60000;
const SERVER_WAIT_SEC = 20;
const FIND_LIMIT = 20;
const W3C_ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf';
const STATE_PREFIX = 'ait-device-session-';
const WDA_RUNNER_REL = path.join('Build', 'Products', 'Debug-iphoneos', 'WebDriverAgentRunner-Runner.app');
const SWIPE_DIRS = ['up', 'down', 'left', 'right'];

const COMMON_FLAGS = ['udid', 'team-id', 'wda-bundle-id', 'wda-dir', 'port', 'dry-run'];
const COMMAND_FLAGS = {
  doctor: [],
  'build-wda': [],
  server: [],
  start: [],
  open: ['app', 'deployment'],
  find: ['label'],
  tap: ['x', 'y', 'label'],
  swipe: ['dir'],
  drag: ['from', 'to', 'duration'],
  type: ['label', 'value'],
  'hide-keyboard': [],
  shot: ['out'],
  stop: [],
};

class UsageError extends Error {
  constructor(message, example) {
    super(message);
    this.example = example;
  }
}

function usage(message, example) {
  throw new UsageError(message, example);
}

function fail(step, message) {
  throw new Error(`[${step}] ${message}`);
}

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

function strFlag(flags, key) {
  const v = flags[key];
  if (v === undefined) return undefined;
  if (v === true) usage(`--${key} 플래그에는 값이 필요합니다.`);
  return String(v);
}

function numFlag(flags, key) {
  const s = strFlag(flags, key);
  if (s === undefined) return undefined;
  const n = Number(s);
  if (s.trim() === '' || !Number.isFinite(n)) usage(`--${key} 는 숫자여야 합니다 (입력값: ${s}).`);
  return n;
}

function pointFlag(flags, key) {
  const s = strFlag(flags, key);
  if (s === undefined) usage(`--${key} x,y 가 필요합니다.`, 'drag --from 200,700 --to 200,200');
  const parts = s.split(',').map((p) => p.trim());
  const nums = parts.map(Number);
  if (parts.length !== 2 || parts.some((p) => p === '') || nums.some((n) => !Number.isFinite(n))) {
    usage(`--${key} 는 "x,y" 형식이어야 합니다 (입력값: ${s}).`, 'drag --from 200,700 --to 200,200');
  }
  return { x: nums[0], y: nums[1] };
}

function checkFlags(sub, pos, flags) {
  if (pos.length) usage(`${sub} 는 위치 인자를 받지 않습니다: ${pos.join(' ')}`);
  const allowed = new Set([...COMMON_FLAGS, ...COMMAND_FLAGS[sub]]);
  const unknown = Object.keys(flags).filter((k) => !allowed.has(k));
  if (unknown.length) usage(`${sub} 에서 쓸 수 없는 플래그: ${unknown.map((k) => `--${k}`).join(', ')}`);
}

function expandHome(p) {
  return p.startsWith('~/') ? path.join(os.homedir(), p.slice(2)) : p;
}

function readFileConfig() {
  const file = path.join(process.cwd(), '.appintoss.json');
  if (!fs.existsSync(file)) return {};
  let json;
  try {
    json = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    usage(`.appintoss.json 을 JSON 으로 읽을 수 없습니다: ${e.message}`);
  }
  const dq = json && json.deviceQa;
  return dq && typeof dq === 'object' ? dq : {};
}

function resolveConfig(flags) {
  const file = readFileConfig();
  const pick = (flagKey, envKey, fileKey) => {
    const f = strFlag(flags, flagKey);
    if (f !== undefined && f.trim()) return { value: f.trim(), explicit: true };
    const e = process.env[envKey];
    if (e && e.trim()) return { value: e.trim(), explicit: true };
    const v = file[fileKey];
    if (v !== undefined && v !== null && String(v).trim()) return { value: String(v).trim(), explicit: false };
    return { value: null, explicit: false };
  };
  const port = pick('port', 'AIT_DEVICE_PORT', 'appiumPort');
  const portNum = port.value === null ? DEFAULT_PORT : Number(port.value);
  if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) usage(`Appium 포트가 올바르지 않습니다: ${port.value}`);
  const wdaDir = pick('wda-dir', 'AIT_DEVICE_WDA_DIR', 'wdaDerivedDataPath').value;
  return {
    udid: pick('udid', 'AIT_DEVICE_UDID', 'udid').value,
    teamId: pick('team-id', 'AIT_DEVICE_TEAM_ID', 'teamId').value,
    wdaBundleId: pick('wda-bundle-id', 'AIT_DEVICE_WDA_BUNDLE_ID', 'wdaBundleId').value,
    wdaDir: wdaDir ? path.resolve(expandHome(wdaDir)) : null,
    port: portNum,
    portExplicit: port.explicit,
  };
}

function requireSigning(cfg, sub) {
  const missing = [];
  if (!cfg.teamId) missing.push('teamId (--team-id | AIT_DEVICE_TEAM_ID | deviceQa.teamId)');
  if (!cfg.wdaBundleId) missing.push('wdaBundleId (--wda-bundle-id | AIT_DEVICE_WDA_BUNDLE_ID | deviceQa.wdaBundleId)');
  if (!cfg.wdaDir) missing.push('wdaDerivedDataPath (--wda-dir | AIT_DEVICE_WDA_DIR | deviceQa.wdaDerivedDataPath)');
  if (missing.length) {
    usage(`${sub} 에 필요한 설정이 없습니다:\n  - ${missing.join('\n  - ')}`, `${sub} --team-id ABCDE12345 --wda-bundle-id com.example.wda.runner --wda-dir ~/.appintoss-device/wda-dd`);
  }
}

function developerDir() {
  if (process.env.DEVELOPER_DIR) return { dir: process.env.DEVELOPER_DIR, source: 'DEVELOPER_DIR 환경변수' };
  if (fs.existsSync(XCODE_DEV_DIR)) return { dir: XCODE_DEV_DIR, source: '/Applications/Xcode.app 자동 사용' };
  return { dir: null, source: 'xcode-select 기본값' };
}

function childEnv() {
  const dev = developerDir();
  return dev.dir ? { ...process.env, DEVELOPER_DIR: dev.dir } : process.env;
}

function run(cmd, args, timeoutMs = CMD_TIMEOUT_MS) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: timeoutMs, env: childEnv(), maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({
        ok: !err,
        code: err ? err.code : 0,
        timedOut: !!(err && err.killed),
        notFound: !!(err && err.code === 'ENOENT'),
        stdout: String(stdout || ''),
        stderr: String(stderr || ''),
      });
    });
  });
}

function firstLine(s) {
  return String(s || '').split('\n').map((l) => l.trim()).find(Boolean) || '';
}

function runError(r) {
  if (r.notFound) return '명령을 찾을 수 없음';
  if (r.timedOut) return `${CMD_TIMEOUT_MS / 1000}초 시간 초과`;
  return firstLine(r.stderr) || firstLine(r.stdout) || `exit ${r.code}`;
}

function parseDevice(d) {
  const p = d.properties || {};
  const hw = p.hardware || d.hardwareProperties || {};
  const conn = p.connection || {};
  const st = p.state || {};
  const dp = d.deviceProperties || {};
  const connState = conn.state || (d.connectionProperties || {}).tunnelState;
  const devModeRaw = st.developerModeStatus !== undefined ? st.developerModeStatus : dp.developerModeStatus;
  let devMode = null;
  if (typeof devModeRaw === 'string') devMode = devModeRaw === 'enabled';
  else if (devModeRaw && typeof devModeRaw === 'object') devMode = Object.prototype.hasOwnProperty.call(devModeRaw, 'enabled');
  const sw = p.software || {};
  return {
    udid: hw.udid || '',
    name: st.name || dp.name || '',
    model: hw.marketingName || hw.productType || '',
    platform: hw.platform || '',
    reality: hw.reality || '',
    connected: connState === 'connected',
    devMode,
    os: (sw.osVersionNumber && sw.osVersionNumber.stringValue) || dp.osVersionNumber || '',
  };
}

async function listDevices() {
  const out = path.join(os.tmpdir(), `ait-device-devicectl-${process.pid}.json`);
  try {
    const r = await run('xcrun', ['devicectl', 'list', 'devices', '--json-output', out, '-q']);
    if (!r.ok) return { ok: false, error: runError(r), devices: [] };
    const json = JSON.parse(fs.readFileSync(out, 'utf8'));
    const all = ((json.result && json.result.devices) || []).map(parseDevice);
    return { ok: true, devices: all.filter((d) => d.connected && d.reality === 'physical' && d.platform === 'iOS') };
  } catch (e) {
    return { ok: false, error: e.message, devices: [] };
  } finally {
    fs.rmSync(out, { force: true });
  }
}

function describeDevice(d) {
  return `${d.udid} (${d.name}, ${d.model}, iOS ${d.os})`;
}

async function resolveUdid(cfg, step) {
  if (cfg.udid) return cfg.udid;
  const r = await listDevices();
  if (!r.ok) fail(step, `기기 목록 조회 실패 (xcrun devicectl): ${r.error}`);
  if (r.devices.length === 0) {
    fail(step, '연결된 실기기(iPhone)가 없습니다. 케이블 연결과 "이 컴퓨터 신뢰"는 사용자가 확인해야 합니다. doctor 로 점검하세요.');
  }
  if (r.devices.length > 1) {
    usage(`연결된 실기기가 ${r.devices.length}대입니다. --udid 로 하나를 고르세요:\n  - ${r.devices.map(describeDevice).join('\n  - ')}`);
  }
  console.log(`[${step}] UDID 자동 선택: ${describeDevice(r.devices[0])}`);
  return r.devices[0].udid;
}

function findWdaProject() {
  const home = process.env.APPIUM_HOME || path.join(os.homedir(), '.appium');
  const candidates = [
    path.join(home, 'node_modules', 'appium-xcuitest-driver', 'node_modules', 'appium-webdriveragent', 'WebDriverAgent.xcodeproj'),
    path.join(home, 'node_modules', 'appium-webdriveragent', 'WebDriverAgent.xcodeproj'),
  ];
  return { found: candidates.find((c) => fs.existsSync(c)) || null, candidates };
}

function statePath(udid) {
  return path.join(os.tmpdir(), `${STATE_PREFIX}${udid}.json`);
}

function loadState(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return { ...JSON.parse(fs.readFileSync(file, 'utf8')), file };
  } catch (e) {
    fail('session', `세션 상태 파일을 읽을 수 없습니다 (${file}): ${e.message}`);
  }
}

function findState(cfg) {
  if (cfg.udid) return loadState(statePath(cfg.udid));
  const files = fs.readdirSync(os.tmpdir()).filter((f) => f.startsWith(STATE_PREFIX) && f.endsWith('.json'));
  if (files.length > 1) usage(`세션 상태 파일이 여러 개입니다. --udid 로 기기를 지정하세요: ${files.join(', ')}`);
  return files.length ? loadState(path.join(os.tmpdir(), files[0])) : null;
}

function sessionCtx(cfg, dryRun, step) {
  const state = findState(cfg);
  if (!state && !dryRun) fail(step, `세션이 없습니다 (${os.tmpdir()}/${STATE_PREFIX}*.json). 먼저 start 로 세션을 만드세요.`);
  const port = cfg.portExplicit || !state || !state.port ? cfg.port : state.port;
  return { base: `http://127.0.0.1:${port}`, dryRun, sid: state ? state.sessionId : '<sessionId>', state };
}

function errorHint(message) {
  if (/device is locked|is locked/i.test(message)) {
    return ' / 조치(사용자): 아이폰 잠금을 직접 해제하고 테스트 동안 자동 잠금을 "안 함"으로 두세요.';
  }
  if (/invalid session id|session .*(terminated|not started|does not exist)/i.test(message)) {
    return ' / 조치(에이전트): 세션이 끝났습니다. stop 후 start 로 다시 만드세요.';
  }
  if (/developer mode/i.test(message)) {
    return ' / 조치(사용자): 아이폰 설정 > 개인정보 보호 및 보안 > 개발자 모드를 켜세요.';
  }
  if (/xcodebuild failed|code 65|Unable to launch WebDriverAgent/i.test(message)) {
    return ' / 조치(에이전트): WDA 기동 실패. Appium 로그를 확인하고 build-wda 를 다시 실행하세요.';
  }
  return '';
}

function printDry(base, method, urlPath, body) {
  console.log(`[dry-run] ${method} ${base}${urlPath}`);
  if (body !== undefined) {
    console.log(JSON.stringify(body, null, 2).split('\n').map((l) => `  ${l}`).join('\n'));
  }
}

async function http(ctx, step, method, urlPath, body, timeoutMs = HTTP_TIMEOUT_MS) {
  if (ctx.dryRun) {
    printDry(ctx.base, method, urlPath, body);
    return undefined;
  }
  let res;
  try {
    res = await fetch(`${ctx.base}${urlPath}`, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    if (e.name === 'TimeoutError') fail(step, `${timeoutMs / 1000}초 안에 응답이 없습니다 (${method} ${urlPath}).`);
    const code = (e.cause && e.cause.code) || e.message;
    fail(step, `Appium 서버(${ctx.base})에 연결할 수 없습니다 (${code}). server 로 먼저 띄우세요.`);
  }
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const v = (json && json.value) || {};
    const msg = firstLine(v.message || json.raw || '');
    const err = new Error(`[${step}] ${method} ${urlPath} 실패: HTTP ${res.status} ${v.error || ''} ${msg}${errorHint(`${v.error || ''} ${msg}`)}`);
    err.status = res.status;
    err.wdError = v.error;
    throw err;
  }
  return json.value;
}

async function statusOk(base) {
  try {
    const res = await fetch(`${base}/status`, { signal: AbortSignal.timeout(STATUS_TIMEOUT_MS) });
    return res.ok;
  } catch {
    return false;
  }
}

function execMobile(ctx, step, script, args) {
  return http(ctx, step, 'POST', `/session/${ctx.sid}/execute/sync`, { script, args: [args] });
}

function escapePredicate(text) {
  return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function findByLabel(ctx, step, label) {
  const value = `label CONTAINS '${escapePredicate(label)}'`;
  const found = await http(ctx, step, 'POST', `/session/${ctx.sid}/elements`, { using: '-ios predicate string', value });
  if (ctx.dryRun) return ['<elementId>'];
  return (found || []).map((e) => e[W3C_ELEMENT_KEY] || e.ELEMENT);
}

function center(rect) {
  return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) };
}

function pngSize(buf) {
  const sig = '89504e470d0a1a0a';
  if (buf.length < 24 || buf.subarray(0, 8).toString('hex') !== sig || buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function pad(s, w) {
  s = String(s == null ? '' : s);
  let width = 0;
  for (const ch of s) width += /[ᄀ-ᇿ⺀-꓏가-힣豈-﫿＀-￯]/.test(ch) ? 2 : 1;
  return s + ' '.repeat(Math.max(0, w - width));
}

async function cmdDoctor(cfg) {
  const dev = developerDir();
  const base = `http://127.0.0.1:${cfg.port}`;
  const [xcode, xsel, appiumV, drivers, devices, serverUp] = await Promise.all([
    run('xcodebuild', ['-version']),
    dev.dir ? Promise.resolve(null) : run('xcode-select', ['-p']),
    run('appium', ['-v']),
    run('appium', ['driver', 'list', '--installed', '--json']),
    listDevices(),
    statusOk(base),
  ]);
  const rows = [];
  const add = (item, status, who, detail, fix) => rows.push({ item, status, who, detail, fix });

  const activeDir = dev.dir || (xsel ? firstLine(xsel.stdout) : '');
  const isClt = /CommandLineTools/.test(activeDir);
  if (xcode.ok && !isClt) {
    add('Xcode', 'OK', '-', `${firstLine(xcode.stdout)} (${activeDir}, ${dev.source})`);
  } else if (isClt || !activeDir) {
    const hasXcode = fs.existsSync(XCODE_DEV_DIR);
    add(
      'Xcode', '누락', hasXcode ? '에이전트' : '사용자',
      `개발자 디렉터리가 Xcode 가 아님 (${activeDir || '?'}), devicectl 없음`,
      hasXcode
        ? `DEVELOPER_DIR=${XCODE_DEV_DIR} 로 실행하거나 DEVELOPER_DIR 을 해제 (xcode-select 는 바꾸지 않음)`
        : 'App Store 에서 Xcode 를 설치하고 한 번 실행해 라이선스에 동의 (CommandLineTools 만으로는 devicectl 이 없음)'
    );
  } else {
    add('Xcode', '누락', '사용자', `xcodebuild -version 실패: ${runError(xcode)}`, 'Xcode 를 한 번 실행해 라이선스 동의와 추가 구성 요소 설치를 마치기');
  }

  if (appiumV.ok) add('Appium', 'OK', '-', firstLine(appiumV.stdout));
  else add('Appium', '누락', '에이전트', runError(appiumV), 'npm i -g appium');

  let xcuitest = null;
  if (drivers.ok) {
    try {
      xcuitest = JSON.parse(drivers.stdout).xcuitest || null;
    } catch {
      xcuitest = null;
    }
  }
  if (xcuitest) add('XCUITest 드라이버', 'OK', '-', `xcuitest@${xcuitest.version}`);
  else add('XCUITest 드라이버', '누락', '에이전트', drivers.ok ? '설치 안 됨' : runError(drivers), 'appium driver install xcuitest');

  let target = null;
  if (!devices.ok) {
    add('실기기 연결', '누락', '사용자', `devicectl 실패: ${devices.error}`, 'Xcode 설치 확인 후 아이폰 케이블 연결, "이 컴퓨터 신뢰"');
  } else if (cfg.udid) {
    target = devices.devices.find((d) => d.udid === cfg.udid) || null;
    if (target) add('실기기 연결', 'OK', '-', describeDevice(target));
    else add('실기기 연결', '누락', '사용자', `지정한 UDID ${cfg.udid} 기기가 연결돼 있지 않음 (연결된 실기기 ${devices.devices.length}대)`, '해당 아이폰을 케이블로 연결하고 "이 컴퓨터 신뢰"');
  } else if (devices.devices.length === 1) {
    target = devices.devices[0];
    add('실기기 연결', 'OK', '-', `${describeDevice(target)} 자동 선택`);
  } else if (devices.devices.length === 0) {
    add('실기기 연결', '누락', '사용자', '연결된 실기기 없음', '아이폰을 케이블로 연결하고 "이 컴퓨터 신뢰"');
  } else {
    add('실기기 연결', '누락', '에이전트', `실기기 ${devices.devices.length}대: ${devices.devices.map((d) => d.udid).join(', ')}`, '--udid 또는 AIT_DEVICE_UDID 로 하나를 지정');
  }

  if (!target) add('개발자 모드', '확인 불가', '-', '기기 연결 후 확인');
  else if (target.devMode === true) add('개발자 모드', 'OK', '-', '켜짐');
  else if (target.devMode === false) add('개발자 모드', '누락', '사용자', '꺼짐', '아이폰 설정 > 개인정보 보호 및 보안 > 개발자 모드 켜기 (재시동 포함)');
  else add('개발자 모드', '확인 불가', '-', 'devicectl 출력에 값 없음');

  if (cfg.teamId) add('서명 팀 ID', 'OK', '-', cfg.teamId);
  else add('서명 팀 ID', '누락', '사용자', '미설정', 'Apple 개발자 팀 ID(10자)를 알려 주면 deviceQa.teamId 에 기록. Xcode > Settings > Accounts 에 계정 추가 필요');

  if (cfg.wdaBundleId) add('WDA 번들 ID', 'OK', '-', cfg.wdaBundleId);
  else add('WDA 번들 ID', '누락', '에이전트', '미설정', '팀 안에서 고유한 번들 ID(예: <역도메인>.wda.runner)를 정해 deviceQa.wdaBundleId 에 기록');

  if (!cfg.wdaDir) {
    add('WDA 빌드 산출물', '누락', '에이전트', 'wdaDerivedDataPath 미설정', 'deviceQa.wdaDerivedDataPath 를 정한 뒤 build-wda');
  } else if (fs.existsSync(path.join(cfg.wdaDir, WDA_RUNNER_REL))) {
    add('WDA 빌드 산출물', 'OK', '-', path.join(cfg.wdaDir, WDA_RUNNER_REL));
  } else {
    add('WDA 빌드 산출물', '누락', '에이전트', `${fs.existsSync(cfg.wdaDir) ? 'Runner.app 없음' : '경로 없음'}: ${cfg.wdaDir}`, 'build-wda');
  }

  if (serverUp) add('Appium 서버', 'OK', '-', `${base}/status 응답`);
  else add('Appium 서버', '누락', '에이전트', `${base}/status 응답 없음`, 'server');

  console.log('\nait-device doctor (읽기 전용, xcode-select 와 기기 설정은 바꾸지 않음)');
  console.log(`DEVELOPER_DIR: ${dev.dir || '(미사용, xcode-select 기본값)'} [${dev.source}]\n`);
  const widths = [18, 10, 10];
  console.log(`${pad('항목', widths[0])}  ${pad('상태', widths[1])}  ${pad('조치 주체', widths[2])}  내용`);
  console.log(`${'-'.repeat(widths[0])}  ${'-'.repeat(widths[1])}  ${'-'.repeat(widths[2])}  ${'-'.repeat(40)}`);
  for (const r of rows) {
    console.log(`${pad(r.item, widths[0])}  ${pad(r.status, widths[1])}  ${pad(r.who, widths[2])}  ${r.detail}`);
  }
  const todo = rows.filter((r) => r.status === '누락');
  if (!todo.length) {
    console.log('\n준비 완료: start 로 세션을 만들 수 있습니다.');
    return 0;
  }
  console.log(`\n조치 필요 ${todo.length}건:`);
  for (const r of todo) console.log(`  - [${r.who}] ${r.item}: ${r.fix}`);
  return 3;
}

const BUILD_ERROR_RULES = [
  { re: /PLA Update available/i, who: '사용자', fix: 'developer.apple.com/account 에 로그인해 최신 Program License Agreement 에 동의한 뒤 build-wda 재실행' },
  { re: /No Accounts?:|No Account for Team/i, who: '사용자', fix: 'Xcode > Settings > Accounts 에 Apple 계정(해당 팀 소속) 추가' },
  { re: /cannot be registered to your development team|Failed Registering Bundle Identifier/i, who: '에이전트', fix: '번들 ID 를 쓸 수 없습니다. 팀 안에서 고유한 다른 wdaBundleId 로 바꿔 build-wda 재실행' },
  { re: /requires a development team|No profiles for '|No signing certificate|Code ?Signing Error/i, who: '사용자', fix: '서명 오류: teamId 가 맞는지, Xcode Accounts 에 그 팀 계정이 있는지 확인' },
  { re: /errSecInternalComponent/i, who: '사용자', fix: '로그인 키체인이 잠겨 서명하지 못했습니다. 사용자가 키체인 잠금을 해제' },
  { re: /Developer Mode (is )?disabled|enable Developer Mode/i, who: '사용자', fix: '아이폰 설정 > 개인정보 보호 및 보안 > 개발자 모드 켜기 (재시동 포함)' },
  { re: /Unable to find a destination matching/i, who: '사용자', fix: '기기를 찾지 못했습니다. 케이블 연결과 "이 컴퓨터 신뢰" 확인 후 doctor' },
  { re: /device is locked/i, who: '사용자', fix: '아이폰 잠금을 사용자가 직접 해제' },
];

async function cmdBuildWda(cfg, dryRun) {
  requireSigning(cfg, 'build-wda');
  const udid = await resolveUdid(cfg, 'build-wda');
  const project = findWdaProject();
  const args = [
    'build-for-testing',
    '-project', project.found || project.candidates[0],
    '-scheme', 'WebDriverAgentRunner',
    '-destination', `id=${udid}`,
    '-derivedDataPath', cfg.wdaDir,
    '-allowProvisioningUpdates',
    '-allowProvisioningDeviceRegistration',
    `DEVELOPMENT_TEAM=${cfg.teamId}`,
    'CODE_SIGN_STYLE=Automatic',
    `PRODUCT_BUNDLE_IDENTIFIER=${cfg.wdaBundleId}`,
  ];
  if (dryRun) {
    console.log(`[dry-run] DEVELOPER_DIR=${developerDir().dir || '(xcode-select 기본값)'} xcodebuild ${args.join(' ')}`);
    if (!project.found) console.log(`[dry-run] 경고: WebDriverAgent.xcodeproj 가 없습니다 (appium driver install xcuitest 필요)`);
    return 0;
  }
  if (!project.found) fail('build-wda', `WebDriverAgent.xcodeproj 가 없습니다: ${project.candidates.join(' | ')}. appium driver install xcuitest 를 먼저 실행하세요.`);
  console.log('[build-wda] xcodebuild build-for-testing 시작 (수 분 걸릴 수 있음, 출력을 그대로 보여 줍니다)');
  const hits = new Set();
  let tail = '';
  const scan = (chunk) => {
    const text = tail + chunk.toString();
    for (const rule of BUILD_ERROR_RULES) if (rule.re.test(text)) hits.add(rule);
    tail = text.slice(-300);
  };
  const child = spawn('xcodebuild', args, { env: childEnv(), stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', (c) => { process.stdout.write(c); scan(c); });
  child.stderr.on('data', (c) => { process.stderr.write(c); scan(c); });
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  }).catch((e) => fail('build-wda', e.code === 'ENOENT' ? 'xcodebuild 를 찾을 수 없습니다. Xcode 설치를 확인하세요.' : e.message));
  const runner = path.join(cfg.wdaDir, WDA_RUNNER_REL);
  if (code === 0 && fs.existsSync(runner)) {
    console.log(`\n[build-wda] 완료: ${runner}`);
    return 0;
  }
  if (hits.size) {
    console.error('\n[build-wda] 감지된 원인과 조치:');
    for (const h of hits) console.error(`  - [${h.who}] ${h.fix}`);
  }
  fail('build-wda', code === 0 ? `빌드는 끝났지만 ${runner} 가 없습니다.` : `xcodebuild 실패 (exit ${code}).`);
}

async function cmdServer(cfg, dryRun) {
  const base = `http://127.0.0.1:${cfg.port}`;
  if (await statusOk(base)) {
    console.log(`[server] ${base}/status 가 이미 응답합니다. 새로 띄우지 않습니다.`);
    return 0;
  }
  const args = ['--address', '127.0.0.1', '--port', String(cfg.port)];
  const logPath = path.join(os.tmpdir(), `ait-device-appium-${cfg.port}.log`);
  if (dryRun) {
    console.log(`[dry-run] DEVELOPER_DIR=${developerDir().dir || '(xcode-select 기본값)'} appium ${args.join(' ')}  (detached, 로그 ${logPath})`);
    return 0;
  }
  const fd = fs.openSync(logPath, 'a');
  const child = spawn('appium', args, { detached: true, stdio: ['ignore', fd, fd], env: childEnv() });
  await new Promise((resolve, reject) => {
    child.once('spawn', resolve);
    child.once('error', reject);
  }).catch((e) => fail('server', e.code === 'ENOENT' ? 'appium 명령이 없습니다. npm i -g appium && appium driver install xcuitest' : e.message));
  fs.closeSync(fd);
  let exited = null;
  child.once('exit', (c) => { exited = c; });
  child.unref();
  for (let i = 0; i < SERVER_WAIT_SEC && exited === null; i++) {
    if (await statusOk(base)) {
      console.log(`[server] Appium 기동: ${base} (pid ${child.pid})`);
      console.log(`[server] 로그: ${logPath}`);
      console.log(`[server] 종료할 때: kill ${child.pid}`);
      return 0;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  fail('server', exited !== null ? `appium 이 바로 종료됐습니다 (exit ${exited}). 로그: ${logPath}` : `${SERVER_WAIT_SEC}초 안에 ${base}/status 응답이 없습니다 (pid ${child.pid}). 로그: ${logPath}`);
}

async function sessionAlive(base, sid) {
  try {
    const res = await fetch(`${base}/session/${sid}/timeouts`, { signal: AbortSignal.timeout(10000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function cmdStart(cfg, dryRun) {
  requireSigning(cfg, 'start');
  const udid = await resolveUdid(cfg, 'start');
  const runner = path.join(cfg.wdaDir, WDA_RUNNER_REL);
  if (!fs.existsSync(runner)) {
    if (!dryRun) fail('start', `WDA 빌드 산출물이 없습니다: ${runner}. build-wda 를 먼저 실행하세요.`);
    console.log(`[dry-run] 경고: WDA 빌드 산출물이 없습니다 (${runner}). 실제 실행 전에 build-wda 필요`);
  }
  const ctx = { base: `http://127.0.0.1:${cfg.port}`, dryRun, sid: null };
  const file = statePath(udid);
  const existing = loadState(file);
  if (existing && !dryRun) {
    if (await sessionAlive(ctx.base, existing.sessionId)) {
      console.log(`[start] 기존 세션 재사용: ${existing.sessionId} (상태 파일 ${file})`);
      return 0;
    }
    fs.rmSync(file, { force: true });
  }
  const caps = {
    capabilities: {
      alwaysMatch: {
        platformName: 'iOS',
        'appium:automationName': 'XCUITest',
        'appium:udid': udid,
        'appium:usePrebuiltWDA': true,
        'appium:derivedDataPath': cfg.wdaDir,
        'appium:updatedWDABundleId': cfg.wdaBundleId,
        'appium:xcodeOrgId': cfg.teamId,
        'appium:xcodeSigningId': 'Apple Development',
        'appium:newCommandTimeout': 3600,
        'appium:noReset': true,
      },
      firstMatch: [{}],
    },
  };
  if (!dryRun) console.log('[start] 세션 생성 중 (아이폰에서 WebDriverAgent 가 뜹니다, 최대 60초)');
  const value = await http(ctx, 'start', 'POST', '/session', caps, SESSION_TIMEOUT_MS);
  if (dryRun) {
    console.log(`[dry-run] 성공 시 세션 id 를 ${file} 에 저장`);
    return 0;
  }
  const sessionId = value && value.sessionId;
  if (!sessionId) fail('start', 'Appium 응답에 sessionId 가 없습니다.');
  fs.writeFileSync(file, JSON.stringify({ sessionId, udid, port: cfg.port, createdAt: new Date().toISOString() }, null, 2));
  console.log(`[start] 세션 생성: ${sessionId}`);
  console.log(`[start] 상태 파일: ${file}`);
  return 0;
}

async function cmdOpen(flags, getCtx) {
  const app = strFlag(flags, 'app');
  const dep = strFlag(flags, 'deployment');
  if (!app || !dep) usage('open 에는 --app <appName> 과 --deployment <deploymentId> 가 필요합니다.', 'open --app my-app --deployment 0123abcd');
  if (!/^[A-Za-z0-9._-]+$/.test(app)) usage(`--app 값이 appName 형식이 아닙니다: ${app}`);
  const ctx = getCtx();
  const url = `intoss-private://${app}?_deploymentId=${encodeURIComponent(dep)}&host=appsInTossHost`;
  await execMobile(ctx, 'open', 'mobile: deepLink', { url, bundleId: TOSS_BUNDLE_ID });
  if (!ctx.dryRun) console.log(`[open] 토스 앱으로 열기 요청: ${url}`);
  return 0;
}

async function cmdFind(flags, getCtx) {
  const label = strFlag(flags, 'label');
  if (!label) usage('find 에는 --label <text> 가 필요합니다.', 'find --label 확인');
  const ctx = getCtx();
  const ids = await findByLabel(ctx, 'find', label);
  if (ctx.dryRun) {
    console.log('[dry-run] 이어서 요소마다 GET .../element/<elementId>/attribute/label 과 GET .../element/<elementId>/rect 를 호출');
    return 0;
  }
  console.log(`[find] label CONTAINS '${label}': ${ids.length}개`);
  for (const [i, id] of ids.slice(0, FIND_LIMIT).entries()) {
    const [lab, rect] = await Promise.all([
      http(ctx, 'find', 'GET', `/session/${ctx.sid}/element/${id}/attribute/label`),
      http(ctx, 'find', 'GET', `/session/${ctx.sid}/element/${id}/rect`),
    ]);
    const c = center(rect);
    console.log(`  ${i + 1}. id=${id}  label="${lab}"  rect=${rect.x},${rect.y} ${rect.width}x${rect.height}  center=${c.x},${c.y}`);
  }
  if (ids.length > FIND_LIMIT) console.log(`  ... ${ids.length - FIND_LIMIT}개 더 있음 (label 을 더 구체적으로)`);
  return 0;
}

async function cmdTap(flags, getCtx) {
  const label = strFlag(flags, 'label');
  const x = numFlag(flags, 'x');
  const y = numFlag(flags, 'y');
  if (label !== undefined && (x !== undefined || y !== undefined)) usage('tap 은 --label 또는 --x/--y 중 하나만 씁니다.');
  if (label === '') usage('--label 값이 비어 있습니다.');
  if (label === undefined && (x === undefined || y === undefined)) usage('tap 에는 --x <n> --y <n> 또는 --label <text> 가 필요합니다.', 'tap --x 201 --y 780');
  const ctx = getCtx();
  let point = { x, y };
  if (label !== undefined) {
    const ids = await findByLabel(ctx, 'tap', label);
    if (!ids.length) fail('tap', `label CONTAINS '${label}' 요소가 없습니다. find 로 화면의 label 을 확인하세요.`);
    const rect = await http(ctx, 'tap', 'GET', `/session/${ctx.sid}/element/${ids[0]}/rect`);
    point = ctx.dryRun ? { x: '<rect 중심 x>', y: '<rect 중심 y>' } : center(rect);
    if (ids.length > 1) console.log(`[tap] ${ids.length}개 중 첫 요소를 누릅니다`);
  }
  await execMobile(ctx, 'tap', 'mobile: tap', point);
  if (!ctx.dryRun) console.log(`[tap] (${point.x}, ${point.y}) pt 누름`);
  return 0;
}

async function cmdSwipe(flags, getCtx) {
  const dir = strFlag(flags, 'dir');
  if (!SWIPE_DIRS.includes(dir)) usage(`--dir 는 ${SWIPE_DIRS.join('|')} 중 하나여야 합니다 (입력값: ${dir}).`, 'swipe --dir up');
  const ctx = getCtx();
  await execMobile(ctx, 'swipe', 'mobile: swipe', { direction: dir });
  if (!ctx.dryRun) console.log(`[swipe] ${dir}`);
  return 0;
}

async function cmdDrag(flags, getCtx) {
  const from = pointFlag(flags, 'from');
  const to = pointFlag(flags, 'to');
  const duration = numFlag(flags, 'duration');
  const d = duration === undefined ? 0.5 : duration;
  if (d < 0.5 || d > 60) usage(`--duration 은 0.5~60 초여야 합니다 (입력값: ${d}).`);
  const ctx = getCtx();
  await execMobile(ctx, 'drag', 'mobile: dragFromToForDuration', { duration: d, fromX: from.x, fromY: from.y, toX: to.x, toY: to.y });
  if (!ctx.dryRun) console.log(`[drag] (${from.x}, ${from.y}) → (${to.x}, ${to.y}), 누름 ${d}초`);
  return 0;
}

async function cmdType(flags, getCtx) {
  const label = strFlag(flags, 'label');
  const value = strFlag(flags, 'value');
  if (!label || value === undefined) usage('type 에는 --label <text> 와 --value <문자열> 이 필요합니다.', 'type --label 이름 --value 홍길동');
  const ctx = getCtx();
  const ids = await findByLabel(ctx, 'type', label);
  if (!ids.length) fail('type', `label CONTAINS '${label}' 입력칸이 없습니다. find 로 label 을 확인하세요.`);
  await http(ctx, 'type', 'POST', `/session/${ctx.sid}/element/${ids[0]}/clear`, {});
  await http(ctx, 'type', 'POST', `/session/${ctx.sid}/element/${ids[0]}/value`, { text: value });
  if (!ctx.dryRun) console.log(`[type] '${label}' 입력칸을 비우고 ${[...value].length}자 입력. 목록을 누르기 전에 hide-keyboard`);
  return 0;
}

async function cmdHideKeyboard(_flags, getCtx) {
  const ctx = getCtx();
  await execMobile(ctx, 'hide-keyboard', 'mobile: hideKeyboard', {});
  if (!ctx.dryRun) console.log('[hide-keyboard] 키보드 내림');
  return 0;
}

async function cmdShot(flags, getCtx) {
  const out = strFlag(flags, 'out');
  if (!out || !out.toLowerCase().endsWith('.png')) usage('shot 에는 --out <경로.png> 가 필요합니다.', 'shot --out qa-screens/device/home.png');
  const ctx = getCtx();
  const target = path.resolve(out);
  const b64 = await http(ctx, 'shot', 'GET', `/session/${ctx.sid}/screenshot`);
  if (ctx.dryRun) {
    console.log(`[dry-run] 응답 base64 를 ${target} 에 저장`);
    return 0;
  }
  if (typeof b64 !== 'string' || !b64) fail('shot', '스크린샷 응답이 비어 있습니다.');
  const buf = Buffer.from(b64, 'base64');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, buf);
  const size = pngSize(buf);
  console.log(`[shot] 저장: ${target} (${buf.length} bytes${size ? `, ${size.w}x${size.h}px` : ''})`);
  return 0;
}

async function cmdStop(_flags, getCtx) {
  const ctx = getCtx();
  try {
    await http(ctx, 'stop', 'DELETE', `/session/${ctx.sid}`);
  } catch (e) {
    if (e.status !== 404) throw e;
    console.log(`[stop] 세션이 이미 끝나 있습니다 (${e.wdError || 'HTTP 404'}).`);
  }
  if (ctx.dryRun) {
    console.log(`[dry-run] 이어서 세션 상태 파일 삭제${ctx.state ? `: ${ctx.state.file}` : ''}`);
    return 0;
  }
  fs.rmSync(ctx.state.file, { force: true });
  console.log(`[stop] 세션 종료: ${ctx.sid}, 상태 파일 삭제: ${ctx.state.file}`);
  console.log('[stop] 테스트가 끝났다면 아이폰 자동 잠금을 원래대로 되돌리도록 사용자에게 알리세요.');
  return 0;
}

function printHelp() {
  console.log(`
ait-device: 아이폰 토스 앱 실기기 조작 (Appium XCUITest + WebDriverAgent, 맥 마우스·키보드 미사용)

사용법:
  node ait-device.cjs <subcommand> [flags...]

준비:
  doctor                         읽기 전용 점검표(OK/누락, 조치 주체). 전부 준비면 exit 0, 아니면 exit 3
  build-wda [--dry-run]          WebDriverAgent 를 서명해 빌드(xcodebuild build-for-testing).
                                 수 분 걸린다. 에이전트는 run_in_background 로 실행. 출력은 그대로 흘려 보낸다
  server [--dry-run]             appium --address 127.0.0.1 --port <port> 를 detached 로 띄우고 pid·로그 경로 출력.
                                 이미 /status 가 응답하면 아무것도 하지 않는다

세션:
  start [--dry-run]              세션 생성(최대 60초). 세션 id 를 ${os.tmpdir()}/${STATE_PREFIX}<udid>.json 에 저장.
                                 살아 있는 세션이 있으면 재사용
  stop [--dry-run]               세션 종료(DELETE) + 상태 파일 삭제

조작 (좌표는 포인트 단위, 모두 --dry-run 지원):
  open --app <appName> --deployment <id>
                                 mobile: deepLink 로 intoss-private://<appName>?_deploymentId=<id>&host=appsInTossHost 열기
  find --label <text>            label CONTAINS '<text>' 요소 목록(id, label, rect, center). 최대 ${FIND_LIMIT}개
  tap --x <n> --y <n>            mobile: tap
  tap --label <text>             찾은 첫 요소 rect 중심을 mobile: tap
  swipe --dir up|down|left|right mobile: swipe (아래 내용을 보려면 up)
  drag --from x,y --to x,y [--duration 0.5]
                                 mobile: dragFromToForDuration (duration 은 시작점을 누르고 있는 초, 0.5~60)
  type --label <text> --value <문자열>
                                 입력칸 찾기 → clear → /element/:id/value (한글 입력 가능)
  hide-keyboard                  mobile: hideKeyboard
  shot --out <path.png>          스크린샷 저장, 경로·바이트·픽셀 크기 출력

공통 플래그 (우선순위: 플래그 > 환경변수 > ./.appintoss.json 의 deviceQa):
  --udid <UDID>                  AIT_DEVICE_UDID          deviceQa.udid (미지정이고 연결된 실기기가 1대면 자동 선택)
  --team-id <TEAM_ID>            AIT_DEVICE_TEAM_ID       deviceQa.teamId
  --wda-bundle-id <id>           AIT_DEVICE_WDA_BUNDLE_ID deviceQa.wdaBundleId (팀 안에서 고유)
  --wda-dir <dir>                AIT_DEVICE_WDA_DIR       deviceQa.wdaDerivedDataPath
  --port <n>                     AIT_DEVICE_PORT          deviceQa.appiumPort (기본 ${DEFAULT_PORT})
  --dry-run                      보낼 HTTP 메서드·경로·본문(또는 실행할 명령)만 출력하고 보내지 않음

Xcode: DEVELOPER_DIR 이 없고 ${XCODE_DEV_DIR} 가 있으면 자식 프로세스에만 그 값을 넣는다 (xcode-select 는 바꾸지 않음).
하지 않는 일: sudo, xcode-select -s, 기기 설정 변경, 잠금 해제 시도.

Exit codes:
  0 성공 · 1 런타임 실패(메시지 앞 [단계명]) · 2 잘못된 인자·설정 누락 · 3 doctor 미준비
`);
}

async function main() {
  const [sub, ...rest] = process.argv.slice(2);
  if (!sub || sub === 'help' || sub === '--help' || sub === '-h') {
    printHelp();
    return 0;
  }
  if (!COMMAND_FLAGS[sub]) {
    printHelp();
    usage(`알 수 없는 서브커맨드: "${sub}"`);
  }
  const { pos, flags } = parseArgs(rest);
  checkFlags(sub, pos, flags);
  const dryRun = flags['dry-run'] === true;
  if (flags['dry-run'] !== undefined && !dryRun) usage('--dry-run 은 값을 받지 않습니다.');
  const cfg = resolveConfig(flags);
  if (sub === 'doctor') return cmdDoctor(cfg);
  if (sub === 'build-wda') return cmdBuildWda(cfg, dryRun);
  if (sub === 'server') return cmdServer(cfg, dryRun);
  if (sub === 'start') return cmdStart(cfg, dryRun);
  const handlers = {
    open: cmdOpen,
    find: cmdFind,
    tap: cmdTap,
    swipe: cmdSwipe,
    drag: cmdDrag,
    type: cmdType,
    'hide-keyboard': cmdHideKeyboard,
    shot: cmdShot,
    stop: cmdStop,
  };
  return handlers[sub](flags, () => sessionCtx(cfg, dryRun, sub));
}

main()
  .then((code) => process.exit(code || 0))
  .catch((e) => {
    if (e instanceof UsageError) {
      console.error(`[error] ${e.message}`);
      if (e.example) console.error(`  예: node ait-device.cjs ${e.example}`);
      process.exit(2);
    }
    console.error(e.message);
    console.error('자동 재시도하지 않습니다. 실패 단계는 메시지 앞 [단계명] 참조.');
    process.exit(1);
  });
