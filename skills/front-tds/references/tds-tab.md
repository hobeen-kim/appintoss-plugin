# Tab (탭 네비게이션)

```tsx
import { Tab } from '@toss/tds-mobile';
```

## Props

```typescript
interface TabProps {
  children: React.ReactNode; // required
  onChange: (index: number, key?: string | number) => void; // required
  size?: "large" | "small"; // default: 'large'
  fluid?: boolean; // default: false
  itemGap?: number;
  ariaLabel?: string;
}

interface TabItemProps {
  selected: boolean; // required
  redBean?: boolean; // default: false (빨간 점 알림)
  children: React.ReactNode;
}
```

## 사용 예시

```tsx
const [selected, setSelected] = React.useState(0);

<Tab onChange={(index) => setSelected(index)}>
  <Tab.Item selected={selected === 0}>취득세</Tab.Item>
  <Tab.Item selected={selected === 1}>양도세</Tab.Item>
  <Tab.Item selected={selected === 2}>재산세</Tab.Item>
</Tab>
```

---
> 검증: 2026-06-07 공홈 대조 [일치: TabProps(onChange/size/fluid/itemGap/ariaLabel)·TabItemProps(selected/redBean) 일치]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
