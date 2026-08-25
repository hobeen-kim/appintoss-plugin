# 앱인토스 서버 연동 규격

미니앱 서버(파트너사 서버)를 만들 때 반드시 맞춰야 하는 통신 규격이다. 토스 로그인·토스페이·스마트 발송·프로모션처럼 **서버 간 통신이 필요한 기능**을 쓸 때 적용된다. SDK만 쓴다면 mTLS 절은 건너뛴다.

## 1. CORS — 미니앱 Origin 허용

미니앱 웹뷰에서 자체 서버를 호출하려면 서버의 CORS 허용 Origin에 미니앱 도메인을 넣어야 한다. **SDK 버전과 번들 업로드 시점에 따라 도메인이 다르다.**

| SDK / 시점 | 실 서비스 | 콘솔 QR 테스트 |
|---|---|---|
| **3.x — 2026-08-25(화) 이후 업로드 번들** | `https://<appName>.apps.tossmini.com` | `https://<appName>.private-apps.tossmini.com` |
| 3.x — 그 이전 업로드 번들 | `https://<appName>.web.tossmini.com` | `https://<appName>.private-web.tossmini.com` |
| 1.x ~ 2.x | `https://<appName>.apps.tossmini.com` | `https://<appName>.private-apps.tossmini.com` |

전환 시점이 겹치는 동안에는 **네 도메인을 모두 허용**해 두는 편이 안전하다. 토스 앱에서만 통신이 실패한다면 대부분 이 설정이다.

기타 통신 제약:
- 라이브 환경은 **HTTPS만** 허용된다(로컬에서 되던 HTTP API는 차단).
- iOS 13.4+는 서드파티 쿠키를 완전히 차단한다 — **쿠키 세션 대신 토큰 인증**을 쓴다.
- **iframe은 사용할 수 없다.** 앱인토스 기능이 동작하지 않고 보안 심사에서 반려된다(YouTube 영상 삽입만 예외).
- WebSocket은 `wss://`만 허용된다.

## 2. mTLS 인증서

앱인토스 서버 API는 **mTLS(양방향 TLS)** 가 필수다. 인증서의 CN으로 미니앱을 식별한다.

- 인증서·키 파일은 시크릿 매니저/볼륨에 보관하고 경로만 환경변수로 넘긴다.
- 만료 전에 재발급한다. 무중단 교체가 필요하면 인증서를 둘 이상 등록해 둘 수 있다.

## 3. 방화벽 (Inbound / Outbound)

서버에서 방화벽을 관리한다면 아래를 열어야 한다. 막혀 있으면 API 호출이 실패하거나 콜백을 받지 못한다.

**Inbound (앱인토스 → 파트너사)** — 연결 끊기 콜백, 구독 상태 변경 콜백 등

| IP | Port |
|---|---|
| 117.52.3.11 / 211.115.96.11 / 106.249.5.11 | 443 |
| 117.52.3.80~87 / 211.115.96.80~87 / 106.249.5.80~87 | 443 |

**Outbound (파트너사 → 앱인토스)**

| 기능 | 도메인 | IP | Port |
|---|---|---|---|
| 간편 로그인·메시지 발송·토스 포인트 지급 | `apps-in-toss-api.toss.im` | 117.52.3.192 / 211.115.96.192 / 106.249.5.192 | 443 |
| 간편 결제 | `pay-apps-in-toss-api.toss.im` | 117.52.3.195 / 211.115.96.195 / 106.249.5.195 | 443 |

## 4. 공통 응답 형식

모든 API가 같은 봉투를 쓴다. **`resultType`을 먼저 검사**한 뒤 분기한다.

```json
{ "resultType": "SUCCESS", "success": { "sample": "data" } }
```

```json
{ "resultType": "FAIL", "error": { "errorCode": "INVALID_PARAMETER", "reason": "요청에 실패했습니다." } }
```

- **비즈니스 오류도 HTTP 200으로 내려온다.** 상태 코드만 보고 성공으로 처리하면 안 된다.
- `resultType`은 `SUCCESS` 외에 `FAIL`·`HTTP_TIMEOUT`·`NETWORK_ERROR`·`EXECUTION_FAIL`·`INTERRUPTED`·`INTERNAL_ERROR`가 올 수 있다. **`SUCCESS`가 아니면 전부 실패로 처리**한다.
- 문서화되지 않은 `errorCode`는 실패로 처리하고 `reason`을 로깅한다.
- 요청 필드 검증 실패는 HTTP 400 + `error.data.errorDetails[]`(field·message·rejectedValue).

자주 쓰는 오류 코드: `4010` 인증 정보 없음 · `4050` 인증서버 미등록 미니앱 · `4095` 요청 한도 초과(`error.data.retryAfterSeconds`) · `INVALID_PARAMETER` 잘못된 파라미터.

## 5. 요청 제한 (QPM)

- 기본 **분당 3,000회(QPM)**, 미니앱 기준. 초과하면 일정 시간 차단된다.
- 상향이 필요하면 채널톡으로 **사용 목적·예상 트래픽 규모·피크 시간대 요청량**을 함께 제출한다. 대량 트래픽이 예상되면 오픈 전에 협의한다.

## 6. 도메인

- `https://apps-in-toss-api.toss.im` — 로그인·메시지·포인트
- `https://pay-apps-in-toss-api.toss.im` — 결제

## 7. 사용자 식별

- 토스 로그인 `userKey`는 **앱 단위로 고유**하다. 같은 사용자라도 앱이 다르면 값이 다르다.
- 토스 로그인을 쓰지 않는 앱은 **사용자 식별키(hash) 발급** 기능으로 식별자를 얻는다. 2026-07-16부터 프로모션·스마트 발송·토스페이(일회성/정기) API를 이 hash로도 호출할 수 있고, 유효성 검증 API도 함께 제공된다.
- 로그인 정보·결제 내역 등 민감 정보는 **DB에 암호화 저장**한다. CI는 개인식별정보(PII)다.

---
> 검증: 2026-08-25 공홈 대조 [신규 작성 — CORS Origin 표(2026-08-25 3.x Origin 전환), mTLS, 방화벽 Inbound/Outbound IP, 공통 응답 봉투와 오류 코드, QPM 3,000, 도메인, userKey/hash 식별] 근거: https://developers-apps-in-toss.toss.im/documentation/integration/server-api , https://developers-apps-in-toss.toss.im/documentation/api/response-format , https://developers-apps-in-toss.toss.im/documentation/integration/sdk-3.x , https://developers-apps-in-toss.toss.im/release-note/release-note
