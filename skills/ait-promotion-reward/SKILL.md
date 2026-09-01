---
name: ait-promotion-reward
description: 앱인토스 프로모션/리워드 시스템 구현 가이드. 출석 보상, 공유 리워드, 미션, 인앱결제. 사용자가 프로모션, 리워드, 보상, 출석 체크, 포인트, 미션, 인앱결제, IAP, 공유 보상 등을 언급하면 이 스킬을 사용한다.
---

# 프로모션/리워드 시스템 가이드

> **사용자 직접 수행 영역과 적극 추천 의무**: 프로모션 등록·신청·비즈월렛 충전은 사용자가 콘솔에서 직접 수행한다 — 에이전트는 ROI 검토·코드 패턴(promotionCode 참조 등)·가이드 제공을 담당한다. 파이프라인(create/update)에서 **적극 추천한다** — ROI 검토·설계를 산출물로 제공하고, 콘솔 등록·신청·비즈월렛 충전 수행만 사용자가 직접 한다. 클릭 유도 문구(프로모션·리워드 카피) 작성 시 `knowledge/copy-deliberation.md` 절차(다중 에이전트 의논)를 따른다. (사용자 지시 2026-06-11, 2026-06-12)

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

**공유 리워드 보상 설계 (실측 사례)**

토스 연락처를 연동한 유저는 지인에게 **토스 푸시 알림**으로 앱을 알릴 수 있고(`contactsViral`),
**앱은 공유 발생 여부를 감지할 수 있다** → 이걸 조건으로 보상을 건다.

| 보상 형태 | 예시 | 성립 이유 |
|---|---|---|
| **광고 제거** | "공유하면 광고 안 보게 해줄게요" | 비용 0원, 유저 체감 가치는 큼 |
| **과금 기능 개방** | 원래 결제가 필요한 기능(예: 로또 번호 5개 추천)을 공유 조건으로 제공 | 결제 의향이 낮은 유저를 바이럴로 전환 |

→ 포인트를 쓰지 않고도 바이럴을 만들 수 있다. **비즈 월렛 충전 전 단계에서 먼저 시도할 수단**이다.
(구현: `ait-sdk/references/ait-contacts-viral.md`)

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

## 프로모션 (토스포인트 직접 지급)

비게임 앱 대상으로 서버 없이 SDK 함수 호출만으로 사용자에게 토스포인트를 직접 지급할 수 있다.

> **프로모션은 지급 수단이자 유입 채널이다.** 포인트를 걸어 프로모션을 운영하면 **토스 앱의 두 번째 탭인 「혜택」 탭에 노출**되어,
> 내 앱을 모르던 유저가 혜택을 타고 자연스럽게 들어온다. 지급 비용만 보지 말고 **신규 유입 채널 비용**으로 함께 계산한다.
> 실사례: "분석 결과를 보면 100원 드릴게요" 형태로 핵심 경험 완주에 포인트를 걸었다.
> (출처: 앱인토스 공식 웨비나 2026-08-21 · 성장 관점 정리는 `ait-analytics/references/growth-playbook.md`)

### 요건
- SDK(WebView/React Native): **v2.0.8 이상**
- 토스앱: **v5.232.0 이상** (미만 버전에서는 `undefined` 반환)
- **앱 승인(hasApproved) 후 신청 가능** — 앱이 출시 승인된 상태여야 프로모션 신청 진행 가능 (ait-console ad-apply와 동일한 승인 게이트)

### 신청 선행 조건

프로모션 신청 전 아래 조건을 모두 충족해야 한다:

1. 대표 관리자 약관 동의
2. **비즈 월렛 최소 30만원 충전** — 프로모션 지급 재원
3. 사업자 정보 등록
4. 정산 정보 검토 완료
5. 앱 승인(hasApproved) 완료 (위 승인 게이트 참고)

### promotionCode

콘솔에서 프로모션을 등록하면 자동 생성되는 고유 식별자. 개발 코드에서 이 값을 직접 참조한다.

### 테스트 코드 컨벤션 (핵심)

테스트 단계에서는 실제 프로모션 코드 앞에 **`TEST_` 접두사**를 붙여 사용한다.

| 환경 | promotionCode 형식 | 포인트 차감 여부 |
|------|-------------------|----------------|
| 테스트 | `TEST_PROMO_001` | **없음 (실제 지급 없음)** |
| 운영 | `PROMO_001` | 차감됨 |

- 광고 테스트 ID와 동일한 패턴 — 테스트 시 포인트 차감·실제 지급 없음
- 테스트는 최소 1회 `resultType: SUCCESS` 확인 후 운영 전환
- **환경 전환 원칙**: TEST_ 제거는 런타임 분기가 아닌 **config 값 스왑 + 재빌드**다. 스왑 값은 단일 constants 파일에 모은다(ait-env.md "test vs prod 구분" 참조).

### SDK 직접 지급 방식

```tsx
import { grantPromotionReward } from '@apps-in-toss/web-framework';

// 비게임 앱 전용 — SDK 2.0.8+, 토스앱 5.232.0+ 필수
// 테스트: TEST_{promotionCode} (포인트 차감·실제 지급 없음)
// 운영:   콘솔에서 발급된 promotionCode 그대로 사용
const result = await grantPromotionReward({
  promotionCode: 'TEST_PROMO_001', // 테스트=TEST_{promotionCode}, 운영=발급코드
  amount: 100, // 지급 포인트 (1인당 최대 5,000 토스포인트)
});
```

### 지급 한도

- **1인당 최대 5,000 토스포인트** — 초과 지급 불가

### 운영 흐름

```
1. 콘솔에서 프로모션 등록 (promotionCode 자동 생성)
   ↓
2. 검토 요청 제출
   ↓
3. 테스트 단계: TEST_{promotionCode} 로 최소 1회 호출 → resultType: SUCCESS 확인
   ↓
4. 시작하기 (운영 전환)
```

- 기존 Server-to-Server API 호출 방식도 병행 지원 (무결성이 중요한 경우 S2S 권장)
- SDK 직접 호출 시 중복 지급 방지 방어 로직 필수 구현
- 예산 80% 소진 시 이메일 알림, 100% 소진 시 지급 자동 중단

<!-- [공홈 검증] 2026-06-11: grantPromotionReward(비게임), SDK 2.0.8+, 토스앱 5.232.0+ 요건
  공홈(developers-apps-in-toss.toss.im/promotion/develop.md, /bedrock/reference/framework/비게임/promotion.md) 확인 완료.
  출처: https://techchat-apps-in-toss.toss.im/t/sdk/3102 (2026-03-23)
  출처: https://developers-apps-in-toss.toss.im/promotion/intro.html (2026-06-11) -->

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

## 프로모션 ROI(비용대비 수익) 검토

프로모션 도입 결정 전에 아래 프레임워크로 손익분기를 추정한다. 결론("도입" 또는 "보류")을 `PLAN.md` '수익 모델' 섹션에 기록한다.

### 비용

- 토스포인트/리워드 지급액: 인당 보상(최대 5,000P) × 예상 참여자 수
- **비즈 월렛 선충전 필수**: 최소 30만원 충전 후 신청 가능 — 초기 자본 비용으로 반드시 계산에 포함
- 운영 비용: 프로모션 코드 발급·서버 처리·예산 관리 부담

### 수익

- 리텐션 상승 → 광고 임프레션 증가분: eCPM × 추가 노출 수
  - `ait-ads.md` eCPM 정량 기준 참조: 일 1만 노출 이전에는 최적화 판단 보류
  - 배너/전면/보상형 eCPM 실측 범위 참고
- 보상형 광고 시청 수익: 리워드 광고 완료 수 × 보상형 eCPM

### 판정

손익분기 추정: **보상 지급액 < 추가 광고 수익(추정)?**
- 예(초과 가능성 있음) → **도입** 결론
- 아니오(손실 예상) → **보류** 결론

> 사행성·실금전 보상 금지 원칙은 ROI와 무관하게 항상 유지한다.

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
