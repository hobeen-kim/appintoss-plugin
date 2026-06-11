---
description: 기존 앱인토스 미니앱에 기능 추가·수정을 무개입 적용 (영향 분석 → 증분 구현 → 재검수)
argument-hint: "변경 요청 (예: 월별 통계 화면 추가)"
---

# /appintoss:update

기존 앱인토스 미니앱에 기능 추가·수정을 사람 개입 없이 적용하는 파이프라인이다.

## 입력

- 변경 요청은 `$ARGUMENTS`로 받는다.
- 변경 요청이 비어 있으면 사용자에게 **1회만** "무엇을 변경할까요?"라고 질문한 뒤 진행한다.
- `$ARGUMENTS`에 `--auto`가 있으면 **자동 모드**로 실행한다(Phase 8' 자동 승인 → Phase 9 git 자동 푸시). 규칙은 pipeline 스킬 Phase 8/9 정의를 따른다. `--auto`는 변경 요청 문자열에서 제외한다.
- `--auto` 미지정 시 대상 디렉토리 `.appintoss.json`의 `autoMode`(기본 false)를 읽어 적용한다. 명령행 `--auto` 플래그가 항상 우선.

## 단일 출처 — pipeline 스킬 로드

이 커맨드는 페이즈·게이트·반려 규칙을 **중복 기술하지 않는다.** 모든 기준은 `skills/pipeline/SKILL.md`가 단일 출처다.

**가장 먼저 pipeline 스킬을 로드**하고, 그 스킬의 **update 모드(Phase 0'~7')** 정의·게이트·반려 규칙·에러 처리 표를 그대로 따른다.

## 실행 흐름 (update 모드)

pipeline 스킬의 update 모드 정의를 따른다. 각 페이즈는 해당 에이전트(`agents/*.md`)에 위임한다.

1. **preflight** — 도구·환경 점검. 이어서 **재개 감지**: `PIPELINE-LOG.md`가 있고 기록된 변경 요청 문자열이 이번 요청과 같으면 pipeline 스킬 §재개 규칙에 따라 마지막 `판정: PASS` 페이즈 + 산출물 실재 확인 후 다음 페이즈부터 재개한다("Phase N'부터 재개" 1줄 보고). 변경 요청이 다르거나 "처음부터"면 새 실행.
2. **Phase 0'** — 영향 분석 (planner)
   - 기존 `PLAN.md` · `DESIGN.md` · `API.md`를 로드해 변경 범위와 영향 화면을 식별한다.
   - 스펙 파일이 없는 외부 프로젝트면 **코드 역분석으로 스펙을 복원**한 뒤 진행한다.
   - 식별한 영향 화면의 **before 스크린샷을 변경 전에 캡처**한다 (visual-qa 위임, `qa-screens/before/` — Phase 8' before/after 비교 기준).
3. **Phase 1'** — 증분 스펙 갱신 (designer ⇄ reviewer)
   - 영향받는 페이지만 `DESIGN.md`를 증분 수정하고 크리틱한다.
4. **Phase 2'~6'** — create 모드와 동일 (게이트·담당 동일)
   - 단, Phase 3' 비주얼 검증은 **변경된 화면만** 3-A/3-B/3-C로 검증한다. 3-C 패널: before/after 스크린샷을 designer·reviewer·visual-qa 3관점이 비교 검토·합의(pipeline 3-C 참조).
5. **Phase 7'** — 에셋 갱신 (조건부)
   - **변경된 화면이 기존 화면예시 3장에 포함될 때만** 해당 화면예시를 재캡처한다. 그렇지 않으면 에셋 갱신을 생략한다.
6. **Phase 8'** — visual-qa: `docs/REPORT-v{version}.md` 보고서 생성 (변경 화면 **before/after 비교 필수**) → 수동 모드면 경로 제시 후 **승인 대기로 종료**(사람의 유일한 개입 지점), 자동 모드면 자동 승인 후 Phase C'로 진행
7. **Phase C'** — ait-console 스킬: `upload`(테스트 버전) → `test-send` 무조건 수행(실앱 포함, 보류 금지). 각 단계 결과를 보고서 §콘솔 테스트에 기록. **테스트 발송까지만 자동. `--auto` 모드도 동일하게 테스트 발송 한정.**
8. **Phase 9** (자동 모드 한정) — reviewer: git 커밋 + (remote 있으면) push, 결과를 보고서에 기록 (pipeline Phase 9 가드 준수)

각 페이즈의 입력·산출물·게이트 기준은 pipeline 스킬에서 확인한다.

## 게이트·반려

게이트 기준과 반려 한도(동일 페이즈 5회 초과 시 중단·보고)는 create와 동일하게 pipeline 스킬 정의를 공유한다.

## 완료 보고 형식

완료 시 주요 산출물의 **절대경로**를 항상 출력한다(사용자가 바로 열어볼 수 있도록).

수동 모드: 아래 경로 목록 + "검토 후 승인해 주세요"로 마친다.

```
보고서:   {프로젝트 절대경로}/docs/REPORT-v{version}.md   ← 검토 후 승인해 주세요 (before/after 비교 포함)
앱명세:   {프로젝트 절대경로}/docs/APP-SPEC.md (앱 전체 명세 마스터)
제출문서: {프로젝트 절대경로}/docs/SUBMIT.md (업데이트 노트 v{version} 추가됨 + 앱 내 기능)
검수:     {프로젝트 절대경로}/docs/REVIEW-REPORT.md
빌드:     {프로젝트 절대경로}/{appName}.ait (v{이전}→v{현재})
```

자동 모드(`--auto`): 위 경로 목록 + 커밋 결과를 출력한다.

```
보고서: {프로젝트 절대경로}/docs/REPORT-v{version}.md · 커밋: {해시}({브랜치}, push {여부})
```

## 광고 점검

update 실행 시 **광고 적용 여부를 점검**한다 — 광고(최소 배너)가 없거나 부족하면 광고 추가를 변경 후보에 포함시킨다. **프로모션은 사용자 직접 수행 영역이다** — 에이전트가 제안·신청하지 않는다. 사용자가 프로모션을 명시 요청한 경우에만 `ait-promotion-reward` 스킬 "프로모션 ROI 검토" 절을 적용해 가이드한다. (pipeline §사용자 직접 수행 영역 참조)

## 출시 별도 안내

**출시는 별도다.** 사용자가 "출시해라"라고 하면 `ait-console submit-review → release-watch` 체인을 시작한다. 파이프라인·`--auto` 모드에서 출시를 자동 수행하지 않는다.
