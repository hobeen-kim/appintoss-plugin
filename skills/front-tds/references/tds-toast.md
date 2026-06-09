# Toast (토스트 알림)

```tsx
import { Toast } from '@toss/tds-mobile';
```

## Props

```typescript
interface ToastProps {
  open: boolean;
  position: "top" | "bottom"; // required
  text: string; // required
  leftAddon?: React.ReactNode;
  button?: React.ReactNode;
  duration?: number; // default: 3000
  onClose?: () => void;
  onExited?: () => void;
  higherThanCTA?: boolean;
  'aria-live'?: "assertive" | "polite";
}
```

## 서브 컴포넌트
- `Toast.Button` - 버튼 (position="bottom"에서만 사용)
- `Toast.Icon` - 아이콘 (leftAddon용)
- `Toast.Lottie` - 로티 애니메이션 (leftAddon용)

## 사용 예시

```tsx
const [open, setOpen] = React.useState(false);

// 기본
<Toast
  position="top"
  open={open}
  text="계산이 완료되었어요"
  duration={3000}
  onClose={() => setOpen(false)}
/>

// 아이콘 포함
<Toast
  position="top"
  open={open}
  text="저장되었어요"
  leftAddon={<Toast.Icon name="icn-success-color" />}
  onClose={() => setOpen(false)}
/>

// 버튼 포함 (bottom only)
<Toast
  position="bottom"
  open={open}
  text="계산 결과를 저장했어요"
  button={<Toast.Button onClick={handleUndo}>취소</Toast.Button>}
  onClose={() => setOpen(false)}
/>
```

---
> 검증: 2026-06-07 공홈 대조 [일치: props·서브컴포넌트(Icon/Lottie/Button) 일치. higherThanCTA 기본값 false 확인]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
