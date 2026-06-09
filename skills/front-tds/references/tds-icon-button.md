# IconButton (아이콘 버튼)

```tsx
import { IconButton } from '@toss/tds-mobile';
```

## Props

```typescript
interface IconButtonProps {
  'aria-label': string; // required (접근성 필수)
  variant?: 'fill' | 'clear' | 'border'; // default: 'clear'
  src?: string;
  name?: string;
  color?: string;
  bgColor?: string; // default: 'adaptive.greyOpacity100'
  iconSize?: number; // default: 24
}
```

## 사용 예시

```tsx
<IconButton
  name="chevron-left-bold-mono"
  variant="clear"
  aria-label="뒤로가기"
/>

<IconButton
  src="https://static.toss.im/icons/svg/icon-search-bold-mono.svg"
  variant="fill"
  color="adaptive.blue500"
  iconSize={24}
  aria-label="검색"
/>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
