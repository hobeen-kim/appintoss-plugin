# TableRow (키-값 데이터 표시)

```tsx
import { TableRow } from '@toss/tds-mobile';
```

## Props

```typescript
interface TableRowProps {
  left: React.ReactNode;           // required
  right: React.ReactNode;          // required
  align: "left" | "space-between"; // required
  leftRatio?: number;              // 좌측 영역 너비 비율
}
```

## 사용 예시

```tsx
// 계산 결과 표시 (space-between)
<TableRow align="space-between" left="취득세" right="1,200,000원" />
<TableRow align="space-between" left="지방교육세" right="120,000원" />
<TableRow align="space-between" left="합계" right="1,320,000원" />

// Paragraph와 조합 (스타일 커스텀)
<TableRow
  align="space-between"
  left={<Paragraph typography="t6" color="adaptive.grey700">{item.label}</Paragraph>}
  right={
    <Paragraph
      typography="t6"
      fontWeight={item.isTotal ? 'bold' : 'medium'}
      color={item.isTotal ? 'adaptive.blue500' : undefined}
    >
      {item.value}
    </Paragraph>
  }
/>

// 좌측 정렬 + 비율 지정
<TableRow align="left" left="항목" right="값" leftRatio={40} />
```

## 프로젝트 사용 패턴
- `ResultDisplay` 컴포넌트에서 계산 결과 항목별 표시
- 합계 행은 `fontWeight="bold"` + `color="adaptive.blue500"`로 강조

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
