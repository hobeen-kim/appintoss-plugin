---
name: ait-promotion-reward
description: 앱인토스 프로모션/리워드 시스템 구현 가이드. 출석 보상, 공유 리워드, 미션, 인앱결제. 사용자가 프로모션, 리워드, 보상, 출석 체크, 포인트, 미션, 인앱결제, IAP, 공유 보상 등을 언급하면 이 스킬을 사용한다.
---

# 프로모션/리워드 시스템 가이드

## 시나리오 템플릿 6종

### 1. 출석 리워드
```
매일 출석 → 연속 출석 보너스 → 리텐션 유지

구현:
- 스토리지: getStorageItem/setStorageItem으로 출석 기록
- UI: ProgressStepper(연속일수) + Result(보상 확인)
- 보상: 보상형 광고 시청권, 추가 기능 해금
```

### 2. 복권/추첨
```
행동 완료 → 추첨 기회 획득 → 결과 확인

구현:
- 조건: 특정 행동(광고 시청, 공유 등) 완료 시 추첨권 지급
- UI: BottomSheet(추첨 애니메이션) + Result(당첨 결과)
- 주의: 사행성 요소 금지! 실제 금전적 가치 보상 불가
```

### 3. 마일스톤 달성
```
사용량 누적 → 마일스톤 달성 → 보상 해금

구현:
- 추적: 사용 횟수, 연속 일수 등 스토리지 저장
- UI: ProgressBar(진행률) + Badge(달성 표시)
- 보상: 숨겨진 기능 해금, 커스텀 테마
```

### 4. 바이럴 공유
```
공유 → 친구 유입 → 양쪽 보상

구현 (getTossShareLink + share):
```
```tsx
import { getTossShareLink, share } from '@apps-in-toss/web-framework';

const handleShare = async () => {
  const link = await getTossShareLink('intoss://앱이름/초대');
  await share({ message: link });
};
```
```
- 추적: 공유 횟수 스토리지 저장
- 보상: 공유자 → 추가 기능, 피공유자 → 웰컴 보너스
```

### 5. 미션 시스템
```
일일/주간 미션 → 완료 → 보상 수령

구현:
- 미션 목록: ListRow + Checkbox(완료 여부)
- 보상: 보상형 광고 시청 없이 추가 기능 사용
- 리셋: 일일 미션은 자정 리셋 (스토리지 날짜 비교)
```

### 6. 온보딩 코치
```
첫 사용 → 단계별 가이드 → 완료 보상

구현: ait-coachmark 스킬 참조
- 온보딩 완료 시 보너스 기능 해금
```

## 인앱결제 (IAP) 연동

### 필수 API

```tsx
import { IAP } from '@apps-in-toss/web-framework';

// 1. 상품 목록 조회
const { products } = await IAP.getProductItemList();
// products: [{ sku, displayName, displayAmount, iconUrl, description }]

// 2. 구매
const cleanup = IAP.createOneTimePurchaseOrder({
  options: {
    sku: '상품SKU',
    processProductGrant: ({ orderId }) => {
      // 상품 지급 로직 (서버 API 호출 등)
      return true; // 지급 성공
    },
  },
  onEvent: (event) => { /* 구매 완료 */ cleanup(); },
  onError: (error) => { /* 구매 실패 */ cleanup(); },
});

// 3. 미처리 주문 확인 (앱 시작 시)
const { orders } = await IAP.getPendingOrders();
for (const order of orders) {
  // 미지급 상품 지급 처리
  await IAP.completeProductGrant({ params: { orderId: order.orderId } });
}
```

### IAP 주의사항
- 샌드박스에서 테스트 불가 — 토스 앱에서 실제 결제 발생
- `processProductGrant`에서 반드시 서버에 지급 기록
- 앱 시작 시 `getPendingOrders()`로 미처리 주문 확인 필수

## 수익화 구현 권장 순서

```
1. 보상형 광고 (가장 쉬움, 서버 불필요)
   ↓
2. 공유 리워드 (바이럴 + 유저 유입)
   ↓
3. 프로모션 (토스 포인트 직접 지급 — 사업자 등록 필요)
   ↓
4. 인앱결제 (가장 복잡, 서버 필수)
```

## 부정행위 방지

- 보상형 광고: `userEarnedReward`에서만 보상 (클릭/닫기 시 미지급)
- 출석 체크: 서버 시간 기준 (클라이언트 시간 조작 방지)
- 공유: 실제 공유 완료 확인 후 보상 (share 함수 resolve 후)
- 미션: 서버 검증 가능하면 서버에서 완료 확인

## 문서 신선도

번들 문서가 stale일 수 있다. API·정책·규격이 불확실하면 공홈 조회를 우선하라: https://developers-apps-in-toss.toss.im/
