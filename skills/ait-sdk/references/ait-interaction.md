# 인터랙션 (Interaction)

```tsx
// WebView
import { generateHapticFeedback, requestReview, requestNotificationAgreement } from '@apps-in-toss/web-framework';
// React Native
import { generateHapticFeedback, requestReview, requestNotificationAgreement } from '@apps-in-toss/framework';
```

## 설명
햅틱 피드백, 리뷰 요청, 알림 수신 동의 등 사용자 인터랙션 API 모음.

## API

### generateHapticFeedback
버튼 클릭·화면 전환 등에 촉각 피드백(진동)을 발생시킵니다.
```typescript
function generateHapticFeedback(options: {
  type: HapticFeedbackType;
}): Promise<void>;

type HapticFeedbackType =
  | 'tickWeak' | 'tap' | 'tickMedium' | 'softMedium'
  | 'basicWeak' | 'basicMedium'
  | 'success' | 'error' | 'wiggle' | 'confetti';
```
- import: WebView `@apps-in-toss/web-framework`, RN `@apps-in-toss/framework`
- 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인터렉션/generateHapticFeedback.md

```tsx
<button onClick={() => generateHapticFeedback({ type: 'tickWeak' })}>
  햅틱
</button>
```

### requestReview
토스 앱 내 리뷰(별점) 요청 화면을 띄웁니다. — SDK 2.4.0 도입 (플랜 제공 정보, 공홈 개별 문서에는 버전 미명시 — 릴리즈 노트 조회 실패 2026-06-10)
```typescript
function requestReview(): Promise<void>;
```
- import: WebView `@apps-in-toss/web-framework`, RN `@apps-in-toss/framework`
- 별점 화면 먼저 표시 → 4점 이상 선택 시에만 텍스트 리뷰 입력 노출, 3점 이하는 별점만 수집
- 호출해도 UI가 항상 표시되지는 않음 — 사용자 피로도 기반 내부 정책으로 노출 결정
- 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인터렉션/requestReview.md

```tsx
const handleComplete = async () => {
  await completeGoal();
  try {
    await requestReview();
  } catch (error) {
    console.error('리뷰 요청 실패:', error);
  }
};
```

### requestNotificationAgreement
알림 수신 동의 요청 UI를 띄웁니다. — SDK 2.5.0 도입 (플랜 제공 정보, 공홈 개별 문서에는 버전 미명시 — 릴리즈 노트 조회 실패 2026-06-10)
```typescript
function requestNotificationAgreement(params: {
  options: {
    templateCode: string;
  };
  onEvent: (result: { type: NotificationAgreementResult }) => void;
  onError: (error: unknown) => void | Promise<void>;
}): () => void;

type NotificationAgreementResult = 'newAgreement' | 'alreadyAgreed' | 'agreementRejected';
```
- import: WebView `@apps-in-toss/web-framework`, RN `@apps-in-toss/framework`
- `templateCode`: 콘솔 → 스마트 메시징 → 알림 동의 탭에서 등록한 템플릿 코드
- 반환값은 cleanup 함수 — 이벤트 리스너 해제용, 반드시 호출
- 결과: `newAgreement`(신규 동의) / `alreadyAgreed`(이미 동의) / `agreementRejected`(거부)
- 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인터렉션/requestNotificationAgreement.md

```tsx
const cleanup = requestNotificationAgreement({
  options: { templateCode: 'your-template-code' },
  onEvent: ({ type }) => {
    if (type === 'newAgreement') console.log('신규 동의');
    else if (type === 'alreadyAgreed') console.log('이미 동의됨');
    else if (type === 'agreementRejected') console.log('동의 거부');
    cleanup();
  },
  onError: (error) => {
    console.error('요청 실패:', error);
    cleanup();
  },
});
```

## 주의사항
- `requestReview`: 같은 세션에서 반복 호출 금지. 리뷰 노출 여부에 보상·진행을 걸지 말 것. 목표 달성 등 만족 시점에만 호출
- `requestNotificationAgreement`: 콘솔에 알림 동의 템플릿을 먼저 등록하지 않으면 UI 미표시. cleanup 미호출 시 리스너 중복 등록·메모리 누수
- 동의 이후 실제 메시지 발송은 자체 서버에서 트리거

## 출처
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인터렉션/generateHapticFeedback.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인터렉션/requestReview.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인터렉션/requestNotificationAgreement.md

---
> 검증: 2026-06-10 공홈 대조 [일치: 3개 API 시그니처·파라미터·반환 타입·결과 타입 모두 공홈 fetch 결과 기준 작성 / 도입 버전(2.4.0, 2.5.0)은 공홈 미확인 — 릴리즈 노트 조회 실패 (2026-06-10)]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
