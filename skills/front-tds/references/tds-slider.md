# Slider (슬라이더)

```tsx
import { Slider, SliderTooltip } from '@toss/tds-mobile';
```

## Props

```typescript
interface SliderProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  color?: string;
  label?: { min: string; max: string; mid?: string };
  tooltip?: React.ReactElement;
}
```

## 사용 예시

```tsx
const [value, setValue] = React.useState(50);

<Slider
  value={value}
  minValue={0}
  maxValue={100}
  label={{ min: "0%", mid: "50%", max: "100%" }}
  tooltip={<SliderTooltip message={`${value}%`} />}
  onValueChange={(newValue) => setValue(newValue)}
/>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
