# 딥링크 & 페이지 네비게이션

## 앱 내 라우팅 (react-router-dom)

```tsx
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:id" element={<Category />} />
        <Route path="/calculator/:type" element={<Calculator />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## 네이티브 백 버튼 처리

Android 백 버튼/iOS 스와이프 백을 커스텀 처리할 수 있습니다.

```tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { graniteEvent } from '@apps-in-toss/web-framework';

function useBackHandler(handler?: () => void) {
  const navigate = useNavigate();

  useEffect(() => {
    const cleanup = graniteEvent.addEventListener('backEvent', {
      onEvent: () => {
        if (handler) {
          handler();
        } else {
          navigate(-1);
        }
      },
      onError: () => {},
    });
    return cleanup;
  }, [handler, navigate]);
}

// 사용
function CalculatorPage() {
  useBackHandler(); // 기본: 이전 페이지로

  // 또는 커스텀 동작
  useBackHandler(() => {
    if (hasUnsavedChanges) {
      showConfirmDialog();
    } else {
      navigate(-1);
    }
  });
}
```

## 네비게이션 악세서리 버튼

TDS 네비게이션 바 우측에 커스텀 버튼을 추가합니다.

```tsx
import { partner, tdsEvent } from '@apps-in-toss/web-framework';

useEffect(() => {
  partner.addAccessoryButton({
    id: 'share',
    title: '공유',
    icon: { name: 'icon-share-mono' },
  });

  const cleanup = tdsEvent.addEventListener('navigationAccessoryEvent', {
    onEvent: ({ id }) => {
      if (id === 'share') {
        shareResult();
      }
    },
    onError: () => {},
  });

  return () => {
    cleanup();
    partner.removeAccessoryButton();
  };
}, []);
```

## 주의사항
- 앱 내 라우팅은 react-router-dom 사용
- 외부 링크는 제한적 허용 (법률 고지, 공공기관, 단순 정보 확인용만). 주요 기능이 외부 링크에 의존하면 안 됨
- 백 버튼 이벤트 리스너는 반드시 cleanup 처리
