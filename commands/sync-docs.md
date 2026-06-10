---
description: 번들 reference를 공홈·npm·릴리즈 노트와 대조해 드리프트를 갱신하고 CHANGELOG에 기록
argument-hint: "[생성 앱 경로 — docs/DRIFT.md 소비용, 생략 가능]"
---

# /appintoss:sync-docs

플러그인 번들 문서(`skills/*/references/`, `knowledge/`)가 공식 문서·최신 SDK 대비 stale인지 대조하고, 드리프트가 확인된 reference만 출처 기반으로 갱신하는 유지보수 커맨드다.

## 입력

- `$ARGUMENTS`로 생성 앱 프로젝트 경로를 받을 수 있다(생략 가능).
- 경로가 주어지면 그 앱의 `docs/DRIFT.md`를 읽는다 — 생성 앱 파이프라인(pipeline 스킬)이 실행 중 발견한 드리프트를 구조화 집계해 두는 파일로, **sync-docs가 이를 입력으로 소비**한다. DRIFT.md 항목은 1단계 드리프트 목록에 병합하고, 처리 결과(반영/무효 + 사유)를 해당 DRIFT.md 항목에 기록한다.
- 경로가 없으면 공홈·npm·릴리즈 노트 대조만 수행한다.

## 동작 5단계

### 1단계: 공홈 대조 — 드리프트 목록 산출

- 공홈 인덱스 https://developers-apps-in-toss.toss.im/llms.txt 와 전문 https://developers-apps-in-toss.toss.im/llms-full.txt 를 조회하여, 번들 reference(`skills/ait-sdk`·`skills/front-tds` 등 `skills/*/references/`)와 대조한다.
- TDS는 https://tossmini-docs.toss.im/tds-mobile/llms.txt 와 대조한다.
- 입력으로 받은 생성 앱 `docs/DRIFT.md` 항목을 병합하여 **드리프트 목록**(문서 경로 · 번들 기술 내용 · 공홈 실제 내용 · 출처 URL)을 산출한다.

### 2단계: npm 버전 대조

- registry.npmjs.org에서 `@apps-in-toss/web-framework`의 latest 버전을 확인한다:
  ```bash
  curl -s https://registry.npmjs.org/@apps-in-toss/web-framework/latest | jq -r .version
  ```
- 번들 문서에 기재된 버전·API 시그니처와 대조하여 버전 드리프트를 목록에 추가한다.

### 3단계: 릴리즈 노트 확인

- **주의: 공홈 릴리즈 노트 페이지 본문은 클라이언트 렌더링이라 일반 fetch(WebFetch·curl)로는 빈 응답만 온다.** 원문은 JS 청크 `assets/release-note.md.*.lean.js`를 curl로 직접 받아야 확보할 수 있다:
  ```bash
  # 1) 페이지 HTML에서 청크 파일명 추출
  curl -s https://developers-apps-in-toss.toss.im/release-note.html | grep -o 'assets/release-note\.md\.[^"]*\.lean\.js'
  # 2) 청크를 직접 받아 원문 확인
  curl -s https://developers-apps-in-toss.toss.im/assets/release-note.md.{hash}.lean.js
  ```
- 릴리즈 노트에서 SDK·정책·콘솔 변경 사항을 확인하고, 번들 문서에 미반영된 변경을 드리프트 목록에 추가한다.

### 4단계: reference 갱신

- 드리프트가 **확인된** reference만 갱신한다. 반영 전 반드시 해당 내용을 공홈 fetch로 재확인한다 — **추측 금지**, 공홈에서 확인하지 못한 내용은 갱신하지 않는다.
- 갱신한 내용마다 **출처(URL · 확인 일자)를 명기**한다.

### 5단계: CHANGELOG 기록 + 버전 범프 판단

- 갱신 내역을 플러그인 `CHANGELOG.md` 최상단에 기존 형식대로 기록한다.
- 변경 규모에 따라 플러그인 버전 범프를 판단한다(오류 정정·reference 갱신은 minor/patch, 동작 규칙 변경을 동반하면 minor 이상).
- 드리프트 0건이면 갱신·범프 없이 "드리프트 없음(대조 일자)"만 보고하고 종료한다.

## 완료 보고

갱신한 파일의 절대경로 목록 + 드리프트 처리 결과(반영 N건 / 무효 N건 / 보류 N건과 사유)를 출력한다.
