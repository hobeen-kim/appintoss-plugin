---
name: ait-build
description: 앱인토스 미니앱 빌드, 번들링, 개발 서버 설정, 로컬 테스트(AIT Devtools), 트러블슈팅 가이드. ait CLI(SDK 3.x) 사용법.
trigger: 앱인토스 빌드, ait CLI 명령, 번들 사이즈, 개발 서버, vite 설정, AIT Devtools, 토스 앱 테스트, CORS, 빌드 에러 관련 질문 시 트리거
references:
  - ./references/ait-build-commands.md
  - ./references/ait-build-config.md
  - ./references/ait-build-test.md
  - ./references/ait-build-troubleshooting.md
  - ./references/ait-build-output.md
---

# 앱인토스 빌드 가이드

앱인토스 미니앱은 Vite로 빌드하고, `ait` CLI로 `.ait` 번들로 패키징합니다.

## 사전 요구사항
- Node.js 18+
- npm
- `@apps-in-toss/web-framework` (devDependencies)

## 빌드 흐름
1. `tsc -b` → TypeScript 타입 체크
2. `vite build` → 웹 번들 생성 (`dist/`)
3. `npx ait build` → `.ait` 번들 패키징 (`{appName}.ait`)

**세 단계를 묶은 `npm run build`를 사용한다.** `npx ait build`를 단독으로 실행하면 웹 번들을 다시 만들지 않고 **기존 `dist/`를 그대로 포장**한다 — 버전만 올라가고 내용물은 옛 코드인 `.ait`가 만들어지며, 테스터 화면에서 구버전이 보이기 전까지 아무 에러도 나지 않는다. 코드 수정 후 재빌드는 반드시 `npm run build`(또는 `tsc -b && vite build && npx ait build`)로 한다.

```json
// package.json — scripts.build 가 3단계를 모두 포함해야 한다
"build": "tsc -b && vite build && ait build"
```

## 빌드 산출물 검증 (재빌드 시 필수)

재빌드·재배포 전에 `.ait` 안에 **이번 변경분이 실제로 들어갔는지** 확인한다. 버전 문자열(또는 이번에 바꾼 고유 문자열)을 산출물에서 직접 찾는 방식이다.

```bash
# 1) 버전 범프 -> 2) 전체 빌드 -> 3) 산출물 검증
npm version patch --no-git-tag-version
npm run build

VER=$(node -p "require('./package.json').version")
OUT=$(mktemp -d)
unzip -q -o *.ait -d "$OUT"
grep -rq "$VER" "$OUT" && echo "OK: $VER 반영됨" || echo "FAIL: stale dist — vite build 누락"
```

`FAIL`이면 `dist/`가 갱신되지 않은 것이다. `npm run build`가 `vite build`를 포함하는지 먼저 확인한다.

## 제약사항
- 번들 크기: **압축 해제 기준 100MB 이하** — 대용량 리소스는 번들에서 빼고 CDN/외부 스토리지에서 내려받게 구성한다
- 출력 디렉터리: `dist/` (`webBundleDir` 기본값)
- 재업로드 시 `package.json` version을 올려야 한다(동일 버전 재업로드 거부)

## CLI 명령 (ait CLI 3.1.1 실측)

| 명령 | 용도 |
|---|---|
| `ait init --app-name <kebab> --skip-input` | 기존 웹 프로젝트에 SDK 설정 추가. `--skip-input` 없으면 "웹 번들 디렉터리" 프롬프트에서 멈춘다. 앱 이름은 케밥-케이스만 허용 |
| `ait build` | `apps-in-toss.config.ts`를 읽어 `.ait` 생성 (dist 재빌드 없음) |
| `ait deploy [--api-key] [-m "메모"] [--timeout 초]` | 번들 업로드 (`-m`/`--memo` 최대 1000자) |
| `ait token add` / `ait token remove` | API 키 등록·삭제 |
| `ait migrate v3` | 2.x → 3.x 설정 파일·스크립트 자동 마이그레이션 |

## TDSProvider 환경 분기
- **토스 앱 내부 (AIT)**: `TDSMobileAITProvider` 사용
- **브라우저**: `TDSMobileProvider` 사용 (light mode)
- `navigator.userAgent` 및 `window.__GRANITE__` 존재 여부로 자동 감지

## 빌드 완료 출력

빌드 성공 후 반드시 `references/ait-build-output.md`의 포맷으로 콘솔 대조 항목을 출력한다. 이를 통해 Developer Center 콘솔 설정과의 불일치를 사전에 방지한다.

## 문서 신선도

번들 문서가 stale일 수 있다. API·정책·규격이 불확실하면 공홈 조회를 우선하라: https://developers-apps-in-toss.toss.im/
