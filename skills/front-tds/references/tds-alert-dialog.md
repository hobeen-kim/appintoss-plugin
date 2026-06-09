# AlertDialog (알림 다이얼로그)

```tsx
import { AlertDialog } from '@toss/tds-mobile';
```

## Props

```typescript
interface AlertDialogProps {
  open?: boolean;                    // default: false
  title?: React.ReactNode;
  description?: React.ReactNode;
  alertButton?: React.ReactNode;     // 확인 버튼
  closeOnDimmerClick?: boolean;      // default: true
  closeOnBackEvent?: boolean;        // default: true
  onClose: () => void;               // required
  onEntered?: () => void;
  onExited?: () => void;
  portalContainer?: HTMLElement;     // default: document.body
}
```

## 서브 컴포넌트

### AlertDialog.Title
```typescript
{ as?: string; color?: string; typography?: string; fontWeight?: string }
// defaults: 'h3', 'adaptive.grey800', 't4', 'bold'
```

### AlertDialog.Description
```typescript
{ as?: string; color?: string; typography?: string; fontWeight?: string }
// defaults: 'h3', 'adaptive.grey600', 't6', 'medium'
```

### AlertDialog.AlertButton
```typescript
{ size?: string; color?: string; fontWeight?: string; variant?: "arrow" | "underline" | "clear" }
// defaults: 'medium', colors.blue500, 'bold'
```

## 사용 예시

```tsx
const [open, setOpen] = React.useState(false);

// 기본
<AlertDialog
  open={open}
  title={<AlertDialog.Title>알림</AlertDialog.Title>}
  description={<AlertDialog.Description>처리가 완료되었어요.</AlertDialog.Description>}
  alertButton={
    <AlertDialog.AlertButton onClick={() => setOpen(false)}>
      확인
    </AlertDialog.AlertButton>
  }
  onClose={() => setOpen(false)}
/>

// 설명 없이
<AlertDialog
  open={open}
  title={<AlertDialog.Title>저장되었어요</AlertDialog.Title>}
  alertButton={
    <AlertDialog.AlertButton onClick={() => setOpen(false)}>확인</AlertDialog.AlertButton>
  }
  onClose={() => setOpen(false)}
/>

// 딤 클릭 닫기 비활성화 (wiggle 애니메이션)
<AlertDialog
  open={open}
  closeOnDimmerClick={false}
  title={<AlertDialog.Title>필수 확인</AlertDialog.Title>}
  alertButton={<AlertDialog.AlertButton onClick={() => setOpen(false)}>확인</AlertDialog.AlertButton>}
  onClose={() => setOpen(false)}
/>
```

---
> 검증: 2026-06-07 공홈 대조 [일치: props·서브컴포넌트(Title/Description/AlertButton) 일치. 서브컴포넌트 세부 기본값은 공홈 미명시 — 본 문서 값은 참고용]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
