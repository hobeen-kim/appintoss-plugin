# Checkbox (체크박스)

```tsx
import { Checkbox } from '@toss/tds-mobile';
```

## Props

```typescript
interface CheckboxProps {
  inputType?: 'checkbox' | 'radio'; // default: 'checkbox'
  size?: number; // default: 24
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  defaultChecked?: boolean;
  disabled?: boolean;
  'aria-label'?: string; // 접근성 필수
}
```

## 서브 컴포넌트
- `Checkbox.Circle` - 원형 체크박스
- `Checkbox.Line` - 선형 체크박스

## 사용 예시

```tsx
// 원형 체크박스
const [checked, setChecked] = React.useState(false);
<Checkbox.Circle
  checked={checked}
  onCheckedChange={setChecked}
  aria-label="동의"
/>

// 라디오 버튼 변형
<Checkbox.Circle
  inputType="radio"
  checked={selected === '주택'}
  onCheckedChange={() => setSelected('주택')}
  aria-label="주택"
/>

// 비활성화
<Checkbox.Circle disabled defaultChecked={true} />
```

---
> 검증: 2026-06-07 공홈 spot-check [일치: import·Checkbox.Circle/Line·props(inputType/size=24/checked/onCheckedChange/defaultChecked/disabled/aria-label) 일치]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
