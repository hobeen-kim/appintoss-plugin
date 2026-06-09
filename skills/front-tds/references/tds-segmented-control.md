# SegmentedControl (세그먼트 선택)

```tsx
import { SegmentedControl } from '@toss/tds-mobile';
```

## Props

```typescript
interface SegmentedControlProps {
  children: React.ReactNode; // required
  size?: "small" | "large"; // default: 'small'
  alignment?: "fixed" | "fluid"; // default: 'fixed'
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
}

interface SegmentedControlItemProps {
  children: React.ReactNode; // required
  value: string; // required
  size?: "small" | "large";
}
```

## 사용 예시

```tsx
// 비제어 (내부 상태)
<SegmentedControl defaultValue="1">
  <SegmentedControl.Item value="1">항목 1</SegmentedControl.Item>
  <SegmentedControl.Item value="2">항목 2</SegmentedControl.Item>
  <SegmentedControl.Item value="3">항목 3</SegmentedControl.Item>
</SegmentedControl>

// 제어 (외부 상태)
const [value, setValue] = React.useState('매매');
<SegmentedControl value={value} onChange={setValue}>
  <SegmentedControl.Item value="매매">매매</SegmentedControl.Item>
  <SegmentedControl.Item value="전세">전세</SegmentedControl.Item>
  <SegmentedControl.Item value="월세">월세</SegmentedControl.Item>
</SegmentedControl>
```

## 프로젝트 사용 패턴
- 2~4개 옵션 선택 시 사용
- 커스텀 래퍼 `SegmentedControl.tsx`에서 label 포함 래핑

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
