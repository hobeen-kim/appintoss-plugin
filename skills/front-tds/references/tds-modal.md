# Modal (모달)

```tsx
import { Modal } from '@toss/tds-mobile';
```

## Props

```typescript
interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExited?: () => void;
  portalContainer?: HTMLElement; // default: document.body
}

interface ModalOverlayProps {
  onClick?: () => void;
}
```

## 서브 컴포넌트
- `Modal.Overlay` - 배경 딤 처리
- `Modal.Content` - 모달 콘텐츠 영역

## 사용 예시

```tsx
const [open, setOpen] = React.useState(false);

<Modal open={open} onOpenChange={setOpen}>
  <Modal.Overlay />
  <Modal.Content style={{ padding: '32px 20px 20px 20px' }}>
    <Paragraph typography="t4" fontWeight="bold">제목</Paragraph>
    <Paragraph typography="t6">내용</Paragraph>
    <Button display="full" onClick={() => setOpen(false)}>확인</Button>
  </Modal.Content>
</Modal>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
