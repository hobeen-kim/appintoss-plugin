# 권한 (Permissions)

```tsx
import {
  fetchAlbumPhotos,
  openCamera,
  fetchContacts,
  getCurrentLocation,
  startUpdateLocation,
  setClipboardText,
  getClipboardText,
} from '@apps-in-toss/web-framework';
```

## 권한 상태

```typescript
type PermissionStatus = 'notDetermined' | 'denied' | 'allowed' | 'osPermissionDenied';
// osPermissionDenied: OS/앱 설정 레벨에서 권한이 거부된 상태
```

## 카메라

```typescript
openCamera(options?: OpenCameraOptions): Promise<ImageResponse>;
openCamera.getPermission(): Promise<PermissionStatus>;
openCamera.openPermissionDialog(): Promise<'denied' | 'allowed'>;
```

## 사진 앨범

```typescript
fetchAlbumPhotos(options?: FetchAlbumPhotosOptions): Promise<ImageResponse[]>;
fetchAlbumPhotos.getPermission(): Promise<PermissionStatus>;
fetchAlbumPhotos.openPermissionDialog(): Promise<'denied' | 'allowed'>;
```

## 연락처

```typescript
fetchContacts(options: FetchContactsOptions): Promise<ContactResult>;
```

## 위치

```typescript
getCurrentLocation(options: GetCurrentLocationOptions): Promise<Location>;

// 실시간 위치 업데이트
startUpdateLocation(params: StartUpdateLocationEventParams): () => void;
startUpdateLocation.getPermission(): Promise<PermissionStatus>;
startUpdateLocation.openPermissionDialog(): Promise<'denied' | 'allowed'>;
```

## 클립보드

```typescript
setClipboardText(text: string): Promise<void>;
getClipboardText(): Promise<string>;
```

## 사용 패턴

```tsx
// 1. 권한 확인
const status = await openCamera.getPermission();

// 2. 권한 미결정이면 요청
if (status === 'notDetermined') {
  const result = await openCamera.openPermissionDialog();
  if (result === 'denied') return;
}

// 3. 거부 상태면 안내
if (status === 'denied') {
  // 설정에서 권한을 허용해달라는 안내 표시
  return;
}

// 4. 기능 실행
const image = await openCamera();
```

## apps-in-toss.config.ts 등록 (SDK 2.x 프로젝트는 `granite.config.ts`)
사용할 권한은 반드시 config에 등록해야 합니다. `{ name, access }` 객체 배열로 지정합니다.

```typescript
defineConfig({
  permissions: [
    { name: 'camera', access: 'access' },
    { name: 'photos', access: 'read' },
    { name: 'geolocation', access: 'access' },
  ],
  // ...
});
```

### 권한 이름(name)과 접근 타입(access)
| name | access | 관련 함수 |
|------|--------|-----------|
| `clipboard` | `read` | `getClipboardText` |
| `clipboard` | `write` | `setClipboardText` |
| `contacts` | `read` | `fetchContacts` |
| `photos` | `read` | `fetchAlbumPhotos` |
| `camera` | `access` | `openCamera` |
| `geolocation` | `access` | `getCurrentLocation`, `startUpdateLocation`, `useGeolocation` |
| `microphone` | `access` | - |

---
> 검증: 2026-06-07 공홈 대조 [갱신됨: PermissionStatus에 `osPermissionDenied` 추가 / config의 permissions를 문자열 배열이 아닌 `{name, access}` 객체 배열로 수정, name/access 매핑표 추가(microphone 포함). 권한 함수명(openCamera/fetchAlbumPhotos/fetchContacts/getCurrentLocation/startUpdateLocation/getClipboardText/setClipboardText)은 공홈 일치] 근거: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/권한/permission.html , .../카메라/openCamera.html
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
