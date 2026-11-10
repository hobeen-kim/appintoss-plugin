# useToast (토스트 훅)

```tsx
import { useToast } from '@toss/tds-mobile';
```

## 설명
임시 알림 메시지를 명령형으로 표시하는 Overlay Extension 훅. 버튼 없으면 3초, 버튼 있으면 5초 후 자동 닫힘 (웹 기준).
앱(토스 앱) 환경에서는 네이티브 토스트로 바뀌고 3초 고정이다. 토스트 버튼 조작은 바로 해야 한다(실기기 관찰, 이슈 #15).

## 메서드

### openToast
```typescript
openToast(message: string, options?: OpenToastOptions): { closeToast: () => void }
```

### OpenToastOptions

```typescript
interface OpenToastOptions {
  type?: "top" | "bottom";       // default: "bottom"
  gap?: number;                   // 상/하단에서 떨어질 간격(px). 다른 위치 값보다 우선 적용
  icon?: string;                  // 아이콘 이름 (lottie와 배타)
  iconType?: "circle" | "square"; // 아이콘 형태
  lottie?: string;                // 로티 URL (icon과 배타)
  button?: ToastButton;           // 액션 버튼
  higherThanCTA?: boolean;        // default: false - BottomCTA 위에 표시
  duration?: number;              // 자동 닫힘 딜레이 (ms)
}

interface ToastButton {
  text: string;           // required
  onClick: () => void;    // required
}
```

## 사용 예시

```tsx
function Example() {
  const toast = useToast();

  // 기본 메시지
  toast.openToast('메시지를 전송했어요');

  // 아이콘 포함
  toast.openToast('프로필을 업데이트했어요', {
    icon: 'icon-check',
    iconType: 'circle',
  });

  // 버튼 포함
  toast.openToast('결제에 실패했어요', {
    icon: 'icon-warning-circle',
    button: {
      text: '다시 시도하기',
      onClick: () => retryPayment(),
    },
  });

  // 상단 표시 + 커스텀 타이밍
  toast.openToast('새로운 알림이 있어요', {
    type: 'top',
    gap: 30,
    duration: 1000,
  });

  // 수동 닫기
  const { closeToast } = toast.openToast('처리 중...');
  // ...나중에
  closeToast();
}
```

## 플랫폼 차이
- **주의**: 직접 만든 하단 탭바·고정 버튼이 있으면 토스트가 가리므로 `gap`으로 그 높이만큼 띄운다.
- **웹**: 자동 닫힘 설정 가능, `closeToast()` 수동 닫기 가능
- **앱(Android/iOS)**: 고정 위치 (Android 26px, iOS 46px), SafeArea/BottomCTA 높이 고려, 수동 닫기 불가

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
