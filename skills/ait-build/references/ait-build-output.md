# 빌드 완료 출력 포맷

`npx ait build` 완료 후, granite.config.ts의 주요 설정을 출력하여 Developer Center 콘솔 등록 정보와 대조할 수 있게 한다.

## 출력 포맷

빌드 성공 시 아래 포맷으로 출력한다:

```
✅ 빌드 완료

📦 번들: {appName}.ait ({번들 크기})
📋 콘솔 대조 항목:
   앱 이름(displayName): {brand.displayName}
   아이콘(icon):         {brand.icon}
   appName:              {appName}

⚠️  Developer Center 콘솔에서 아래 항목이 위 값과 일치하는지 확인하세요:
   - 앱 이름 (한국어) = displayName
   - 앱 아이콘 = icon URL의 이미지
   - 영문 기능명 ≠ 디폴트 값
```

## 사용법

빌드 완료 후 granite.config.ts를 읽어서 위 포맷으로 출력한다. 이 출력은 콘솔 설정 미스매치로 인한 반려를 방지하기 위한 것이다.

## 배경

실제 반려 사례:
- 앱 이름이 콘솔 등록 이름과 불일치 → 반려
- 아이콘이 콘솔 업로드 이미지와 불일치 → 반려
- 영문 기능명이 디폴트 값 → 반려

---
> 검증: 2026-06-07 공홈 대조 [일치: appName=콘솔 앱 ID, brand.displayName=노출 이름, brand.icon=콘솔 업로드 이미지 URL이라는 의미는 공홈 Config 문서와 일치 — 근거: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Config.html | 공홈 미검증: "✅ 빌드 완료" 출력 포맷 자체는 본 스킬 고유 산출물로 공홈 출처 없음]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
