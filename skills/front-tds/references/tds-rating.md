# Rating (별점)

```tsx
import { Rating } from '@toss/tds-mobile';
```

## Props

```typescript
interface RatingProps {
  readOnly: boolean;                   // required - true: 표시만, false: 입력 가능
  value: number;                       // required - 현재 점수
  size: "tiny" | "small" | "medium" | "large" | "big"; // required
  // 인터랙티브: medium | large | big, 읽기전용: 모든 크기
  variant?: "full" | "compact" | "iconOnly"; // 읽기전용 모드 표시 스타일
  max?: number;                        // default: 5 - 최대 점수
  onValueChange?: (value: number) => void; // 인터랙티브 모드 콜백
  disabled?: boolean;                  // default: false
  'aria-label'?: string;              // 접근성 레이블
}
```

## 사용 예시

```tsx
// 인터랙티브 (편집 가능)
function Basic() {
  const [value, setValue] = React.useState(5);
  return (
    <Rating
      readOnly={false}
      value={value}
      max={5}
      size="medium"
      aria-label="별점 평가"
      onValueChange={setValue}
    />
  );
}

// 읽기 전용 변형
<Rating readOnly value={4} max={5} size="medium" variant="full" aria-label="평점" />
<Rating readOnly value={4} max={5} size="medium" variant="compact" aria-label="평점" />
<Rating readOnly value={4} max={5} size="medium" variant="iconOnly" aria-label="평점" />

// 비활성화
<Rating readOnly={false} value={3} max={5} size="medium" disabled aria-label="평점" />
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
