# CLAUDE.md 작성 가이드

## 용도
오케스트레이터(메인 에이전트)가 프로젝트 전체를 이해하고 서브에이전트를 조율하기 위한 설정 문서입니다.

## 템플릿

```markdown
# {프로젝트명} 앱인토스 미니앱

## 나의 역할: 오케스트레이터
- 직접 코드를 작성하지 않고 서브에이전트에게 작업을 분배하고 조율
- 사용자 요청을 분석하고 적절한 에이전트에 위임
- 리뷰 결과를 보고 담당 에이전트에 재작업 지시

## 에이전트 팀
| 에이전트 | 역할 | 작업 범위 |
|---------|------|----------|
| `app-developer` | React + TDS UI 개발 | `app/` |
| `devops` | 빌드, 배포, CI/CD | `Dockerfile`, `.github/workflows/` |
| `reviewer` | 코드 리뷰 & 검수 체크리스트 | 전체 (읽기만) |
{추가 에이전트 행}

## 워크플로우

​```
[1] 요구사항 분석 → 필요한 에이전트 결정
    ↓
[2] 문서 업데이트 (DESIGN.md, API.md 등)
    ↓
[3] 개발 ({에이전트 순서})
    ↓
[4] 리뷰 (reviewer) ← 최종 1회
    ↓ Error 있으면
[5] 재작업 → [4]로 복귀 (최대 2회)
    ↓ Error 없으면
[6] 완료
​```

### 병렬 실행 가능
- {병렬 가능한 작업 조합}

### 리뷰 결과 처리
| 이슈 위치 | 담당 에이전트 |
|-----------|-------------|
| `app/` | app-developer |
| `Dockerfile`, `.github/workflows/` | devops |
{추가 매핑}

## 서브에이전트 지시 시 포함할 정보
1. 작업 목표 (한 문장)
2. 관련 문서 경로
3. 수정 범위
4. 제약사항
5. 완료 기준

## 기술스택
- React 18 + TypeScript + Vite
- TDS (`@toss/tds-mobile`, `@toss/tds-mobile-ait`)
- react-router-dom
- Apps-in-Toss (`@apps-in-toss/web-framework@^2.0.5`)
{추가 기술스택}

## 앱 구조
{plan.md 기반으로 라우팅, 페이지 구조 정리}

## AIT 빌드 & 배포
- `apps-in-toss.config.ts`: 앱 설정 (appName: '{앱이름}', brand.primaryColor, permissions). 개발 서버 포트·빌드 명령은 `package.json` scripts에 있다 (SDK 2.x 프로젝트는 `granite.config.ts`)
- `npx ait build` → `{앱이름}.ait` 번들 생성
- TDSProvider 조건부 분기: AIT → TDSMobileAITProvider, 브라우저 → TDSMobileProvider

## UI 규칙
- TDS 컴포넌트 필수 사용
- 라이트 모드만
- 금융상품 추천/앱설치 유도 금지. 외부 링크는 제한적 허용
- 번들 100MB 이하
```

## 작성 원칙
- plan.md의 내용을 기술적 관점으로 변환
- 에이전트 팀 구성은 Step 3 결과를 반영
- 워크플로우에 리뷰 루프(최대 2회), 재작업 지시, 병렬 실행 규칙을 반드시 포함
- 리뷰 결과 → 담당 에이전트 매핑 테이블 포함
- 프로젝트별 고유 규칙이 있으면 별도 섹션으로 추가
