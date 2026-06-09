# Skeleton (스켈레톤 로딩)

```tsx
import { Skeleton } from '@toss/tds-mobile';
```

## Props

```typescript
interface SkeletonProps {
  height?: string | number; // default: 'auto'
  pattern?: 'topList' | 'topListWithIcon' | 'amountTopList' |
            'amountTopListWithIcon' | 'subtitleList' | 'subtitleListWithIcon' |
            'listOnly' | 'listWithIconOnly' | 'cardOnly'; // default: 'topList'
  custom?: ('list' | 'title' | 'subtitle' | 'card' |
            'listWithIcon' | `spacer(${number})`)[];
  repeatLastItemCount?: number | 'infinite'; // default: 3
  play?: 'show' | 'hide'; // default: 'show'
  background?: 'white' | 'grey' | 'greyOpacity100'; // default: 'grey'
}
```

## 사용 예시

```tsx
// 기본
<Skeleton style={{ width: '100%' }} />

// 패턴 사용
<Skeleton pattern="topListWithIcon" style={{ width: '100%' }} />

// 커스텀 패턴
<Skeleton
  custom={['title', 'subtitle', 'spacer(20)', 'card']}
  repeatLastItemCount={1}
  style={{ width: '100%' }}
/>
```

---
> 검증: 2026-06-07 공홈 spot-check [일치: pattern 9종·custom·repeatLastItemCount(infinite)·play·background 일치]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
