# SplitTextField (분할 텍스트 입력)

```tsx
import { SplitTextField } from '@toss/tds-mobile';
```

## 설명
주민등록번호 등 고정 형식 입력을 위한 분할 입력 필드. 첫 필드 입력 완료 시 자동 포커스 이동.

## 변형
- `SplitTextField.RRN13` - 주민등록번호 13자리 (6+7)
- `SplitTextField.RRNFirst7` - 주민등록번호 앞 7자리 (6+1)

## Props

```typescript
interface SplitTextFieldProps {
  variant?: "box" | "line" | "big" | "hero";
  label?: string;                          // default: '주민등록번호'
  labelOption?: "appear" | "sustain";
  help?: React.ReactNode;
  paddingTop?: string | number;
  paddingBottom?: string | number;
  hasError?: boolean;                      // default: false
  first?: TextFieldPublicProps;            // 첫번째 필드 설정
  second?: TextFieldPublicProps;           // 두번째 필드 설정
  focused?: boolean;
}

// RRN13 추가
interface RRN13Props extends SplitTextFieldProps {
  mask?: boolean; // default: true - 뒷 7자리 마스킹
}

// RRNFirst7 추가
interface RRNFirst7Props extends SplitTextFieldProps {
  mask?: boolean; // default: false - 성별코드 마스킹
}
```

## 사용 예시

```tsx
// 주민등록번호 13자리
<SplitTextField.RRN13
  variant="box"
  label="주민등록번호"
  help="주민등록번호를 입력해주세요."
/>

// 마스킹 해제
<SplitTextField.RRN13 variant="box" label="주민등록번호" mask={false} />

// 앞 7자리만
<SplitTextField.RRNFirst7
  variant="box"
  label="주민등록번호 (앞 7자리)"
  help="생년월일과 성별코드를 입력하세요."
/>

// 커스텀 placeholder
<SplitTextField.RRN13
  variant="box"
  label="주민등록번호"
  first={{ placeholder: '앞 6자리' }}
  second={{ placeholder: '뒷 7자리' }}
/>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
