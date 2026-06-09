# Switch (토글 스위치)

```tsx
import { Switch } from '@toss/tds-mobile';
```

## Props

```typescript
interface SwitchProps {
  checked: boolean;
  disabled?: boolean;
  name?: string;
  hasTouchEffect?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
  onClick?: (event: React.MouseEvent<HTMLInputElement, MouseEvent>) => void;
}
```

## 사용 예시

```tsx
const [checked, setChecked] = React.useState(false);

<Switch
  checked={checked}
  onChange={() => setChecked((prev) => !prev)}
/>

// 비활성화
<Switch checked disabled />
```

---
> 검증: 2026-06-07 공홈 spot-check [일치: props(checked/disabled/name/hasTouchEffect/onChange/onClick) 시그니처 일치]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
