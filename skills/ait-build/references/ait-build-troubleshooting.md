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

SDK 3.x는 로컬 브라우저(AIT Devtools)에서 테스트한다 — 같은 네트워크의 실기기 접속 절차는 필요 없다.

1. `npm run dev`가 뜨는지, 출력된 localhost 링크로 열었는지 확인
2. 우측 하단에 AIT Devtools 패널이 보이는지 확인 — 안 보이면 `vite.config.ts`에 `aitDevtools.vite()`가 있는지 확인
3. 포트를 바꾸려면 `package.json`의 `dev` 스크립트에서 `--port`를 준다 (3.x 설정 파일에는 `web.host`·`web.port`가 없다)

## 토스 앱에서 통신 실패 (CORS)

로컬에서는 되는데 토스 앱에서만 API가 막히면 대부분 CORS다. 서버 허용 Origin에 미니앱 도메인을 넣는다.

| SDK | 실 서비스 | QR 테스트 |
|---|---|---|
| 3.x (2026-08-25 이후 업로드) | `https://<appName>.apps.tossmini.com` | `https://<appName>.private-apps.tossmini.com` |
| 3.x (그 이전 업로드) | `https://<appName>.web.tossmini.com` | `https://<appName>.private-web.tossmini.com` |
| 1.x ~ 2.x | `https://<appName>.apps.tossmini.com` | `https://<appName>.private-apps.tossmini.com` |

- 라이브는 **HTTPS만** 허용된다. HTTP API는 토스 앱에서 차단된다.
- iOS 13.4+는 서드파티 쿠키를 차단한다 — 쿠키 세션 대신 토큰 인증을 쓴다.
- 서버 API(mTLS)를 쓴다면 방화벽 Inbound/Outbound IP도 함께 확인한다(`back-api` 스킬 참조).

## iOS에서 흰 화면

1. **Sentry 연동** — 런타임 에러가 조용히 나는 경우가 많다. 로그 수집부터 붙인다.
2. **메모리·리소스 점검** — 토스 앱은 메모리 제약이 있어 렌더 실패로 흰 화면이 난다. 이미지·폰트 용량을 줄이고, 초기에는 필요한 것만 불러오는 분할 로딩으로 바꾼다.
3. 토스 앱을 최신 버전으로 올려 재시도한다(하위 버전 이슈).

## ait build 실패

> `granite build`는 웹 프로젝트에서 폐기됐다(빌드 시 'no longer supported' 에러) — `npx ait build`를 쓴다.

1. `apps-in-toss.config.ts` 문법 확인 (2.x는 `granite.config.ts`)
2. `appName`·`brand`·`webBundleDir` 값 확인 — 3.0.4부터 빌드 시 검증되며 누락되면 실패한다
3. `vite build`가 먼저 성공했는지, `dist/`가 실제로 갱신됐는지 확인

```bash
npm run build     # tsc -b && vite build && ait build 한 번에
ls -l dist/       # dist가 방금 갱신됐는지 mtime 확인
```

**`.ait`는 만들어졌는데 옛 코드가 들어 있다면** `ait build`를 단독 실행한 것이다. `ait build`는 `dist/`를 다시 만들지 않는다. `npm run build`로 다시 빌드하고 산출물 검증(ait-build-commands.md)을 돌린다.

## 업로드 실패

- **동일 버전 재업로드 거부** — `npm version patch --no-git-tag-version`으로 버전을 올린다.
- **압축 해제 기준 100MB 초과** — 대용량 리소스는 번들에서 빼고 CDN에서 내려받게 한다.
- **`npm run build`로 만들지 않은 번들** — 프로젝트 구조가 맞지 않으면 콘솔에서 컴파일이 실패해 업로드되지 않는다.

---
> 검증: 2026-08-25 공홈 대조 [갱신됨: 개발 서버 절 3.x AIT Devtools 기준으로 교체(web.host 제거), CORS Origin 표·iOS 흰 화면·업로드 실패·stale dist 절 추가, 설정 파일명 apps-in-toss.config.ts로 갱신] 근거: https://developers-apps-in-toss.toss.im/guide/operation/toss , https://developers-apps-in-toss.toss.im/documentation/integration/server-api
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
