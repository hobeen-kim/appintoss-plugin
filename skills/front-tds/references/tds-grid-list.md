# GridList (그리드 목록)

```tsx
import { GridList } from '@toss/tds-mobile';
```

## Props

```typescript
interface GridListProps {
  column?: 1 | 2 | 3; // default: 3
  children: React.ReactNode;
}

interface GridListItemProps {
  image: React.ReactNode; // required
  children?: React.ReactNode; // 이미지 아래 텍스트
}
```

## 사용 예시

```tsx
<GridList column={3}>
  <GridList.Item
    image={<img src="icon-url.png" style={{ width: '24px', height: '24px' }} />}
  >
    취득세
  </GridList.Item>
  <GridList.Item
    image={<img src="icon-url.png" style={{ width: '24px', height: '24px' }} />}
  >
    양도세
  </GridList.Item>
</GridList>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
