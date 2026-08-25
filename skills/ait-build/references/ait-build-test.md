# 테스트

## 1. 로컬 브라우저 테스트 — AIT Devtools (SDK 3.x 표준)

SDK 3.x부터 **샌드박스 앱 설치·로그인 없이** 로컬 브라우저에서 바로 테스트한다.

```bash
npm run dev
# 출력된 localhost 링크를 브라우저로 연다
```

우측 하단에 **AIT Devtools** 패널이 보이면 정상이다. 이 패널에서 SDK 기능(IAP 상품 카탈로그·구독 mock, 화면 꺼짐 방지, 액세서리 버튼 이벤트 등)을 mock으로 테스트할 수 있다.

- 3.x 스캐폴드/`ait migrate v3` 프로젝트는 자동 설정된다.
- 3.0.1에서 올라온 프로젝트만 수동 설정: `npm i -D @apps-in-toss/devtools` → `vite.config.ts`에 `aitDevtools.vite()` 추가.

브라우저에서는 `TDSMobileProvider`(light mode)가 쓰인다.

## 2. 토스 앱 테스트 — 업로드 후 QR / 테스트 스킴

```bash
npm run build                       # tsc -b && vite build && ait build → {appName}.ait
npx ait deploy --api-key {API 키}   # 또는 콘솔에서 직접 업로드
```

업로드 후 콘솔의 '테스트하기' 버튼에서 QR 코드를 얻는다. QR 테스트 조건:

- 토스 앱에 로그인되어 있을 것
- 워크스페이스 멤버일 것
- **만 19세 이상**일 것

**검토 요청 전에 테스트를 최소 1회 완료해야 '검토 요청하기' 버튼이 활성화된다.**

### 테스트 스킴

출시 전에는 `intoss://`가 열리지 않는다. 업로드 때마다 발급되는 `_deploymentId`를 붙인 private 스킴을 쓴다.

```
intoss-private://{appName}?_deploymentId={업로드 시 발급된 UUID}
intoss-private://{appName}/path/sub?_deploymentId=...
intoss-private://{appName}?_deploymentId=...&queryParams={URL 인코딩된 JSON}
```

정식 출시 후에는 `intoss://{appName}/경로`를 쓴다. 공유 기능에는 `intoss-private://`를 넣으면 안 된다(검수 항목).

## 3. 실 환경에서 반드시 재확인할 항목

로컬·QR 테스트가 통과해도 실제 환경에서 깨질 수 있다.

- 메모리·리소스 사용량 (iOS 흰 화면의 주원인)
- **CORS**: 서버의 허용 Origin 목록 (아래)
- 권한 처리 / 로그인·세션 유지 / 실제 결제·인증

### CORS 허용 Origin

| SDK | 실 서비스 | QR 테스트 |
|---|---|---|
| 3.x (2026-08-25 이후 업로드 번들) | `https://<appName>.apps.tossmini.com` | `https://<appName>.private-apps.tossmini.com` |
| 3.x (그 이전 업로드 번들) | `https://<appName>.web.tossmini.com` | `https://<appName>.private-web.tossmini.com` |
| 1.x ~ 2.x | `https://<appName>.apps.tossmini.com` | `https://<appName>.private-apps.tossmini.com` |

전환 시점이 겹치는 기간에는 **네 개를 모두 허용**해 두는 편이 안전하다.

- 라이브 환경은 **HTTPS만** 허용된다(로컬에서 되던 HTTP API는 차단된다).
- iOS 13.4+는 서드파티 쿠키를 완전히 차단한다 — 쿠키 세션 대신 토큰 인증을 쓴다.

## TDSProvider 환경 분기

```tsx
const isAIT = typeof window !== 'undefined' && Boolean(
  navigator.userAgent.includes('AIT') ||
  navigator.userAgent.includes('tossapp') ||
  (window as unknown as Record<string, unknown>).__GRANITE__
);

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

---
> 검증: 2026-08-25 공홈 대조 [전면 개정: SDK 3.x AIT Devtools 로컬 테스트로 1순위 교체(샌드박스 앱 절차 제거), `web.host` 설정 삭제(3.x에 없음), QR 테스트 조건·`intoss-private://` 테스트 스킴·CORS Origin 표(2026-08-25 3.x Origin 전환)·HTTPS/서드파티 쿠키 주의 추가 | 공홈 미검증: TDSProvider 분기 코드는 프로젝트 컨벤션] 근거: https://developers-apps-in-toss.toss.im/guide/operation/toss , https://developers-apps-in-toss.toss.im/documentation/integration/server-api , https://developers-apps-in-toss.toss.im/documentation/integration/sdk-3.x
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
