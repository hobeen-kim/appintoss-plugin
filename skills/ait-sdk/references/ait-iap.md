# IAP (인앱결제)

```tsx
import { IAP } from '@apps-in-toss/web-framework';
```

## 설명
앱인토스 인앱결제 API. 1회성 결제를 지원합니다. 정기 결제는 별도 `subscription` API 참고.

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
> 검증: 2026-06-07 공홈 대조 [갱신됨: createSubscriptionPurchaseOrder는 IAP 객체에 없음(정기결제는 subscription API)으로 제거 / createOneTimePurchaseOrder 파라미터 구조를 {options:{sku, processProductGrant}, onEvent, onError}로 수정 / getProductItemList·getPendingOrders·getCompletedOrRefundedOrders 반환을 `| undefined`로, getCompletedOrRefundedOrders에 key 페이지네이션 파라미터 추가 / 반환 타입·인터페이스 필드 공홈 일치] 근거: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱%20결제/IAP.html
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
