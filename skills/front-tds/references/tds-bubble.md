# Bubble (대화 말풍선)

```tsx
import { Bubble } from '@toss/tds-mobile';
```

## Props

```typescript
interface BubbleProps extends HTMLAttributes<HTMLDivElement> {
  background: "blue" | "grey";  // required - blue: 나, grey: 상대방
  withTail?: boolean;            // default: true - 말풍선 꼬리
  children?: React.ReactNode;
}
```

## 사용 예시

```tsx
// 기본
<Bubble background="blue" withTail>Hello</Bubble>

// 대화 패턴
<Bubble background="grey" withTail>안녕하세요</Bubble>
<Bubble background="blue" withTail>네, 반갑습니다.</Bubble>

// 꼬리 없이
<Bubble background="grey" withTail={false}>Hello</Bubble>
```

## 참고
- `blue` - 현재 사용자 메시지 (우측 꼬리)
- `grey` - 상대방 메시지 (좌측 꼬리)
- children에 텍스트, Lottie 등 다양한 콘텐츠 가능

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
