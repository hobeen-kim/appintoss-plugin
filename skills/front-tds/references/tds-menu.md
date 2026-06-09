# Menu (드롭다운 선택)

```tsx
import { Menu } from '@toss/tds-mobile';
```

## Props

```typescript
interface MenuTriggerProps {
  open?: boolean;
  defaultOpen?: boolean;
  children?: React.ReactNode;
  dropdown?: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right" |
              "top-start" | "top-end" | "bottom-start" | "bottom-end";
  onOpen?: () => void;
  onClose?: () => void;
}

interface MenuDropdownItemProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
}

interface MenuDropdownCheckedItemProps {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}
```

## 서브 컴포넌트
- `Menu.Trigger` - 트리거 래퍼
- `Menu.Dropdown` - 드롭다운 컨테이너
- `Menu.Header` - 드롭다운 헤더
- `Menu.DropdownItem` - 일반 항목
- `Menu.DropdownCheckItem` - 체크 항목

## 사용 예시

```tsx
const [open, setOpen] = React.useState(false);
const [selected, setSelected] = React.useState(1);

<Menu.Trigger
  open={open}
  onOpen={() => setOpen(true)}
  onClose={() => setOpen(false)}
  placement="bottom"
  dropdown={
    <Menu.Dropdown header={<Menu.Header>선택하세요</Menu.Header>}>
      <Menu.DropdownCheckItem
        checked={selected === 1}
        onCheckedChange={() => setSelected(1)}
      >
        옵션 1
      </Menu.DropdownCheckItem>
      <Menu.DropdownCheckItem
        checked={selected === 2}
        onCheckedChange={() => setSelected(2)}
      >
        옵션 2
      </Menu.DropdownCheckItem>
    </Menu.Dropdown>
  }
>
  <Button>선택하기</Button>
</Menu.Trigger>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
