---
name: ait-build
description: 앱인토스 미니앱 빌드, 번들링, 개발 서버 설정, 테스트, 트러블슈팅 가이드. granite CLI 사용법.
trigger: 앱인토스 빌드, granite 명령, 번들 사이즈, 개발 서버, vite 설정, 토스 앱 테스트, 빌드 에러 관련 질문 시 트리거
references:
  - ./references/ait-build-commands.md
  - ./references/ait-build-config.md
  - ./references/ait-build-test.md
  - ./references/ait-build-troubleshooting.md
  - ./references/ait-build-output.md
---

# 앱인토스 빌드 가이드

앱인토스 미니앱은 Vite로 빌드하고, granite CLI로 `.ait` 번들로 패키징합니다.

## 사전 요구사항
- Node.js 18+
- npm
- `@apps-in-toss/web-framework` (devDependencies)

## 빌드 흐름
1. `tsc -b` → TypeScript 타입 체크
2. `vite build` → 웹 번들 생성 (`dist/`)
3. `npx ait build` → `.ait` 번들 패키징 (`{appName}.ait`)

## 제약사항
- 번들 크기: **100MB 이하**
- 출력 디렉토리: `dist/` (기본값)

## TDSProvider 환경 분기
- **토스 앱 내부 (AIT)**: `TDSMobileAITProvider` 사용
- **브라우저**: `TDSMobileProvider` 사용 (light mode)
- `navigator.userAgent` 및 `window.__GRANITE__` 존재 여부로 자동 감지

## 빌드 완료 출력

빌드 성공 후 반드시 `references/ait-build-output.md`의 포맷으로 콘솔 대조 항목을 출력한다. 이를 통해 Developer Center 콘솔 설정과의 불일치를 사전에 방지한다.

## 문서 신선도

번들 문서가 stale일 수 있다. API·정책·규격이 불확실하면 공홈 조회를 우선하라: https://developers-apps-in-toss.toss.im/
