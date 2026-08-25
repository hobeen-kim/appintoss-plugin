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

# 전체 빌드 (권장) — tsc -b && vite build && ait build
npm run build

# 개별 단계 (디버깅용)
npx tsc -b           # 타입 체크
npx vite build       # 웹 번들 -> dist/
npx ait build        # apps-in-toss.config.ts 기반 -> {appName}.ait 생성
```

> **`npx ait build` 단독 실행 금지.** `ait build`는 `dist/`를 다시 만들지 않고 **있는 그대로 포장**한다. 코드 수정 후 이 명령만 실행하면 버전만 올라간 stale 번들이 생성되며 빌드는 성공으로 끝난다. 재빌드는 항상 `npm run build`.

## 산출물 검증 (재빌드 시 필수)

```bash
VER=$(node -p "require('./package.json').version")
OUT=$(mktemp -d)
unzip -q -o *.ait -d "$OUT"
grep -rq "$VER" "$OUT" && echo "OK: $VER 반영됨" || echo "FAIL: stale dist — vite build 누락"
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
