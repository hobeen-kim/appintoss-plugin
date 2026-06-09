# Badge (뱃지)

```tsx
import { Badge } from '@toss/tds-mobile';
```

## Props

```typescript
interface BadgeProps {
  variant: "fill" | "weak";
  size: "xsmall" | "small" | "medium" | "large";
  color: "blue" | "teal" | "green" | "red" | "yellow" | "elephant";
  children?: React.ReactNode;
}
```

## 사용 예시

```tsx
<Badge size="small" color="blue" variant="fill">NEW</Badge>
<Badge size="xsmall" color="red" variant="fill">주의</Badge>
<Badge size="medium" color="green" variant="weak">완료</Badge>
```

---
> 검증: 2026-06-07 공홈 spot-check [일치: variant(fill/weak)·size(xsmall~large)·color(blue/teal/green/red/yellow/elephant)·children 일치]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
