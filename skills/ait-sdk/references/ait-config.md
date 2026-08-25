# defineConfig (앱 설정) — SDK 3.x

```tsx
import { defineConfig } from '@apps-in-toss/web-framework/config';
```

## 설명

`apps-in-toss.config.ts`에서 앱인토스 미니앱의 설정을 정의하는 함수.

> **SDK 3.x 기준 문서다.** 파일명은 `apps-in-toss.config.ts`이며 `granite.config.ts`는 SDK 2.x 이름이다.
> 2.x 프로젝트를 3.x로 올릴 때는 `npx ait migrate v3`를 쓴다(설정 파일 변환 + package.json 스크립트 갱신 자동 처리).

## 인터페이스 (실측: web-framework 3.1.1 `dist/config.d.ts`)

```typescript
interface AppsInTossConfig {
  appName: string;                    // required - 콘솔에 등록한 앱 ID(케밥-케이스, 등록 후 변경 불가)
  brand: {
    primaryColor: string;             // required - 주 색상 (#RRGGBB)
  };
  permissions: Permission[];          // required - 필요 권한 목록 (빈 배열이라도 필수)
  navigationBar?: {
    withBackButton?: boolean;
    withHomeButton?: boolean;
    withTitle?: boolean;              // false면 내비게이션 바에서 아이콘+앱 이름을 함께 숨김
    transparentBackground?: boolean;
    theme?: 'light' | 'dark';
    initialAccessoryButton?: {        // 우측 기능 버튼(최대 1개)
      id: string;
      title: string;
      icon: { source: { uri: string } } | { name: string };
    };
  };
  webView?: {                         // 2.x의 webViewProps (type 프로퍼티는 삭제됨)
    allowsInlineMediaPlayback?: boolean;              // iOS, 기본 false
    bounces?: boolean;                                // iOS, 기본 true
    pullToRefreshEnabled?: boolean;                   // iOS, 기본 false (3.0.4부터 true→false로 변경)
    overScrollMode?: 'always' | 'content' | 'never';  // Android, 기본 'always'
    mediaPlaybackRequiresUserAction?: boolean;        // iOS/Android, 기본 true
    allowsBackForwardNavigationGestures?: boolean;    // iOS, 기본 true
  };
  webBundleDir?: string;              // 2.x의 outdir. 웹 번들 산출 디렉터리(기본 'dist')
}

// 권한 항목
interface Permission {
  name: 'clipboard' | 'contacts' | 'photos' | 'camera' | 'geolocation' | 'microphone';
  access: 'read' | 'write' | 'access';
}
```

**3.x에 없는 필드** — `brand.displayName`, `brand.icon`, `webViewProps`, `web`(`host`/`port`/`commands`), `outdir`.
앱 이름과 로고는 **콘솔 앱 정보가 단일 출처**이며 설정 파일에서 대조하지 않는다. 개발 서버 포트·빌드 명령은 `package.json` scripts로 옮겼다.

> 공홈 UI/UX 가이드(브랜딩 절)에는 아직 `granite.config.ts`의 `brand.displayName`·`brand.icon`을 입력하라는 2.x 표기가 남아 있다. 3.x 타입에는 해당 필드가 없으므로 **콘솔 등록값만 맞추면 된다**.

## 사용 예시

```typescript
// apps-in-toss.config.ts
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'my-fin-cal',
  brand: {
    primaryColor: '#3182F6',
  },
  permissions: [{ name: 'clipboard', access: 'read' }],
  navigationBar: {
    withBackButton: true,
    withTitle: true,
  },
  webView: {
    pullToRefreshEnabled: false,
    overScrollMode: 'never',
  },
  webBundleDir: 'dist',
});
```

```json
// package.json — 2.x의 web.commands가 여기로 이동
{
  "scripts": {
    "dev": "vite --port 3000",
    "build": "tsc -b && vite build && ait build"
  }
}
```

## 권한 목록 (permissions)

각 항목은 `{ name, access }` 객체다.

- `{ name: 'clipboard', access: 'read' | 'write' }` - 클립보드
- `{ name: 'geolocation', access: 'access' }` - 위치 정보
- `{ name: 'contacts', access: 'read' | 'write' }` - 연락처
- `{ name: 'photos', access: 'read' | 'write' }` - 사진 앨범
- `{ name: 'camera', access: 'access' }` - 카메라
- `{ name: 'microphone', access: 'access' }` - 마이크

## 2.x → 3.x 마이그레이션

```bash
npx ait migrate v3     # 설정 파일 변환 + package.json 스크립트 갱신
```

| 항목 | 2.x | 3.x |
|---|---|---|
| 설정 파일 | `granite.config.ts` | `apps-in-toss.config.ts` |
| brand | `displayName`·`primaryColor`·`icon` | `primaryColor`만 |
| WebView | `webViewProps`(+`type`) | `webView`(`type` 삭제) |
| 산출 디렉터리 | `outdir` | `webBundleDir` |
| 실행 명령 | `web.commands` | `package.json` scripts |
| 테스트 | 샌드박스 앱 설치·로그인 | 로컬 브라우저(AIT Devtools) |

**유의**: SDK 3.x 번들을 출시하면 2.x로 롤백할 수 없다. `localStorage`를 직접 쓰는 2.x 앱은 3.x로 올리면 기존 데이터에 접근할 수 없으므로(Storage API 사용 앱은 무관) 마이그레이션을 보류한다.

---
> 검증: 2026-08-25 공홈 + npm 실측 대조 [전면 개정: 3.x 스키마로 재작성 — `apps-in-toss.config.ts` 개명, brand는 primaryColor만, webView/navigationBar/webBundleDir 반영, web·outdir·displayName·icon 제거, `ait migrate v3` 추가. 실측 근거: `@apps-in-toss/web-framework@3.1.1` dist/config.d.ts] 근거: https://developers-apps-in-toss.toss.im/documentation/integration/sdk-3.x , https://developers-apps-in-toss.toss.im/documentation/integration/props
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
