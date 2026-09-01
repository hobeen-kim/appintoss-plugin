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

## 결제 전환 최적화 패턴 (웨비나 실측)

> 출처: 앱인토스 공식 웨비나 2026-08-21. API가 아니라 **BM 설계 관점**의 실사례다.

**전제 — 결제 최적화보다 이탈 개선이 먼저다.**
실측 사례에서 **결과 화면을 본 유저의 23%가 결제까지 전환**했다. 즉 결제 UI를 손대기 전에
**결과 화면까지 도달시키는 것**이 매출에 더 크게 기여한다(퍼널 개선은 `ait-analytics/references/growth-playbook.md` §4).

| 패턴 | 내용 | 효과 |
|---|---|---|
| **선택지 다양화** | 단일 가격만 제시하지 않는다 — **1개월 무료 체험 / 첫 결제 할인 / 재구독 할인** 을 함께 노출 | 심리적 허들 완화 |
| **부분 공개(티저)** | 결과가 100건이면 전부 보여주지 않고 **일부만 공개**, 나머지는 결제 후 열람 | 궁금증 → 결제 동기 |
| **단건 + 정기구독 병행 제시** | "한 번 더 들어올 것 같은데 그냥 구독할까?" 라는 멘탈 모델을 유도 | 객단가·LTV 상승 |
| **가격은 실험으로 정한다** | 2,000원으로 시작 → 피드백("2,000원은 절대 안 한다") → **990원**(세 자리 수)으로 낮춰 시장 검증 | 결제 저항 감소 |

- 구독 상품은 `getProductItemList`의 `renewalCycle`(WEEKLY/MONTHLY/YEARLY)로 단건과 함께 한 화면에 배치할 수 있다.
- **광고와 결제를 함께 쓸 때**: 결제 앞단에 광고를 두면 UX 훼손이 매출을 깎을 수 있다.
  광고 유형 선택 기준은 `ait-ads.md`「광고 유형 선택 — eCPM 실측 범위와 의사결정」 참조.

## 서버 웹훅 (구독 상태 변경) — 실측 기준

> 실측 출처: 운영 서버 수신 로그 2026-08-24~26. 공홈 요약만 보고 최상위 `status`를 읽으면 **모든 구독 웹훅이 미처리**된다.

### 페이로드 구조

```json
{
  "eventType": "subscription.status_changed",
  "occurredAt": "...",
  "orderId": "...",
  "sku": "...",
  "changeReason": "CREATED",
  "subscription": {
    "previous": { "...": "..." },
    "current": { "status": "ACTIVE", "accessGranted": true, "expiresAt": null, "autoRenew": true }
  },
  "eventVersion": "1.0"
}
```

- 상태는 최상위가 아니라 **`subscription.current.status`** 에 온다.
- 무슨 일이 있었는지의 판정 기준은 **`changeReason`** 이다 — `status`만으로는 해지를 구분할 수 없다(해지해도 ACTIVE 유지).

| changeReason | 의미 | `current` 값 | 서버 처리 |
|---|---|---|---|
| `CREATED` | 구독 시작 | status=ACTIVE, autoRenew=true, **expiresAt=null** | 이용권 부여. 초기 만료일은 **서버가 갱신 주기로 계산** |
| `RENEWED` | 자동갱신 결제 성공 | status=ACTIVE | 만료일 연장. **페이로드에 `expiresAt`이 오면 그 값을 우선**(결제 주기와 어긋나지 않게) |
| `AUTO_RENEW_DISABLED` | 사용자 해지 | **status는 ACTIVE 유지**, autoRenew=false | 이용권은 만료일까지 유지, 갱신 예정만 해제 |
| `EXPIRED` | 기간 만료 | accessGranted=false | 이용권 회수 |
| `REVOKED` | 환불 | accessGranted=false | 즉시 이용권 회수 |

- **`RENEWED` 미처리 = 실결제 사고**다. 자동갱신 결제는 되는데 이용권 만료일이 연장되지 않는다. `changeReason` 분기를 반드시 구현한다.
- 해지 웹훅은 앱스토어 해지 약 1분 뒤 도착(실측). `CREATED`·`AUTO_RENEW_DISABLED` 2종 페이로드 실측 확보.

### 웹훅 인증 헤더 — `Bearer {값}`

콘솔 웹훅 설정에 등록한 인증 값은 **`Authorization: Bearer {등록값}`** 형식으로 전송된다(실측 2026-08-24). 콘솔 UI가 "Basic Auth 값"으로 표기해도 전송 형식은 Bearer다 — Basic 가정으로 대조하면 콘솔 테스트 발송이 401로 떨어진다.

```python
raw = request.headers.get("authorization", "")
token = raw.removeprefix("Bearer ").removeprefix("Basic ").strip()   # raw/Basic/Bearer 3형식 수용
if token != WEBHOOK_SECRET:
    return Response(status_code=401)
```

## OS별 구독 해지·환불 경로

실측 2026-08-24~26. FAQ·설정 화면의 사용자 안내 문구는 **OS 분기가 필수**다.

| | 해지(자동갱신 취소) | 환불 |
|---|---|---|
| **iOS(애플 결제)** | **아이폰 설정 → Apple 계정 → 구독**. 토스 앱 내 "정기결제 관리"류 진입은 동작하지 않거나 안드로이드 전용 | **애플 전담**. 콘솔 **[환불 내역]에 표시되지 않는다** |
| **Android·토스 결제** | 토스 앱 구독 관리 | 콘솔 환불 승인/반려 플로우 대상 |

- 애플 환불은 요청과 승인이 분리되어 승인까지 **수 시간~1일 이상** 걸린다. 승인 지연 동안 서버·콘솔 어디에도 신호가 없고, 승인 시점에 `REVOKED` 웹훅이 도착한다.
- 콘솔 [환불 내역]은 안드로이드·토스 결제 건 전용 — 애플 건을 여기서 찾으면 안 된다.
- iOS 사용자에게 "토스 앱에서 해지하세요"라고 안내하면 **틀린 안내**다.

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
> 갱신: 2026-08-28 — 서버 웹훅(구독 상태 변경) 페이로드 구조·`changeReason` 판정표·웹훅 인증 헤더(Bearer)·OS별 해지/환불 경로 추가. 근거: 운영 서버 수신 로그 실측 2026-08-24~26 (이슈 #8·#9·#10).
