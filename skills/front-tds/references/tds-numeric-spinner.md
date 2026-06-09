# NumericSpinner (숫자 증감 버튼)

```tsx
import { NumericSpinner } from '@toss/tds-mobile';
```

## Props

```typescript
interface NumericSpinnerProps {
  size: "tiny" | "small" | "medium" | "large"; // required
  number?: number;              // default: 0 - 제어 모드 값
  defaultNumber?: number;       // 비제어 모드 초기값
  minNumber?: number;           // default: 0
  maxNumber?: number;           // default: 999
  disable?: boolean;            // default: false
  onNumberChange?: (number: number) => void;
  decreaseAriaLabel?: string;   // 접근성: 감소 버튼 레이블
  increaseAriaLabel?: string;   // 접근성: 증가 버튼 레이블
}
```

## 사용 예시

```tsx
// 제어 모드
function Controlled() {
  const [value, setValue] = React.useState(0);
  return (
    <NumericSpinner
      size="large"
      number={value}
      onNumberChange={(number) => setValue(number)}
    />
  );
}

// 비제어 모드
<NumericSpinner size="large" defaultNumber={0} />

// 크기 변형
<NumericSpinner size="tiny" defaultNumber={0} />
<NumericSpinner size="small" defaultNumber={0} />
<NumericSpinner size="medium" defaultNumber={0} />
<NumericSpinner size="large" defaultNumber={0} />

// 비활성화
<NumericSpinner size="large" defaultNumber={0} disable />

// 접근성 레이블
<NumericSpinner
  number={value}
  onNumberChange={setValue}
  decreaseAriaLabel="상품 수량 줄이기"
  increaseAriaLabel="상품 수량 늘리기"
/>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
