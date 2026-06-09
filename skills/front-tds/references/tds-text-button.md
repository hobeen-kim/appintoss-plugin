# TextButton (텍스트 버튼)

```tsx
import { TextButton } from '@toss/tds-mobile';
```

## Props

```typescript
interface TextButtonProps {
  size: "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge"; // required
  variant?: "arrow" | "underline" | "clear"; // default: 'clear'
  disabled?: boolean;
}
```

## 사용 예시

```tsx
<TextButton size="medium">더보기</TextButton>
<TextButton size="medium" variant="arrow">자세히 보기</TextButton>
<TextButton size="medium" variant="underline">약관 보기</TextButton>
<TextButton size="small" disabled>비활성화</TextButton>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
