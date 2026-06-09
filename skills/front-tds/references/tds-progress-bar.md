# ProgressBar (진행률 표시)

```tsx
import { ProgressBar } from '@toss/tds-mobile';
```

## Props

```typescript
interface ProgressBarProps {
  progress: number; // required: 0.0 ~ 1.0
  size: "light" | "normal" | "bold"; // required
  color?: string; // default: colors.blue400
  animate?: boolean; // default: false
  className?: string;
}
```

## 사용 예시

```tsx
<ProgressBar progress={0.5} size="normal" />
<ProgressBar size="bold" progress={progress} animate color={colors.blue500} />
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
