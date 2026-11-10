---
name: ait-device-qa
description: 아이폰 토스 앱 실기기 QA 자동화. USB로 연결한 아이폰을 Appium(XCUITest)과 WebDriverAgent로 HTTP 조작해 테스트 버전을 열고, 누르고, 입력하고, 캡처한다(맥 마우스·키보드 미사용). 브라우저 devtools와 헤드리스 캡처로는 안 보이는 실기기 전용 문제를 확인하고, 비주얼 QA에서 브라우저 캡처와 실기기 캡처를 나란히 비교할 때 쓴다. iOS 전용. 사용자가 실기기 테스트, 실기기 QA, 아이폰 테스트, 토스 앱에서 확인, 실기기 캡처, Phase D, Appium, WebDriverAgent, XCUITest, device QA 를 언급하면 이 스킬을 사용한다.
trigger: 실기기 테스트, 실기기 QA, 아이폰 테스트, 토스 앱에서 확인, 실기기 캡처, 실기기 스크린샷, Phase D, Appium, WebDriverAgent, XCUITest, device QA
references:
  - ./references/setup.md
---

# ait-device-qa: 아이폰 토스 앱 실기기 QA

USB로 연결한 아이폰의 토스 앱에서 미니앱 테스트 버전을 열고 조작·캡처한다. 단일 진입점은 `scripts/ait-device.cjs`(외부 의존성 없음, Node 18 이상)다.

## 1. 언제 쓰나

- 브라우저(`@apps-in-toss/devtools`)나 Playwright 헤드리스로는 재현되지 않고 **토스 앱 웹뷰에서만 보이는 문제**를 확인할 때
- 비주얼 QA에서 **브라우저 캡처와 실기기 캡처를 나란히 비교**할 때. 파이프라인 선택 페이즈 **"Phase D 실기기 QA"** 에서 visual-qa가 이 스킬을 쓴다
- **iOS 전용**이다. Android는 아래 이유로 지원하지 않는다

## 2. 왜 이 방법인가

| 방법 | 안 되는 이유 |
|---|---|
| SDK 샌드박스 앱 | SDK 3.x에는 샌드박스 앱이 없다 |
| Android 에뮬레이터 (API 36, Google Play 이미지) | Play 스토어가 토스를 "기기와 호환되지 않음"으로 막아 설치할 수 없다 |
| macOS iPhone 미러링 + 화면 조작 | 미러링 창에 접근성 트리가 없어 실제 마우스 포인터, 키 입력, 창 활성화가 필요하다. 사용자의 마우스·키보드를 계속 빼앗는다 |

그래서 USB로 연결한 아이폰을 **Appium(XCUITest 드라이버) + WebDriverAgent(WDA)** 로 HTTP 조작한다. 맥의 마우스·키보드를 쓰지 않으므로 사용자는 그동안 다른 작업을 할 수 있다.

## 3. 역할 분담

### 사용자 (처음 한 번)

1. 아이폰이 iOS 26 이상이면 Xcode 26 이상이 필요하고, Xcode 26은 macOS 15.6 이상에서만 돈다
2. App Store에서 Xcode 설치 후 한 번 실행해 라이선스 동의 (`mas install 497799835`는 sudo 비밀번호가 필요해 사용자가 직접)
3. 아이폰을 케이블로 연결하고 "이 컴퓨터 신뢰"
4. 아이폰 설정 > 개인정보 보호 및 보안 > 개발자 모드 켜기 (재시동 포함)
5. Xcode > Settings > Accounts에 Apple 계정 추가
6. 유료 개발자 팀이면 developer.apple.com/account에서 최신 Program License Agreement 동의 (안 하면 빌드가 `PLA Update available`로 실패)
7. 테스트하는 동안 아이폰 자동 잠금을 "안 함"으로. 끝나면 원래대로 되돌린다

상세 절차와 트러블슈팅: [`references/setup.md`](./references/setup.md)

### 에이전트

- `doctor`로 점검하고, 조치 주체가 **에이전트**인 누락 항목을 처리한다: `npm i -g appium`, `appium driver install xcuitest`, WDA 번들 ID 결정, `build-wda`, `server`
- 조치 주체가 **사용자**인 항목이 남으면 `doctor`의 "조치 필요" 목록을 그대로 사용자에게 전달하고 멈춘다
- 세션 생성, 테스트 버전 열기, 조작, 캡처, 보고서 작성, 세션 종료

## 4. 설정값

미니앱 프로젝트 루트의 `.appintoss.json`에 `deviceQa` 객체를 둔다. 스크립트는 **현재 디렉터리**의 이 파일을 읽으므로 프로젝트 루트에서 실행한다.

```json
{
  "deviceQa": {
    "enabled": false,
    "udid": "",
    "teamId": "",
    "wdaBundleId": "",
    "wdaDerivedDataPath": "",
    "appiumPort": 4723
  }
}
```

| 키 | 플래그 | 환경변수 | 의미 |
|---|---|---|---|
| `enabled` | (없음) | (없음) | 파이프라인 Phase D 실행 여부. 스크립트는 읽지 않는다 |
| `udid` | `--udid` | `AIT_DEVICE_UDID` | 대상 아이폰. 비우면 연결된 실기기가 1대일 때 자동 선택 |
| `teamId` | `--team-id` | `AIT_DEVICE_TEAM_ID` | Apple 개발자 팀 ID(10자). 사용자 계정에서 나온다 |
| `wdaBundleId` | `--wda-bundle-id` | `AIT_DEVICE_WDA_BUNDLE_ID` | WDA 번들 ID. 팀 안에서 고유해야 한다(예: `<역도메인>.wda.runner`) |
| `wdaDerivedDataPath` | `--wda-dir` | `AIT_DEVICE_WDA_DIR` | WDA 빌드 산출물 경로. 저장소 밖(예: `~/.appintoss-device/wda-dd`)을 권장 |
| `appiumPort` | `--port` | `AIT_DEVICE_PORT` | Appium 포트 (기본 4723) |

우선순위: **플래그 > 환경변수 > `.appintoss.json`**.

## 5. 절차

`doctor → (WDA 없으면) build-wda → server → start → open → 조작·캡처 → stop`

```bash
# 미니앱 프로젝트 루트에서 실행
node "$CLAUDE_PLUGIN_ROOT/skills/ait-device-qa/scripts/ait-device.cjs" doctor
# exit 0 준비 완료 / 3 = 누락 있음 (표의 "조치 주체" 확인)

# WDA 빌드: 수 분 걸리므로 run_in_background 로 실행한다
node "$CLAUDE_PLUGIN_ROOT/skills/ait-device-qa/scripts/ait-device.cjs" build-wda

# Appium 서버 (127.0.0.1 에만 바인딩, detached). pid·로그 경로를 출력한다
node "$CLAUDE_PLUGIN_ROOT/skills/ait-device-qa/scripts/ait-device.cjs" server

# 세션 생성 (아이폰에서 WDA 가 뜬다, 최대 60초). 살아 있는 세션이 있으면 재사용
node "$CLAUDE_PLUGIN_ROOT/skills/ait-device-qa/scripts/ait-device.cjs" start

# 테스트 버전 열기
node "$CLAUDE_PLUGIN_ROOT/skills/ait-device-qa/scripts/ait-device.cjs" open --app <appName> --deployment <deploymentId>

# 조작·캡처 (아래 6·7절)
node "$CLAUDE_PLUGIN_ROOT/skills/ait-device-qa/scripts/ait-device.cjs" shot --out qa-screens/device/home.png

# 끝
node "$CLAUDE_PLUGIN_ROOT/skills/ait-device-qa/scripts/ait-device.cjs" stop
kill <server 가 출력한 pid>
```

- 파이프라인 Phase D의 실행 조건 "`doctor` exit 0"은 에이전트 몫(`build-wda`, `server` 등)을 처리한 뒤 **다시 돌린 `doctor` 결과**로 판단한다. 사용자 몫이 남아 있으면 Phase D를 건너뛰고 사유를 적는다
- 쓰기 계열(`start`, `open`, `tap`, `swipe`, `drag`, `type`, `hide-keyboard`, `stop`, `build-wda`, `server`)은 모두 `--dry-run`을 지원한다. 보낼 HTTP 메서드·경로·본문(또는 실행할 명령)만 출력하고 보내지 않는다
- `DEVELOPER_DIR`이 없고 `/Applications/Xcode.app`이 있으면 스크립트가 자식 프로세스에만 `DEVELOPER_DIR`을 넣는다. `xcode-select`는 바꾸지 않는다
- 세션 id는 `os.tmpdir()/ait-device-session-<udid>.json`에 저장되고 이후 명령이 자동으로 읽는다

## 6. 서브커맨드

아래 `ait-device`는 `node "$CLAUDE_PLUGIN_ROOT/skills/ait-device-qa/scripts/ait-device.cjs"`를 줄여 쓴 것이다.

| 명령 | 하는 일 |
|---|---|
| `ait-device doctor` | 읽기 전용 점검표: Xcode, Appium, XCUITest 드라이버, 연결된 실기기·UDID, 개발자 모드, 팀 ID, WDA 번들 ID, WDA 빌드 산출물, Appium `/status`. 항목별 OK/누락과 조치 주체(사용자/에이전트) |
| `ait-device build-wda` | `xcodebuild build-for-testing`으로 WDA 서명 빌드. `PLA Update available`·서명 오류를 감지하면 조치 안내 |
| `ait-device server` | `appium --address 127.0.0.1 --port <port>` detached 기동. 이미 `/status`가 응답하면 아무것도 안 함 |
| `ait-device start` | 세션 생성 |
| `ait-device open --app <appName> --deployment <id>` | `mobile: deepLink`로 `intoss-private://<appName>?_deploymentId=<id>&host=appsInTossHost`를 토스 앱(`com.vivarepublica.cash`)에서 연다 |
| `ait-device find --label <text>` | `label CONTAINS '<text>'` 요소 목록(id, label, rect, 중심 좌표). 최대 20개 |
| `ait-device tap --x <n> --y <n>` / `tap --label <text>` | `mobile: tap`. `--label`이면 찾은 첫 요소 rect 중심 |
| `ait-device swipe --dir up\|down\|left\|right` | `mobile: swipe`. 아래 내용을 보려면 `up` |
| `ait-device drag --from x,y --to x,y [--duration 0.5]` | `mobile: dragFromToForDuration`. duration은 시작점을 누르고 있는 초(0.5~60) |
| `ait-device type --label <text> --value <문자열>` | 입력칸 찾기 → clear → `/element/:id/value` (한글 가능) |
| `ait-device hide-keyboard` | `mobile: hideKeyboard` |
| `ait-device shot --out <path.png>` | 스크린샷 저장. 경로·바이트·픽셀 크기 출력 |
| `ait-device stop` | 세션 종료 + 상태 파일 삭제 |

Exit code: `0` 성공 · `1` 런타임 실패(메시지 앞 `[단계명]`) · `2` 잘못된 인자·설정 누락 · `3` doctor 미준비. 자동 재시도하지 않는다.

## 7. 조작 요령

- **테스트 버전 열기**: deploymentId는 `npm run build`(ait build) 출력값과 같다. 콘솔에 번들을 올리고 빌드가 끝나야 열린다. 콘솔 알림 "OO의 테스트에 초대됐어요" 푸시로도 열 수 있다
- **좌표는 포인트 단위**다. iPhone 17 스크린샷은 1206x2622px = 402x874pt(3배율)이므로, 스크린샷 픽셀 좌표를 배율로 나눠 `tap` 좌표로 쓴다
- **요소 찾기**: `find --label`로 label을 확인한 뒤 `tap --label`로 누른다. **WebView 안 요소도 접근성 트리에 보인다**
- **스크롤**: `swipe --dir up`(아래 내용 보기). 거리를 정해야 하면 `drag --from x,y --to x,y`
- **한글 입력**: `mobile: keys`는 영문 키보드에서 입력되지 않는다. `type`(입력칸 clear 후 `/element/:id/value`)을 쓴다
- **입력 뒤 결과 목록을 누르기 전에 `hide-keyboard`**. 키보드가 목록을 가려 키가 대신 눌린다
- **네이티브 토스트는 앱 환경에서 3초 고정**이다. 토스트 버튼을 누르거나 토스트를 캡처하려면 동작 직후 바로 `find`/`tap`/`shot` 한다
- 화면 전환 애니메이션이 끝난 뒤(1~2초) 캡처한다

## 8. 캡처 규칙과 보고서

- 실기기 캡처는 `qa-screens/device/{화면명}.png`에 저장한다. `{화면명}`은 Phase 3 브라우저 캡처(`qa-screens/`)의 같은 화면 파일명과 맞춘다
- 보고서에는 **브라우저 | 실기기 2열 비교표**로 임베드하고, **실기기에서만 보이는 차이를 화면별 1줄**로 적는다. 이미지는 보고서 기준 상대경로로 쓴다(보고서가 `docs/`에 있으면 `../qa-screens/...`)

```markdown
| 화면 | 브라우저 (Phase 3) | 실기기 (Phase D) | 실기기에서만 보이는 차이 |
|---|---|---|---|
| 홈 | ![](../qa-screens/home.png) | ![](../qa-screens/device/home.png) | 하단 탭 글자에 밑줄·파란색 잔류 |
| 입력 시트 | ![](../qa-screens/form-sheet.png) | ![](../qa-screens/device/form-sheet.png) | 차이 없음 |
```

- 실기기 캡처가 없는 화면은 "미생성"과 사유를 적는다(조용한 누락 금지)

## 9. 실기기 QA 체크리스트

실기기에서만 드러나는 TDS 함정이다(`@toss/tds-mobile` 2.5.1 실측). 처리 방법은 `front-tds` 스킬 「실기기(토스 앱) 함정」 절을 따른다.

- [ ] `<a>`로 만든 메뉴를 탭한 뒤 밑줄·파란 글자가 남지 않는가 (TDS 전역 리셋 `a:hover`)
- [ ] BottomSheet 아래쪽 필수 항목(체크박스, 입력칸)이 스크롤 없이 보이는가 (기본 최대 높이 70vh)
- [ ] `useToast`가 앱에서 네이티브 토스트로 바뀌어 하단 탭바·고정 버튼을 가리지 않는가
- [ ] 비활성 Button이 의도한 색으로 보이는가 (비활성 투명도 때문에 색 변수를 바꿔도 흐림)
- [ ] BottomSheet 모양이 시안과 같은가 (좌우 10px 띄운 카드이고 안전 영역만큼 위로 떠 있어 바닥에 붙은 시안과 다름)

## 10. 주의

- **운영 서버를 쓰는 테스트 버전이면 본인 계정에 실제 데이터가 생긴다.** 테스트 후 정리 여부를 사용자에게 확인한다
- **기기 잠금 해제, 비밀번호·본인 인증 입력, 기기 설정 변경은 사용자가 직접 한다.** 스크립트는 sudo, `xcode-select -s`, 기기 설정 변경, 잠금 해제를 시도하지 않는다
- 테스트가 끝나면 `stop` 후 Appium 서버를 종료(`kill <pid>`)하고, **아이폰 자동 잠금을 원래대로 되돌리도록** 사용자에게 알린다
- 이 스킬은 출시·검토 요청을 하지 않는다. 검토 요청·출시는 `ait-console` 안전 규칙대로 사용자가 직접 한다
- Appium 서버는 `127.0.0.1`에만 바인딩한다. 같은 네트워크의 다른 기기가 아이폰을 조작할 수 없게 하기 위해서다

## 11. 검증 상태

- **레시피**(1회 설정 순서, capabilities, 조작 요령, TDS 함정 5종): 이슈 #15 작성 환경 실측. macOS 27.2.1, Xcode 27.2, Appium 3.9.0, appium-xcuitest-driver 12.22.8, iPhone 17, 토스 앱 5.283.0, `@apps-in-toss/web-framework` 3.9, `@toss/tds-mobile` 2.5.1
- **`ait-device.cjs`** (2026-11-10, Xcode 27.2 · Appium 3.9.0 · xcuitest 12.22.8 맥에 iPhone 17(iOS 27.2) 연결 상태):
  - 실행 확인: `doctor` 실제 실행(Xcode 27.2 자동 사용, Appium 3.9.0, xcuitest 12.22.8, 실기기 자동 선택, 개발자 모드 판정), 쓰기 계열 전부 `--dry-run`, 잘못된 인자 exit 2, 설정 우선순위
  - 로컬 가짜 WebDriver 서버로 확인: `start`·`find`·`tap`·`type`·`open` 오류 안내·`shot`(PNG 크기 판독)·`stop`의 HTTP 경로, `server`의 detached 기동 경로
  - **미실행**: 실제 Appium 세션 생성, `build-wda` 실제 빌드, 실기기에서의 조작·캡처. 사용자 폰에서 WDA가 뜨기 때문에 이번 작업에서는 돌리지 않았다. 첫 실사용 때 이 절을 갱신한다
- `mobile:` 명령 인자 이름과 `/element/:id/value`의 `text` 필드는 설치된 appium 3.9.0, appium-xcuitest-driver 12.22.8 소스와 대조했다

## 12. 출처

- 이슈 #15: https://github.com/hobeen-kim/appintoss-plugin/issues/15
- Appium XCUITest 드라이버 문서: https://appium.github.io/appium-xcuitest-driver/latest/

> 갱신: 2026-11-10. 신규 스킬(이슈 #15). Appium·Xcode·토스 앱 버전이 바뀌면 capabilities와 오류 문구가 달라질 수 있으니 문제가 생기면 위 드라이버 문서를 먼저 확인한다.
