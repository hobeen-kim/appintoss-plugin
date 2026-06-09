# SafeAreaInsets (안전 영역)

```tsx
import { SafeAreaInsets } from '@apps-in-toss/web-framework';
```

## 설명
디바이스의 안전 영역(노치, Dynamic Island 등) 정보를 제공합니다.

## 메서드

### get
현재 Safe Area Inset 값을 가져옵니다.

```typescript
SafeAreaInsets.get(): SafeAreaInsets;

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}
```

### subscribe
화면 모드 변경 시 Safe Area 변경 이벤트를 구독합니다.

```typescript
SafeAreaInsets.subscribe({
  onEvent: (insets: SafeAreaInsets) => void;
}): () => void;  // cleanup 함수 반환
```

## 사용 예시

```tsx
import { useEffect, useState } from 'react';
import { SafeAreaInsets } from '@apps-in-toss/web-framework';

function useInsets() {
  const [insets, setInsets] = useState(SafeAreaInsets.get());

  useEffect(() => {
    const cleanup = SafeAreaInsets.subscribe({
      onEvent: (newInsets) => setInsets(newInsets),
    });
    return cleanup;
  }, []);

  return insets;
}

function MyComponent() {
  const insets = useInsets();

  return (
    <div style={{ paddingBottom: insets.bottom }}>
      콘텐츠
    </div>
  );
}
```

---
> 검증: 2026-06-07 공홈 대조 [일치: SafeAreaInsets.get()·subscribe({onEvent}) → cleanup 반환, 인터페이스 {top, bottom, left, right}, import @apps-in-toss/web-framework 모두 공홈 일치. 참고: getSafeAreaInsets는 SDK 1.4.7부터 deprecated(top/bottom만 반환)] 근거: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면%20제어/safe-area.html
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
