---
name: front-tds
description: TDS(@toss/tds-mobile) 컴포넌트 활용법 가이드. UI 개발 시 TDS 컴포넌트 사용법을 참고할 때 사용.
trigger: TDS 컴포넌트를 사용한 UI 개발, 앱인토스 프론트엔드 구현, TDS 컴포넌트 사용법 질문 시 트리거
references:
  - ./references/tds-provider.md
  - ./references/tds-foundation.md
  - ./references/tds-border.md
  - ./references/tds-paragraph.md
  - ./references/tds-post.md
  - ./references/tds-textfield.md
  - ./references/tds-textarea.md
  - ./references/tds-split-text-field.md
  - ./references/tds-segmented-control.md
  - ./references/tds-tab.md
  - ./references/tds-switch.md
  - ./references/tds-checkbox.md
  - ./references/tds-menu.md
  - ./references/tds-slider.md
  - ./references/tds-button.md
  - ./references/tds-icon-button.md
  - ./references/tds-text-button.md
  - ./references/tds-bottom-cta.md
  - ./references/tds-fixed-bottom-cta.md
  - ./references/tds-list-row.md
  - ./references/tds-list-header.md
  - ./references/tds-list-footer.md
  - ./references/tds-table-row.md
  - ./references/tds-grid-list.md
  - ./references/tds-badge.md
  - ./references/tds-board-row.md
  - ./references/tds-top.md
  - ./references/tds-bottom-sheet.md
  - ./references/tds-modal.md
  - ./references/tds-alert-dialog.md
  - ./references/tds-confirm-dialog.md
  - ./references/tds-toast.md
  - ./references/tds-loader.md
  - ./references/tds-skeleton.md
  - ./references/tds-progress-bar.md
  - ./references/tds-progress-stepper.md
  - ./references/tds-result.md
  - ./references/tds-asset.md
  - ./references/tds-highlight.md
  - ./references/tds-bottom-info.md
  - ./references/tds-tooltip.md
  - ./references/tds-search-field.md
  - ./references/tds-numeric-spinner.md
  - ./references/tds-stepper.md
  - ./references/tds-rating.md
  - ./references/tds-bubble.md
  - ./references/tds-bar-chart.md
  - ./references/tds-number-keypad.md
  - ./references/tds-alphabet-keypad.md
  - ./references/tds-full-secure-keypad.md
  - ./references/tds-agreement.md
  - ./references/tds-use-dialog.md
  - ./references/tds-use-toast.md
  - ./references/tds-use-bottom-sheet.md
---

# TDS 컴포넌트 활용 가이드

TDS(@toss/tds-mobile)는 토스 디자인 시스템의 모바일 컴포넌트 라이브러리입니다.
앱인토스 미니앱 개발 시 반드시 TDS 컴포넌트를 사용해야 합니다.

> 공식 문서: https://tossmini-docs.toss.im/tds-mobile/

## 패키지
- `@toss/tds-mobile` **v2.5.1** - 메인 컴포넌트 라이브러리
- `@toss/tds-mobile-ait` **v2.5.1** - 앱인토스 전용 Provider

(2026-08-25 npm `latest` 실측. SDK 3.x 마이그레이션 문서는 최소 2.4.1 이상을 요구한다. 설치: `npm i @toss/tds-mobile @toss/tds-mobile-ait @emotion/react@^11 react@^18 react-dom@^18`)

**비게임 미니앱은 TDS 사용이 사실상 필수다** — 커스텀 HTML/CSS UI 요소는 검수에서 반려된다. 다만 **플로팅 탭바 컴포넌트는 TDS에 없어** 직접 스타일링해야 한다(`front-design` 화면 골격 규칙).
- `@toss/tds-colors` - 색상 토큰

## 사용 원칙
1. 모든 UI는 TDS 컴포넌트로 구성 (검수 기준)
2. 라이트 모드만 지원
3. adaptive 색상 토큰 사용 (다크모드 자동 대응)
4. 앱 설치 유도 금지. 외부 링크는 제한적 허용 (법률 고지, 공공기관 등)

## 컴포넌트 카테고리

### Provider (앱 설정)
- `TDSMobileProvider` / `TDSMobileAITProvider` - 앱 최상위 래퍼

### 레이아웃
- `Border` - 구분선/섹션 간격

### 텍스트
- `Paragraph` - 텍스트 표시 (타이포그래피, 색상, 굵기, 서브컴포넌트: Text, Badge, Link, Icon)
- `Post` - 리치 텍스트 (H1~H4, Paragraph, Ul, Ol, Li, Hr)

### 입력
- `TextField` - 텍스트 입력 (box/line/big/hero, 서브: Clearable, Password, Button)
- `TextArea` - 다중 줄 텍스트 입력
- `SplitTextField` - 분할 입력 (주민등록번호 등: RRN13, RRNFirst7)
- `SearchField` - 검색 입력 (고정, 지우기 버튼)

### 선택
- `SegmentedControl` - 세그먼트 선택
- `Tab` - 탭 네비게이션
- `Switch` - 토글 스위치
- `Checkbox` - 체크박스/라디오 (Circle, Line)
- `Menu` - 드롭다운 메뉴
- `Slider` - 슬라이더

### 버튼
- `Button` - 기본 버튼 (primary/danger/light/dark, fill/weak)
- `IconButton` - 아이콘 버튼
- `TextButton` - 텍스트 버튼
- `BottomCTA` - 하단 고정 CTA (Single, Double)
- `FixedBottomCTA` - 간편 하단 고정 버튼 (Double 지원)

### 리스트/데이터
- `ListRow` - 리스트 행 (Texts, AssetIcon, Loader, ref: shine/blink)
- `ListHeader` - 리스트 헤더 (TitleParagraph, RightText, RightArrow, DescriptionParagraph)
- `ListFooter` - 리스트 더보기 (Text, Icon, Hairline, Shadow)
- `TableRow` - 키-값 표시 (계산 결과용)
- `GridList` - 그리드 목록
- `Badge` - 뱃지
- `BoardRow` - 아코디언/접힘 패널 (Q&A, Prefix, ArrowIcon, Text)

### 네비게이션
- `Top` - 페이지 상단 타이틀 (TitleParagraph, SubtitleParagraph, RightButton)

### 모달/다이얼로그
- `BottomSheet` - 바텀시트 (Header, HeaderDescription, CTA, DoubleCTA, Select)
- `Modal` - 모달 (Overlay, Content)
- `AlertDialog` - 알림 다이얼로그 (Title, Description, AlertButton)
- `ConfirmDialog` - 확인 다이얼로그 (Title, Description, CancelButton, ConfirmButton)

### 피드백
- `Toast` - 토스트 알림 (Button, Icon, Lottie)
- `Loader` - 로딩 스피너
- `Skeleton` - 스켈레톤 로딩
- `ProgressBar` - 진행률 표시
- `ProgressStepper` - 단계 진행 표시 (compact/icon)
- `Result` - 결과/오류 화면

### 에셋
- `Asset` - 아이콘/이미지/로티/비디오/텍스트 (Frame, frameShape 프리셋, acc, overlap)

### 데이터 시각화
- `BarChart` - 막대 차트 (AllBar, SingleBar, Auto 색상)

### 기타
- `Highlight` - 하이라이트 강조
- `BottomInfo` - 하단 안내 영역
- `Tooltip` - 툴팁
- `NumericSpinner` - 숫자 증감 버튼
- `Stepper` - 단계별 워크플로우 표시 (StepperRow, NumberIcon, Texts)
- `Rating` - 별점 (인터랙티브/읽기전용)
- `Bubble` - 대화 말풍선

### 키패드
- `NumberKeypad` - 숫자 키패드
- `AlphabetKeypad` - 알파벳 키패드
- `FullSecureKeypad` - 보안 키패드 (숫자+알파벳)

### 동의
- `AgreementV4` - 동의 컴포넌트 (Checkbox, Text, Badge, Necessity, Collapsible, Group)
- `AgreementV3` - (deprecated → V4 사용 권장)

### Overlay Extension Hooks (명령형 오버레이)
- `useDialog` - 명령형 다이얼로그 (openAlert, openConfirm, openAsyncConfirm)
- `useToast` - 명령형 토스트 (openToast)
- `useBottomSheet` - 명령형 바텀시트 (open, close, openOneButtonSheet, openTwoButtonSheet, openAsyncTwoButtonSheet)

## 공홈 검증 현황 (2026-06-07)

검증 출처: 공홈 https://developers-apps-in-toss.toss.im/ / 컴포넌트 상세 https://tossmini-docs.toss.im/tds-mobile/components/
(상세 문서의 구 스코프 `@toss-design-system/tds-mobile` 표기는 무시 — 현행 정식 번들 표기 `@toss/tds-mobile` 유지)

### 핵심 12종 — 정밀 검증 완료 (각 reference 파일 내 "검증:" 메모 참조)
alert-dialog, bottom-cta, bottom-sheet, button, fixed-bottom-cta, foundation, list-row, provider, tab, textfield, toast, top

### 잔여 spot-check 5종 — 공홈 대조 결과
| 컴포넌트 | 결과 | 비고 |
|---|---|---|
| checkbox | 일치 | import·Checkbox.Circle/Line·props(inputType/size=24/checked/onCheckedChange/defaultChecked/disabled/aria-label) 일치 |
| switch | 일치 | props(checked/disabled/name/hasTouchEffect/onChange/onClick) 시그니처 일치 |
| badge | 일치 | variant(fill/weak)·size(xsmall~large)·color(blue/teal/green/red/yellow/elephant)·children 일치 |
| skeleton | 일치 | pattern 9종·custom·repeatLastItemCount(infinite)·play·background 일치 |
| loader | 일치 | size·type(primary/dark/light)·label·style·className 일치 |

### 나머지 reference (총 54종 중 위 17종 외)
런타임 조회 지침(파일 끝 stale 경고)으로 커버. 사용 시 불확실하면 공홈 조회.
> 갱신: 2026-08-25 — TDS 버전 2.2.1 → **2.5.1**(npm latest 실측), 설치 커맨드·TDS 필수성·플로팅 탭바 미제공 명시 (이슈 #4)
