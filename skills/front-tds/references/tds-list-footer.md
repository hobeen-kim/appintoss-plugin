# ListFooter (리스트 더보기)

```tsx
import { ListFooter } from '@toss/tds-mobile';
```

## 설명
리스트 하단에 "더 보기" 버튼을 표시하는 컴포넌트.

## Props

```typescript
interface ListFooterProps {
  border?: "full" | "indented" | "none";  // default: "full"
  icon?: string | ReactElement;            // 아이콘
  hairline?: ReactElement;                 // 커스텀 구분선 (ListFooter.Hairline)
  shadow?: ReactElement;                   // 그림자 효과 (ListFooter.Shadow)
  textColor?: string;                      // default: "adaptive.blue500"
  iconColor?: string;                      // default: "adaptive.blue500"
  children?: string | ReactElement;
  onClick?: () => void;
}
```

## 서브 컴포넌트
- `ListFooter.Text` - 텍스트 (color, fontWeight: "regular"|"medium"|"semibold"|"bold")
- `ListFooter.Icon` - 아이콘 (name, color)
- `ListFooter.Hairline` - 구분선 (indent: number)
- `ListFooter.Shadow` - 그림자 효과

## 사용 예시

```tsx
// 기본
<ListFooter>더 보기</ListFooter>

// 아이콘 포함
<ListFooter icon="icon-plus-small-mono">더 보기</ListFooter>

// 커스텀 텍스트 스타일
<ListFooter>
  <ListFooter.Text color="adaptive.blue400" fontWeight="bold">
    더 보기
  </ListFooter.Text>
</ListFooter>

// 보더 변형
<ListFooter border="none">더 보기</ListFooter>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
