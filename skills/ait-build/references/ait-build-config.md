# 빌드 설정 파일

## apps-in-toss.config.ts (SDK 3.x)

앱인토스 앱의 메인 설정 파일. `defineConfig`로 정의한다. SDK 2.x의 이름은 `granite.config.ts`이며, 전환은 `npx ait migrate v3`로 한다.

```typescript
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'my-fin-cal',           // 콘솔에 등록한 앱 ID(케밥-케이스, 등록 후 변경 불가)
  brand: {
    primaryColor: '#3182F6',       // 브랜드 기본 색상 (#RRGGBB)
  },
  permissions: [],                 // 런타임 권한 (빈 배열이라도 필수)
  navigationBar: {                 // 선택
    withBackButton: true,
    withTitle: true,
  },
  webView: {                       // 선택 (2.x webViewProps)
    pullToRefreshEnabled: false,
    overScrollMode: 'never',
  },
  webBundleDir: 'dist',            // 선택 (2.x outdir), 기본 'dist'
});
```

전체 스키마와 필드별 기본값은 `ait-sdk/references/ait-config.md` 참조.

**3.x에 없는 필드** — `brand.displayName`, `brand.icon`, `webViewProps`, `web.host/port/commands`, `outdir`.
앱 이름·로고는 **콘솔 앱 정보가 단일 출처**이고, 개발 서버 포트와 빌드 명령은 `package.json` scripts에 있다.

### permissions 예시

```typescript
permissions: [
  { name: 'clipboard', access: 'read' },
  { name: 'clipboard', access: 'write' },
  { name: 'camera', access: 'access' },
  { name: 'photos', access: 'read' },
],
```

## package.json (2.x의 web.commands 이동처)

```json
{
  "scripts": {
    "dev": "vite --port 5173",
    "build": "tsc -b && vite build && ait build"
  }
}
```

`build`에 `vite build`와 `ait build`가 **모두** 들어가야 한다. `ait build`만 실행하면 기존 `dist/`를 그대로 포장한다.

## vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import aitDevtools from '@apps-in-toss/devtools/unplugin';

export default defineConfig({
  plugins: [
    aitDevtools.vite(),   // 로컬 브라우저 테스트 도구 (3.x)
    react(),
  ],
  server: {
    host: true,  // 네트워크 접근 허용
  },
});
```

`@apps-in-toss/devtools`는 3.x 스캐폴드·`ait migrate v3` 시 자동 설정된다. 3.0.1에서 올라온 프로젝트만 수동 설치(`npm i -D @apps-in-toss/devtools`)가 필요하다. 다른 번들러는 `aitDevtools.webpack()` 등 어댑터를 쓴다.

## tsconfig.app.json (주요 옵션)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "moduleResolution": "bundler"
  }
}
```

## 빌드 시 검증되는 항목

`ait build`(3.0.4+)는 `appName`·`brand`·`webBundle` 설정을 검증한다. 값이 없거나 형식이 틀리면 빌드가 실패한다.

---
> 검증: 2026-08-25 공홈 + npm 실측 대조 [전면 개정: 3.x 스키마로 재작성. granite.config.ts→apps-in-toss.config.ts, displayName·icon·web·outdir·webViewProps 제거, navigationBar·webView·webBundleDir 반영, AIT Devtools 플러그인·빌드 검증 추가. 실측: @apps-in-toss/web-framework@3.1.1] 근거: https://developers-apps-in-toss.toss.im/documentation/integration/sdk-3.x , https://developers-apps-in-toss.toss.im/release-note/release-note
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
