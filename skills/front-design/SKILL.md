---
name: front-design
description: 페이지별 디자인 명세(docs/design/{page}/DESIGN.md) 작성 가이드. 화면 구성, TDS 컴포넌트 매핑, 상태 정의.
trigger: 디자인 명세 작성, DESIGN.md 작성/수정, 페이지 UI 설계, 화면 구성 정의 시 트리거
references:
  - ./references/front-design-template.md
  - ./references/front-design-trend-guide.md
---

# 디자인 명세 가이드

`docs/design/{page}/DESIGN.md`는 각 페이지의 **UI 설계 문서**입니다.
app-developer는 코드 작성 전에 이 문서를 확인하고, 필요 시 업데이트합니다.

## 원칙
- **GLOBAL.md를 먼저 작성**한 후 페이지별 DESIGN.md를 작성한다
- 페이지별로 하나의 DESIGN.md를 작성한다
- TDS 컴포넌트로 어떻게 구현할지 매핑한다
- 화면 상태(로딩, 빈 상태, 에러)를 정의한다
- 사용자 인터랙션 흐름을 명시한다
- 색상/스타일은 GLOBAL.md의 디자인 토큰을 참조한다

## 디렉토리 구조
```
docs/design/
├── GLOBAL.md              # 앱 전체 디자인 가이드 (색상, 테마, 공통 스타일)
├── home/DESIGN.md
├── category/DESIGN.md
├── calculator-dsr/DESIGN.md
└── ...
```

## DESIGN.md 작성 시
→ 템플릿과 작성 예시는 **front-design-template.md** 레퍼런스 참고
→ TDS 제약 내 차별화·트렌디 기법은 **front-design-trend-guide.md** 레퍼런스 참고

## 문서 신선도

번들 문서가 stale일 수 있다. API·정책·규격이 불확실하면 공홈 조회를 우선하라: https://developers-apps-in-toss.toss.im/
