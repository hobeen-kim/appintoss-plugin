# 토스 앱 테스트

## 브라우저 테스트

```bash
npm run dev
# http://localhost:5173 접속
```

브라우저에서는 `TDSMobileProvider`가 사용됩니다 (light mode).

## 모바일 기기 테스트 (같은 네트워크)

1. `npm run dev` 실행
2. 같은 네트워크의 모바일 기기에서 `http://{본인IP}:5173` 접속
3. `granite.config.ts`의 `web.host`를 본인 IP로 설정

```typescript
web: {
  host: '192.168.x.x',  // 본인 IP로 변경
  port: 5173,
  // ...
}
```

## AIT 번들 테스트 (토스 개발자 도구)

1. `npx ait build` → `.ait` 파일 생성
2. `.ait` 파일을 토스 개발자 도구로 업로드
3. 토스 앱에서 미니앱으로 실행

## TDSProvider 환경 분기

```tsx
// AIT 환경 감지
const isAIT = typeof window !== 'undefined' && Boolean(
  navigator.userAgent.includes('AIT') ||
  navigator.userAgent.includes('tossapp') ||
  (window as unknown as Record<string, unknown>).__GRANITE__
);

// Provider 분기
{isAIT ? (
  <TDSMobileAITProvider>
    <App />
  </TDSMobileAITProvider>
) : (
  <TDSMobileProvider appearance="light">
    <App />
  </TDSMobileProvider>
)}
```

## 개발 서버 포트

| 용도 | 포트 | 명령 |
|------|------|------|
| 기본 개발 | 5173 | `npm run dev` |
| 미리보기 | 5175 | `npm run dev -- --port 5175` |

---
> 검증: 2026-06-07 공홈 대조 [일치: granite build → .ait 업로드 흐름은 공홈 출시 절차와 일치 — 근거: https://developers-apps-in-toss.toss.im/development/deploy.html | 공홈 미검증: TDSMobileAITProvider/TDSMobileProvider 분기 코드와 AIT userAgent 감지 로직은 프로젝트 컨벤션으로 공홈 단일 출처 없음. 실 서비스 도메인은 https://<appName>.apps.tossmini.com, QR 테스트는 https://<appName>.private-apps.tossmini.com]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
