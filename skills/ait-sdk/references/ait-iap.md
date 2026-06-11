# IAP (인앱결제)

```tsx
import { IAP } from '@apps-in-toss/web-framework';
```

## 설명
앱인토스 인앱결제 API. 1회성 결제를 지원합니다. 정기 결제는 아래 [정기결제(구독)](#정기결제구독) 절 참고.

## 메서드

### 상품 목록 조회
```typescript
IAP.getProductItemList(): Promise<{ products: IapProductListItem[] } | undefined>;

interface IapProductListItem {
  sku: string;
  displayAmount: string;
  displayName: string;
  iconUrl: string;
  description: string;
}
```

### 1회성 결제
```typescript
IAP.createOneTimePurchaseOrder(params: IapCreateOneTimePurchaseOrderOptions): () => void;

interface IapCreateOneTimePurchaseOrderOptions {
  options: {
    sku: string;
    // 결제 성공 시 실행되는 상품 지급 로직 (SDK 1.1.3+)
    processProductGrant: (params: { orderId: string }) => boolean | Promise<boolean>;
  };
  onEvent: (event: { type: 'success' }) => void | Promise<void>;
  onError: (error: unknown) => void | Promise<void>;
}
```

### 미완료 주문 조회
```typescript
IAP.getPendingOrders(): Promise<{
  orders: Array<{
    orderId: string;
    sku: string;
    paymentCompletedDate?: string;
  }>;
} | undefined>;
```

### 완료/환불 주문 조회
```typescript
IAP.getCompletedOrRefundedOrders(params?: {
  key?: string | null;
}): Promise<CompletedOrRefundedOrdersResult | undefined>;

interface CompletedOrRefundedOrdersResult {
  hasNext: boolean;
  nextKey?: string | null;
  orders: Array<{
    orderId: string;
    sku: string;
    status: 'COMPLETED' | 'REFUNDED';
    date: string;
  }>;
}
```

### 상품 지급 완료 처리
```typescript
IAP.completeProductGrant(params: {
  params: { orderId: string };
}): Promise<boolean | undefined>;
```

## 정기결제(구독)

구독 기능은 2026-05-14 정식 출시되었습니다. 공홈 레퍼런스: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱%20결제/subscription.html

> 최소 지원 버전: 안드로이드 토스앱 v5.253.0, iOS 토스앱 v5.250.0 이상. 샌드박스 테스트 현재 미지원.

### 구독 상품 조회 (getProductItemList — 구독 추가 필드)

기존 `IAP.getProductItemList()` 반환값에 구독 상품 전용 필드가 추가됩니다.

```typescript
interface IapProductListItem {
  // ...기존 필드 동일...
  type?: 'SUBSCRIPTION';                              // 구독 상품인 경우
  renewalCycle?: 'WEEKLY' | 'MONTHLY' | 'YEARLY';    // 구독 갱신 주기
  offers?: Offer[];                                   // 무료체험·신규할인·복귀할인 오퍼
}
```

### 구독 결제 요청

```typescript
IAP.createSubscriptionPurchaseOrder(
  params: CreateSubscriptionPurchaseOrderOptions
): () => void;

interface CreateSubscriptionPurchaseOrderOptions {
  options: {
    sku: string;           // 필수: 구독 상품 SKU
    offerId?: string | null; // 선택: 오퍼 ID (무료체험 등)
    // 결제 성공 시 실행되는 상품 지급 로직
    processProductGrant: (params: {
      orderId: string;
      subscriptionId?: string;
    }) => boolean | Promise<boolean>;
  };
  onEvent: (event: SubscriptionSuccessEvent) => void | Promise<void>;
  onError: (error: unknown) => void | Promise<void>;
}
```

반환값은 정리(cleanup) 함수이며, 컴포넌트 언마운트 시 호출합니다.

### 구독 상태 조회

```typescript
IAP.getSubscriptionInfo(params: {
  params: { orderId: string };
}): Promise<{ subscription: IapSubscriptionInfoResult } | undefined>;

interface IapSubscriptionInfoResult {
  catalogId: number;
  status: 'ACTIVE' | 'EXPIRED' | 'IN_GRACE_PERIOD' | 'ON_HOLD' | 'PAUSED' | 'REVOKED';
  expiresAt: string | null;
  isAutoRenew: boolean;
  gracePeriodExpiresAt: string | null;
  isAccessible: boolean;  // 콘텐츠 접근 허용 여부
}
```

---

> **수수료 안내:** IAP 수수료 무료 프로모션 2026-06-30까지(이후 정책 공지 확인, 출처: https://toss.im/apps-in-toss/blog/update-26-3-5 )

## 알려진 이슈·복구 패턴

### 구독 콜백 미호출 버그 — SDK 2.6.2 미만에서 발생, 2.6.2에서 수정 (공식 공지)

> 출처: 공식 공지 (https://techchat-apps-in-toss.toss.im/t/sdk-2-6-2/4071 ).
> techchat 4071은 공식 공지이며, 2.6.2 미만에서 발생한 버그가 2.6.2에서 수정되었음을 확인. 2.6.2 이상으로 업그레이드하여 해결할 것.

`IAP.createSubscriptionPurchaseOrder` 호출 후 결제가 완료되었음에도 `processProductGrant`가 호출되지 않는 버그가 SDK 2.6.2 미만 버전에서 발생하였으며, SDK 2.6.2에서 수정되었습니다.

**복구 패턴 — 앱 시작 시 미완료 구독 주문 재처리:**

```typescript
// 앱 초기화 시점(또는 포그라운드 복귀 시) 실행
async function recoverPendingSubscriptions() {
  const result = await IAP.getPendingOrders();
  if (!result) return;

  for (const order of result.orders) {
    // 서버에 지급 완료 여부 확인 후, 미지급이면 서버 지급 처리
    const granted = await verifyAndGrantOnServer(order.orderId);
    if (granted) {
      await IAP.completeProductGrant({ params: { orderId: order.orderId } });
    }
  }
}
```

이 패턴은 구독/1회성 결제 모두에 적용 가능하며, SDK 버전과 무관하게 안전망으로 유지하는 것이 권장됩니다.

---

## 사용 예시

```tsx
import { IAP } from '@apps-in-toss/web-framework';

// 상품 목록 조회
const { products } = await IAP.getProductItemList();

// 1회성 결제
const cleanup = IAP.createOneTimePurchaseOrder({
  options: {
    sku: 'premium_calculator',
    // 결제 성공 시 호출 → 서버 검증 후 지급 성공 여부 반환
    processProductGrant: async ({ orderId }) => {
      await verifyPurchase(orderId);
      return true; // 지급 성공
    },
  },
  onEvent: (event) => {
    if (event.type === 'success') {
      // 지급까지 정상 완료
    }
  },
  onError: (error) => {
    // 결제/지급 실패 처리 (예: PRODUCT_NOT_GRANTED_BY_PARTNER)
  },
});

// 미완료 주문 복구
const { orders } = await IAP.getPendingOrders();
for (const order of orders) {
  await IAP.completeProductGrant({ params: { orderId: order.orderId } });
}
```

---
> 검증: 2026-06-11 공홈 대조 [갱신됨: 2026-06-07 당시 제거했던 구독 API를 subscription.html 공홈 확인으로 재문서화 / createOneTimePurchaseOrder 파라미터 구조를 {options:{sku, processProductGrant}, onEvent, onError}로 수정 / getProductItemList·getPendingOrders·getCompletedOrRefundedOrders 반환을 `| undefined`로, getCompletedOrRefundedOrders에 key 페이지네이션 파라미터 추가 / 반환 타입·인터페이스 필드 공홈 일치 / 정기결제(구독) 절 신설(subscription.html 대조) / 알려진 이슈·복구 패턴 절 추가] 근거: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱%20결제/IAP.html , https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱%20결제/subscription.html
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
