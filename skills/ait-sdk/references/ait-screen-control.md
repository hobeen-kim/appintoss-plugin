# 화면 제어 (Screen Control)

```tsx
// WebView
import { setDeviceOrientation, setScreenAwakeMode, generateHapticFeedback } from '@apps-in-toss/web-framework';
// React Native
import { setSecureScreen, setIosSwipeGestureEnabled } from '@apps-in-toss/framework';
import { closeView, useBackEvent, useParams } from '@granite-js/react-native';
```

## 설명
화면 방향·꺼짐 방지·캡처 차단·뒤로 가기·파라미터 등 미니앱 화면 동작을 제어하는 API 모음.

## API

### setDeviceOrientation
화면 방향(세로/가로)을 설정합니다.
```typescript
function setDeviceOrientation(options: {
  type: 'portrait' | 'landscape';
}): Promise<void>;
```
- import: WebView `@apps-in-toss/web-framework`, RN `@apps-in-toss/framework`
- 앱 전체에 영향 → 특정 화면에서만 쓸 경우 화면 이탈 시 원복 필요
- 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/setDeviceOrientation.md

```tsx
useEffect(() => {
  setDeviceOrientation({ type: 'landscape' });
  return () => {
    setDeviceOrientation({ type: 'portrait' });
  };
}, []);
```

### setScreenAwakeMode
화면 꺼짐 방지(상시 켜짐) 모드를 설정합니다.
```typescript
function setScreenAwakeMode(options: {
  enabled: boolean;
}): Promise<{ enabled: boolean }>;
```
- import: WebView `@apps-in-toss/web-framework`, RN `@apps-in-toss/framework`
- 앱 전체에 영향. 앱 이탈 시 자동 해제될 수 있음
- 미디어·웹툰·영상·문서 열람 화면에 적합
- 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/setScreenAwakeMode.md

```tsx
useEffect(() => {
  setScreenAwakeMode({ enabled: true });
  return () => {
    setScreenAwakeMode({ enabled: false });
  };
}, []);
```

### setSecureScreen
네이티브 레벨에서 화면 캡처를 차단/허용합니다.
```typescript
function setSecureScreen(options: {
  enabled: boolean;
}): Promise<{ enabled: boolean }>;
```
- import: `@apps-in-toss/framework` (공홈 문서는 RN 예시만 제공)
- 화면 단위 적용 가능. 잔액·거래내역 등 민감 정보 화면에 사용
- 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/setSecureScreen.md

```tsx
useEffect(() => {
  setSecureScreen({ enabled: true });
  return () => {
    setSecureScreen({ enabled: false });
  };
}, []);
```

### closeView
현재 화면(미니앱 뷰)을 닫습니다.
```typescript
function closeView(): Promise<void>;
```
- import: `@granite-js/react-native` (공홈 문서 기준)
- 파라미터 없음. 닫기 버튼으로 서비스 종료 시 사용
- 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/closeView.md

```tsx
import { Button } from 'react-native';
import { closeView } from '@granite-js/react-native';

function CloseButton() {
  return <Button title="닫기" onPress={closeView} />;
}
```

### useBackEvent
뒤로 가기 이벤트를 등록/제거하는 컨트롤러를 반환하는 Hook.
```typescript
function useBackEvent(): {
  addEventListener(callback: () => void): void;
  removeEventListener(callback: () => void): void;
};
```
- import: `@granite-js/react-native`
- 화면이 보이는 동안에만 동작 (내부적으로 useVisibility 사용)
- 등록한 콜백은 cleanup에서 `removeEventListener`로 반드시 해제
- 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/useBackEvent.md

```tsx
const backEvent = useBackEvent();

useEffect(() => {
  const callback = () => Alert.alert('back');
  backEvent.addEventListener(callback);
  return () => {
    backEvent.removeEventListener(callback);
  };
}, [backEvent]);
```

### useParams
현재 라우트의 쿼리 파라미터를 파싱·검증해 반환하는 Hook.
```typescript
function useParams<TScreen extends keyof RegisterScreen>(options: {
  from: TScreen;
  strict?: true;
}): RegisterScreen[TScreen];
```
- import: `@granite-js/react-native` (createRoute와 함께 사용)
- `from`: 파라미터를 가져올 라우트 경로 / `strict: false`면 현재 라우트 파라미터를 검증 없이 반환
- `createRoute`의 `validateParams`(검증)·`parserParams`(전처리)와 연동. Zod/Valibot 스키마 사용 가능
- 쿼리스트링은 숫자·문자열·배열·객체로 자동 파싱. 중복 키(`age=10&age=20`)는 배열 `{ age: [10, 20] }`
- 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/useParams.md

```tsx
// Route 객체로 사용 (권장)
const params = Route.useParams();

// 직접 사용
const params = useParams({ from: '/examples/use-params' });

// strict 해제
const params = useParams({ strict: false }) as { id: string };
```

### setIosSwipeGestureEnabled
iOS 스와이프 뒤로 가기 제스처를 켜고 끕니다.
```typescript
function setIosSwipeGestureEnabled(options: {
  isEnabled: boolean;
}): Promise<void>;
```
- import: `@apps-in-toss/framework` (공홈 문서는 RN 예시만 제공)
- iOS 전용. Android에는 영향 없음
- 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/setIosSwipeGestureEnabled.md

```tsx
<Button title="스와이프 끄기" onPress={() => setIosSwipeGestureEnabled({ isEnabled: false })} />
<Button title="스와이프 켜기" onPress={() => setIosSwipeGestureEnabled({ isEnabled: true })} />
```

## 주의사항
- `setDeviceOrientation`, `setScreenAwakeMode`는 앱 전체 설정 → useEffect cleanup으로 원복하는 패턴 필수
- `closeView`, `useBackEvent`, `useParams`는 공홈 문서상 `@granite-js/react-native` import — WebView 환경 제공 여부는 공홈에서 별도 확인 필요
- `useBackEvent` 콜백을 해제하지 않으면 중복 등록됨

## 출처
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/setDeviceOrientation.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/setScreenAwakeMode.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/setSecureScreen.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/closeView.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/useBackEvent.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/useParams.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/setIosSwipeGestureEnabled.md

---
> 검증: 2026-06-10 공홈 대조 [일치: 7개 API 시그니처·파라미터·반환 타입 모두 공홈 fetch 결과 기준 작성]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
