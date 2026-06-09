# Button (버튼)

```tsx
import { Button } from '@toss/tds-mobile';
```

## Props

```typescript
interface ButtonProps {
  as?: 'button' | 'a';
  color?: 'primary' | 'danger' | 'light' | 'dark'; // default: 'primary'
  variant?: 'fill' | 'weak'; // default: 'fill'
  display?: 'inline' | 'block' | 'full'; // default: 'inline'
  size?: 'small' | 'medium' | 'large' | 'xlarge'; // default: 'xlarge'
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  htmlStyle?: CSSProperties;
  onClick?: () => void;
}
```

## 사용 예시

```tsx
// 기본 (Primary Fill)
<Button>계산하기</Button>

// 크기
<Button size="small">소형</Button>
<Button size="large">대형</Button>
<Button size="xlarge">특대형</Button>

// 스타일 변형
<Button color="primary" variant="fill">주요 버튼</Button>
<Button color="primary" variant="weak">보조 버튼</Button>
<Button color="dark" variant="fill">다크 버튼</Button>
<Button color="danger" variant="fill">위험 버튼</Button>

// 전체 너비
<Button display="full">전체 너비</Button>

// 로딩 / 비활성화
<Button loading>계산 중...</Button>
<Button disabled>비활성화</Button>
```

---
> 검증: 2026-06-07 공홈 대조 [갱신됨: size 기본값 medium→xlarge]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
