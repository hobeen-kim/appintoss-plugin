'use strict';
/**
 * lib/watch.cjs — 콘솔 비동기 작업 공통 폴링 프레임워크 ("async-watch", plan T9).
 *
 * 콘솔에는 "신청 후 즉시 안 되고 나중에 완료되는" 비동기 작업이 있다
 * (버전 심사 → 출시 가능, 광고 unit ID 발급, 기능성 템플릿 심사 등).
 * asyncWatch는 이를 주기 폴링으로 무인 대기하는 공통 루프다.
 *
 * 정책:
 *   - 주기: 기본 1시간(intervalMs) — 호출자가 설정 가능(parseInterval: 30s/10m/1h).
 *   - check(): 상태 감지 콜백 — API 우선(DOM 폴백이 필요하면 각 watcher가 주입).
 *     반환값은 boolean 또는 { ready, reason }.
 *   - READY 시 onReady() 1회 실행 후 종료. onReady 실패는 자동 재시도 금지(즉시 중단).
 *   - check 일시 오류는 다음 주기로 이월. 연속 maxConsecutiveErrors회면 중단 보고.
 *   - max(최대 폴 횟수) 도달 시 "대기 만료" — status 'expired'.
 *   - 매 폴 결과를 타임스탬프와 함께 stdout 로그.
 *
 * 크론 메커니즘 3옵션:
 *   (a) 시스템 cron/launchd가 단발 판정 커맨드(release-status 등)를 주기 실행
 *   (b) Claude Code 하니스 스케줄(schedule 스킬 / CronCreate) 등록
 *   (c) 본 프레임워크의 자체 장시간 폴링 루프  ← 기본 구현(사용자 환경 비의존)
 *
 * 안전 규칙: watcher는 사용자 개시 또는 명시 설정에서만 기동한다(자동 출시 절대 금지).
 * 기동 가드는 각 서브커맨드(예: release-watch --confirm-release)가 담당한다.
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000; // 1h

/** Parse "30s" / "10m" / "1h" / "500ms" (bare number = seconds) into milliseconds. */
function parseInterval(spec, defMs = DEFAULT_INTERVAL_MS) {
  if (spec == null) return defMs;
  const m = String(spec).trim().match(/^(\d+(?:\.\d+)?)(ms|s|m|h)?$/);
  if (!m) throw new Error(`[watch] interval 형식 오류: "${spec}" (예: 30s, 10m, 1h)`);
  const mult = { ms: 1, s: 1000, m: 60 * 1000, h: 60 * 60 * 1000 }[m[2] || 's'];
  return Math.max(1, Math.round(parseFloat(m[1]) * mult));
}

/**
 * Run the polling loop. Resolves with:
 *   { status:'ready', polls }           — onReady 1회 실행 완료
 *   { status:'expired', polls }         — max 폴 도달(대기 만료)
 *   { status:'check-error', polls, error }   — check 연속 오류로 중단
 *   { status:'onready-failed', polls, error } — onReady 실패(재시도 없이 중단)
 */
async function asyncWatch({
  name,
  check,
  onReady,
  intervalMs = DEFAULT_INTERVAL_MS,
  max = null,
  maxConsecutiveErrors = 3,
  log = console.log,
}) {
  let polls = 0;
  let consecutiveErrors = 0;
  for (;;) {
    polls += 1;
    const ts = new Date().toISOString();
    let result = null;
    let checkFailed = false;
    try {
      result = await check();
      consecutiveErrors = 0;
    } catch (e) {
      // 일시 오류는 다음 주기로 이월 — 연속 한도 도달 시에만 중단.
      checkFailed = true;
      consecutiveErrors += 1;
      log(`[${name}] ${ts} poll#${polls} check 오류(이월, 연속 ${consecutiveErrors}/${maxConsecutiveErrors}): ${e.message}`);
      if (consecutiveErrors >= maxConsecutiveErrors) {
        return { status: 'check-error', polls, error: e.message };
      }
    }
    if (!checkFailed) {
      const ready = result === true || !!(result && result.ready === true);
      const reason = result && result.reason ? ` — ${result.reason}` : '';
      log(`[${name}] ${ts} poll#${polls} ${ready ? 'READY' : 'NOT_READY'}${reason}`);
      if (ready) {
        try {
          await onReady(result); // 1회만 — 실패 시 자동 재시도 금지
        } catch (e) {
          return { status: 'onready-failed', polls, error: e.message };
        }
        return { status: 'ready', polls };
      }
    }
    if (max != null && polls >= max) {
      return { status: 'expired', polls };
    }
    await sleep(intervalMs);
  }
}

module.exports = { asyncWatch, parseInterval, DEFAULT_INTERVAL_MS };
