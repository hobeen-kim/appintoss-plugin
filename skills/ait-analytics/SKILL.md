---
name: ait-analytics
description: 앱인토스 Analytics API 사용법. 화면 조회, 노출, 클릭 이벤트 로깅.
trigger: 앱인토스 분석, 이벤트 로깅, Analytics, 사용자 행동 추적, 로그 관련 질문 시 트리거
references:
  - ./references/ait-analytics-api.md
---

# 앱인토스 Analytics 가이드

`@apps-in-toss/web-analytics`를 통해 사용자 행동을 추적합니다.
web-framework에서 re-export되므로 별도 설치 불필요합니다.

## 이벤트 종류
| 메서드 | 용도 | 예시 |
|--------|------|------|
| `screen` | 화면 진입 | 페이지 로드 시 |
| `impression` | 요소 노출 | 배너, 결과 영역이 뷰포트에 보일 때 |
| `click` | 사용자 클릭 | 버튼, 링크 클릭 시 |

## 문서 신선도

번들 문서가 stale일 수 있다. API·정책·규격이 불확실하면 공홈 조회를 우선하라: https://developers-apps-in-toss.toss.im/
