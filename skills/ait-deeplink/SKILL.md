---
name: ait-deeplink
description: 앱인토스 딥링크, 페이지 네비게이션, 백/홈 이벤트 처리 가이드.
trigger: 앱인토스 딥링크, 페이지 이동, 네비게이션 이벤트, 백 버튼 처리, 악세서리 버튼 관련 질문 시 트리거
references:
  - ./references/ait-events.md
  - ./references/ait-partner.md
  - ./references/ait-deeplink-navigation.md
---

# 앱인토스 딥링크 & 네비게이션 가이드

앱인토스 미니앱 내 페이지 이동, 네이티브 백/홈 이벤트 처리, 딥링크 구성 방법을 다룹니다.

## 핵심 개념
- **앱 내 라우팅**: react-router-dom 사용
- **네이티브 이벤트**: graniteEvent (백/홈 버튼)
- **네비게이션 악세서리**: partner API + tdsEvent
- **외부 링크 제한**: 주요 기능이 외부 링크에 의존 금지. 법률 고지/공공기관 등 단순 정보 확인용은 허용

## 문서 신선도

번들 문서가 stale일 수 있다. API·정책·규격이 불확실하면 공홈 조회를 우선하라: https://developers-apps-in-toss.toss.im/
