# 이벤트 (graniteEvent, tdsEvent)

```tsx
import { graniteEvent, tdsEvent } from '@apps-in-toss/web-framework';
```

## graniteEvent

### backEvent
백 버튼(Android) 또는 스와이프 백(iOS) 이벤트.

```typescript
const cleanup = graniteEvent.addEventListener('backEvent', {
  onEvent: () => {
    // 백 버튼 처리 (예: 이전 페이지, 모달 닫기)
  },
  onError: (error) => {
    console.error(error);
  },
});
// 정리
cleanup();
```

### homeEvent
홈 버튼 이벤트.

```typescript
const cleanup = graniteEvent.addEventListener('homeEvent', {
  onEvent: () => {
    // 홈 버튼 처리
  },
  onError: (error) => {
    console.error(error);
  },
});
```

## tdsEvent

### navigationAccessoryEvent
TDS 네비게이션 바의 악세서리 버튼 클릭 이벤트.

```typescript
const cleanup = tdsEvent.addEventListener('navigationAccessoryEvent', {
  onEvent: ({ id }) => {
    if (id === 'heart') {
      router.push('/heart');
    }
  },
  onError: (error) => {
    console.error(error);
  },
});
```

## React에서 사용

```tsx
import { useEffect } from 'react';
import { graniteEvent } from '@apps-in-toss/web-framework';

function MyPage() {
  useEffect(() => {
    const cleanup = graniteEvent.addEventListener('backEvent', {
      onEvent: () => {
        // 커스텀 백 처리
        navigate(-1);
      },
      onError: () => {},
    });
    return cleanup; // 컴포넌트 언마운트 시 정리
  }, []);

  return <div>...</div>;
}
```

## 주의사항
- 반드시 cleanup 함수를 호출하여 이벤트 리스너를 정리할 것
- React에서는 useEffect의 cleanup으로 처리
