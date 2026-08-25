---
name: ait-review
description: 앱인토스 미니앱 검수 기준 및 출시 전 11단계 체크리스트. 21개 앱 실제 반려 사례 기반. apps-in-toss.config.ts 검증, package.json 의존성, TDS Provider 분기, AI 생성 콘텐츠, 어뷰징 방지, 콘솔 설정 확인까지 포함.
trigger: 앱인토스 검수, 리뷰 기준, 제출 전 체크리스트, 앱 등록 규칙, 출시 점검, 심사 준비, 제출 전 확인, 반려 방지 관련 질문 시 트리거
references:
  - ./references/ait-review-checklist.md
  - ./references/ait-review-ui-rules.md
---

# 앱인토스 검수 가이드

앱인토스 미니앱은 토스 플랫폼에 등록되기 전 검수 과정을 거칩니다.
검수 기준을 충족하지 않으면 반려될 수 있습니다.

21개 앱 실제 반려 사례를 기반으로 한 11단계 체크리스트를 포함합니다.
출시 전 아래 기준과 `ait-review-checklist.md`의 11단계를 순서대로 확인하세요.

## 핵심 검수 기준
1. **TDS 컴포넌트 필수 사용** - 커스텀 UI 금지
2. **번들 크기 100MB 이하**
3. **앱 설치 유도 금지, 외부 링크는 제한적 허용**
4. **라이트 모드만 지원**
5. **인터랙션 반응 2초 이내**

## 문서 신선도

번들 문서가 stale일 수 있다. API·정책·규격이 불확실하면 공홈 조회를 우선하라: https://developers-apps-in-toss.toss.im/
