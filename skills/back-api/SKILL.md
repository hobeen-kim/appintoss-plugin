---
name: back-api
description: API 명세 문서(docs/API.md) 작성 가이드와 앱인토스 서버 연동 규격(CORS Origin·mTLS·방화벽 IP·공통 응답 봉투·QPM). 엔드포인트, 요청/응답 타입, 에러 코드 정의.
trigger: API 설계, API.md 작성/수정, 엔드포인트 추가, 요청/응답 타입 정의, CORS·mTLS·방화벽·서버 연동 규격 질문 시 트리거
references:
  - ./references/back-api-template.md
  - ./references/back-api-conventions.md
  - ./references/ait-server-api.md
---

# API 명세 가이드

`docs/API.md`는 프론트엔드(app-developer)와 백엔드(back-developer) 간의 **API 계약서**입니다.
모든 엔드포인트, 요청/응답 타입, 에러 코드가 이 문서에 정의되어야 합니다.

## 원칙
- API.md는 **단일 진실 공급원(Single Source of Truth)**이다
- app-developer는 API.md를 보고 API를 호출한다
- back-developer는 API를 변경할 때 반드시 API.md를 먼저 또는 함께 업데이트한다
- 응답 타입은 TypeScript 인터페이스로 정의하여 프론트/백 모두 참고할 수 있게 한다

## API.md 작성 시
→ 엔드포인트별 구조는 **back-api-template.md** 레퍼런스 참고
→ 네이밍/에러 코드 규약은 **back-api-conventions.md** 레퍼런스 참고

## 앱인토스 서버 연동 규격 (필수)

미니앱 서버를 만들 때는 **`references/ait-server-api.md`** 를 먼저 확인한다. 여기서 자주 사고가 나는 항목:

- **CORS 허용 Origin** — SDK 버전·업로드 시점에 따라 도메인이 다르다. 2026-08-25 이후 업로드되는 SDK 3.x 번들은 `https://<appName>.apps.tossmini.com` / `https://<appName>.private-apps.tossmini.com`으로 서비스된다. 전환기에는 네 도메인을 모두 허용한다.
- **HTTPS 전용** — 라이브에서 HTTP API는 차단된다. WebSocket은 `wss://`만.
- **쿠키 인증 금지** — iOS 13.4+ 서드파티 쿠키 차단. 토큰 인증을 쓴다.
- **공통 응답 봉투** — 비즈니스 오류도 HTTP 200으로 온다. `resultType`이 `SUCCESS`가 아니면 전부 실패로 처리한다.
- **QPM 3,000** — 앱당 분당 요청 한도. 초과 시 `4095`.
- **mTLS·방화벽 IP** — 서버 API(로그인·결제·발송)를 쓸 때 필요하다.
- **웹훅 수신 인증** — 콘솔에 등록한 인증 값은 **`Authorization: Bearer {값}`** 형식으로 온다(실측). Basic 가정으로 대조하면 401이 반복된다 — raw/Basic/Bearer 3형식을 수용한다. 상세: `ait-sdk/references/ait-iap.md` "웹훅 인증 헤더".
- **구독 웹훅 페이로드** — 상태는 최상위가 아니라 `subscription.current.status`, 판정 기준은 `changeReason`이다. `RENEWED` 미처리는 결제 사고로 직결된다. 상세: `ait-sdk/references/ait-iap.md` "서버 웹훅(구독 상태 변경)".
- **기능성 메시지 발송 API** — `POST /api-partner/v1/apps-in-toss/messenger/send-message`(단건, 앱당 분당 15,000 / 사용자당 분당 10) · `send-bulk-message`(분당 3,000) · `send-test-message`. 본문 `{ templateSetCode, context }`, mTLS + 사용자 인증 토큰. 상세: `ait-smart-message/SKILL.md` "서버 직접 API 발송".

## 문서 신선도

번들 문서가 stale일 수 있다. API·정책·규격이 불확실하면 공홈 조회를 우선하라: https://developers-apps-in-toss.toss.im/
