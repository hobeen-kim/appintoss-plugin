# ListHeader (리스트 헤더)

```tsx
import { ListHeader } from '@toss/tds-mobile';
```

## 설명
페이지/섹션 상단에 타이틀, 설명, 인터랙티브 요소를 표시하는 헤더 컴포넌트.

## Props

```typescript
interface ListHeaderProps {
  title: React.ReactNode;               // required
  titleWidthRatio?: number;             // default: 0.66 - 타이틀 너비 비율
  description?: React.ReactNode;
  descriptionPosition?: "top" | "bottom"; // default: "top"
  right?: React.ReactNode;
  rightAlignment?: "bottom" | "center";  // default: "center"
}
```

## 서브 컴포넌트

### ListHeader.TitleParagraph
```typescript
{ typography: "t7" | "t5" | "t4"; fontWeight: string; color?: string; children: ReactNode }
```

### ListHeader.TitleTextButton
```typescript
{ size: "medium" | "xsmall" | "large"; fontWeight: string; variant?: "clear" | "arrow" | "underline"; children: ReactNode }
```

### ListHeader.TitleSelector
```typescript
{ typography: "t7" | "t5" | "t4"; children: ReactNode }
```

### ListHeader.RightText
```typescript
{ typography: "t7" | "t6"; color?: string; children: ReactNode }
// default color: adaptive.grey700
```

### ListHeader.RightArrow
```typescript
{ typography: "t7" | "t6"; children?: ReactNode; color?: string; textColor?: string; onClick?: () => void }
```

### ListHeader.DescriptionParagraph
```typescript
{ children: ReactNode }
```

## 사용 예시

```tsx
// 기본
<ListHeader
  title={
    <ListHeader.TitleParagraph typography="t5" fontWeight="bold">
      타이틀
    </ListHeader.TitleParagraph>
  }
  right={
    <ListHeader.RightText typography="t7">
      부가 정보
    </ListHeader.RightText>
  }
  description={<ListHeader.DescriptionParagraph>설명</ListHeader.DescriptionParagraph>}
/>

// 하단 설명
<ListHeader
  title={<ListHeader.TitleParagraph typography="t5" fontWeight="bold">타이틀</ListHeader.TitleParagraph>}
  description={<ListHeader.DescriptionParagraph>설명</ListHeader.DescriptionParagraph>}
  descriptionPosition="bottom"
/>

// TextButton 타이틀 + 화살표
<ListHeader
  title={
    <ListHeader.TitleTextButton size="large" fontWeight="bold" variant="arrow">
      타이틀
    </ListHeader.TitleTextButton>
  }
/>

// RightArrow
<ListHeader
  title={<ListHeader.TitleParagraph typography="t7" fontWeight="bold">타이틀</ListHeader.TitleParagraph>}
  right={<ListHeader.RightArrow typography="t6">더보기</ListHeader.RightArrow>}
/>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
