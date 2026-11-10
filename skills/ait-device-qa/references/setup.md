# 실기기 QA 설정: 사용자 1회 설정, WDA 빌드, 트러블슈팅

`ait-device-qa` 스킬의 준비 절차다. 아래 `ait-device`는 `node "$CLAUDE_PLUGIN_ROOT/skills/ait-device-qa/scripts/ait-device.cjs"`를 줄여 쓴 것이다. 모든 명령은 미니앱 프로젝트 루트에서 실행한다(`.appintoss.json`의 `deviceQa`를 읽는다).

## 1. 버전 요건

| 조건 | 요건 |
|---|---|
| 아이폰 iOS 26 이상 | Xcode 26 이상 |
| Xcode 26 | macOS 15.6 이상 |

이슈 #15 실측 환경: macOS 27.2.1, Xcode 27.2, Appium 3.9.0, appium-xcuitest-driver 12.22.8, iPhone 17, 토스 앱 5.283.0.

## 2. 사용자가 처음 한 번 하는 설정

에이전트가 대신할 수 없는 항목이다(비밀번호, 기기 조작, 계정 동의가 필요).

1. **macOS 버전 확인**: 1절 표를 만족하는지 확인한다
2. **Xcode 설치**: App Store에서 설치한다. `mas install 497799835`는 sudo 비밀번호가 필요해 사용자가 직접 실행한다. 설치 후 **한 번 실행해 라이선스에 동의**하고 추가 구성 요소 설치를 마친다
3. **아이폰 연결**: 케이블로 연결하고 아이폰에 뜨는 **"이 컴퓨터 신뢰"** 를 누른다(기기 암호 입력)
4. **개발자 모드**: 아이폰 설정 > 개인정보 보호 및 보안 > 개발자 모드 켜기. 재시동 후 한 번 더 확인을 누른다
5. **Apple 계정**: Xcode > Settings > Accounts에 Apple 계정을 추가한다
6. **PLA 동의(유료 개발자 팀)**: developer.apple.com/account에 로그인해 최신 Program License Agreement에 동의한다. 안 하면 빌드가 `PLA Update available` 오류로 실패한다
7. **자동 잠금 "안 함"**: 테스트하는 동안 아이폰 설정 > 디스플레이 및 밝기 > 자동 잠금을 "안 함"으로 둔다. 잠겨 있으면 `device is locked`로 앱을 열 수 없다. **테스트가 끝나면 원래대로 되돌린다**

## 3. 에이전트 준비 (sudo 없음)

```bash
npm i -g appium
appium driver install xcuitest
ait-device doctor
```

- `xcode-select`를 바꾸지 않는다(`sudo xcode-select -s` 금지). `ait-device.cjs`는 `DEVELOPER_DIR`이 없고 `/Applications/Xcode.app`이 있으면 자식 프로세스에만 `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`를 넣는다. 스크립트 밖에서 `xcrun devicectl`을 직접 부를 때는 앞에 `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`를 붙인다
- UDID는 `doctor`가 보여 준다. 직접 볼 때는 `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcrun devicectl list devices`의 Identifier 열이다(형식 `00008150-...`)
- **팀 ID**는 사용자 계정 값이다. 유료 팀은 developer.apple.com/account의 멤버십 정보에 나온다. 키체인에 개발 인증서가 있으면 읽기 전용으로 확인할 수도 있다

  ```bash
  security find-certificate -c "Apple Development" -p | openssl x509 -noout -subject
  # subject 의 OU= 값이 팀 ID 다. CN 괄호 안 값은 팀 ID 가 아니다
  ```

  인증서가 여러 개거나 팀이 여러 개면 어느 팀을 쓸지 사용자에게 확인한다
- **WDA 번들 ID**는 에이전트가 정한다. 팀 안에서 고유해야 한다(예: `<역도메인>.wda.runner`). 이미 다른 앱이 쓰는 ID면 빌드가 실패한다
- 정한 값은 `.appintoss.json`의 `deviceQa`에 기록한다

## 4. WDA 빌드

```bash
ait-device build-wda          # 수 분 걸린다. 에이전트는 run_in_background 로 실행
ait-device build-wda --dry-run  # 실행할 xcodebuild 명령만 출력
```

실제로 실행하는 명령:

```bash
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
xcodebuild build-for-testing \
  -project ~/.appium/node_modules/appium-xcuitest-driver/node_modules/appium-webdriveragent/WebDriverAgent.xcodeproj \
  -scheme WebDriverAgentRunner -destination 'id=<UDID>' -derivedDataPath <wdaDerivedDataPath> \
  -allowProvisioningUpdates -allowProvisioningDeviceRegistration \
  DEVELOPMENT_TEAM=<teamId> CODE_SIGN_STYLE=Automatic PRODUCT_BUNDLE_IDENTIFIER=<wdaBundleId>
```

- 성공하면 `<wdaDerivedDataPath>/Build/Products/Debug-iphoneos/WebDriverAgentRunner-Runner.app`이 생기고, `doctor`의 "WDA 빌드 산출물"이 OK가 된다
- `APPIUM_HOME`을 쓰면 `~/.appium` 대신 그 경로에서 `WebDriverAgent.xcodeproj`를 찾는다
- Xcode나 XCUITest 드라이버를 업데이트한 뒤 `start`가 WDA 기동에 실패하면 다시 `build-wda` 한다
- 세션은 이 산출물을 그대로 쓴다(`appium:usePrebuiltWDA: true`, `appium:derivedDataPath`)

## 5. 세션 capabilities

`ait-device start`가 보내는 값이다(`--dry-run`으로 확인 가능).

```json
{
  "platformName": "iOS",
  "appium:automationName": "XCUITest",
  "appium:udid": "<UDID>",
  "appium:usePrebuiltWDA": true,
  "appium:derivedDataPath": "<wdaDerivedDataPath>",
  "appium:updatedWDABundleId": "<wdaBundleId>",
  "appium:xcodeOrgId": "<teamId>",
  "appium:xcodeSigningId": "Apple Development",
  "appium:newCommandTimeout": 3600,
  "appium:noReset": true
}
```

## 6. 트러블슈팅

| 증상 | 원인 | 조치 | 주체 |
|---|---|---|---|
| `xcrun: error: unable to find utility "devicectl"` | `xcode-select -p`가 `/Library/Developer/CommandLineTools`를 가리킨다. CommandLineTools에는 devicectl이 없다 | `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`를 붙여 실행한다(`ait-device.cjs`는 자동 적용). `sudo xcode-select -s`는 쓰지 않는다 | 에이전트 |
| `doctor`의 Xcode가 누락이고 `/Applications/Xcode.app`이 없음 | Xcode 미설치 | App Store에서 설치 후 한 번 실행해 라이선스 동의 | 사용자 |
| `xcodebuild -version` 실패(라이선스) | Xcode를 아직 한 번도 실행하지 않음 | Xcode를 실행해 라이선스 동의와 추가 구성 요소 설치 | 사용자 |
| `doctor`의 실기기 연결이 누락 | 케이블 미연결, "이 컴퓨터 신뢰" 안 함 | 연결하고 신뢰 | 사용자 |
| 실기기가 여러 대 | UDID 자동 선택 불가 | `--udid` 또는 `deviceQa.udid` 지정 | 에이전트 |
| 개발자 모드 꺼짐 | 기기 설정 | 설정 > 개인정보 보호 및 보안 > 개발자 모드 켜기(재시동) | 사용자 |
| 빌드 `PLA Update available` | 최신 Program License Agreement 미동의 | developer.apple.com/account에서 동의 후 `build-wda` 재실행 | 사용자 |
| 빌드 `No Accounts` / `No Account for Team` | Xcode에 계정 없음 | Xcode > Settings > Accounts에 해당 팀 계정 추가 | 사용자 |
| 빌드 `cannot be registered to your development team` | 번들 ID를 다른 곳에서 이미 사용 | 다른 고유 `wdaBundleId`로 바꿔 `build-wda` 재실행 | 에이전트 |
| 빌드 `requires a development team` / `No profiles for` / `No signing certificate` | teamId 오류 또는 계정·인증서 없음 | teamId 확인, Xcode Accounts에 그 팀 계정이 있는지 확인 | 사용자 |
| 빌드 `errSecInternalComponent` | 로그인 키체인이 잠겨 서명 실패 | 사용자가 키체인 잠금 해제 | 사용자 |
| `device is locked` | 아이폰이 잠김 | 잠금 해제, 테스트 동안 자동 잠금 "안 함" | 사용자 |
| `start`가 60초 시간 초과 | WDA 첫 기동이 느리거나 실패 | Appium 로그(`server`가 출력한 경로) 확인 후 `start` 재실행. 기기가 사용 중이라는 오류가 나면 Appium 서버를 종료(`kill <pid>`)하고 `server`부터 다시 | 에이전트 |
| `Appium 서버(...)에 연결할 수 없습니다` | 서버가 안 떠 있음 | `ait-device server` | 에이전트 |
| `세션이 없습니다` / `invalid session id` | `start` 안 함, 또는 `newCommandTimeout`(3600초) 경과로 세션 종료 | `stop` 후 `start` | 에이전트 |
| `open` 후 테스트 버전이 안 열림 | 콘솔 업로드 전이거나 빌드가 아직 안 끝남, deploymentId 불일치 | 콘솔 업로드·빌드 완료 확인, deploymentId가 `npm run build` 출력값과 같은지 확인. 대안: 콘솔 "OO의 테스트에 초대됐어요" 푸시로 열기 | 에이전트 |
| 한글이 입력되지 않음 | `mobile: keys`는 영문 키보드에서 입력 안 됨 | `ait-device type`(clear 후 `/element/:id/value`) | 에이전트 |
| 목록 대신 키보드 키가 눌림 | 키보드가 목록을 가림 | 목록을 누르기 전에 `hide-keyboard` | 에이전트 |
| 토스트 버튼을 못 누름 | 네이티브 토스트가 3초 고정 | 동작 직후 바로 `find`/`tap` | 에이전트 |

## 7. 테스트가 끝난 뒤

1. `ait-device stop` (세션 종료, 상태 파일 삭제)
2. `kill <server 가 출력한 pid>` (Appium 서버 종료)
3. 사용자에게 알린다: 아이폰 자동 잠금 원복, 운영 서버 테스트 버전이었다면 생긴 데이터를 정리할지 여부
