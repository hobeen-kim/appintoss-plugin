# 환경 정보 (env, globals)

```tsx
import { env, getAppsInTossGlobals, isMinVersionSupported, getServerTime } from '@apps-in-toss/web-framework';
```

## 배포 ID (공홈 미검증)
> 공홈 reference에서 확인 불가. 사용 전 확인 권장.
```typescript
env.getDeploymentId(): string;
```

## 앱인토스 전역 정보 (공홈 미검증)
> 공홈 reference에서 확인 불가. 사용 전 확인 권장.
```typescript
getAppsInTossGlobals(): AppsInTossGlobals;
```

## 최소 버전 확인
특정 API가 지원되는 앱 버전인지 확인합니다.

```typescript
isMinVersionSupported(minVersions: {
  android: string;
  ios: string;
}): boolean;
```

## 서버 시간
```typescript
getServerTime(): Promise<number | undefined>;
getServerTime.isSupported(): boolean;
```

## test vs prod 구분 — 런타임 플래그 없음

.ait 번들에는 test/prod 자동 스위치·런타임 `isTest` 플래그가 **없다**. SDK(`env`, `isMinVersionSupported`, `getServerTime`, AIT 휴리스틱)는 환경 감지 용도로만 사용하며, test/prod 분기 목적으로 설계되지 않았다.

test와 prod의 차이는 **config 상수 값**으로만 구분한다:

| 구분 | test 값 | prod 값 |
|------|---------|---------|
| 광고 그룹 ID | `ait-ad-test-*` (예: `ait-ad-test-banner-id`) | 콘솔 발급 운영 ID |
| 프로모션 코드 | `TEST_{code}` (포인트 차감·지급 없음) | 콘솔 발급 코드 그대로 |
| 토스페이 | `isTestPayment: true` | `isTestPayment: false` |

**전환 방법**: config 상수 파일의 값을 스왑한 뒤 **재빌드·재업로드**(테스트 번들 ≠ 출시 번들). 스왑 후 한 번 더 테스트 권장. 광고 ID 스왑·재빌드·재배포는 `ait-console ad-id-watch`가 자동화.

> 출처/검증: 공식 SDK reference에 isTest 런타임 플래그 미존재 확인(2026-06-11 llms.txt 대조). 테스트 ID는 ait-ads.md, TEST_ 컨벤션은 ait-promotion-reward SKILL.md 참조.

## AIT 환경 감지 패턴
```typescript
const isAIT = typeof window !== 'undefined' && Boolean(
  navigator.userAgent.includes('AIT') ||
  navigator.userAgent.includes('tossapp') ||
  (window as unknown as Record<string, unknown>).__GRANITE__
);
```

## 사용 예시

```tsx
import { isMinVersionSupported, getServerTime } from '@apps-in-toss/web-framework';

// 버전별 기능 분기
if (isMinVersionSupported({ android: '5.231.0', ios: '5.231.0' })) {
  // 새로운 API 사용
} else {
  // 폴백 처리
}

// 서버 시간 사용
if (getServerTime.isSupported()) {
  const serverTime = await getServerTime();
}
```

---
> 검증: 2026-06-07 공홈 대조 [일치: getServerTime(): Promise<number | undefined> + getServerTime.isSupported(), isMinVersionSupported(앱 최소 버전 확인) 모두 공홈 reference 존재·일치] [공홈 미검증: env.getDeploymentId, getAppsInTossGlobals는 공홈 reference에서 확인 불가(env.html은 React Native plugin-env용 별개 문서). AIT 환경 감지 패턴은 공식 API가 아닌 휴리스틱] 근거: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/환경%20확인/getServerTime.html , .../시작하기/overview.html
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
