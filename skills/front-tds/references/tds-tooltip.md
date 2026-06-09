# Tooltip (툴팁)

```tsx
import { Tooltip } from '@toss/tds-mobile';
```

## Props

```typescript
interface TooltipProps {
  size?: "small" | "medium" | "large";         // default: "medium"
  defaultOpen?: boolean;                        // default: false
  open?: boolean;                               // 외부 제어
  onOpenChange?: (open: boolean) => void;
  message?: React.ReactNode;                    // 툴팁 내용
  messageAlign?: "left" | "center" | "right";  // default: "left"
  placement?: "top" | "bottom";                 // default: "bottom"
  motionVariant?: "weak" | "strong";           // default: "weak"
  offset?: number;                              // 트리거와의 거리
  anchorPositionByRatio?: number;              // default: 0.5 - 화살표 위치 (0~1)
  openOnHover?: boolean;                        // default: false
  openOnFocus?: boolean;                        // default: false
  dismissible?: boolean;                        // default: false - 외부 클릭/ESC로 닫기
  autoFlip?: boolean;                           // default: false - 잘릴 때 자동 방향 전환
  strategy?: "absolute" | "fixed";             // default: "absolute"
  clipToEnd?: "left" | "right" | "none";       // default: "none"
}
```

## 사용 예시

```tsx
// 외부 상태 제어
const [isOpen, setIsOpen] = useState(false);
<Tooltip message="툴팁 텍스트" open={isOpen}>
  <Button onClick={() => setIsOpen(!isOpen)}>토글</Button>
</Tooltip>

// 호버로 열기
<Tooltip message="툴팁 텍스트" openOnHover>
  <Button>호버하세요</Button>
</Tooltip>

// 포커스 + 호버 + 닫기
<Tooltip message="텍스트" openOnFocus openOnHover dismissible>
  <Button>포커스 또는 호버</Button>
</Tooltip>

// 위치 및 스타일 커스텀
<Tooltip message="텍스트" placement="top" offset={15} size="large" messageAlign="center">
  <Button>커스텀 위치</Button>
</Tooltip>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
