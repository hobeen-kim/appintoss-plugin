---
name: ait-console
description: 앱인토스 Developer Center 콘솔 자동화 — 앱 등록, 앱 정보 등록(set-app-info), 에셋 업로드, 테스트 버전 업로드, 테스트 발송, 검토 요청, 출시, app-approval-watch, release-watch, 광고 신청, 고객센터. 사용자가 콘솔 자동화, 콘솔 제출, 앱 등록, 앱 정보 등록, set-app-info, 버전 업로드, 테스트 발송, 검토 요청, 강제 배포, 출시, 출시해라, release, app-approval-watch, 앱 정보 승인, release-watch, 광고 신청, 광고 ID, ad-id-watch, 템플릿 심사, template-watch, console automation 을 언급하면 이 스킬을 사용한다.
trigger: 콘솔 자동화, 콘솔 제출, 앱 등록, 앱 정보 등록, set-app-info, 버전 업로드, 테스트 발송, 검토 요청, 강제 배포, 출시, 출시해라, release, app-approval-watch, 앱 정보 승인, release-watch, 광고 신청, 광고 ID, ad-id-watch, 템플릿 심사, template-watch, console automation
---

# ait-console — 콘솔 자동화 스킬

앱인토스 Developer Center 콘솔(`apps-in-toss.toss.im`)을 사람이 직접 열지 않고 명령·크론으로 모두 처리한다. 단일 진입점 `skills/ait-console/scripts/ait-console.cjs`의 서브커맨드를 사용한다.

---

## 1. 서브커맨드 목록 및 실행 절차

| 구분 | 서브커맨드 | 설명 | 실행 단위 |
|---|---|---|---|
| read | `apps` | 워크스페이스·앱 목록(+배포 버전) | 즉시 |
| read | `versions <appName>` | 앱 번들 버전 목록 | 즉시 |
| write | `register` | 앱 등록(이름·appName·유형) | --dry-run 선행 권장 |
| write | `set-app-info` | 앱 정보 등록 — APP-SPEC.md 파싱 + 에셋 업로드 + draft 저장·readback 검증. **앱정보 검수 제출은 `--submit` 명시 필요** | draft까지 자동 / 검수 제출은 --submit 명시 |
| write | `upload` | 번들 **테스트 버전** 배포 — 공식 `ait deploy` CLI 래퍼(API 키 토큰 인증). raw S3 3-step은 AccessDenied로 폐기(deprecated). 동일 번들 재업로드(Code 4097)는 친절 안내 | 인증 토큰 필요(AIT_DEPLOY_API_KEY) |
| write | `test-send` | 테스트 발송(테스트 버튼→"푸시 보내기") | --dry-run 선행 권장 |
| write | `submit-review` | 검토 요청 + 노트 작성(SUBMIT.md 전재) | 사용자 명시 개시 |
| read(크론) | `release-status` | 출시하기 활성 감지 — **클릭 금지** | 크론 호출 |
| write | `release` | 출시하기 클릭(출시 확정) | 사용자 명시 개시 |
| 루프 | `app-approval-watch` | 앱 정보 hasApproved 폴링 → true 시 "버전 검토 요청 가능" 안내 | 불요(read 전용) |
| 루프 | `release-watch` | release-status 폴링 → 활성 시 release | 사용자 명시 개시 |
| write | `ad-apply` | 광고 unit ID 신청 | --dry-run 선행 권장 |
| 루프 | `ad-id-watch` | 광고 ID 발급 감지 → config 주입·재빌드·재배포 | 사용자 명시 개시 |
| 루프 | `template-watch` | 기능성 템플릿 심사 통과 감지 → 발송 활성화 알림 | 사용자 명시 개시 |

### read 서브커맨드 (`apps`, `versions`)

쿠키 세션 API를 직접 호출하므로 Playwright 없이 즉시 실행된다. storageState가 없으면 자동 로그인 후 실행.

```
node ait-console.cjs apps
node ait-console.cjs versions <appName>
```

### write 서브커맨드 일반 절차

1. `--dry-run` 플래그로 입력값·대상 요약만 먼저 출력(브라우저 미기동)
2. 실모드: 작업 내용 stdout 출력 → 실행 → readback 검증
3. 실패 시: 단계명 + 스크린샷(`docs/qa-screens/console-fail-{step}.png`) + dom-map 갱신 안내 + exit 1

```
node ait-console.cjs register --app <appName> --name <표시이름> --type <NON_GAME|GAME> [--dry-run]
node ait-console.cjs set-app-info <appName> [--docs <docs 경로>] [--submit]
node ait-console.cjs upload <projectDir> [--memo <메모>] [--bundle <.ait>]
# raw S3 3-step(initialize→PUT→complete)은 AccessDenied로 폐기 — lib/api.cjs DEPRECATED 주석 참조
node ait-console.cjs test-send --app <appName> [--dry-run]
node ait-console.cjs submit-review --app <appName> --docs <docs 경로> [--first|--update] [--dry-run]
node ait-console.cjs release --app <appName>
```

### create/update 자동 범위 vs 출시 상태머신

**파이프라인 자동 범위** (테스트 발송까지만):

- create 끝: `register`(미등록 시) → `set-app-info`(앱 정보 draft 자동 저장+검증) → [`--submit` 명시 시 앱정보 검수 제출] → `upload`(테스트 버전) → `test-send`
- update 끝: `upload`(테스트 버전) → `test-send`

`set-app-info`는 docs/APP-SPEC.md(부제·상세설명·카테고리 1순위·검색키워드)와 docs/assets(icon·screenshot-1~3·thumbnail)를 콘솔에 반영한다. 기본은 **draft 저장+readback 검증까지만**이며, **앱정보 검수 제출(POST mini-app/review)은 `--submit` 명시 시에만** 수행한다. 업로드된 아이콘의 콘솔 발급 static URL은 출력으로 안내되므로 granite.config.ts `brand.icon`을 이 URL로 갱신한다.

**출시 상태머신** (사용자 "출시해라" 명시 명령에서만 개시):

0. `set-app-info --submit` — 앱정보 검수 제출(`--submit` 명시 필요) → `app-approval-watch` — 앱 정보 hasApproved 폴링(read 전용, 사용자 개시 불요) — 승인 후 다음 진행
1. `submit-review` — 검토 요청 + 노트 작성
2. `release-watch` — 심사 결과 폴링, APPROVED 시 `release` 실행

체인 전체: `set-app-info --submit → app-approval-watch → submit-review → release-watch → release`

**광고 신청(ad-apply)은 앱 승인(hasApproved=true) 이후에만 가능.** ad-apply 및 ad-id-watch는 app-approval-watch로 앱 승인이 완료된 뒤 시작한다. 앱 미승인 상태에서 ad-apply를 실행하면 exit 3으로 거부된다.

광고 신청 분기 체인: `app-approval-watch(승인 완료) → ad-apply → ad-id-watch`

이 단계들은 파이프라인이 자동 호출하지 않는다(`app-approval-watch`는 read 전용 폴링이라 자동 기동 가능하나, `submit-review`·`release`는 사용자 명시 명령에서만).

---

## 2. 자격증명·보안

- 자격증명 파일: `.appintoss/credentials.json` (권한 `chmod 600`, `.gitignore` 필수 등재)
- 환경 변수: `AIT_CONSOLE_ID` / `AIT_CONSOLE_PW`
- id/pw·쿠키 값을 로그·보고서·스크린샷·문서에 **평문 노출 금지**
- 자격증명 파일·환경 변수가 없으면 `NEEDS_CONTEXT` 메시지를 출력하고 중단
- OAuth code·state 쿼리도 민감값 — 로그에 남기지 않는다

---

## 3. headless 기본 · 2FA 시에만 창 · storageState 세션

- **평소 headless** — 무창(Playwright headless) 실행이 기본
- **2FA/휴대폰 인증이 실제 감지될 때만** headed 전환(브라우저 창 띄움), 5분 폴링 대기
- **storageState**(`~/.appintoss-console/profile` 또는 `TBIZAUTH` 쿠키)를 영속 저장해 재로그인 최소화
- Bearer 토큰 없음 — 인증은 전적으로 **쿠키 세션**(`TBIZAUTH`) 단위
- 세션 만료 시 IdP OAuth code 플로우 자동 재수행

---

## 4. watcher 패턴

`lib/watch.cjs`의 `asyncWatch` 공통 폴링 프레임워크 위에 4종의 watcher가 구현된다.

### asyncWatch 공통 동작

- 기본 폴링 간격: 1시간(`--interval` 설정 가능)
- 상태 감지(`check`): API 우선 · DOM 폴백
- READY 감지 시 `onReady()` 1회 실행 후 종료
- 타임아웃: `--max` 폴 횟수 또는 만료 시각 — 도달 시 "대기 만료" + 비0 종료
- `check` 일시 오류는 다음 주기로 이월(연속 N회 오류 시 중단 보고)
- `onReady` 실패는 자동 재시도 없이 즉시 중단
- 매 폴 결과를 타임스탬프와 함께 stdout 로그

### watcher 4종 + 전체 출시 체인

**체인 순서**: `app-approval-watch` → `submit-review` → `release-watch` → `release`

| watcher | 트리거 | 감지 신호(API 우선) | 완료 동작 | 사용자 개시 필요 |
|---|---|---|---|---|
| `app-approval-watch` | 앱 정보 검수 제출(`set-app-info --submit`) 후 | `GET /mini-app/{app}` → `hasApproved===true` | "버전 검토 요청 가능" 안내 로그 (read 전용, 클릭 없음) | 불요(read 전용 폴링) |
| `release-watch` | 검토 요청(`submit-review`) 후 사용자 "출시해라" | bundles `reviewStatus==="APPROVED" && deployed===false` + `hasApproved===true` | "출시하기" 클릭(`release` 실행) | 필요(`--confirm-release`) |
| `ad-id-watch` | 앱 승인 후 광고 신청(`ad-apply`) → 발급 감지 | 광고 ID 발급 여부(API/DOM — dom-map §비동기 상태 감지) | 실 광고 ID를 config 상수 파일의 테스트 ID와 스왑 주입 → 재빌드 안내 → `upload`+`test-send` 재배포 | 필요 |
| `template-watch` | 기능성 메시지 템플릿 등록 후 사용자 개시 | 템플릿 심사 통과(2~3영업일, API/DOM 감지) | 발송 활성화 stdout 알림(실제 발송 없음) | 필요 |

#### app-approval-watch 상세

- **목적**: 앱 정보 검수 제출 후 `hasApproved=true`(앱 정보 승인)를 폴링. 승인되면 버전 검토 요청(`submit-review`)이 가능함을 알린다.
- **check**: `GET /mini-app/{app}` 의 `hasApproved` — read 전용·안전. 클릭 없음.
- **onReady**: "승인 완료" 로그 + `submit-review` 실행 가능 안내.
- **`--then-submit-review`**: 승인 후 submit-review 체인을 시도하나, 현재 submit-review가 게이트 통과 후 미캡처 상태이므로 "console-dom-map.md 갱신 필요(승인 후 재캡처)" 마커로 안전 중단한다. 추측 강행 금지.

```
node ait-console.cjs app-approval-watch <appName> [--interval 1h] [--max N]
node ait-console.cjs app-approval-watch <appName> --then-submit-review  # 승인 후 체인(현재 안전 중단)
```

`ad-id-watch`는 `ait-sdk/references/ait-ads.md`의 "운영 ID 발급 전 테스트 ID 사용" 규칙의 후속 자동화다. 발급된 실 광고 ID를 테스트 ID 상수와 스왑하며, 스왑 전후 diff를 출력한다.

감지 방법이 dom-map에 "미확인"으로 남은 watcher는 실행 시 "감지 방법 미확인 — dom-map 갱신 필요" + exit 1로 보류 처리된다.

### 크론 메커니즘 3옵션

watcher 장시간 폴링을 위한 크론 메커니즘 3가지 중 하나를 선택한다:

- **(a) 시스템 cron/launchd** — 서버·Mac 환경에서 OS 레벨 스케줄 등록
- **(b) Claude Code 하니스 스케줄** — `schedule` 스킬 또는 `CronCreate`로 에이전트 스케줄 등록
- **(c) 자체 폴링 루프 (기본)** — `ait-console.cjs release-watch`를 직접 실행 시 프로세스가 살아있는 동안 스스로 폴링. 장시간 세션이므로 nohup/background 실행 권장

기본 구현은 (c) 자체 폴링 + 사용자에게 (b) 하니스 스케줄 등록 안내를 함께 제공한다.

**모든 watcher는 사용자 개시 또는 명시 설정에서만 기동한다. 자동 기동 금지.**

---

## 5. 실패 대응

- **API 우선, DOM 폴백**: dom-map §API 인벤토리에서 'API 대체 가능' 작업은 lib/api.cjs 직접 호출, '불가-DOM필요'는 Playwright headless 경로
- **비공식 API 변경 가능성**: 콘솔 내부 API는 공식 공개 API가 아님. 실패 시 자동 재시도 없이 DOM 폴백 또는 단계명과 함께 중단 보고
- **console-fail 스크린샷**: 단계 실패 시 `docs/qa-screens/console-fail-{step}.png` 저장 + `skills/ait-console/references/console-dom-map.md` 갱신 안내
- **자동 재시도 금지**: 단계별 1회 실행, 실패 즉시 보고 후 중단. watcher의 주기 폴링은 재시도가 아니라 정상 동작

---

## 6. 안전 규칙 (자동 출시 금지)

> **출시(`release`)는 사용자 명시 명령에서만 개시한다.**
> **모든 watcher(release-watch / ad-id-watch / template-watch)는 사용자 개시 또는 명시 설정에서만 기동한다 — 어떤 것도 무단 자동 기동·자동 출시하지 않는다.**

- `release`는 `--confirm-release` 플래그 또는 사용자 "출시해라" 명시 체인 안에서만 실행
- **`submit-review`·`release`는 `--confirm` 필수(코드 강제) — 없으면 즉시 exit 2로 거부**
- 파이프라인·다른 스킬이 `submit-review`, `release`, watcher를 자동 호출하는 것을 금지
- 테스트 발송(`test-send`)까지만 파이프라인 자동 범위이며, 그 이후는 항상 사용자 명시 명령
- `release-status`는 판정 전용 — 어떤 경우에도 클릭하지 않는다

---

## 7. 외부 심사 게이트 (미캡처 항목)

콘솔 쓰기 플로우 중 일부는 토스 측 심사 완료가 선행 조건이라 현재 spike 시점에 자력 통과 불가하다:

| 항목 | 상태 | 선행 조건 |
|---|---|---|
| `submit-review` — 검토 요청 제출 + 출시노트 폼 | **미캡처 (게이트 A 차단)** | 앱 정보(meta) `hasApproved===true` 필요 |
| `release` — 출시하기 클릭 | **미캡처** | 버전 `reviewStatus==="APPROVED"` 필요 |
| `ad-apply` — 광고 ID 신청 | **미캡처(T3 보류)** | 앱 정보(meta) `hasApproved===true` 필요(미승인 시 exit 3 게이트 차단) + spike 조사 미완료 |
| `template-watch` — 템플릿 심사 감지 | **미캡처(T3 보류)** | spike 조사 미완료 |

미캡처 항목은 토스 심사가 완료된 후 `console-dom-map.md` §쓰기 플로우·§비동기 상태 감지 절을 재캡처해 갱신하면 이어서 구현할 수 있다.

---

## 8. create/update 파이프라인 연계

파이프라인(`skills/pipeline/SKILL.md`)의 create·update 모드 종료 시 이 스킬이 자동으로 호출된다:

- **create 모드 끝**: `register`(미등록 시) → `set-app-info`(앱 정보 draft 자동) → `upload` → `test-send` — 앱정보 검수 제출은 `set-app-info --submit` 명시 시에만
- **update 모드 끝**: `upload` → `test-send`

각 단계의 성공·실패는 `docs/PIPELINE-LOG.md`와 `docs/REPORT-v{version}.md`에 기록된다.

검토 요청·출시는 파이프라인이 자동 진행하지 않는다. 사용자가 "출시해라"라고 하면 `submit-review → release-watch` 체인을 시작한다.

---

## 9. 테스트 정책

**실제 write(register·upload·test-send·submit-review·release·ad-apply)는 테스트 앱 `today-lucky-draw`에서만 수행한다.**

- `--dry-run` 플래그로 먼저 입력값·대상을 검증한다
- QA 1단계: `--dry-run`/모의 검증(에이전트 실행 가능)
- QA 2단계: 실콘솔 스모크는 사용자 입회 검증으로 진행
- 타 앱에 write 서브커맨드 실행 금지
