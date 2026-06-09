---
description: 미니앱 개선점 발굴 → 자동 update → 보고를 1회 실행 (기능·UI/UX·품질 3축)
argument-hint: "프로젝트 경로 [--focus feature|uiux|quality|auto]"
---

# /appintoss:improve

기존 앱인토스 미니앱을 1회 진단하여 개선 후보 1건을 발굴하고 `/appintoss:update --auto`로 적용한 뒤 결과를 로그에 남긴다. **이 커맨드는 1회 실행 단위다.**

## 입력

- 대상은 `$ARGUMENTS`(프로젝트 경로 또는 앱명)로 받는다. 비어 있으면 사용자에게 **1회만** "어떤 앱을 개선할까요?"라고 질문한다.
- `--focus` 옵션으로 개선 축을 지정한다 (기본 `auto`):
  - `feature` — 기능 추가·플로우 개선
  - `uiux` — 레이아웃·카피·시그니처 모먼트·터치 타겟·접근성
  - `quality` — 리팩터·번들 크기·검수 반려 리스크 제거
  - `auto` — 아래 3축을 모두 진단해 **ROI가 가장 높은 1건** 선택

## 개선 대상 3축

**1차 근거는 항상 코드와 실제 화면이다.** `REPORT-v*.md`·`IMPROVE-LOG.md`·`PLAN/DESIGN.md`는 **있으면 참고하는 보조 자료**일 뿐 — 없다고 진단을 건너뛰지 않는다. 보조 파일이 없으면 아래 "직접 측정"으로 근거를 **생성**해 진단한다.

| 축 | 다루는 것 | 1차 근거 (항상 가능, 직접 측정) | 보조 (있으면 참고) |
|---|---|---|---|
| **기능(feature)** | 새 기능·플로우 | 코드 역분석으로 현재 기능 파악 + WebSearch 트렌드 | PLAN.md 스펙 |
| **UI/UX(uiux)** | 레이아웃·카피·시그니처 모먼트·터치 타겟·a11y | **dev 서버 기동 → Playwright 스크린샷 + axe-core 직접 실행**해 약점 측정 | 직전 비주얼 점수·3-C 패널 지적 |
| **품질(quality)** | 리팩터·번들 크기·검수 반려 리스크 | **`tsc`/`lint` 실행 + 번들 크기 측정 + 검수 11단계 직접 점검** | REVIEW-REPORT.md |

## 단일 출처 — pipeline 스킬

update 실행은 `skills/pipeline/SKILL.md`의 update 모드·게이트·반려 규칙을 단일 출처로 따른다. 이 파일은 진단·선택 절차만 정의한다.

## 실행 흐름 (1회 실행 단위)

1. **대상 로드 + 스펙 복원** — 대상 앱의 `src/`(코드)를 1차로 읽는다. `PLAN.md`·`DESIGN.md`가 있으면 로드하고, **없으면 코드 역분석으로 스펙을 복원**한다(update Phase 0' 규칙 재사용). 직전 `docs/IMPROVE-LOG.md`·`docs/REPORT-v*.md`는 있으면 참고만.
2. **축별 직접 진단** — `--focus`가 특정 축이면 그 축만, `auto`면 3축 전부 진단한다. **보조 파일 부재는 진단을 막지 않는다 — 직접 측정으로 근거를 만든다.**
   - feature: 코드 역분석으로 현재 기능 목록 파악 → WebSearch 트렌드(`knowledge/toss-user-insights.md` 휴리스틱) 대비 스펙 갭 도출
   - uiux: **dev 서버(`granite dev`/`vite`) 기동 → Playwright로 전 화면 스크린샷(318×524 @2x) + axe-core 스캔** → 비주얼 루브릭·접근성·트렌드 디자인 대비 약점 측정 (REPORT 있으면 직전 점수와 비교)
   - quality: `npx tsc -b --noEmit`·`lint` 실행 + 번들 크기(`du`/빌드) + `ait-review` 11단계 직접 점검 → 잔여 리스크 도출
3. **개선 후보 1건 선택** — 직접 측정한 진단 결과에서 후보를 **1건만** 선택한다(auto는 영향도/구현비용 기준 ROI 최상위). **실제로 측정해보고도** 마땅한 후보가 없을 때만 `docs/IMPROVE-LOG.md`에 "변경 없음"(측정 근거 명시)을 기록하고 종료한다. 보조 파일이 없다는 이유만으로 "변경 없음" 종료는 금지.
4. **자동 update 실행** — 선택한 후보를 `/appintoss:update --auto "{개선안}"`으로 실행한다(자동 모드 → Phase 9 git 자동 푸시까지). pipeline의 자동 모드 중단 예외(정책 금지영역·반려 5회 초과·빌드 실패)는 그대로 적용된다.
5. **로그 기록** — 결과를 `docs/IMPROVE-LOG.md`에 append한다: 일시 · 개선 축 · 개선안 · 커밋(해시/브랜치/push 여부) · 게이트 결과.
6. **경로 출력** — 완료 시 `docs/IMPROVE-LOG.md`·`docs/REPORT-v{version}.md`·`docs/SUBMIT.md`의 **절대경로**를 출력한다(사용자가 바로 열어볼 수 있도록). '변경 없음'이면 IMPROVE-LOG 경로만.

## 무한 자동변경 방지

- **1회 실행당 update 1건만** 수행한다.
- 직전 `docs/IMPROVE-LOG.md`와 **동일한 개선안은 중복 실행 금지**한다(같은 후보가 다시 도출되면 "변경 없음"으로 종료).
- 주기 반복이 필요하면 사용자가 `/loop` 또는 cron으로 이 커맨드를 감싸 쓴다.
