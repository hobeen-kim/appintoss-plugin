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

## 화면 골격 필수 규칙 (검수 반려 실사례)

### 1. 인트로 화면 — 토스 로그인을 쓰면 필수
첫 화면은 **서비스 소개 인트로**다. 진입 즉시 `appLogin()`을 호출하거나 바텀시트를 자동으로 여는 설계는 반려된다.

- 인트로 구성: 앱이 무엇을 해주는지 한 줄 + 핵심 기능 2~3개 + 로그인 CTA 1개
- 인트로 화면에는 **인앱 광고를 배치하지 않는다** (공홈: 인트로/로딩/컷신/팝업 모달 노출 금지)
- 반려 문구 실사례: "서비스 설명 없이 즉시 토스 로그인을 유도하고 있어 인트로 페이지 추가가 필요해요."

### 2. 탭바 — 쓸 거면 반드시 플로팅 형태
탭바는 **필수가 아니다**. 화면이 2개 이하면 쓰지 않는다. 사용한다면 하단에 꽉 차는 **고정형 바는 금지**다 — 토스 앱 기본 하단 탭과 혼동되어 반려된다.

- 좌우 여백 + 알약(pill) 라운드 + 그림자, safe-area 위로 약 14px 띄운 `position: fixed/absolute`
- 탭 2~5개
- **TDS(`@toss/tds-mobile`)에 플로팅 탭바 컴포넌트는 없다** — 직접 스타일링한다(이 경우만 커스텀 허용, 내용물은 TDS 텍스트·아이콘 사용)
- 반려 문구 실사례: "탭바를 사용하는 경우, 토스 미니앱 브랜딩 가이드에 적합한 플로팅 형태를 사용해야 해요."

```css
/* 플로팅 탭바 골격 */
.tabbar {
  position: fixed;
  left: 16px; right: 16px;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 14px);
  display: flex; justify-content: space-around; align-items: center;
  height: 56px; padding: 0 8px;
  background: #fff;
  border-radius: 28px;                       /* 알약 라운드 */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
```

DESIGN.md에는 탭바 사용 여부와, 사용 시 위 플로팅 스펙 준수를 명시한다.

## 화면 설계 해상도

기기별 대응이 아니라 **기준 해상도 하나**를 정하고 스케일링으로 맞춘다. 세로형 미니앱은 논리 해상도 **360×640 ~ 420×740** 중 하나를 골라 DESIGN.md에 명시하고, 에셋은 1x·2x 두 그룹으로 준비한다. 상세는 `knowledge/toss-ux-writing.md` 3절.

## DESIGN.md 작성 시
→ 템플릿과 작성 예시는 **front-design-template.md** 레퍼런스 참고
→ TDS 제약 내 차별화·트렌디 기법은 **front-design-trend-guide.md** 레퍼런스 참고
→ **모든 화면 문구는 `knowledge/toss-ux-writing.md`의 UX 라이팅 5원칙**(해요체·능동·긍정·캐주얼 경어·명사+명사 금지)을 따른다. 다이얼로그 왼쪽 버튼은 항상 **[닫기]**

## 문서 신선도

번들 문서가 stale일 수 있다. API·정책·규격이 불확실하면 공홈 조회를 우선하라: https://developers-apps-in-toss.toss.im/
