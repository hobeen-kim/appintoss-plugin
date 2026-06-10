# TossPay (토스페이 결제)

```tsx
import { checkoutPayment } from '@apps-in-toss/web-framework';
// React Native: import { TossPay } from '@apps-in-toss/framework'; → TossPay.checkoutPayment(...)
```

## 설명
토스페이 결제창을 띄워 사용자 인증을 수행하는 API. **결제창은 인증만 수행하며, 실제 결제 승인·취소는 서버 API로 별도 처리해야 합니다.**

## 메서드

### TossPay.checkoutPayment — 결제창 띄우기 (사용자 인증)
> 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/토스페이/TossPay.md , …/checkoutPayment.md
```typescript
function checkoutPayment(options: CheckoutPaymentOptions): Promise<CheckoutPaymentResult>;
```

### CheckoutPaymentOptions
> 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/토스페이/CheckoutPaymentOptions.md
```typescript
interface CheckoutPaymentOptions {
  payToken: string; // 결제 생성(make-payment) 서버 API에서 받은 결제 토큰
}
```

### CheckoutPaymentResult
> 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/토스페이/CheckoutPaymentResult.md
```typescript
interface CheckoutPaymentResult {
  success: boolean; // 사용자가 결제창에서 인증을 성공했는지 여부
  reason?: string;  // 인증 실패 시 사유 (선택)
}
```

## 사용 예시

```tsx
import { checkoutPayment } from '@apps-in-toss/web-framework';

async function handlePayment() {
  // 1. 서버에서 결제 생성 → payToken 수령
  const { payToken } = await fetch('/my-api/payment/create').then((res) => res.json());

  // 2. 클라이언트에서 결제창 인증
  const { success, reason } = await checkoutPayment({ payToken });

  // 3. 인증 성공 시 서버에서 결제 승인(execute) 처리
  if (success) {
    await fetch('/my-api/payment/execute', {
      method: 'POST',
      body: JSON.stringify({ payToken }),
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

## 개발 가이드 요약 (서버 연동)
> 출처: https://developers-apps-in-toss.toss.im/tosspay/develop.md

결제 흐름 3단계: **① 결제 생성(서버) → ② 결제창 인증(클라이언트, checkoutPayment) → ③ 결제 승인(서버)**

서버 API (base: `https://pay-apps-in-toss-api.toss.im`, 헤더 `x-toss-user-key` 필수):

| 엔드포인트 | 용도 |
|---|---|
| `POST /api-partner/v1/apps-in-toss/pay/make-payment` | 결제 생성, `payToken` 수령 |
| `POST /api-partner/v1/apps-in-toss/pay/execute-payment` | 인증 완료된 결제 승인 |
| `POST /api-partner/v1/apps-in-toss/pay/refund-payment` | 환불 |
| `POST /api-partner/v1/apps-in-toss/pay/get-payment-status` | 결제 상태·이력 조회 |

- `orderNo`: 가맹점별 유일해야 함 (영숫자 + `_-:.^@`, 최대 50자)
- 테스트 결제는 `isTestPayment: true` — `payToken` 발급 환경과 일치해야 함

## 자동결제(auto-pay) 요약
> 출처: https://developers-apps-in-toss.toss.im/tosspay/auto-pay.md

흐름: **빌링키 생성 → 사용자 인증 → 결제 실행 → (선택) 해지**

서버 API (base: `https://apps-in-toss-api.toss.im`, mTLS + userKey 인증):

| 엔드포인트 | 용도 |
|---|---|
| `POST /api-partner/v1/apps-in-toss/pay/create-billing-key` | 빌링키 생성 (`productDesc`, `isTestPayment`) → `wrappedToken` 수령 |
| `POST /api-partner/v1/apps-in-toss/pay/execute-billing` | 자동결제 실행 (`wrappedToken`, `orderNo`, `productDesc`, `amount`, `spreadOut` 등) |
| `POST /api-partner/v1/apps-in-toss/pay/get-billing-key-status` | 빌링키 상태 조회 |
| `POST /api-partner/v1/apps-in-toss/pay/remove-billing-key` | 빌링키 해지 |

- 클라이언트 인증: `TossPay.requestTossPayPaysBilling({ wrappedToken })` — SDK 5.256.0+ (Android/iOS) 필요
- `wrappedToken`은 이후 모든 호출에 필요하므로 반드시 보관
- 자동결제는 별도 가맹점 키 발급·약정 가입 필수

## 주의사항
- `checkoutPayment`는 **인증만** 수행 — 인증 성공 후 서버에서 `execute-payment`를 호출해야 실제 결제됨
- 현금영수증 설정은 결제 생성 시에만 가능, 이후 수정 불가
- 동일 `orderNo`는 최초 인증 이후 중복 사용 불가, 2년간 재사용 불가
- 샌드박스에서 발급된 토큰은 라이브 환경에서 사용 불가

## 출처
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/토스페이/TossPay.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/토스페이/checkoutPayment.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/토스페이/CheckoutPaymentOptions.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/토스페이/CheckoutPaymentResult.md
- https://developers-apps-in-toss.toss.im/tosspay/develop.md
- https://developers-apps-in-toss.toss.im/tosspay/auto-pay.md

---
> 검증: 2026-06-10 공홈 대조 [checkoutPayment 시그니처·CheckoutPaymentOptions/Result 필드·서버 API 엔드포인트·자동결제 흐름 모두 공홈 fetch 확인]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
