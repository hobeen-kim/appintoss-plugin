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

- 공홈 인덱스 https://developers-apps-in-toss.toss.im/llms.txt 와 전문 https://developers-apps-in-toss.toss.im/llms-full.txt 를 **파일로 받아** 번들 reference(`skills/*/references/`, `knowledge/`)와 대조한다.
  ```bash
  curl -s https://developers-apps-in-toss.toss.im/llms.txt      -o /tmp/ait-llms.txt
  curl -s https://developers-apps-in-toss.toss.im/llms-full.txt -o /tmp/ait-llms-full.txt
  ```
  `llms-full.txt`는 상위 100여 개 문서의 전문을 담지만 **뒤쪽 SDK API 레퍼런스는 잘려 있다.** 개별 API 문서는 URL 뒤에 `.md`를 붙여 따로 받는다.
  특정 질문은 `GET {페이지}.md?ask=<질문>`으로 바로 물어볼 수도 있다.
- 개별 문서가 필요하면 `mcp__apps-in-toss__get_doc` / `list_examples`도 쓸 수 있으나, 검색 인덱스가 비어 있는 경우가 있어 **`llms-full.txt` 대조를 기본 경로로 삼는다.**
- TDS는 https://tossmini-docs.toss.im/tds-mobile/llms.txt 와 대조한다.
- 입력으로 받은 생성 앱 `docs/DRIFT.md` 항목을 병합하여 **드리프트 목록**(문서 경로 · 번들 기술 내용 · 공홈 실제 내용 · 출처 URL)을 산출한다.

### 2단계: npm 버전 대조 (dist-tags 전수)

- 관련 패키지의 **dist-tags를 한 번에** 확인한다. latest뿐 아니라 **beta도 함께 본다** — beta에 다음 메이저가 올라와 있으면 곧 같은 드리프트가 반복된다.
  ```bash
  for p in @apps-in-toss/web-framework @apps-in-toss/cli @apps-in-toss/framework \
           @apps-in-toss/devtools @toss/tds-mobile @toss/tds-mobile-ait; do
    echo -n "$p: "; npm view "$p" dist-tags --json
  done
  ```
- **메이저 변경이 감지되면 설정 스키마 드리프트를 의심한다.** 실제 타입 정의를 설치해 확인하는 것이 가장 확실하다:
  ```bash
  npm i @apps-in-toss/web-framework@latest --prefix /tmp/ait-verify --no-audit --no-fund
  cat /tmp/ait-verify/node_modules/@apps-in-toss/web-framework/dist/config.d.ts
  ```
- CLI 커맨드·옵션이 바뀌었는지도 함께 본다(`npx ait --help`, `npx ait <cmd> --help`). 숨은 플래그는 `dist/index.js`에서 `Option.` 정의를 grep한다.
- 번들 문서에 기재된 버전·API 시그니처·설정 필드와 대조해 드리프트 목록에 추가한다.
- **`skills/ait-sdk/SKILL.md`의 "SDK 버전" 표를 실측값으로 갱신한다.**

### 3단계: 릴리즈 노트 확인

공홈은 모든 페이지의 **마크다운 원문**을 URL 뒤에 `.md`를 붙여 제공한다. 릴리즈 노트도 마찬가지다.

```bash
curl -s https://developers-apps-in-toss.toss.im/release-note/release-note.md
```

- 릴리즈 노트에서 SDK·정책·콘솔 변경 사항을 확인하고, 번들 문서에 미반영된 변경을 드리프트 목록에 추가한다.
- **날짜가 적힌 정책 전환(예: "N월 N일 이후 업로드되는 번들부터 …")은 별도로 표시**한다. 시점 전후로 동작이 달라지므로 번들 문서에 조건부로 기술해야 한다.

### 4단계: reference 갱신

- 드리프트가 **확인된** reference만 갱신한다. 반영 전 반드시 해당 내용을 공홈 fetch로 재확인한다 — **추측 금지**, 공홈에서 확인하지 못한 내용은 갱신하지 않는다.
- 갱신한 내용마다 **출처(URL · 확인 일자)를 명기**한다.

### 5단계: CHANGELOG 기록 + 버전 범프 판단

- 갱신 내역을 플러그인 `CHANGELOG.md` 최상단에 기존 형식대로 기록한다.
- 변경 규모에 따라 플러그인 버전 범프를 판단한다(오류 정정·reference 갱신은 minor/patch, 동작 규칙 변경을 동반하면 minor 이상).
- 드리프트 0건이면 갱신·범프 없이 "드리프트 없음(대조 일자)"만 보고하고 종료한다.

## 완료 보고

갱신한 파일의 절대경로 목록 + 드리프트 처리 결과(반영 N건 / 무효 N건 / 보류 N건과 사유)를 출력한다.
