# 오케스트레이터 라우팅 참고

이 문서는 라우팅 보조용 보충 자료입니다. 전체 실행 흐름·단계 정의·게이트 통과 기준은 여기에 중복 기술하지 않습니다.

> 단계 정의·진입/통과 게이트 기준의 단일 출처(SSOT)는 `pipeline` 스킬입니다. 전체 흐름이 필요하면 `pipeline` 스킬을 참조하세요.
> 전체 플로우 실행은 `/appintoss:create`(신규)·`/appintoss:update`(변경) 커맨드가 담당합니다.

## 6 에이전트

| 에이전트 | 역할 |
|----------|------|
| `planner` | 기획·요구사항 정리·플로우 설계 |
| `designer` | UI/UX 디자인·화면 설계·TDS 적용 |
| `app-developer` | 프론트엔드 미니앱 구현 |
| `back-developer` | 서버·API 구현 |
| `visual-qa` | 스크린샷 기반 시각 검수 |
| `reviewer` | 코드 리뷰·검수·빌드/배포/제출 점검 (구 devops 역할 통합) |

## 문서 우선 원칙

구현 전에 계약 문서를 먼저 확정해 에이전트 간 불일치를 막습니다.

**API가 필요한 경우:**
- `back-developer`에게 `docs/API.md` 엔드포인트 추가/수정 지시 후, 확정되면 구현으로 넘어갑니다.

**UI 페이지가 필요한 경우:**
- `designer`에게 `docs/design/{page}/DESIGN.md` 작성/수정 지시 후, 확정되면 `app-developer`가 구현합니다.

> 문서가 먼저 확정되어야 구현 단계에서 에이전트 간 불일치가 없습니다.

## 재작업 처리

- 리뷰 결과에서 **Error** 항목을 추출해 파일 경로 기반으로 담당 에이전트를 결정합니다.
- 담당 에이전트에게 리뷰어 이슈 원문과 수정 대상 파일/라인을 전달합니다.
- **Warning**은 재작업하지 않고 사용자에게 보고만 합니다.
- 시각 결함은 `visual-qa`가 확인 후 해당 구현 에이전트로 넘깁니다.

## 병렬 vs 순차

| 병렬 가능 | 조건 |
|----------|------|
| DESIGN.md 작성(designer) + API.md 작성(back-developer) | 서로 독립적인 문서 |

| 순차 필수 | 이유 |
|----------|------|
| API.md → back-developer 구현 | API 명세 확정 후 구현 |
| API.md → app-developer 구현 | API 명세 기반 호출 |
| 구현 → reviewer / visual-qa | 코드 완성 후 검수 |

## 에이전트 지시 템플릿

```markdown
## 작업 지시

**목표**: {기능명} 구현
**관련 문서**: `docs/API.md`, `docs/design/{page}/DESIGN.md`
**스코프**: `{directory}/` 내 파일
**제약사항**:
- {제약 1}
- {제약 2}
**완료 기준**:
- {기준 1}
- {기준 2}
```

## 문서 신선도 주의

번들 문서가 stale일 수 있다. 불확실하면 공홈 조회(https://developers-apps-in-toss.toss.im/)를 우선하라.
