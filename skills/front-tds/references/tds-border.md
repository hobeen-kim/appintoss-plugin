# Border (구분선)

```tsx
import { Border } from '@toss/tds-mobile';
```

## Props

```typescript
interface BorderProps {
  variant?: "full" | "padding24" | "height16"; // default: "full"
  height?: string;
}
```

## 사용 예시

```tsx
// 전체 너비 구분선 (항목 사이)
<Border variant="full" />

// 좌측 패딩 있는 구분선
<Border variant="padding24" />

// 섹션 구분용 높이 있는 구분선 (16px 높이의 회색 영역)
<Border variant="height16" />

// 커스텀 높이
<Border variant="height16" height="24px" />
```

## 프로젝트 사용 패턴
- `variant="height16"` - 섹션 간 간격 (입력 영역 ↔ 결과 영역)
- `variant="full"` - 리스트 항목 사이 구분선

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
