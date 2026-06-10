# Share (공유)

```tsx
import { share, getTossShareLink } from '@apps-in-toss/web-framework';
// React Native: import { share, getTossShareLink } from '@apps-in-toss/framework';
```

## 설명
네이티브 공유 시트 호출(`share`)과 토스 앱으로 연결되는 공유 링크 생성(`getTossShareLink`) API.

## 메서드

### share — 네이티브 공유 시트 띄우기
> 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/공유/share.md
```typescript
function share(message: { message: string }): Promise<void>;
```
- `message.message` (string, 필수): 공유할 텍스트 내용
- 반환: 공유 동작 완료 시 resolve되는 `Promise<void>`
- Android/iOS 네이티브 공유 시트를 띄워 사용자가 공유할 앱을 선택

### getTossShareLink — 토스 공유 링크 생성
> 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/공유/getTossShareLink.md
```typescript
function getTossShareLink(url: string, ogImageUrl?: string): Promise<string>;
```
- `url` (string, 필수): `intoss://<app-name>` 또는 `intoss://<app-name>/path?query=param` 형식의 딥링크
- `ogImageUrl` (string, 선택): 외부 플랫폼 공유 시 표시될 OG 미리보기 이미지 — 절대 HTTPS URL
- 반환: 토스 앱에서 해당 딥링크 경로를 여는 공유 가능한 링크 문자열. 토스 앱 미설치 시 앱스토어(iOS)/플레이스토어(Android)로 리다이렉트

## 사용 예시

```tsx
import { share, getTossShareLink } from '@apps-in-toss/web-framework';

// 1. 토스 공유 링크 생성 후 공유 시트로 전달
const handleShare = async () => {
  try {
    const tossLink = await getTossShareLink(
      'intoss://my-app',
      'https://static.toss.im/icons/png/4x/icon-share-dots-mono.png',
    );
    await share({ message: `내 앱을 확인해보세요! ${tossLink}` });
  } catch (error) {
    console.error('공유 실패:', error);
  }
};
```

## 주의사항
- `share`는 try-catch로 에러 처리 권장
- OG 이미지 URL은 반드시 절대 HTTPS 경로여야 함
- 외부 플랫폼은 OG 메타데이터를 캐싱하므로 변경이 즉시 반영되지 않을 수 있음
- 정식 `intoss://` 스킴은 앱 출시 이후에만 동작 — 출시 전 테스트는 `_deploymentId` 파라미터가 붙은 테스트 스킴 사용

## 출처
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/공유/share.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/공유/getTossShareLink.md

---
> 검증: 2026-06-10 공홈 대조 [share·getTossShareLink 시그니처·파라미터·반환 타입·import 경로 모두 공홈 fetch 확인]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
