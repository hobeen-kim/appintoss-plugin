# Contacts Viral (친구초대)

```tsx
import { contactsViral } from '@apps-in-toss/web-framework';
// React Native: import { contactsViral } from '@apps-in-toss/framework';
```

## 설명
연락처 기반 친구초대 모듈을 띄우고, 초대(공유) 완료 시 콘솔에 등록된 리워드를 지급하는 API.

## 메서드

### contactsViral — 친구초대 모듈 실행
> 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/친구초대/contactsViral.md
```typescript
function contactsViral(params: ContactsViralParams): () => void;
```
- `params` (ContactsViralParams, 필수): 옵션·이벤트·에러 콜백 묶음
- 반환: 정리(cleanup) 함수 `() => void` — 이벤트 처리 완료 후 반드시 호출

## 타입

### ContactsViralParams
> 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/친구초대/ContactsViralParams.md
```typescript
interface ContactsViralParams {
  options: ContactsViralOption;
  onEvent: (event: ContactsViralEvent) => void;
  onError: (error: unknown) => void;
}
```
- `options` (ContactsViralOption, 필수): 친구초대 모듈 설정
- `onEvent` (function, 필수): `ContactsViralEvent`(아래 두 이벤트의 유니온)를 받는 콜백
- `onError` (function, 필수): `unknown` 타입 에러 처리 콜백

### ContactsViralOption
> 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/친구초대/ContactsViralOption.md
```typescript
type ContactsViralOption = {
  moduleId: string;
};
```
- `moduleId` (string, 필수): 콘솔에 등록한 리워드 ID — 리워드 동작의 기준

### ContactsViralSuccessEvent — 모듈 종료 이벤트
> 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/친구초대/ContactsViralSuccessEvent.md
```typescript
type ContactsViralSuccessEvent = {
  type: 'close';
  data: {
    closeReason: 'clickBackButton' | 'noReward';
    sentRewardAmount?: number;
    sendableRewardsCount?: number;
    sentRewardsCount: number;
    rewardUnit?: string;
  };
};
```
- `closeReason`: 종료 사유 — 뒤로가기(`clickBackButton`) 또는 리워드 소진(`noReward`)
- `sentRewardAmount` (선택): 지급된 리워드 양
- `sendableRewardsCount` (선택): 남은 초대 가능 연락처 수
- `sentRewardsCount`: 리워드를 받은 연락처 수
- `rewardUnit` (선택): 리워드 단위

### RewardFromContactsViralEvent — 공유 완료 리워드 이벤트
> 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/친구초대/RewardFromContactsViralEvent.md
```typescript
type RewardFromContactsViralEvent = {
  type: 'sendViral';
  data: {
    rewardAmount: number;
    rewardUnit: string;
  };
};
```
- `rewardAmount`: 지급될 리워드 양
- `rewardUnit`: 리워드 단위

## 사용 예시

```tsx
import { contactsViral } from '@apps-in-toss/web-framework';

function handleContactsViral(moduleId: string) {
  const cleanup = contactsViral({
    options: { moduleId: moduleId.trim() },
    onEvent: (event) => {
      if (event.type === 'sendViral') {
        console.log('리워드 지급:', event.data.rewardAmount, event.data.rewardUnit);
      } else if (event.type === 'close') {
        console.log('모듈 종료:', event.data.closeReason);
        cleanup();
      }
    },
    onError: (error) => {
      console.error('에러 발생:', error);
      cleanup?.();
    },
  });
}
```

## 주의사항
- 토스 앱 5.223.0 이상에서만 동작
- **미니앱 심사 승인 필수** — 미승인 앱은 "Internal Server Error" 발생
- 리워드 조건·수량·단위는 SDK가 아닌 콘솔에서 설정 (`moduleId`로 연결)
- 샌드박스에서는 실제 UI·리워드 지급 없음 — 콘솔의 QR 코드로 테스트
- 이벤트 처리 완료 후 반환된 cleanup 함수를 반드시 호출
- 공유 리워드 시나리오는 ait-promotion-reward 스킬과 연계해 설계
- 리워드 지급 시 **토스포인트 동시 지급 불가** — "리워드 적립 후 포인트 교환" 우회 구조 필수 (ait-ads.md 운영 기준 참조)

## 출처
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/친구초대/contactsViral.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/친구초대/ContactsViralParams.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/친구초대/ContactsViralOption.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/친구초대/ContactsViralSuccessEvent.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/친구초대/RewardFromContactsViralEvent.md

---
> 검증: 2026-06-10 공홈 대조 [contactsViral 시그니처·ContactsViralParams·ContactsViralOption·ContactsViralSuccessEvent·RewardFromContactsViralEvent 타입·import 경로 모두 공홈 fetch 확인]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
