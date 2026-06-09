# Highlight (하이라이트 강조)

```tsx
import { Highlight } from '@toss/tds-mobile';
```

## Props

```typescript
interface HighlightProps {
  open: boolean; // required
  padding?: number; // default: 0
  delay?: number; // default: 0 (초 단위)
  message?: string | function;
  messageColor?: string; // default: colors.white
  messageXAlignment?: "left" | "center" | "right";
  messageYAlignment?: "top" | "bottom";
  onClick?: () => void;
  onExited?: () => void;
  highlighterClassname?: string;
}
```

## 사용 예시

```tsx
<Highlight open={showHighlight} message="여기를 확인해보세요" messageXAlignment="center">
  <Button>계산하기</Button>
</Highlight>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
