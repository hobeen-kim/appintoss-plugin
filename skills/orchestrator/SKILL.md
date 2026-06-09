---
name: orchestrator
description: 라우팅 보조. 사용자가 /appintoss:create·/appintoss:update 커맨드 없이 개별 작업을 요청할 때 어느 에이전트·스킬로 보낼지 안내한다.
trigger: 커맨드 없이 개별 작업(구현/디자인/리뷰/제출 등)을 요청해 어떤 에이전트·스킬로 보낼지 모호할 때 트리거
references:
  - ./references/orchestrator-workflow.md
---

# 오케스트레이터 (라우팅 보조)

v2에서 전체 개발 플로우의 단계 진행과 게이트 통과 판정은 `/appintoss:create`·`/appintoss:update` 커맨드와 `pipeline` 스킬이 담당합니다. 오케스트레이터는 그 머신을 **대체하지 않고**, 사용자가 커맨드 없이 개별 작업을 요청했을 때 어느 에이전트·스킬로 보낼지 안내하는 **라우팅 보조 역할**만 수행합니다.

## 단일 출처 원칙

단계 정의·진입/통과 게이트 기준의 **단일 출처(SSOT)는 `pipeline` 스킬**입니다. 이 파일에는 단계 정의 표를 중복 기술하지 않습니다. 전체 흐름·게이트가 필요하면 항상 `pipeline` 스킬을 참조하세요.

전체 플로우를 돌리려면:
- 신규 앱 → `/appintoss:create`
- 기존 앱 변경 → `/appintoss:update`

위 커맨드가 내부적으로 `pipeline` 스킬을 따라 단계를 진행합니다.

## 라우팅 규칙

사용자 요청에서 작업 성격을 파악해 아래 매핑으로 보냅니다.

| 요청 성격 | 담당 에이전트 | 관련 스킬 |
|-----------|-------------|----------|
| 기획·요구사항 정리·플로우 설계 | `planner` | `project-start` |
| UI/UX 디자인·화면 설계·TDS 적용 | `designer` | `front-design`, `front-tds` |
| 프론트엔드 구현·미니앱 화면 개발 | `app-developer` | `front-tds`, `ait-sdk` |
| 서버·API 구현 | `back-developer` | `back-api` |
| 시각 검수·스크린샷 기반 QA | `visual-qa` | `front-design` |
| 코드 리뷰·검수·빌드/배포/제출 점검 | `reviewer` | `ait-build`, `ait-submit` |

> devops 역할은 v2에서 `reviewer`에 통합되었습니다. 빌드/배포/제출 관련 검수도 `reviewer`가 담당합니다.

## 에이전트 지시 방법

에이전트로 보낼 때 다음 정보를 반드시 포함합니다.

```
1. 작업 목표: 무엇을 구현/수정해야 하는지 (한 문장)
2. 관련 문서: 참고해야 할 docs/ 경로
3. 스코프: 수정해야 할 파일/디렉토리 범위
4. 제약사항: 주의할 점, 하지 말아야 할 것
5. 완료 기준: 작업이 완료되었다고 판단할 조건
```

## 리뷰 결과 처리

리뷰어 출력에서 이슈를 파싱하여 담당 에이전트를 결정합니다.

| 이슈 위치 | 담당 에이전트 |
|-----------|-------------|
| `app/` 파일 | app-developer |
| `server/` 파일 | back-developer |
| 빌드/배포/제출 설정 | reviewer |
| `docs/API.md` 불일치 | 원인 측 에이전트 (API 변경자) |
| `docs/design/` 불일치 | designer 또는 app-developer |
| 화면 시각 결함 | visual-qa → 해당 구현 에이전트 |

재작업 지시 시 리뷰어의 원문 이슈를 그대로 전달합니다.

## 문서 신선도 주의

번들 문서가 stale일 수 있다. 불확실하면 공홈 조회(https://developers-apps-in-toss.toss.im/)를 우선하라.
