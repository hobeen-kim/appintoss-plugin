# 데이터 / 파일 (Data & File)

```tsx
// WebView
import { saveBase64Data, openPDFViewer, fetchAlbumItems } from '@apps-in-toss/web-framework';
// React Native
import { saveBase64Data, openPDFViewer, fetchAlbumItems } from '@apps-in-toss/framework';
```

## 설명
Base64 데이터 저장, PDF 뷰어, 앨범(사진/동영상) 선택 등 데이터·파일 관련 API 모음.

## API

### saveBase64Data
Base64로 인코딩된 데이터를 지정한 파일명·MIME 타입으로 사용자 기기에 저장합니다.
```typescript
function saveBase64Data(params: {
  data: string;      // Base64 인코딩 문자열
  fileName: string;  // 저장할 파일명
  mimeType: string;  // 예: 'image/png'
}): Promise<void>;
```
- import: WebView `@apps-in-toss/web-framework`, RN `@apps-in-toss/framework`
- 이미지·텍스트·PDF 등 다양한 포맷 지원
- 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/데이터/saveBase64Data.md

```tsx
try {
  await saveBase64Data({
    data: base64String,
    fileName: 'result.png',
    mimeType: 'image/png',
  });
} catch (error) {
  console.error('저장 실패:', error);
}
```

### openPDFViewer
Base64 PDF 데이터를 네이티브 PDF 뷰어로 엽니다. — SDK 2.6.0 도입 (플랜 제공 정보, 공홈 문서에는 토스 앱 5.261.0 이상 요구만 명시)
```typescript
function openPDFViewer(params: {
  data: string;       // Base64 인코딩된 PDF 데이터 (필수)
  filename?: string;  // 파일명 (선택)
}): Promise<'CLOSE'>;
```
- import: WebView `@apps-in-toss/web-framework`, RN `@apps-in-toss/framework`
- 사용자가 뷰어를 닫으면 `'CLOSE'` 반환
- 에러 코드: `INVALID_REQUEST`(잘못된 요청) / `INVALID_DATA`(잘못된 PDF 데이터) / `PDF_VIEWER_ERROR`(뷰어 오류) / `UNSUPPORTED_APP_VERSION`(토스 앱 5.261.0 미만)
- 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/PDF/openPDFViewer.md

```tsx
try {
  const result = await openPDFViewer({
    data: 'JVBERi0xLjQK...',
    filename: 'document.pdf',
  });
  if (result === 'CLOSE') {
    console.log('PDF 뷰어가 닫혔어요.');
  }
} catch (error) {
  console.error('PDF 뷰어 오류:', error);
}
```

### fetchAlbumItems
기기 앨범에서 사진/동영상을 선택받아 가져옵니다. — SDK 2.6.0 도입 (플랜 제공 정보, 공홈 문서에는 토스 앱 5.261.0 이상 요구만 명시)
```typescript
function fetchAlbumItems(options?: {
  types?: ('PHOTO' | 'VIDEO')[];  // 선택 가능 미디어 타입
  maxCount?: number;              // 최대 선택 개수
  maxWidth?: number;              // 미디어 최대 너비
  base64?: boolean;               // base64 인코딩 반환 여부
}): Promise<AlbumItemResponse[]>;

interface AlbumItemResponse {
  id: string;                 // 미디어 고유 식별자
  dataUri: string;            // 선택된 미디어의 data URI
  type: 'PHOTO' | 'VIDEO';
}
```
- import: WebView `@apps-in-toss/web-framework`, RN `@apps-in-toss/framework`
- 사용자가 선택을 취소하면 빈 배열 `[]` 반환
- 에러 코드: `NOT_ALLOWED`(앨범 접근 권한 거부) / `INVALID_REQUEST` / `INVALID_DATA` / `UNSUPPORTED_APP_VERSION`(토스 앱 5.261.0 미만)
- 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/사진/fetchAlbumItems.md

```tsx
try {
  const items = await fetchAlbumItems({
    types: ['PHOTO', 'VIDEO'],
    maxCount: 5,
    base64: true,
  });

  if (items.length === 0) {
    console.log('선택이 취소되었어요.');
    return;
  }

  items.forEach((item) => {
    console.log(item.type, item.id);
  });
} catch (error) {
  console.error('앨범 조회 오류:', error.code);
}
```

## 주의사항
- `openPDFViewer`·`fetchAlbumItems`는 토스 앱 5.261.0 이상 필요 → `UNSUPPORTED_APP_VERSION` 에러 핸들링 필수
- `fetchAlbumItems`는 앨범 권한 거부 시 `NOT_ALLOWED` 에러 → 권한 거부 UX 대비
- 취소(빈 배열)와 에러(throw)는 다른 경로 — 둘 다 처리할 것
- 대용량 미디어를 `base64: true`로 받으면 메모리 부담 → `maxWidth`로 제한 권장

## 출처
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/데이터/saveBase64Data.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/PDF/openPDFViewer.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/사진/fetchAlbumItems.md

---
> 검증: 2026-06-10 공홈 대조 [일치: 3개 API 시그니처·파라미터·반환 타입·에러 코드 모두 공홈 fetch 결과 기준 작성 / 도입 버전(2.6.0)은 공홈 미확인 — 릴리즈 노트 조회 실패 (2026-06-10)]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
