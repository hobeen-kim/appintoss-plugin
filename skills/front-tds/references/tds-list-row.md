# ListRow (리스트 행)

```tsx
import { ListRow } from '@toss/tds-mobile';
```

## Props

```typescript
interface ListRowProps {
  border?: "indented" | "none"; // default: "indented"
  disabled?: boolean; // default: false
  disabledStyle?: "type1" | "type2"; // default: "type1"
  verticalPadding?: "small" | "medium" | "large" | "xlarge"; // default: "medium"
  horizontalPadding?: "small" | "medium"; // default: "medium"
  left?: React.ReactNode;
  leftAlignment?: "top" | "center"; // default: "center"
  contents?: React.ReactNode; // required
  right?: React.ReactNode;
  rightAlignment?: "top" | "center"; // default: "center"
  withArrow?: boolean; // default: false
  withTouchEffect?: boolean; // default: false
  onClick?: () => void;
}
```

## 서브 컴포넌트
- `ListRow.Texts` - 텍스트 영역
  - `type`: "1RowTypeA" | "2RowTypeA" | "2RowTypeB" | ...
  - `top`: 상단 텍스트
  - `bottom`: 하단 텍스트
- `ListRow.AssetIcon` - 좌측 아이콘
- `ListRow.Loader` - 로딩 스켈레톤 (type: "square"|"circle"|"bar")

## 사용 예시

```tsx
// 단순 텍스트
<ListRow
  contents={<ListRow.Texts top="취득세" type="1RowTypeA" />}
/>

// 아이콘 + 텍스트 + 우측 버튼
<ListRow
  left={<ListRow.AssetIcon name="bank-toss" />}
  contents={
    <ListRow.Texts
      type="2RowTypeA"
      top="취득세"
      bottom="부동산 구매 시 납부"
    />
  }
  right={<Button color="primary" size="small" variant="weak">계산</Button>}
/>

// 클릭 가능 (화살표)
<ListRow
  contents={<ListRow.Texts type="1RowTypeA" top="양도소득세 계산기" />}
  withArrow
  withTouchEffect
  onClick={() => navigate('/capital-gains')}
/>

// 2줄 + 화살표 (카테고리 목록)
<ListRow
  contents={
    <ListRow.Texts
      type="2RowTypeA"
      top={item.name}
      bottom={item.description}
    />
  }
  withArrow
  withTouchEffect
  onClick={() => navigate(`/calc/${item.id}`)}
/>

// 로딩 상태
<ListRow.Loader type="circle" verticalPadding="medium" />
```

---
> 검증: 2026-06-07 공홈 대조 [일치: props·서브컴포넌트(Texts/AssetIcon/Loader) 일치]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
