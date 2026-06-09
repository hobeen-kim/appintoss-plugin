# UI 규칙 (프로젝트 컨벤션)

## 헤더 규칙
- AIT 공통 내비게이션 바가 뒤로가기를 제공하므로 **커스텀 뒤로가기 버튼 금지**
- **Category 페이지**: 커스텀 헤더 없음
- **Result 영역**: 헤더 없음
- **Calculator 페이지**: 콘텐츠 헤더만 (계산기 이름 + 초기화 버튼). 뒤로가기는 AIT 네비바에 위임
- "계산기"라는 단어는 페이지 타이틀에서 제외

## 계산 결과 표시
- 계산 과정 토글: `Asset.Icon` 사용
  - 접힘: `icon-arrow-down-mono`
  - 펼침: `icon-arrow-up-mono`
- BottomInfo 면책 고지: 사용하지 않음

## TDS Provider 분기
```tsx
// AIT 환경: TDSMobileAITProvider 사용
// 브라우저: TDSMobileProvider 사용 (light mode)
const isAIT = typeof window !== 'undefined' && Boolean(
  navigator.userAgent.includes('AIT') ||
  navigator.userAgent.includes('tossapp') ||
  (window as unknown as Record<string, unknown>).__GRANITE__
);

{isAIT ? (
  <TDSMobileAITProvider>...</TDSMobileAITProvider>
) : (
  <TDSMobileProvider appearance="light">...</TDSMobileProvider>
)}
```

## 금지 사항
- 자사 앱 설치 유도 (문구, 배너, 앱마켓 링크)
- 주요 기능이 외부 링크에 의존하는 구조
- 커스텀 스타일로 TDS 컴포넌트 오버라이드
- 커스텀 뒤로가기 버튼 또는 네비게이션 바 구현 (AIT 공통 네비바와 중복 — 반려 사유)

## 허용 사항
- 법률 고지, 공공기관/제휴기관 공식 페이지 등 단순 정보 확인용 외부 링크
- 외부 이미지 (`<img src="https://...">`)
- 참고: https://developers-apps-in-toss.toss.im/intro/guide.html

---
> 검증: 2026-06-07 공홈 대조 [일치: 토스 내비게이션 바 뒤로가기 제공·자체 구현 버튼 중복 금지, 라이트 모드 구현, 자사 앱 설치 유도 금지, 법률 고지·공공기관 외부 링크만 허용 — 근거: https://developers-apps-in-toss.toss.im/checklist/app-nongame.html, intro/guide.html | 공홈 미검증: Category/Result/Calculator 페이지 헤더 규칙·Asset.Icon 토글·"계산기" 단어 제외 등은 프로젝트 고유 컨벤션으로 공홈 출처 없음]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
