# useBottomSheet (바텀시트 훅)

```tsx
import { useBottomSheet } from '@toss/tds-mobile';
```

## 설명
바텀시트를 명령형으로 표시하는 Overlay Extension 훅. 컴포넌트 선언 없이 함수 호출로 바텀시트를 띄울 수 있음.

## 메서드

### open(options)
기본 바텀시트. 콘텐츠와 헤더를 자유롭게 구성.

```typescript
interface BottomSheetOptions {
  children: React.ReactNode;                  // required - 시트 콘텐츠
  header?: React.ReactNode;                   // 타이틀
  closeOnDimmerClick?: boolean;               // default: true
  onEntered?: () => void;
  onExited?: () => void;
  onClose?: () => void;
  UNSAFE_disableFocusLock?: boolean;
  UNSAFE_ignoreDimmerClick?: boolean;
  UNSAFE_ignoreBackEvent?: boolean;
}
```

### close()
현재 표시된 바텀시트를 닫음.

### openOneButtonSheet(options)
단일 버튼 바텀시트.

```typescript
interface OneButtonOptions extends BottomSheetOptions {
  button?: string | ReactElement;             // default: '확인'
  closeOnButtonClick?: boolean;               // default: true
  topAccessory?: React.ReactNode;
  bottomAccessory?: React.ReactNode;
}
```

### openTwoButtonSheet(options)
이중 버튼 바텀시트. Promise 반환.

```typescript
interface TwoButtonOptions extends BottomSheetOptions {
  leftButton?: string | ReactElement;         // default: '취소'
  rightButton?: string | ReactElement;        // default: '확인'
  closeOnLeftButtonClick?: boolean;           // default: true
  closeOnRightButtonClick?: boolean;          // default: true
}
```

### openAsyncTwoButtonSheet(options)
비동기 작업 처리 이중 버튼 바텀시트. 버튼 클릭 시 자동 로딩 상태.

```typescript
interface AsyncTwoButtonOptions extends TwoButtonOptions {
  onLeftButtonClick?: () => Promise<void>;
  onRightButtonClick?: () => Promise<void>;
  leftButtonLoadingPropName?: string;         // default: 'loading'
  rightButtonLoadingPropName?: string;        // default: 'loading'
}
```

## 사용 예시

```tsx
function Example() {
  const { open, close, openOneButtonSheet, openTwoButtonSheet, openAsyncTwoButtonSheet } = useBottomSheet();

  // 기본 바텀시트
  const handleBasic = () => {
    open({
      header: '기본 바텀시트예요',
      children: <Paragraph typography="t6">콘텐츠 내용</Paragraph>,
      onClose: () => close(),
    });
  };

  // 단일 버튼
  const handleOneButton = () => {
    openOneButtonSheet({
      header: '안내',
      children: <Paragraph typography="t6">확인해주세요</Paragraph>,
      button: '확인',
    });
  };

  // 이중 버튼
  const handleTwoButton = async () => {
    await openTwoButtonSheet({
      header: '삭제할까요?',
      children: <Paragraph typography="t6">이 작업은 되돌릴 수 없어요</Paragraph>,
      leftButton: '취소',
      rightButton: '삭제',
    });
  };

  // 비동기 이중 버튼 (자동 로딩)
  const handleAsync = () => {
    openAsyncTwoButtonSheet({
      header: '결제를 취소할까요?',
      children: <Paragraph typography="t6">확인이 필요해요</Paragraph>,
      leftButton: '취소',
      rightButton: '확인',
      onRightButtonClick: async () => {
        await api.cancelPayment();
      },
    });
  };

  return (
    <>
      <Button onClick={handleBasic}>기본</Button>
      <Button onClick={handleOneButton}>단일 버튼</Button>
      <Button onClick={handleTwoButton}>이중 버튼</Button>
      <Button onClick={handleAsync}>비동기</Button>
    </>
  );
}
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
