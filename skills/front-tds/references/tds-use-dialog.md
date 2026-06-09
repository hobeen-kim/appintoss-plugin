# useDialog (다이얼로그 훅)

```tsx
import { useDialog } from '@toss/tds-mobile';
```

## 설명
Alert/Confirm 다이얼로그를 명령형으로 표시하는 Overlay Extension 훅. 컴포넌트 선언 없이 함수 호출로 다이얼로그를 띄울 수 있음.

## 메서드

### openAlert
간단한 알림 다이얼로그. 사용자 확인만 필요한 경우.

```typescript
interface AlertOptions {
  title: React.ReactNode;                    // required
  description?: React.ReactNode;
  alertButton?: ReactElement | string;       // default: '확인'
  closeOnDimmerClick?: boolean;              // default: false
  onEntered?: () => void;                    // 열림 애니메이션 완료 콜백
  onExited?: () => void;                     // 닫힘 애니메이션 완료 콜백
}
```

### openConfirm
확인/취소 2버튼 다이얼로그. 사용자 결정이 필요한 경우.

```typescript
interface ConfirmOptions {
  title: React.ReactNode;                    // required
  description?: React.ReactNode;
  confirmButton?: ReactElement | string;     // default: '확인'
  cancelButton?: ReactElement | string;      // default: '취소'
  closeOnDimmerClick?: boolean;              // default: false
  onEntered?: () => void;
  onExited?: () => void;
}
```

### openAsyncConfirm
비동기 작업을 처리하는 확인 다이얼로그. 버튼 클릭 시 자동 로딩 상태 표시.

```typescript
interface AsyncConfirmOptions extends ConfirmOptions {
  onConfirmClick?: () => Promise<void>;
  confirmButtonLoadingPropName?: string;     // default: 'loading'
  onCancelClick?: () => Promise<void>;
  cancelButtonLoadingPropName?: string;      // default: 'loading'
}
```

## 사용 예시

```tsx
function Example() {
  const { openAlert, openConfirm, openAsyncConfirm } = useDialog();

  // 알림
  const handleAlert = () => {
    openAlert({
      title: '알려드릴게요',
      description: '작업이 완료됐어요.',
      alertButton: '확인하기',
    });
  };

  // 확인/취소
  const handleConfirm = () => {
    openConfirm({
      title: '삭제할까요?',
      description: '이 작업은 되돌릴 수 없어요.',
      confirmButton: '삭제하기',
      cancelButton: '취소',
    });
  };

  // 비동기 확인 (자동 로딩 상태)
  const handleAsync = () => {
    openAsyncConfirm({
      title: '상담을 종료할까요?',
      description: '상담을 종료하면 대화를 이어갈 수 없어요.',
      confirmButton: '종료하기',
      cancelButton: '취소',
      onConfirmClick: async () => {
        await api.endConsultation();
      },
    });
  };

  return (
    <>
      <Button onClick={handleAlert}>알림</Button>
      <Button onClick={handleConfirm}>확인</Button>
      <Button onClick={handleAsync}>비동기 확인</Button>
    </>
  );
}
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
