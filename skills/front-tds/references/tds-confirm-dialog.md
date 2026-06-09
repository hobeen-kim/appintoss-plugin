# ConfirmDialog (확인 다이얼로그)

```tsx
import { ConfirmDialog } from '@toss/tds-mobile';
```

## Props

```typescript
interface ConfirmDialogProps {
  open: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  cancelButton: React.ReactNode;
  confirmButton: React.ReactNode;
  closeOnDimmerClick?: boolean; // default: true
  closeOnBackEvent?: boolean; // default: true
  onClose: () => void;
  onEntered?: () => void;
  onExited?: () => void;
  portalContainer?: HTMLElement; // default: document.body
}
```

## 서브 컴포넌트 Props

```typescript
// ConfirmDialog.Title
interface TitleProps {
  as?: string; // default: 'h3'
  color?: string; // default: 'adaptive.grey800'
  typography?: string; // default: 't4'
  fontWeight?: 'regular' | 'medium' | 'semibold' | 'bold'; // default: 'bold'
}

// ConfirmDialog.Description
interface DescriptionProps {
  color?: string; // default: 'adaptive.grey600'
  typography?: string; // default: 't6'
  fontWeight?: string; // default: 'medium'
}

// ConfirmDialog.CancelButton / ConfirmButton
interface ButtonProps {
  type?: 'primary' | 'danger' | 'light' | 'dark'; // default: 'dark'(cancel), 'primary'(confirm)
  style?: 'fill' | 'weak'; // default: 'weak'(cancel), 'fill'(confirm)
  size?: 'medium' | 'big' | 'large' | 'tiny'; // default: 'large'
}
```

## 사용 예시

```tsx
const [open, setOpen] = React.useState(false);

<ConfirmDialog
  open={open}
  title={<ConfirmDialog.Title>초기화하시겠어요?</ConfirmDialog.Title>}
  description={
    <ConfirmDialog.Description>
      입력한 모든 내용이 삭제됩니다.
    </ConfirmDialog.Description>
  }
  cancelButton={
    <ConfirmDialog.CancelButton onClick={() => setOpen(false)}>
      취소
    </ConfirmDialog.CancelButton>
  }
  confirmButton={
    <ConfirmDialog.ConfirmButton onClick={handleReset}>
      초기화
    </ConfirmDialog.ConfirmButton>
  }
  onClose={() => setOpen(false)}
/>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
