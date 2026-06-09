# Stepper (단계별 표시)

```tsx
import { Stepper, StepperRow } from '@toss/tds-mobile';
```

## 설명
여러 순차적 단계를 시각적으로 표시하는 컴포넌트. 절차적 워크플로우 표시에 적합.

## Stepper Props

```typescript
interface StepperProps {
  play?: boolean;          // default: true - 입장 애니메이션 실행
  delay?: number;          // default: 0 - 애니메이션 시작 딜레이 (초)
  staggerDelay?: number;   // default: 0.1 - 순차 StepperRow 등장 간격 (초)
}
```

## StepperRow Props

```typescript
interface StepperRowProps {
  left: React.ReactNode;     // required - 좌측 (아이콘/이미지)
  center: React.ReactNode;   // required - 중앙 (제목/설명)
  right?: React.ReactNode;   // 우측 (버튼/아이콘)
  hideLine?: boolean;        // 연결선 숨김 (마지막 단계)
}
```

## 서브 컴포넌트
- `StepperRow.NumberIcon` - 번호 아이콘 (number: 1~9)
- `StepperRow.Texts` - 텍스트 (type: "A"|"B"|"C", title, description)
- `StepperRow.AssetFrame` - Asset 래퍼
- `StepperRow.RightArrow` - 우측 화살표
- `StepperRow.RightButton` - 우측 버튼

## 사용 예시

```tsx
// 기본 구조
<Stepper>
  <StepperRow
    left={<StepperRow.NumberIcon number={1} />}
    center={<StepperRow.Texts type="A" title="신청" description="대출 신청서를 작성해요" />}
    right={<StepperRow.RightArrow />}
  />
  <StepperRow
    left={<StepperRow.NumberIcon number={2} />}
    center={<StepperRow.Texts type="A" title="심사" description="심사가 진행돼요" />}
  />
  <StepperRow
    left={<StepperRow.NumberIcon number={3} />}
    center={<StepperRow.Texts type="A" title="완료" description="대출이 실행돼요" />}
    hideLine
  />
</Stepper>

// 순차 애니메이션
<Stepper staggerDelay={0.5}>
  {/* StepperRow children */}
</Stepper>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
