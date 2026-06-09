# 빌드 트러블슈팅

## TypeScript 빌드 에러

```bash
# 타입 체크만 실행
npx tsc -b --noEmit

# 에러 위치 확인
npx tsc -b 2>&1 | head -20
```

주요 tsconfig 옵션:
- `strict: true` → 엄격한 타입 체크
- `noUnusedLocals: true` → 사용하지 않는 변수 에러
- `noUnusedParameters: true` → 사용하지 않는 매개변수 에러

## 번들 크기 초과

앱인토스 번들 제한: **압축 해제 기준 100MB 이하**

```bash
# 현재 크기 확인
npm run build && du -sh dist/

# 큰 파일 찾기
find dist/ -type f -size +1M -exec ls -lh {} \;
```

크기 줄이는 방법:
- 사용하지 않는 의존성 제거
- 이미지/에셋 최적화 (압축, 적절한 포맷)
- 동적 import로 코드 스플리팅
- tree-shaking 확인 (ESM import 사용)

## 개발 서버 접속 불가

1. `web.host`가 본인 IP로 설정되어 있는지 확인
2. 방화벽에서 포트가 열려있는지 확인
3. 같은 네트워크에 있는지 확인

```bash
# 본인 IP 확인
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## ait build 실패

> `granite build`는 웹 프로젝트에서 폐기됨(빌드 시 'no longer supported' 에러) — `npx ait build` 사용. 실측: 2026-06-07 E2E(@apps-in-toss/web-framework 2.x).

1. `granite.config.ts` 문법 확인
2. `npm run build`가 먼저 성공하는지 확인
3. `.granite/app.json`이 올바르게 생성되는지 확인

```bash
# 단계별 확인
npm run build          # 1. 웹 빌드 성공 확인
cat .granite/app.json  # 2. 앱 메타데이터 확인
npx ait build      # 3. AIT 번들 생성
```

---
> 검증: 2026-06-07 공홈 대조 [갱신됨: 번들 제한을 "압축 해제 기준 100MB 이하"로 명확화 — 근거: https://developers-apps-in-toss.toss.im/development/deploy.html | 일치: granite build / tsc 빌드 흐름]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
