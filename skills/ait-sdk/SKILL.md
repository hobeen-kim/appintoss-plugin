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
---

# 앱인토스 SDK 가이드

`@apps-in-toss/web-framework`는 앱인토스 미니앱 개발을 위한 프레임워크입니다.
내부적으로 `@apps-in-toss/web-bridge`(네이티브 브릿지)와 `@apps-in-toss/web-analytics`(분석)를 re-export합니다.

## 패키지 (v1.14.1)
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
| 설정 | `defineConfig` | granite.config.ts 앱 설정 |
| 저장소 | `Storage` | 네이티브 로컬 저장소 (Promise 기반) |
| 이벤트 | `graniteEvent`, `tdsEvent` | 백/홈 버튼, 네비게이션 이벤트 |
| 권한 | `fetchAlbumPhotos`, `openCamera` 등 | 카메라, 앨범, 위치, 연락처, 클립보드 |
| Safe Area | `SafeAreaInsets` | 디바이스 안전 영역 정보 |
| 인앱결제 | `IAP` | 1회성/구독 결제 |
| 광고 | `GoogleAdMob`, `TossAds` | AdMob 리워드 광고, 토스 광고 |
| 파트너 | `partner` | 네비게이션 악세서리 버튼 |
| 환경 | `env`, `getAppsInTossGlobals` | 배포 ID, 버전 체크 |

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

## 문서 신선도

번들 문서가 stale일 수 있다. API·정책·규격이 불확실하면 공홈 조회를 우선하라: https://developers-apps-in-toss.toss.im/
