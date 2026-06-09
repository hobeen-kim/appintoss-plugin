# defineConfig (앱 설정)

```tsx
import { defineConfig } from '@apps-in-toss/web-framework/config';
```

## 설명
granite.config.ts에서 앱인토스 미니앱의 설정을 정의하는 함수.

## 인터페이스

```typescript
interface AppsInTossWebConfig {
  appName: string;                    // required - 콘솔에 등록한 앱 ID
  brand?: {
    displayName: string;              // 사용자에게 노출되는 앱 이름
    primaryColor: string;             // 주 색상 (hex) - 버튼/UI에 적용
    icon: string;                     // 콘솔에서 받은 로고 이미지 URL
  };
  permissions?: Permission[];         // 필요 권한 목록 ({name, access} 객체 배열)
  webViewProps?: {
    type?: 'game' | 'partner';        // 내비게이션 바 타입
    // 그 외 WebView 속성은 "WebView의 속성 제어하기" 문서 참고
  };
  web: {
    host?: string;                    // 개발 서버 호스트
    port: number;                     // required - 개발 서버 포트
    commands: {
      dev: string;                    // 개발 서버 실행 명령
      build: string;                  // 빌드 명령
    };
  };
  outdir?: string;                    // 빌드 산출물 디렉토리
}

// 권한 항목
interface Permission {
  name: 'clipboard' | 'contacts' | 'photos' | 'camera' | 'geolocation' | 'microphone';
  access: 'read' | 'write' | 'access';
}
```

## 사용 예시

```typescript
// granite.config.ts
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'my-fin-cal',
  brand: {
    displayName: '금융 계산기',
    primaryColor: '#3182F6',
    icon: '/icon.png',
  },
  permissions: [{ name: 'clipboard', access: 'read' }],
  webViewProps: {
    type: 'partner',
  },
  web: {
    host: '192.168.200.169',
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'tsc -b && vite build',
    },
  },
});
```

## 권한 목록 (permissions)
각 항목은 `{ name, access }` 객체입니다.
- `{ name: 'clipboard', access: 'read' | 'write' }` - 클립보드
- `{ name: 'geolocation', access: 'access' }` - 위치 정보
- `{ name: 'contacts', access: 'read' }` - 연락처
- `{ name: 'photos', access: 'read' }` - 사진 앨범
- `{ name: 'camera', access: 'access' }` - 카메라
- `{ name: 'microphone', access: 'access' }` - 마이크

---
> 검증: 2026-06-07 공홈 대조 [갱신됨: permissions를 `string[]` → `{name, access}[]` 객체 배열로 수정 / webViewProps.type을 `'partner'|'external'|'game'` → `'game'|'partner'`로 정정 / 공홈 미문서화 webViewProps 세부 옵션·default 표기 제거(공홈 "WebView 속성 제어" 문서로 위임). import 경로 @apps-in-toss/web-framework/config 공홈 일치] 근거: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Config.html
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
