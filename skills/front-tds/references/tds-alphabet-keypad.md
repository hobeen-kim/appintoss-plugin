# AlphabetKeypad (알파벳 키패드)

```tsx
import { AlphabetKeypad } from '@toss/tds-mobile';
```

## Props

```typescript
interface AlphabetKeypadProps {
  onKeyClick: (value: string) => void;   // required
  onBackspaceClick: () => void;           // required
  alphabets?: string[];                   // default: ['A'-'Z'] - 대소문자 구분
}
```

## 사용 예시

```tsx
// 기본 (A-Z)
<AlphabetKeypad
  onKeyClick={(value) => console.log(value)}
  onBackspaceClick={() => {}}
/>

// 커스텀 배열
<AlphabetKeypad
  alphabets={['a','b','c','d','e']}
  onKeyClick={() => {}}
  onBackspaceClick={() => {}}
/>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
