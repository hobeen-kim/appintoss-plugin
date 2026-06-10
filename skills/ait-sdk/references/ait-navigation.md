# 화면 이동 (Navigation)

```tsx
// WebView
import { openURL } from '@apps-in-toss/web-framework';
// React Native
import { openURL, useNavigation, createRoute } from '@granite-js/react-native';
```

## 설명
외부 URL 열기와 미니앱 내 화면 간 이동(라우팅)을 다루는 API 모음.

## API

### openURL
URL을 기기 기본 브라우저 또는 연결된 앱으로 엽니다.
```typescript
function openURL(url: string): Promise<any>;
```
- import: WebView `@apps-in-toss/web-framework`, RN `@granite-js/react-native`
- 내부적으로 React Native `Linking.openURL` 사용
- WebView 환경은 새 브라우저 탭, 네이티브는 외부 앱/브라우저로 전환
- 잘못된 스킴·열 수 없는 URL이면 Promise reject → try-catch 권장
- 딥링크도 지원: `openURL('intoss://{appName}')`
- 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 이동/openURL.md

```tsx
import { openURL } from '@apps-in-toss/web-framework';

function Page() {
  const handlePress = () => {
    openURL('https://google.com');
  };
  return <button onClick={handlePress}>구글 웹사이트 열기</button>;
}
```

### Routing (화면 간 이동)
- RN: React Navigation 기반. WebView: 프로젝트에 설정된 웹 라우터(예: React Router) 규칙을 따름
- 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 이동/routing.md

**라우트 정의 (createRoute)**
```tsx
export const Route = createRoute('/page-a', {
  validateParams: (params) => params,
  component: PageA,
});
```

**이동 (useNavigation)**
```tsx
const navigation = useNavigation();

navigation.navigate('/page-b');
navigation.navigate('/page-c', { message: '안녕!', date: new Date().getTime() });
```

**뒤로 가기**
```tsx
if (navigation.canGoBack()) {
  navigation.goBack();
}
```

**내비게이션 상태 리셋**
```tsx
import { CommonActions } from '@granite-js/native/@react-navigation/native';

navigation.dispatch((state) => {
  return CommonActions.reset({
    ...state,
    index: 0,
    routes: state.routes.filter((route) => route.name === '/page-a'),
  });
});
```

**파라미터 수신**
```tsx
const params = Route.useParams(); // createRoute.validateParams로 타입 안전 보장
```

- `pages/` 디렉토리에 파일 추가 시 개발 모드에서 `src/router.gen.ts` 타입 자동 생성

## 외부링크 정책 (심사 필수 사항)
외부 이동은 토스 심사 정책의 제약을 받는다. 정책 문서: https://developers-apps-in-toss.toss.im/checklist/miniapp-external-link.md

**금지되는 외부 이동** (위반 시 노출 제한~서비스 중단 제재):
- 결제 처리를 외부로 유도
- 앱 다운로드·설치 페이지로 이동
- 핵심 서비스 기능·플로우를 외부에서 수행
- 자사 홍보용 랜딩 페이지 이동
- "앱 내 기능으로 등록한 서비스를 미니앱 내에서 모두 경험할 수 없는 형태" (공홈 원문)

**허용되는 외부 이동** (제한적 예외):
- 법적 고지·필수 공시
- 공공기관·제휴기관 공식 페이지
- 자사 홍보가 아닌 제3자 정보 사이트
- 미니앱 기능만으로 서비스 완결이 불가능한 특수 케이스

**구현 가이드**: 외부로 이동하기 전 사용자가 외부 이동임을 인지할 수 있는 UI(확인 다이얼로그·안내 문구 등)를 제공할 것. `openURL` 호출을 사용자 인지 단계 뒤에 배치한다.

```tsx
const handleExternalLink = async () => {
  const confirmed = await showConfirmDialog('외부 페이지로 이동합니다. 계속할까요?');
  if (confirmed) {
    openURL('https://example.com/terms');
  }
};
```

## 주의사항
- 외부링크는 위 정책의 허용 케이스에 해당하는지 먼저 확인 → 심사 반려 주요 원인
- `openURL`은 reject 가능 → 에러 핸들링 필수
- 라우팅 환경 차이: RN(React Navigation) vs WebView(웹 라우터) — 코드 공유 시 주의

## 출처
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 이동/openURL.md
- https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 이동/routing.md
- https://developers-apps-in-toss.toss.im/checklist/miniapp-external-link.md

---
> 검증: 2026-06-10 공홈 대조 [일치: openURL 시그니처·routing API(useNavigation/createRoute/goBack/reset)·외부링크 정책 모두 공홈 fetch 결과 기준 작성]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
