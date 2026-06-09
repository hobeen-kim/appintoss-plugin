# Partner API (네비게이션 악세서리)

```tsx
import { partner, tdsEvent } from '@apps-in-toss/web-framework';
```

## 설명
TDS 네비게이션 바에 커스텀 악세서리 버튼을 추가/제거하는 API.

## 메서드

### addAccessoryButton
```typescript
partner.addAccessoryButton(options: AddAccessoryButtonOptions): Promise<void>;

interface AddAccessoryButtonOptions {
  id: string;                    // 버튼 식별자
  title: string;                 // 버튼 텍스트
  icon: { name: string };        // 아이콘 이름
}
```

### removeAccessoryButton
```typescript
partner.removeAccessoryButton(): Promise<void>;
```

## 사용 예시

```tsx
import { useEffect } from 'react';
import { partner, tdsEvent } from '@apps-in-toss/web-framework';

function MyPage() {
  useEffect(() => {
    // 악세서리 버튼 추가
    partner.addAccessoryButton({
      id: 'bookmark',
      title: '북마크',
      icon: { name: 'icon-heart-mono' },
    });

    // 버튼 클릭 이벤트 핸들링
    const cleanup = tdsEvent.addEventListener('navigationAccessoryEvent', {
      onEvent: ({ id }) => {
        if (id === 'bookmark') {
          toggleBookmark();
        }
      },
      onError: () => {},
    });

    return () => {
      cleanup();
      partner.removeAccessoryButton();
    };
  }, []);

  return <div>...</div>;
}
```

---
> 검증: 2026-06-07 공홈 대조 [공홈 미검증: partner.addAccessoryButton/removeAccessoryButton 및 tdsEvent.navigationAccessoryEvent는 공홈 SDK reference(bedrock/reference/framework)에서 페이지·함수명 확인 불가. WebSearch로도 미노출. 번들 문서 원본 유지하되 사용 전 반드시 공홈/실제 SDK 타입 정의로 확인할 것. 내비게이션 바 커스터마이징은 공홈 "NavigationBar" 문서 참고 권장] 근거: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/시작하기/overview.html
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
