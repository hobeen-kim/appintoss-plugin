# 빌드 명령어

## 개발 서버

```bash
# 기본 개발 서버 (5173 포트)
npm run dev          # vite

# 네트워크 접근 가능 (모바일 테스트용)
npx vite --host

# 포트 변경
npm run dev -- --port 5175
```

`vite.config.ts`에 `server: { host: true }` 설정이 되어 있어 기본적으로 네트워크 접근이 가능합니다.

## 빌드

```bash
# 버전 범프 (빌드 전 필수 — 콘솔은 동일 버전 재업로드 거부)
npm version patch --no-git-tag-version   # package.json version 증가 (최초 빌드는 생략 가능)

# 웹 빌드 (타입 체크 + 번들링)
npm run build        # tsc -b && vite build → dist/ 폴더 생성

# AIT 번들 생성
npx ait build    # granite.config.ts 기반 → {appName}.ait 파일 생성 (구 granite build는 웹 프로젝트 폐기)
```

## 미리보기

```bash
npm run preview      # vite preview (빌드 결과 확인)
```

## 린트

```bash
npm run lint         # eslint .
```

## 타입 체크

```bash
# 타입 체크만 실행
npx tsc -b --noEmit

# 에러 위치 확인
npx tsc -b 2>&1 | head -20
```

## 번들 사이즈 확인

```bash
# 빌드 후 dist 디렉토리 크기 확인
npm run build && du -sh dist/

# .ait 파일 크기 확인 (압축 해제 기준 100MB 이하여야 함)
ls -lh *.ait
```

---
> 검증: 2026-06-07 공홈 대조 [일치: granite build → .ait 번들 생성, 압축 해제 기준 100MB 제한 — 근거: https://developers-apps-in-toss.toss.im/development/deploy.html | 공홈 미검증: npm run dev/preview/lint 등 vite 표준 스크립트는 프로젝트 package.json 의존이라 공홈 단일 출처 없음]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
