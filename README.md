# appintoss-plugin v2.21.0

앱인토스(Apps in Toss) 미니앱 **무개입 생성 파이프라인** Claude Code 플러그인. 주제 한 줄로 검수 통과 수준의 미니앱(코드 + `.ait` 번들 + 검수리포트 + 콘솔 제출 에셋)을 완성한다.

## 사용법

```
/appintoss:create "가계부 미니앱"     # 신규 생성 — Phase 0~7 무개입 완주
/appintoss:update "월별 통계 추가"    # 기존 앱 기능 추가·수정 — 영향 분석 후 증분 적용
/appintoss:sync-docs                 # 번들 reference를 공홈과 대조·갱신
```

산출물: `PLAN.md`, `DESIGN.md`, `src/`, `{appName}.ait`, `REVIEW-REPORT.md`, `docs/assets/`(아이콘 600×600 · 화면예시 636×1048 ×3 · 썸네일 1932×828), `PIPELINE-LOG.md`(게이트 증거), `docs/REPORT-v{version}.md`(완료 보고서 — 변경 내역·스크린샷 임베드, 승인 대기)

파이프라인은 마지막에 **완료 보고서를 생성하고 사용자 승인 대기로 종료**한다 — 보고서 파일 하나만 보고 승인 여부를 결정할 수 있다 (사람의 유일한 개입 지점).

## 자동 모드 · git 푸시 · 모니터링

```
/appintoss:create "가계부 미니앱" --auto    # 보고서 생성 후 승인 대기 없이 git 커밋·push까지 자동
/appintoss:update "월별 통계 추가" --auto    # update도 동일하게 자동 완주
/appintoss:improve ./app [--focus feature|uiux|quality|auto]  # 개선점 발굴 1건 → 자동 update
```

- **`--auto` 자동 모드**: Phase 8 승인 게이트에서 **승인을 기다리지 않고 자동 승인** 후 Phase 9로 진행한다. 보고서는 사후 확인용으로 남는다. 단 ① 정책 금지영역 주제 ② 동일 페이즈 반려 5회 초과 ③ 빌드 실패 시에는 자동 모드라도 무조건 중단·보고한다(무한 폭주 방지).
- **Phase 9 git 자동 푸시**(자동 모드 한정): git 저장소 아니면 `git init` → `git add` → 커밋(`feat(appintoss): {앱명} v{version} - {요약}`) → remote 있으면 현재 브랜치 push, 없으면 로컬 커밋만. force push·history rewrite 금지. 결과(커밋 해시·브랜치·push 여부)는 보고서 §배포에 기록된다.
- **`/appintoss:improve`**: 기능·UI/UX·품질 3축을 진단해 개선 후보 1건(`--focus`로 축 지정, 기본 auto는 ROI 최상위)을 `/appintoss:update --auto`로 적용하고 `docs/IMPROVE-LOG.md`에 기록한다. 1회 실행당 1건, 직전 로그와 동일 개선안은 중복 금지. 주기 반복은 `/loop`·cron으로 감싼다.
- **`.appintoss.json` 설정**(`ait-setup` 스킬): `git`(`remote`·`branch`)·`autoMode` 기본값을 정의한다. `git.branch`를 별도 브랜치로 두면 main 직접 push를 피할 수 있다. `.gitignore`에 `node_modules/`·`dist/`·`*.ait` 추가 권장.

## 구조

```
appintoss-plugin/
├── .claude-plugin/
│   ├── plugin.json           # manifest (v2.21.0)
│   └── marketplace.json      # 로컬 마켓플레이스 (appintoss-local)
├── commands/                 # 4개: create.md, update.md, improve.md, sync-docs.md — 페이즈 머신 진입점
├── agents/                   # 6개: planner, designer, app-developer,
│                             #       back-developer, visual-qa, reviewer(devops 통합)
├── skills/                   # 21개
│   ├── pipeline/             # ★ 단일 출처 — 페이즈·게이트·반려 규칙
│   ├── ait-assets/           # 콘솔 제출 에셋 생성 (규격·렌더 템플릿)
│   ├── front-tds/            # TDS 컴포넌트 54종 reference
│   ├── ait-sdk/              # SDK reference 9종
│   └── ait-build, ait-review, ait-submit, ait-login, ...
└── knowledge/                # over-engineering, presentation-logic, skill-guide
```

## 핵심 규칙 (pipeline 스킬이 단일 출처)

- **게이트**: 비주얼 85/100점(루브릭 25/25/20/15/10/10, 개성·트렌디함 포함), tsc·lint 0건, 정적 검사 위반 0건, `.ait` 100MB 이하, 검수 11단계 전항목 PASS
- **반려**: 게이트 미통과 → 위반 목록과 함께 원인 페이즈로 자동 재작업. 동일 페이즈 5회 초과 시에만 중단·보고
- **빌드**: `npx ait build` (구 `granite build` 폐기). 재빌드 시 `npm version patch --no-git-tag-version` 필수 (콘솔은 동일 버전 재업로드 거부)
- **원칙**: TDS-only(라이트모드 전용) · 스펙 먼저(DESIGN.md/API.md) · YAGNI · Presentation/Logic 분리 · 증거 없는 PASS 금지
- **정책 필터**: 금융상품 추천·자사앱 설치 유도·주요기능 외부의존 금지 (Phase 0에서 사전 차단)

## 공식 AI 도구 연동

토스 공식 AI 개발 도구를 함께 쓰면 문서 참조 정확도가 올라간다(필수 아님).

```
brew tap toss/tap && brew install ax                                   # ax CLI 설치
claude mcp add --transport stdio apps-in-toss ax mcp start             # ax MCP 등록 (문서·예제 직접 참조)
npx create-ait-app {appName}                                           # 공식 스캐폴더 (TDS 사용 Y)
```

llms.txt 인덱스: https://developers-apps-in-toss.toss.im/llms-full.txt · https://tossmini-docs.toss.im/tds-mobile/llms-full.txt (인덱스 https://developers-apps-in-toss.toss.im/llms.txt)

## 문서 신선도

번들 reference는 2026-06-10 공홈 대조 기준. stale 가능성이 있으므로 각 스킬은 불확실 시 공홈(https://developers-apps-in-toss.toss.im/)을 런타임 조회한다. 주기적 일괄 갱신은 수동 수행.

## 설치

```
claude plugin marketplace add /Users/hobeen/study/appintoss-plugin
claude plugin install appintoss@appintoss-local
```

## 범위 외

콘솔 업로드·검수 요청(수동), 앱빌더(Deus) 자동화(API 없음), 백엔드 실배포, 다크모드, 실기기 테스트
