# FullSecureKeypad (보안 키패드)

```tsx
import { FullSecureKeypad } from '@toss/tds-mobile';
```

## 설명
숫자+알파벳을 함께 표시하는 보안 키패드. 키 사이에 랜덤 빈 공간이 배치되어 입력 패턴 예측 방지.

## Props

```typescript
interface FullSecureKeypadProps {
  onKeyClick: (value: string) => void;   // required
  onBackspaceClick: () => void;           // required
  onSpaceClick: () => void;               // required
  onSubmit: () => void;                   // required
  submitDisabled?: boolean;               // default: false
  submitButtonText?: string;              // default: '입력 완료'
}
```

## Ref

```typescript
interface FullSecureKeypadRef {
  reorderEmptyCells: () => void;  // 빈 셀 위치 랜덤 재배치
  element: HTMLDivElement;
}
```

## 사용 예시

```tsx
const ref = React.useRef<FullSecureKeypadRef>(null);

<FullSecureKeypad
  ref={ref}
  onKeyClick={(value) => console.log(value)}
  onBackspaceClick={() => {}}
  onSpaceClick={() => {}}
  onSubmit={() => {}}
  submitButtonText="확인"
/>

// 빈 셀 재배치
ref.current?.reorderEmptyCells();
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
