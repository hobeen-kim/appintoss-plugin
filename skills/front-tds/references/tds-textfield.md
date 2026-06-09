# TextField (텍스트 입력)

```tsx
import { TextField } from '@toss/tds-mobile';
```

## Props

```typescript
interface TextFieldProps {
  variant: "box" | "line" | "big" | "hero"; // required
  label?: string;
  labelOption?: "appear" | "sustain"; // default: "appear"
  help?: React.ReactNode;
  hasError?: boolean; // default: false
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  right?: React.ReactNode;
  disabled?: boolean; // default: false
  paddingTop?: string | number;
  paddingBottom?: string | number;
  value?: string | number;
  defaultValue?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email" | "url";
  format?: { transform: (value: string) => string; reset?: (formattedValue: string) => string };
  onFocus?: React.FocusEventHandler;
  onBlur?: React.FocusEventHandler;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}
```

## 서브 컴포넌트
- `TextField.Clearable` - 지우기 버튼 포함 (추가 prop: `onClear: () => void`)
- `TextField.Password` - 비밀번호 표시/숨기기
- `TextField.Button` - 우측 화살표 버튼 (드롭다운 트리거용)

## 사용 예시

```tsx
// 기본 박스형
<TextField
  variant="box"
  label="이름"
  placeholder="이름을 입력해주세요"
/>

// 라인형 (금액 입력)
<TextField
  variant="line"
  label="취득가액"
  suffix="원"
  placeholder="금액을 입력해주세요"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
  inputMode="numeric"
/>

// 오류 상태
<TextField
  variant="box"
  label="이메일"
  hasError={isInvalid}
  help="올바른 이메일 형식이 아니에요"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// 지우기 버튼
<TextField.Clearable
  variant="box"
  label="검색"
  value={value}
  onClear={() => setValue('')}
  onChange={(e) => setValue(e.target.value)}
/>

// 접두사/접미사
<TextField
  variant="box"
  label="금액"
  suffix="원"
/>

// 드롭다운 트리거
<TextField.Button
  variant="line"
  label="주택 유형"
  value={selectedLabel}
  onClick={() => setIsOpen(true)}
/>
```

## 프로젝트 사용 패턴
- `variant="line"` + `suffix` + `inputMode="numeric"` - 금액/숫자 입력
- `TextField.Button` + `BottomSheet` - 선택 필드(드롭다운) 구현
- `hasError` + `help` - 폼 검증 피드백

---
> 검증: 2026-06-07 공홈 대조 [일치: variant(box/line/big/hero)·서브컴포넌트(Clearable/Password/Button)·주요 props 일치]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
