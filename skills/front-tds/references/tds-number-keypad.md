# NumberKeypad (숫자 키패드)

```tsx
import { NumberKeypad } from '@toss/tds-mobile';
```

## Props

```typescript
interface NumberKeypadProps {
  onKeyClick: (value: string) => void;       // required
  onBackspaceClick: () => void;               // required
  numbers?: (0|1|2|3|4|5|6|7|8|9)[];        // default: [1,2,3,4,5,6,7,8,9,0]
  secure?: boolean;                           // default: false - 보안 키패드 모드
}
```

## 사용 예시

```tsx
// 기본
<NumberKeypad
  onKeyClick={(value) => console.log(value)}
  onBackspaceClick={() => console.log('backspace')}
/>

// 커스텀 키 배열
<NumberKeypad
  numbers={[1, 3, 5, 7, 9, 2, 4, 6, 8, 0]}
  onKeyClick={() => {}}
  onBackspaceClick={() => {}}
/>

// 보안 모드 (인접 키 랜덤 시뮬레이션)
<NumberKeypad
  secure
  onKeyClick={() => {}}
  onBackspaceClick={() => {}}
/>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
