# Loader (로딩 스피너)

```tsx
import { Loader } from '@toss/tds-mobile';
```

## Props

```typescript
interface LoaderProps {
  size?: 'small' | 'medium' | 'large'; // default: 'medium'
  type?: 'primary' | 'dark' | 'light'; // default: 'primary'
  label?: string;
  style?: React.CSSProperties;
  className?: string;
}
```

## 사용 예시

```tsx
<Loader />
<Loader size="small" />
<Loader size="large" type="dark" />
<Loader label="계산 중이에요." />
```

---
> 검증: 2026-06-07 공홈 spot-check [일치: size·type(primary/dark/light)·label·style·className 일치]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
