---
name: back-api
description: API 명세 문서(docs/API.md) 작성 가이드. 엔드포인트, 요청/응답 타입, 에러 코드 정의.
trigger: API 설계, API.md 작성/수정, 엔드포인트 추가, 요청/응답 타입 정의 시 트리거
references:
  - ./references/back-api-template.md
  - ./references/back-api-conventions.md
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

## 문서 신선도

번들 문서가 stale일 수 있다. API·정책·규격이 불확실하면 공홈 조회를 우선하라: https://developers-apps-in-toss.toss.im/
