# TDS Provider 설정

## 패키지
- `@toss/tds-mobile` → `TDSMobileProvider` (브라우저 개발용)
- `@toss/tds-mobile-ait` → `TDSMobileAITProvider` (앱인토스 환경)

## 설치

```bash
npm install @toss/tds-mobile @toss/tds-mobile-ait @emotion/react@^11
```

## 사용법

```tsx
import { TDSMobileProvider } from '@toss/tds-mobile';
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';

const isAIT = typeof window !== 'undefined' && Boolean(
  navigator.userAgent.includes('AIT') ||
  navigator.userAgent.includes('tossapp') ||
  (window as unknown as Record<string, unknown>).__GRANITE__
);

function TDSProvider({ children }: { children: React.ReactNode }) {
  if (isAIT) {
    return <TDSMobileAITProvider>{children}</TDSMobileAITProvider>;
  }
  return (
    <TDSMobileProvider
      userAgent={{ colorPreference: 'light', fontScale: 100, fontA11y: undefined, isAndroid: false, isIOS: false }}
      token={{ color: { primary: '#3182f6' } }}
    >
      {children}
    </TDSMobileProvider>
  );
}
```

## TDSMobileProvider Props
- `userAgent`: `{ colorPreference: 'light'|'dark', fontScale: number, fontA11y: undefined, isAndroid: boolean, isIOS: boolean }`
- `token`: `{ color: { primary: string } }` - 브랜드 컬러 설정

## 참고
- 앱 최상위에서 한 번만 감싸면 됨
- AIT 환경에서는 `TDSMobileAITProvider`가 자동으로 토스앱 환경에 맞춤

---
> 검증: 2026-06-07 공홈 대조 [일치: @toss/tds-mobile-ait → TDSMobileAITProvider, 신규 스코프 @toss/tds-* 확인(구 @toss-design-system/* 폐기) | 공홈 미검증: TDSMobileProvider userAgent/token props 세부·@emotion/react 정확 버전(설치 가이드 페이지 404)]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
