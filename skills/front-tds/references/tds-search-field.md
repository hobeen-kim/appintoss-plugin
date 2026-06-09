# SearchField (검색 입력)

```tsx
import { SearchField } from '@toss/tds-mobile';
```

## Props

```typescript
interface SearchFieldProps {
  fixed?: boolean;           // default: false - 상단 고정
  takeSpace?: boolean;       // default: true - fixed 시 레이아웃 공간 유지
  onDeleteClick?: () => void; // 지우기 버튼 클릭 콜백
  placeholder?: string;
  // + 표준 input 속성 상속
}
```

## 사용 예시

```tsx
// 기본
<SearchField placeholder="검색어를 입력하세요" />

// 상단 고정
<SearchField
  placeholder="검색어를 입력하세요"
  fixed
  takeSpace
/>

// 지우기 콜백
<SearchField
  placeholder="검색어를 입력하고 오른쪽 버튼을 클릭해보세요."
  onDeleteClick={() => alert('delete')}
/>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
