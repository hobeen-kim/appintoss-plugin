# TextArea (다중 줄 입력)

```tsx
import { TextArea } from '@toss/tds-mobile';
```

## Props

TextField의 props를 상속 (prefix, suffix, right 제외)

```typescript
interface TextAreaProps {
  minHeight?: string | number;
  height?: string | number;
  // + TextField의 모든 props (prefix, suffix, right 제외)
}
```

## 사용 예시

```tsx
// 고정 높이
<TextArea
  variant="box"
  height="200px"
  placeholder="텍스트를 입력해주세요."
  help="내용을 입력하세요"
/>

// 자동 높이 조절
<TextArea
  variant="box"
  placeholder="텍스트를 길게 입력하거나 엔터를 눌러보세요."
  minHeight={100}
/>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
