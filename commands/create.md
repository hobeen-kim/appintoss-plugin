---
description: 주제 하나로 앱인토스 미니앱을 무개입 완성 (코드 + .ait + 검수리포트 + 콘솔 제출 에셋)
argument-hint: "주제 (예: 가계부 미니앱)"
---

# /appintoss:create

주제 하나로 앱인토스 미니앱을 사람 개입 없이 완성하는 파이프라인 진입점이다.

## 입력

- 주제는 `$ARGUMENTS`로 받는다.
- 주제가 비어 있으면 사용자에게 **1회만** "어떤 미니앱을 만들까요?"라고 질문한 뒤, 답을 주제로 사용한다. 이후로는 추가 질문 없이 무개입 진행한다.
- `$ARGUMENTS`에 `--auto`가 있으면 **자동 모드**로 실행한다(Phase 8 자동 승인 → Phase 9 git 자동 푸시). 규칙은 pipeline 스킬 Phase 8/9 정의를 따른다. `--auto`는 주제 문자열에서 제외한다.
- `--auto` 미지정 시 대상 디렉토리 `.appintoss.json`의 `autoMode`(기본 false)를 읽어 적용한다. 명령행 `--auto` 플래그가 항상 우선.

## 단일 출처 — pipeline 스킬 로드

이 커맨드는 페이즈·게이트·반려 규칙을 **중복 기술하지 않는다.** 모든 기준은 `skills/pipeline/SKILL.md`가 단일 출처다.

**가장 먼저 pipeline 스킬을 로드**하고, 페이즈 정의·게이트 기준·반려 규칙·에러 처리 표를 그 스킬의 명세대로 따른다. 이 파일에 페이즈 게이트 수치나 루브릭을 다시 적지 않는다.

## 실행 흐름 (create 모드)

pipeline 스킬의 create 모드 정의를 따른다. 각 페이즈는 해당 에이전트(`agents/*.md`)에 위임한다.

1. **preflight** — 도구·환경 점검. 이어서 **재개 감지**: 대상 디렉토리에 `PIPELINE-LOG.md`가 있으면 pipeline 스킬 §재개 규칙에 따라 마지막 `판정: PASS` 페이즈 + 산출물 실재를 확인해 다음 페이즈부터 재개한다("Phase N부터 재개" 1줄 보고). 사용자가 "처음부터"라고 하면 전체 재실행.
2. **Phase 0** — planner ⇄ designer·reviewer (브레인스토밍 라운드). planner가 `knowledge/toss-user-insights.md` 기반 컨셉 초안 → designer·reviewer가 각자 코멘트 → planner가 수렴 (라운드 중계는 오케스트레이터, pipeline 라운드 규칙)
3. **Phase 1** — designer ⇄ reviewer (크리틱 루프)
4. **Phase 2** — app-developer (API 필요 주제는 back-developer가 `API.md` 선행 작성)
5. **Phase 3** — visual-qa (3-A 비주얼·3-B 동작·3-C 패널). 3-C 패널: visual-qa가 캡처한 스크린샷을 designer·reviewer·visual-qa 3관점이 검토·합의(오케스트레이터가 스크린샷 경로를 designer·reviewer에 중계 — pipeline 3-C 참조)
6. **Phase 4** — reviewer
7. **Phase 5** — reviewer
8. **Phase 6** — reviewer
9. **Phase 7** — visual-qa
10. **Phase 8** — visual-qa: `docs/REPORT-v{version}.md` 보고서 생성 → 수동 모드면 경로 제시 후 **승인 대기로 종료**(사람의 유일한 개입 지점), 자동 모드면 자동 승인 후 Phase C로 진행
11. **Phase C** — ait-console 스킬: `register`(미등록 시) → `upload-assets` → `upload`(테스트 버전) → `test-send` 자동 수행(테스트 앱 한정). 각 단계 결과를 보고서 §콘솔 테스트에 기록. **테스트 발송까지만 자동. `--auto` 모드도 동일하게 테스트 발송 한정.**
12. **Phase 9** (자동 모드 한정) — reviewer: git 커밋 + (remote 있으면) push, 결과를 보고서에 기록 (pipeline Phase 9 가드 준수)

각 페이즈의 입력·산출물·게이트 기준은 pipeline 스킬에서 확인한다.

## 게이트·반려

- 게이트 미달 시 pipeline 스킬의 반려 규칙대로 **원인 페이즈로 반려**하여 재작업시킨다.
- 동일 페이즈 반려가 **5회를 초과**하면 파이프라인을 중단하고, 현재 산출물과 미해결 위반 목록을 사람에게 보고한다.

## 산출물 위치

주제를 kebab-case로 변환한 이름의 새 프로젝트 디렉토리를 **cwd 하위에 생성**하고, 모든 산출물을 그 안에 둔다.

## 완료 보고 형식

완료 시 주요 산출물의 **절대경로**를 항상 출력한다(사용자가 바로 열어볼 수 있도록). 상세 내용은 보고서 안에 있으므로 콘솔엔 경로만 나열한다.

수동 모드: 아래 경로 목록 + "검토 후 승인해 주세요"로 마친다.

```
보고서:   {프로젝트 절대경로}/docs/REPORT-v{version}.md   ← 검토 후 승인해 주세요
앱명세:   {프로젝트 절대경로}/docs/APP-SPEC.md (앱 전체 명세 마스터)
제출문서: {프로젝트 절대경로}/docs/SUBMIT.md (출시·업데이트 노트 + 앱 내 기능)
검수:     {프로젝트 절대경로}/docs/REVIEW-REPORT.md
빌드:     {프로젝트 절대경로}/{appName}.ait
에셋:     {프로젝트 절대경로}/docs/assets/ (icon·screenshot-1~3·thumbnail)
```

자동 모드(`--auto`): 위 경로 목록 + 커밋 결과를 출력한다.

```
보고서: {프로젝트 절대경로}/docs/REPORT-v{version}.md · 커밋: {해시}({브랜치}, push {여부})
```

## 출시 별도 안내

**출시는 별도다.** 사용자가 "출시해라"라고 하면 `ait-console submit-review → release-watch` 체인을 시작한다. 파이프라인·`--auto` 모드에서 출시를 자동 수행하지 않는다.

## 중단 예외

유일한 시작 차단 예외는 **주제 자체가 정책 금지영역**(금융상품 추천 등)인 경우다. 이때는 즉시 중단하고 대안을 제시한다. 그 외에는 무개입으로 끝까지 진행한다.
