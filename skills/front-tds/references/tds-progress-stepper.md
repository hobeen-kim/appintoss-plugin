# ProgressStepper (단계 진행 표시)

```tsx
import { ProgressStepper, ProgressStep } from '@toss/tds-mobile';
```

## ProgressStepper Props

```typescript
interface ProgressStepperProps {
  variant: "compact" | "icon";       // required - compact: 심플, icon: 아이콘 포함
  paddingTop?: "default" | "wide";   // default: "default" (16px), wide: 24px
  activeStepIndex?: number;          // default: 0 - 현재 단계
  checkForFinish?: boolean;          // default: false - 완료 단계 체크마크 (icon variant만)
}
```

## ProgressStep Props

```typescript
interface ProgressStepProps {
  title?: string;              // 단계 제목
  icon?: React.ReactNode;     // 커스텀 아이콘 (icon variant만)
}
```

## 사용 예시

```tsx
// compact 변형
<ProgressStepper variant="compact" activeStepIndex={1}>
  <ProgressStep title="Step 1" />
  <ProgressStep title="Step 2" />
  <ProgressStep title="Step 3" />
</ProgressStepper>

// icon 변형 + 완료 체크
<ProgressStepper variant="icon" activeStepIndex={2} checkForFinish>
  <ProgressStep title="신청" />
  <ProgressStep title="심사" />
  <ProgressStep title="완료" />
</ProgressStepper>

// 제목 없는 심플 진행률
<ProgressStepper variant="compact" activeStepIndex={1}>
  <ProgressStep />
  <ProgressStep />
  <ProgressStep />
</ProgressStepper>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
