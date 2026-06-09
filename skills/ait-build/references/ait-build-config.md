# 빌드 설정 파일

## granite.config.ts
앱인토스 앱의 메인 설정 파일. `defineConfig`로 정의합니다.

```typescript
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'my-fin-cal',          // 콘솔에 등록한 앱 ID
  brand: {
    displayName: '금융 계산기',    // 사용자에게 노출될 앱 이름
    primaryColor: '#3182F6',       // 브랜드 기본 색상 (hex)
    icon: 'https://static.toss.im/icons/png/4x/icon-person-man.png', // 콘솔에서 업로드한 이미지의 URL
  },
  web: {
    host: 'localhost',             // 개발 서버 호스트
    port: 5173,                    // 개발 서버 포트
    commands: {
      dev: 'vite',                 // 실행 명령어
      build: 'tsc -b && vite build', // 빌드 명령어
    },
  },
  permissions: [],                 // 런타임 권한
  outdir: 'dist',                  // 빌드 산출물 경로
  webViewProps: {
    type: 'partner',              // 'game' | 'partner' (게임 또는 비게임)
  },
});
```

### defineConfig 전체 스키마 (공홈 기준)

```typescript
interface defineConfig {
  appName: string;        // 콘솔에 등록한 앱 ID
  brand: {
    displayName: string;  // 사용자에게 노출될 앱 이름
    primaryColor: string; // 브랜드 기본 색상 (hex)
    icon: string;         // 콘솔에서 업로드한 이미지의 URL
  };
  web: {
    host: string;         // 개발 서버 호스트
    port: number;         // 개발 서버 포트
    commands: {
      dev: string;        // 실행 명령어
      build: string;      // 빌드 명령어
    };
  };
  permissions: Permission[]; // 런타임 권한
  outdir: string;         // 빌드 산출물 경로
  webViewProps: {
    type: 'game' | 'partner'; // 게임 또는 비게임
  };
}
```

### permissions 예시 (공홈)

```typescript
permissions: [
  { name: 'clipboard', access: 'read' },
  { name: 'clipboard', access: 'write' },
  { name: 'camera', access: 'access' },
  { name: 'photos', access: 'read' },
],
```

## vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // 네트워크 접근 허용
  },
});
```

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

## .granite/app.json
granite build 시 자동 생성되는 앱 메타데이터.

```json
{
  "appName": "my-fin-cal",
  "permissions": []
}
```

---
> 검증: 2026-06-07 공홈 대조 [갱신됨: defineConfig 스키마에 outdir 필드 추가, webViewProps.type = 'game' | 'partner' 명시, brand.icon은 로컬 경로가 아닌 콘솔 업로드 이미지 URL, permissions 객체 예시 추가 — 근거: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Config.html]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
