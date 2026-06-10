---
name: ait-login
description: 토스 로그인(OAuth2) 연동 가이드. Phase 0~5 순서, mTLS 인증서, 연동 해제 콜백까지. 사용자가 로그인, 인증, OAuth, JWT, 토스 로그인, 회원가입, 사용자 식별 등을 언급하면 이 스킬을 사용한다.
---

# 토스 로그인 연동 가이드

## 언제 필요한가?

- 첫 몇 개 앱은 **로그인 없이 출시 가능** (계산기, 유틸리티 등)
- 다음 경우에 필요: 사용자별 데이터 저장, 구매 이력, 개인화, 프로모션 참여

## 자동 진행 원칙 (되묻지 말 것)

로그인 연동은 **매 단계 되묻지 말고 끝까지 자동 진행**한다. 사용자는 결과를 보고 판단한다.

1. **코드로 판정** — `src/`·서버 모델(User 등)에서 **실제로 쓰는 사용자 데이터**를 읽어 동의 항목을 스스로 결정한다. 안 쓰는 항목은 "사용 안함". **단, 이름(user_name)은 필수 강제라 항상 켜진다 → 복호화 키·AAD·복호화 로직은 로그인 쓰는 한 항상 필요**(동의 0개 불가).
2. **자동 산출** — 약관/개인정보 처리방침 초안 생성(`legal-templates.md`) + 서버 정적 라우트(`/legal/*.html`) 구현 + (암호화 항목 켤 때) 복호화 로직 + (이름·이메일·성별 외 켤 때) 연동 해제 콜백 구현까지 **코드로 다 만든다.**
3. **콘솔 수동 항목만 1회 일괄 요청** — 사람이 콘솔에서만 할 수 있는 것(토스 로그인 계약·설정, mTLS 인증서 발급, 복호화 키·AAD 수령, 약관 URL·콜백 등록)을 **체크리스트 하나로** 모아 안내한다. 단계마다 끊어 묻지 않는다.
4. **콘솔 설정값은 "권장값을 결론으로 제시"** — "이름은 앱이 안 쓰니 콘솔에서 사용 안함으로 끄세요"처럼 단정해 안내한다. "필수인가요 선택인가요?"로 되묻지 않는다(앱 사용 여부는 코드가 답을 안다).
5. **산출물 집약** — 콘솔 업로드 관련 산출물은 별도 파일이 아니라 `docs/SUBMIT.md`의 '토스 로그인 설정' 섹션에 집약해 기록한다.

## OAuth 설정 빠른 시작 (콘솔→서버→클라이언트)

처음부터 끝까지 따라 할 수 있는 순서. (공홈 근거 표기, 미확인은 명시)

> **약관 URL은 필수다.** 콘솔 등록 전에 `legal-templates.md`로 약관·개인정보 처리방침을 생성하고 서버 정적 라우트(`/legal/terms.html`·`/legal/privacy.html`)로 서빙해 URL을 확보한다(서버 없으면 미니앱 `/terms`·`/privacy` 라우트). 이 URL을 콘솔 약관/동의문에 등록한다.

### 1. 콘솔에서 켜고 발급받기
1. **토스 로그인 계약 → 설정**: 콘솔에서 `계약 → 설정` 순서로 진행. 약관동의는 **대표관리자 계정에서만** 가능. (근거: WebSearch 스니펫)
2. **mTLS 인증서 발급**: 콘솔 → 대상 앱 선택 → 왼쪽 메뉴 `mTLS 인증서` 탭 → `+ 발급받기`. 발급되면 **인증서 파일 + 키 파일** 다운로드. (근거: WebSearch 스니펫, integration-process.html)
3. **복호화 키 + AAD 확인**: 토스 로그인 정보 등록이 완료되면 **복호화 키**를 확인할 수 있고, **AAD(Additional Authenticated Data)** 는 콘솔 등록 **이메일로 전달**된다. 이 키는 `login-me` 응답의 암호화 필드 복호화에 사용. (근거: develop.html, WebSearch 스니펫)
4. **scope/동의항목**: 콘솔에서 받을 항목(scope)을 선택. 실제로는 **사용자가 동의한 값만** 응답에 내려온다. (근거: develop.html)
5. **연동 해제 콜백 등록**: 콜백 URL과 basic auth 헤더를 콘솔에 입력. (근거: develop.html "콘솔에서 입력할 수 있어요")
   > 공홈 미검증: `console.html`(콘솔 가이드 상세 페이지)이 WebFetch에서 404 — 위 메뉴 경로의 정확한 화면 위치는 콘솔에서 직접 확인 필요.

### 2. 발급물을 서버에 배치 (.env 예시)
mTLS 인증서/키와 복호화 키·AAD는 **서버에서만** 보관·사용한다. 클라이언트 노출 금지.
```bash
# mTLS (콘솔 다운로드 파일을 시크릿 매니저/볼륨에 저장, 경로만 .env에)
TOSS_MTLS_CERT_PATH=/run/secrets/toss_client_cert.pem
TOSS_MTLS_KEY_PATH=/run/secrets/toss_client_key.pem
# 응답 복호화 (이메일로 받은 AAD + 콘솔 복호화 키)
TOSS_DECRYPT_KEY=<콘솔에서 확인한 복호화 키>
TOSS_DECRYPT_AAD=<이메일로 받은 AAD>
# API Base
TOSS_API_BASE=https://apps-in-toss-api.toss.im
# 연동 해제 콜백 basic auth (콘솔 등록값과 동일하게)
TOSS_UNLINK_CALLBACK_USER=<basic-auth-user>
TOSS_UNLINK_CALLBACK_PASS=<basic-auth-pass>
```
비밀 관리: 키 파일은 시크릿 매니저(예: Vault/KMS/도커 시크릿)에 두고 .env엔 경로만. 복호화 키·AAD는 평문 커밋 금지.

### 3. 서버 토큰 교환 흐름 (인가코드 → 토큰 → 복호화)
1. 클라이언트로부터 `authorizationCode`, `referrer` 수신
2. mTLS로 `POST {TOSS_API_BASE}/api-partner/v1/apps-in-toss/user/oauth2/generate-token` 호출
3. 응답의 `accessToken`으로 `GET .../login-me` 호출 (`Authorization: Bearer ${accessToken}`)
4. `login-me`의 암호화 필드를 **AES-256-GCM**으로 복호화:
   - 키 길이 256비트, **암호문 앞부분에 IV(NONCE) 포함**, AAD는 콘솔/이메일로 받은 값. (근거: develop.html)

### 4. 클라이언트 appLogin 호출
아래 Phase 3 코드 참고. `@apps-in-toss/web-framework`의 `appLogin()` 사용.

### 5. 샌드박스 테스트
- 샌드박스에서 로그인하면 `appLogin()`의 `referrer`가 `'SANDBOX'`로 내려온다(토스앱은 `'DEFAULT'`).
- 서버는 `referrer` 값을 `generate-token` 요청에 그대로 전달해야 한다.
  > 공홈 미검증: 샌드박스 전용 별도 API base URL이 있는지는 확인하지 못함 — 콘솔/문서에서 확인 필요.

## Phase별 구현 순서

### Phase 0: 필요 여부 판단
- 로그인 없이도 앱이 동작하는가? → 로그인 없이 먼저 출시
- 사용자 식별이 반드시 필요한가? → Phase 1로

### Phase 1: 콘솔 설정

**동의 항목 추천**: 어떤 사용자 정보를 받을지(이름·이메일·성별·생년월일·내외국인·휴대폰·CI)는 `references/oauth-consent-guide.md`의 최소 수집 원칙으로 추천한다. PLAN.md 기능에 실제 쓰이는 항목만 켜고, 식별은 `userKey`로 충분하나 **이름이 필수 강제라 동의 0개는 불가** — 최소 이름은 켜지고 복호화 필요. **이름·이메일·성별 외 항목을 켜면 연결 끊기 콜백이 필수**임을 자동 판정해 안내한다. 추천 결과는 SUBMIT.md '토스 로그인 설정' 섹션에 표로 출력.
1. 앱인토스 콘솔 → 토스 로그인 `계약 → 설정` (대표관리자 계정)
2. **mTLS 인증서** 발급 (콘솔 > 대상 앱 > `mTLS 인증서` 탭 > `+ 발급받기`) → 인증서/키 파일 다운로드
3. **복호화 키** 확인 + **AAD** 이메일 수신
4. **scope/동의항목** 선택, **연동 해제 콜백 URL + basic auth** 등록

### Phase 2: 서버 구성
서버가 mTLS 인증서로 토스 API와 통신해야 한다.
**API Base URL (로그인):** `https://apps-in-toss-api.toss.im` (port 443) — (근거: integration-process.html)

**필요 엔드포인트:** (모든 경로 prefix는 `/api-partner/v1/apps-in-toss/user/oauth2`)

| 서버 API | 토스 API | 용도 |
|---------|---------|------|
| `POST /auth/token` | `POST .../generate-token` | 인가코드 → 토큰 교환 |
| `POST /auth/refresh` | `POST .../refresh-token` | 토큰 갱신 |
| `GET /auth/me` | `GET .../login-me` | 유저 정보 (개인정보 암호화됨 → 복호화 필요) |
| `POST /auth/logout` | `POST .../access/remove-by-access-token` | 로그아웃(액세스토큰 제거) |
| (선택) | `POST .../access/remove-by-user-key` | userKey로 연결 끊기 |

**generate-token** — 요청: `authorizationCode`, `referrer`. 응답: `tokenType`("Bearer"), `accessToken`, `refreshToken`, `expiresIn`(초, 약 3599 = 1시간), `scope`.

**refresh-token** — 요청: `refreshToken`. 응답: `tokenType`, `accessToken`, `refreshToken`, `expiresIn`, `scope`.

**login-me** — 헤더 `Authorization: Bearer ${accessToken}`. 응답 필드:
- 평문: `userKey`(number), `scope`(string), `agreedTerms`(list)
- 암호화: `name`, `phone`, `birthday`(yyyyMMdd), `ci`, `di`(항상 null), `gender`(MALE/FEMALE), `nationality`(LOCAL/FOREIGNER), `email`

**API 응답 래퍼:** 성공 `{"resultType":"SUCCESS","success":{...}}`, 실패 `{"resultType":"FAIL","error":{"errorCode":...,"reason":...}}`. (근거: integration-process.html)

### Phase 3: 클라이언트 구현

```tsx
import { appLogin } from '@apps-in-toss/web-framework';

// 시그니처: appLogin(): Promise<{ authorizationCode: string; referrer: 'DEFAULT' | 'SANDBOX' }>
const handleLogin = async () => {
  const { authorizationCode, referrer } = await appLogin();
  // authorizationCode: 10분 유효, 1회용(재사용 불가)
  // referrer: 'DEFAULT'(토스앱) | 'SANDBOX'(샌드박스)

  const response = await fetch('/auth/token', {
    method: 'POST',
    body: JSON.stringify({ authorizationCode, referrer }),
  });
  const { accessToken, refreshToken } = await response.json();
  // 토큰 저장 후 로그인 완료
};
```

### Phase 4: 연동 해제 콜백 (필수 — 없으면 심사 반려)

토스앱에서 사용자가 "연결 끊기" 시 서버가 호출받는 콜백. 콜백 URL과 basic auth는 **콘솔에 등록**한다.

**요청 규격** (GET 또는 POST):
```
GET  $callback_url?userKey=$userKey&referrer=$referrer
POST $callback_url   Content-Type: application/json   {"userKey": $userKey, "referrer": $referrer}
```
**referrer 값:**
- `UNLINK`: 사용자가 토스앱에서 직접 연결 끊음
- `WITHDRAWAL_TERMS`: 로그인 서비스 약관 동의 철회
- `WITHDRAWAL_TOSS`: 토스 회원 탈퇴

처리: 해당 `userKey`의 토큰 무효화, 관련 데이터 삭제/비활성화.
주의: **서비스가 직접 연결 끊기 API(`access/remove-*`)를 호출한 경우엔 콜백이 오지 않는다.**
> 공홈 미검증: 파트너 서버가 콜백에 반환해야 하는 응답 형식(상태코드/바디)은 문서에 명시 없음.

### Phase 5: QA
- 샌드박스에서 로그인/로그아웃 테스트 (`referrer === 'SANDBOX'` 확인)
- 연동 해제 콜백 테스트 (UNLINK/WITHDRAWAL_TERMS/WITHDRAWAL_TOSS)
- 토큰 만료 → refresh-token 갱신 흐름 테스트

## 주의사항
- 개인정보는 **암호화되어 반환**(`login-me`) → 서버에서 **AES-256-GCM**으로 복호화. 암호문 앞에 IV(NONCE) 포함, AAD 필요.
- mTLS 인증서/키, 복호화 키, AAD는 **서버에서만** 사용 (클라이언트 노출 금지).
- `authorizationCode`는 **10분 유효, 1회용** — 재사용 시 에러.
- `2026-01-02`부터 응답에 `user_key` 추가 예정 (공지 시점 기준).

## 불확실하면 공홈 조회
API·정책·규격·콘솔 화면이 불확실하면 **추측하지 말고 공홈을 먼저 조회**한다.
- 개발 흐름/엔드포인트: https://developers-apps-in-toss.toss.im/login/develop.html
- API 사용(mTLS/Base URL): https://developers-apps-in-toss.toss.im/development/integration-process.html
- 콘솔 가이드: https://developers-apps-in-toss.toss.im/login/console.html
- 검토 체크리스트: https://developers-apps-in-toss.toss.im/checklist/login.html
- 시작점: https://developers-apps-in-toss.toss.im/

> 검증: 2026-06-09 공홈 대조 [갱신: appLogin 유효시간(10분), generate-token/refresh-token/login-me/logout 정확 경로·필드, login-me 응답 필드, 복호화 AES-256-GCM+IV+AAD, 연동해제 콜백 규격(GET/POST·userKey·referrer 값), API Base URL, scope=사용자 동의값 / 미검증: console.html 404로 콘솔 화면 상세 경로·콜백 응답형식·샌드박스 별도 base URL] — 근거 URL: https://developers-apps-in-toss.toss.im/login/develop.html , https://developers-apps-in-toss.toss.im/development/integration-process.html , https://developers-apps-in-toss.toss.im/login/console.html
