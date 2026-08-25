---
name: ait-sdk
description: 앱인토스 SDK(@apps-in-toss/web-framework) API 사용법 가이드. 네이티브 브릿지, 저장소, 권한, 광고, 이벤트 등.
trigger: 앱인토스 SDK API 사용, 네이티브 기능 연동, Storage/IAP/광고/권한 구현 시 트리거
references:
  - ./references/ait-config.md
  - ./references/ait-storage.md
  - ./references/ait-events.md
  - ./references/ait-permissions.md
  - ./references/ait-safe-area.md
  - ./references/ait-iap.md
  - ./references/ait-ads.md
  - ./references/ait-partner.md
  - ./references/ait-env.md
  - ./references/ait-share.md
  - ./references/ait-tosspay.md
  - ./references/ait-screen-control.md
  - ./references/ait-navigation.md
  - ./references/ait-interaction.md
  - ./references/ait-data-file.md
  - ./references/ait-contacts-viral.md
---

# 앱인토스 SDK 가이드

`@apps-in-toss/web-framework`는 앱인토스 미니앱 개발을 위한 프레임워크입니다.
내부적으로 `@apps-in-toss/web-bridge`(네이티브 브릿지)와 `@apps-in-toss/web-analytics`(분석)를 re-export합니다.

## 패키지 (v2.6.1, 2026-05-27 발행)
- `@apps-in-toss/web-framework` - 메인 프레임워크 (web-bridge + web-analytics)
- `@apps-in-toss/web-bridge` - 네이티브 브릿지 API
- `@apps-in-toss/web-analytics` - 분석 API
- `@apps-in-toss/bridge-core` - 브릿지 핵심 유틸리티
- `@apps-in-toss/types` - 타입 정의
- `@apps-in-toss/plugins` - 빌드 플러그인
- `@apps-in-toss/cli` - CLI 도구 (granite)

## API 카테고리

| 카테고리 | 모듈 | 설명 |
|---------|------|------|
| 설정 | `defineConfig` | apps-in-toss.config.ts 앱 설정 (2.x: granite.config.ts) |
| 저장소 | `Storage` | 네이티브 로컬 저장소 (Promise 기반) |
| 이벤트 | `graniteEvent`, `tdsEvent` | 백/홈 버튼, 네비게이션 이벤트 |
| 권한 | `fetchAlbumPhotos`, `openCamera` 등 | 카메라, 앨범, 위치, 연락처, 클립보드 |
| Safe Area | `SafeAreaInsets` | 디바이스 안전 영역 정보 |
| 인앱결제 | `IAP` | 1회성 결제. 구독(`subscription`·`getSubscriptionInfo`, 2.2.0)은 미수록 — 공홈 조회 |
| 광고 | `GoogleAdMob`, `TossAds` | AdMob 리워드 광고, 토스 광고 |
| 파트너 | `partner` | 네비게이션 악세서리 버튼 |
| 환경 | `env`, `getAppsInTossGlobals` | 배포 ID, 버전 체크 |
| 공유 | `share`, `getTossShareLink` | 네이티브 공유 시트, 토스 공유 링크 |
| 토스페이 | `TossPay.checkoutPayment` | 토스페이 결제창, 자동결제 |
| 화면 제어 | `setDeviceOrientation`, `setScreenAwakeMode`, `setSecureScreen`, `closeView` 등 | 화면 방향, 꺼짐 방지, 캡처 방지, 뷰 닫기 |
| 화면 이동 | `openURL`, Routing | 외부 URL, 화면 간 이동, 외부링크 정책 |
| 인터랙션 | `generateHapticFeedback`, `requestReview`, `requestNotificationAgreement` | 햅틱, 리뷰 요청, 알림 수신 동의 |
| 데이터/파일 | `saveBase64Data`, `openPDFViewer`, `fetchAlbumItems` | 파일 저장, PDF 뷰어, 앨범 |
| 친구초대 | `contactsViral` | 연락처 기반 친구초대 모듈, 공유 리워드 |

## 미수록 영역 (존재하나 미수록 — 필요 시 공홈 조회)

다음 API는 공홈에 존재하지만 본 스킬 reference에는 미수록이다. 필요하면 공홈을 조회하라.

- 네트워크: `getNetworkStatus`, `http`
- 환경확인 확장: `getTossAppVersion`, `getPlatformOS`, `getDeviceId`, `getSchemeUri`, `getOperationalEnvironment`, `getLocale`
- 가시성 감지: `InView`, `ImpressionArea`, `useVisibility` 등
- 토스 인증: `tosscert`
- 비게임 식별키: `getAnonymousKey`

## 존재하지 않는 기능 (확정)

QR 스캐너·생체인증·블루투스/NFC·클라이언트 푸시 발송 SDK는 공홈에 존재하지 않음(2026-06-10 llms.txt 전수 대조). 푸시 발송은 서버 Smart Message API(ait-smart-message 스킬), 클라이언트는 `requestNotificationAgreement`(수신 동의)만.

## 공통 패턴

### 기능 지원 확인
```typescript
if (GoogleAdMob.loadAppsInTossAdMob.isSupported()) {
  // 기능 사용
}
```

### 이벤트 구독 & 정리
```typescript
useEffect(() => {
  const cleanup = graniteEvent.addEventListener('backEvent', {
    onEvent: () => { /* 처리 */ },
    onError: (error) => { /* 에러 */ },
  });
  return cleanup; // 컴포넌트 언마운트 시 정리
}, []);
```

### AIT 환경 감지
```typescript
const isAIT = typeof window !== 'undefined' && Boolean(
  navigator.userAgent.includes('AIT') ||
  navigator.userAgent.includes('tossapp') ||
  (window as unknown as Record<string, unknown>).__GRANITE__
);
```

## SDK 버전 (2026-08-25 실측)

| 패키지 | latest | beta |
|---|---|---|
| `@apps-in-toss/web-framework` · `@apps-in-toss/cli` | **3.1.1** | 3.1.0-beta.1 |
| `@apps-in-toss/framework` (React Native) | 2.10.10 | 2.11.0-beta.1 |
| `@toss/tds-mobile` · `@toss/tds-mobile-ait` | **2.5.1** | — |

3.0.0 정식은 2026-07-31 릴리스됐다. 3.x는 **breaking change**다 — `granite.config.ts`→`apps-in-toss.config.ts`, brand에서 displayName/icon 제거, `webViewProps`→`webView`(type 삭제), `outdir`→`webBundleDir`, `web` 블록 삭제(→ package.json scripts). 상세와 마이그레이션 절차는 `references/ait-config.md` 참조.

**신규 프로젝트는 3.x 기준으로 만든다.** 2.x 프로젝트는 `npx ait migrate v3`로 전환하되, 3.x 출시 후에는 2.x로 롤백할 수 없고 `localStorage` 직접 사용 앱은 데이터 접근이 끊기므로 먼저 확인한다.

버전 확인: `npm view @apps-in-toss/web-framework dist-tags`

## 문서 신선도

기준일: 2026-06-10. 번들 문서가 stale일 수 있다. API·정책·규격이 불확실하면 공홈 조회를 우선하라: https://developers-apps-in-toss.toss.im/
