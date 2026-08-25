# 빌드 완료 출력 포맷

`npm run build` 완료 후, 콘솔 등록 정보와 대조할 항목을 출력한다.

## 출력 포맷

```
✅ 빌드 완료

📦 번들: {appName}.ait ({번들 크기} / 압축 해제 기준 100MB 이하)
📋 콘솔 대조 항목:
   appName:            {apps-in-toss.config.ts appName}   ← 콘솔 앱 등록 시 입력한 appName과 완전 일치(변경 불가)
   brand.primaryColor: {brand.primaryColor}
   버전:               {package.json version}             ← 직전 업로드 버전보다 높아야 함

⚠️  Developer Center 콘솔에서 확인하세요:
   - 앱 이름(국문)·로고: 콘솔 앱 정보가 단일 출처 (SDK 3.x 설정 파일에는 displayName·icon 필드가 없음)
   - 영문 앱 이름: 15자 이내 명사형, 디폴트 값 금지
   - CORS 허용 Origin에 미니앱 도메인이 등록됐는지 (ait-build-troubleshooting.md 참조)
```

## 사용법

빌드 완료 후 `apps-in-toss.config.ts`와 `package.json`을 읽어 위 포맷으로 출력한다. 콘솔 설정 미스매치로 인한 반려를 막기 위한 절차다.

## 배경

실제 반려 사례:
- 앱 이름이 콘솔 등록 이름과 불일치 → 반려
- 아이콘이 콘솔 업로드 이미지와 불일치 → 반려
- 영문 기능명이 디폴트 값 → 반려

SDK 2.x에서는 `granite.config.ts`의 `brand.displayName`·`brand.icon`을 콘솔 값과 맞춰야 했지만, **3.x에는 두 필드가 없다.** 대조 기준은 콘솔 앱 정보이며, 설정 파일에서 검증할 항목은 `appName`뿐이다.

---
> 검증: 2026-08-25 공홈 대조 [개정: 3.x에서 displayName·icon 필드가 삭제돼 대조 항목을 appName·primaryColor·버전으로 재정의. 앱 이름·로고 단일 출처는 콘솔 앱 정보] 근거: https://developers-apps-in-toss.toss.im/documentation/integration/sdk-3.x , https://developers-apps-in-toss.toss.im/guide/operation/console-workspace
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
