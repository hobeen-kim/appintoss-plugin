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

## 실기기 주의
- 비활성 `Button`은 색 변수와 별개로 투명도(실기기 0.38)가 걸린다. `--button-disabled-*`만 바꿔도 흐리게 보인다.
- 기본 비활성 표현을 따르고, 색을 바꾸면 실기기 캡처로 확인한다. `front-tds` SKILL.md 「실기기(토스 앱) 함정」 참조.

---
> 검증: 2026-06-07 공홈 대조 [갱신됨: size 기본값 medium→xlarge]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
