# BarChart (막대 차트)

```tsx
import { BarChart } from '@toss/tds-mobile';
```

## Props

```typescript
interface BarChartProps {
  data: BarChartData[];                           // required
  fill: AllBar | SingleBar | Auto;                // required - 색상 스타일
  height?: number;                                 // default: 205
}

interface BarChartData {
  value: number;                                   // required - 막대 높이 값
  maxValue?: number;                               // 스케일링 최대값
  label?: string;                                  // X축 레이블
  theme?: "blue" | "green" | "yellow" | "orange" | "red" | "grey" | "default";
  barAnnotation?: string | number;                 // 막대 위 텍스트
}

// 전체 동일 색상
interface AllBar { type: "all-bar"; theme: string; }

// 특정 막대 강조
interface SingleBar { type: "single-bar"; theme: string; barIndex: number; }

// 자동 색상 (우→좌: blue → green → yellow → orange → red → grey)
interface Auto { type: "auto"; count: number; }
```

## 사용 예시

```tsx
// 전체 동일 색상
<BarChart
  data={[
    { maxValue: 10, value: 6, label: '1월', barAnnotation: 6 },
    { maxValue: 10, value: 5, label: '2월', barAnnotation: 5 },
    { maxValue: 10, value: 4, label: '3월', barAnnotation: 4 },
  ]}
  fill={{ type: 'all-bar', theme: 'green' }}
/>

// 특정 막대 강조
<BarChart
  data={[...]}
  fill={{ type: 'single-bar', barIndex: 0, theme: 'blue' }}
/>

// 자동 색상 + 커스텀 높이
<BarChart
  data={data}
  fill={{ type: 'auto', count: data.length }}
  height={300}
/>
```

## 참고
- 데이터가 12개 초과 시 첫/마지막 레이블만 표시 (겹침 방지)

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
