# Agreement (동의 컴포넌트)

```tsx
import { AgreementV4 } from '@toss/tds-mobile';
// AgreementV3는 deprecated → AgreementV4 사용 권장
```

## AgreementV4 Props

```typescript
interface AgreementV4Props {
  variant: "xLarge" | "large" | "medium" | "medium-title" | "small" | "small-last";
  indent?: number;
  left?: React.ReactNode;     // 좌측 (체크박스)
  middle?: React.ReactNode;   // 중앙 (텍스트)
  right?: React.ReactNode;    // 우측 (뱃지/화살표)
  onPressEnd?: () => void;
}
```

## 서브 컴포넌트

### AgreementV4.Checkbox
```typescript
{
  variant: "checkbox" | "dot" | "hidden";
  checked?: boolean;
  motionVariant?: "strong" | "weak";
  transitionDelay?: number;
  onCheckedChange?: (checked: boolean) => void;
}
```

### AgreementV4.Text
```typescript
{ necessity?: React.ReactNode; onPressEnd?: () => void }
```

### AgreementV4.Badge
```typescript
{ variant: "fill" | "clear"; textColor: string; bgColor?: string }
```

### AgreementV4.Necessity
```typescript
{ variant: "mandatory" | "optional" }
```

### AgreementV4.RightArrow
```typescript
{ collapsed?: boolean; onArrowClick?: () => void }
```

### AgreementV4.Description
```typescript
{ variant: "box" | "normal"; indent?: number }
```

### 접힘/펼침
- `AgreementV4.Collapsible` - collapsed, defaultCollapsed, onCollapsedChange
- `AgreementV4.CollapsibleTrigger` - 토글 트리거
- `AgreementV4.CollapsibleContent` - 접히는 콘텐츠

### 들여쓰기
- `AgreementV4.IndentPushable` - pushed, defaultPushed, onPushedChange
- `AgreementV4.IndentPushableTrigger` / `IndentPushableContent`

### 그룹
- `AgreementV4.Group` - showGradient (default: true)
- `AgreementV4.Header` - variant, indent

## 사용 예시

```tsx
// 단일 항목
<AgreementV4 variant="medium">
  <AgreementV4.Checkbox variant="checkbox" checked={agreed} onCheckedChange={setAgreed} />
  <AgreementV4.Text necessity={<AgreementV4.Necessity variant="mandatory" />}>
    서비스 이용약관 동의
  </AgreementV4.Text>
  <AgreementV4.RightArrow onArrowClick={() => showTerms()} />
</AgreementV4>

// 접힘/펼침 그룹
<AgreementV4.Collapsible>
  <AgreementV4.CollapsibleTrigger>
    <AgreementV4 variant="large">
      <AgreementV4.Checkbox variant="checkbox" checked={allAgreed} onCheckedChange={setAllAgreed} />
      <AgreementV4.Text>전체 동의</AgreementV4.Text>
      <AgreementV4.RightArrow />
    </AgreementV4>
  </AgreementV4.CollapsibleTrigger>
  <AgreementV4.CollapsibleContent>
    {/* 개별 동의 항목들 */}
  </AgreementV4.CollapsibleContent>
</AgreementV4.Collapsible>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
