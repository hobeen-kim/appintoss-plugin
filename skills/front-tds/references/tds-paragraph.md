# Paragraph (텍스트)

```tsx
import { Paragraph } from '@toss/tds-mobile';
```

## Props

```typescript
interface ParagraphProps {
  typography: "t1" | "t2" | "t3" | "t4" | "t5" | "t6" | "t7" |
              "st1" | "st2" | "st3" | "st4" | "st5" | "st6" | "st7" |
              "st8" | "st9" | "st10" | "st11" | "st12" | "st13"; // required
  display?: "block" | "inline"; // default: 'block'
  ellipsisAfterLines?: number;
  textAlign?: string;
  fontWeight?: "regular" | "medium" | "semibold" | "bold"; // default: 'regular'
  color?: string;
}
```

## 서브 컴포넌트
- `Paragraph.Text` - 인라인 텍스트 (색상/굵기 오버라이드)
- `Paragraph.Badge` - 인라인 뱃지 (style: "fill"|"weak", type: "blue"|"teal"|"green"|"red"|"yellow"|"elephant")
- `Paragraph.Link` - 인라인 링크 (type: "underline"|"clear")
- `Paragraph.Icon` - 인라인 아이콘

## 사용 예시

```tsx
// 기본 텍스트
<Paragraph typography="t5">본문 텍스트</Paragraph>

// 굵은 제목
<Paragraph typography="t3" fontWeight="bold">제목</Paragraph>

// 색상 지정
<Paragraph typography="t6" color="adaptive.grey600">보조 텍스트</Paragraph>

// 정렬
<Paragraph typography="t2" fontWeight="bold" textAlign="center">가운데 정렬</Paragraph>

// 인라인 혼합 사용
<Paragraph typography="t5">
  <Paragraph.Text>일반 텍스트</Paragraph.Text>
  <Paragraph.Text fontWeight="bold" color="adaptive.blue500">강조 텍스트</Paragraph.Text>
  <Paragraph.Badge style="fill" type="blue">뱃지</Paragraph.Badge>
</Paragraph>

// 말줄임 처리
<Paragraph typography="t6" ellipsisAfterLines={2}>
  길게 이어지는 텍스트...
</Paragraph>
```

## 프로젝트 사용 패턴
- `t2 bold` - 메인 제목
- `t5 medium/bold` - 결과 값, 섹션 제목
- `t6` - 레이블, 부가 설명
- `t7 adaptive.grey700` - 메타 정보
- `st11 medium` - 작은 레이블

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
