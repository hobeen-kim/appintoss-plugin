---
name: project-start
description: 새 앱인토스 프로젝트 초기 세팅. plan.md 작성 후 필요한 에이전트/스킬을 선별하여 구성.
trigger: 새 프로젝트 시작, 프로젝트 초기화, 프로젝트 세팅, 새 앱 만들기 시 트리거
references:
  - ./references/project-start-claude-md.md
  - ./references/project-start-plan-md.md
  - ./references/workflow-template.yml
---

# 프로젝트 시작 가이드

새 앱인토스 미니앱 프로젝트를 초기 세팅하는 스킬입니다.

## Step 0: 마케팅 퍼스트 — 앱 만들기 전에 메시지부터

> "아이디어부터 시작하지 마라. 마케팅 메시지부터 설계하라."

코드 한 줄 쓰기 전에 사용자와 함께 다음을 먼저 정리한다. 이 단계를 건너뛰면 DAU 한 자릿수 앱이 된다.

### 0-1. 타겟 유저 설계

사용자에게 질문:
1. **누가 쓸 앱인가?** — 토스 핵심 활성 유저층은 40대 이상. 20대 푸시 CTR은 매우 낮고, 10대는 앱인토스 사용 불가.
2. **세그먼트는?** — 토스는 실제 결제 데이터 기반 정밀 타겟팅 가능 (100+개 거래정보 카테고리, 전부 무료)
3. **이 앱이 타겟에게 주는 가치는?** — "이 앱을 왜 열어야 하지?"에 한 문장으로 답할 수 있어야 한다

### 0-2. 마케팅 메시지 설계

사용자에게 질문:
1. **푸시 알림 문구 초안** — 20자 이내, 토스 유저가 탭하고 싶은 한 줄. 이것이 앱의 존재 이유.
2. **카테고리 선택** — 앱인토스 카테고리 중 어디에 노출될지. 인기 vs 비인기 카테고리 전략.
3. **CTR 예측** — "이 문구를 받으면 나라도 누르겠는가?"

### 0-3. 역설계 기획

마케팅 메시지가 확정되면 거꾸로 기획:
```
푸시 문구 → 진입 화면에서 뭘 보여줄지 → 핵심 기능 → 나머지 화면
```

### 4가지 실패 신호 (사용자에게 경고)
1. "내가 좋아하는 아이디어"에서 출발하고 있다
2. 토스 유저층(40대+)을 고려하지 않고 있다
3. 마케팅을 "나중에" 생각하려 한다
4. 세그먼트/메시지를 개발 후에 생각하려 한다

→ 위 신호가 보이면 반드시 사용자에게 알린다.

### Step 0 완료 기준
- 타겟 유저 한 줄 정의 완료
- 푸시 문구 초안 1개 이상
- 역설계 기반 핵심 기능 3개 도출

---

## Step 0.5: 앱 정보 작성

마케팅 전략이 확정되면 앱인토스 등록에 필요한 앱 정보를 사용자와 함께 작성한다.

사용자에게 다음 4가지를 확인:

1. **앱 이름** — 앱인토스에 노출될 공식 이름
2. **부제** — 20자 이하, 앱의 핵심 가치를 한 줄로 전달
3. **상세 설명** — 앱의 기능과 사용 방법을 구체적으로 설명
4. **앱 검색 키워드** — 10개 태그, 토스 검색에서 노출될 키워드

### 작성 원칙
- 부제는 Step 0에서 만든 푸시 문구와 톤을 맞춘다
- 키워드는 타겟 유저가 실제 검색할 만한 단어를 우선 배치한다
- 확정된 앱 정보는 `plan.md`의 상단에 기록한다

### plan.md 기록 형식

```markdown
## 앱 정보
- **앱 이름**: {앱 이름}
- **부제**: {20자 이하}
- **상세 설명**: {상세 설명}
- **검색 키워드**: {태그1}, {태그2}, ... {태그10}
```

### Step 0.5 완료 기준
- 앱 이름 확정
- 부제 20자 이하 확인
- 검색 키워드 10개 확정

---

## Step 1: 디렉토리 생성

사용자에게 프로젝트 이름을 확인한 후 루트 디렉토리를 생성합니다.

```bash
mkdir -p {projectName}
```

## Step 2: plan.md 작성

사용자와 대화하며 다음 내용을 정리합니다:

- 프로젝트 목적 및 핵심 기능
- 타겟 사용자
- 주요 화면/페이지 목록
- 필요한 외부 API/데이터
- 기술적 제약사항

→ `{projectName}/plan.md`에 작성
→ 질문 항목과 템플릿은 **project-start-plan-md.md** 레퍼런스 참고

## Step 3: 에이전트 및 스킬 구성

plan.md를 기반으로 필요한 에이전트와 스킬을 선별하여 복사합니다.

### 필수 (항상 복사)
- **에이전트**: `app-developer.md`, `reviewer.md`, `devops.md`

### 선택 (사용자 컨펌 후 복사)
plan.md 분석 결과를 바탕으로 추가 에이전트를 제안합니다.
**반드시 목록을 보여주고 컨펌을 받은 후** 진행합니다.

| 조건 | 에이전트 | 설명 |
|------|---------|------|
| 서버/API 필요 | `back-developer` | 백엔드 API 개발 |
| 외부 데이터 조사 | 새 에이전트 제안 | researcher 등 |
| 계산/로직 전담 | 새 에이전트 제안 | calc-engine 등 |

### 스킬 복사 규칙

**루트에 이미 있는 스킬은 하위 프로젝트에 복사하지 않는다.** Claude Code는 상위 디렉토리의 `.claude/skills/`도 로드하므로, 하위에 복사하면 중복으로 2개씩 표시된다.

하위 프로젝트 `.claude/skills/`에는 **프로젝트 고유 스킬만** 생성한다 (예: calculator의 `qa-verify`, `test-writing`).

```
루트 .claude/skills/ — 모든 프로젝트가 공유하는 스킬 (ait-*, front-*, orchestrator 등)
{projectName}/.claude/skills/ — 이 프로젝트에만 필요한 고유 스킬
```

### 복사 절차

```bash
# 에이전트 복사
mkdir -p {projectName}/.claude/agents/
cp .claude/agents/app-developer.md {projectName}/.claude/agents/
cp .claude/agents/reviewer.md {projectName}/.claude/agents/
cp .claude/agents/devops.md {projectName}/.claude/agents/
# + 컨펌된 추가 에이전트

# 프로젝트 고유 스킬이 필요한 경우에만 디렉토리 생성
# mkdir -p {projectName}/.claude/skills/
# 루트에 있는 공용 스킬(ait-*, front-*, back-api, orchestrator 등)은 복사하지 않는다
```

### 에이전트 구성 결과를 plan.md에 기록

선별 완료 후, plan.md 하단에 다음을 추가합니다:

```markdown
## 에이전트 구성

### 필수
- `app-developer` — 프론트엔드 UI 개발
- `reviewer` — 코드 리뷰 및 검수
- `devops` — 빌드, 배포, 인프라

### 추가 선택
- `{에이전트명}` — {역할} (선택 사유: {이유})

### 프로젝트 고유 에이전트
- `{에이전트명}` — {역할} (신규 생성 사유: {이유})
```

## Step 4: 프로젝트별 에이전트 커스터마이징

복사한 에이전트를 프로젝트에 맞게 조정합니다:

1. **작업 범위 조정**: 프로젝트 디렉토리 구조에 맞춰 읽기/수정 경로 수정
2. **규칙 추가**: 프로젝트 고유 규칙이 있으면 에이전트 규칙 섹션에 추가
3. **고유 에이전트 생성**: plan.md에서 도출된 프로젝트 특화 에이전트 작성
   - 기존 에이전트를 템플릿 삼아 동일한 구조(역할, 작업 범위, 작업 순서, 규칙)로 작성
   - frontmatter에 필요한 skills 추가 (기존 스킬 또는 새 스킬 생성)
4. **오케스트레이터 스킬 커스터마이징**: `orchestrator/references/orchestrator-workflow.md`를 프로젝트 워크플로우에 맞게 수정
   - 에이전트 팀 목록 반영
   - 병렬/순차 실행 규칙 조정
   - 리뷰 결과 → 담당 에이전트 매핑 테이블 수정

## Step 5: 페이지별 디자인 — DESIGN.md 작성 → 구현 → Vite 프리뷰

plan.md의 화면 구성을 기반으로, 각 페이지의 디자인을 설계하고 실제 확인한다.
**front-design** 스킬의 DESIGN.md 템플릿을 활용한다.

> TDS는 React+Emotion 기반이므로 HTML 목업 불가. DESIGN.md(설계) → 실제 TDS 코드(구현) → Vite dev server(프리뷰) 순서로 진행한다.

### 진행 방식

```
[1] DESIGN.md 작성 (텍스트 기반 설계)
    ↓
[2] app-developer가 TDS 컴포넌트로 구현
    ↓
[3] Vite dev server로 실제 화면 확인 (npm run dev)
    ↓
[4] 사용자 피드백 → DESIGN.md 수정 → [2]로 복귀
```

### [1] DESIGN.md 작성 — 페이지별 설계 명세

각 페이지마다 다음을 DESIGN.md에 작성한다:

#### a. 레이아웃 구성
- 영역 배치를 **ASCII 레이아웃**으로 시각화
- 각 영역에 매핑할 **TDS 컴포넌트** 명시
- 예시:
```
┌─────────────────────┐
│ [Header] 뒤로가기    │  ← NavigationBar
├─────────────────────┤
│                     │
│  상황 선택 그리드     │  ← GridList + GridListItem
│                     │
├─────────────────────┤
│  [추천받기] 버튼      │  ← Button variant="primary"
└─────────────────────┘
```

#### b. TDS 컴포넌트 매핑 테이블
| 영역 | TDS 컴포넌트 | Props | 비고 |
|------|-------------|-------|------|
| 헤더 | NavigationBar | title="..." | 뒤로가기 포함 |
| 선택 | GridList | columns={3} | 아이콘+텍스트 |
| CTA | Button | variant="primary" size="large" | 하단 고정 |

#### c. 광고 지면 배치
- 해당 페이지에 광고가 들어가는 경우, ASCII 레이아웃에 광고 영역을 포함한다
- 광고 유형(배너/보상형)과 위치를 명시한다
- UX를 해치지 않는 위치에 배치한다 (결과 화면 하단, 리스트 사이 등)
- 예시:
```
┌─────────────────────┐
│  결과 콘텐츠          │
├─────────────────────┤
│  [배너 광고]          │  ← TossAds 배너
├─────────────────────┤
│  [다시하기] 버튼       │  ← Button
└─────────────────────┘
```

- 각 페이지 디자인 시 광고 지면이 결정되면 `docs/ads/AD.md`에 기록한다
- 모든 페이지 디자인 완료 후 AD.md의 전체 광고 계획을 최종 확정한다

### docs/ads/AD.md 작성

```markdown
# 광고 계획

## 광고 지면 배치
| 지면 | 광고 유형 | 위치 | 비고 |
|------|---------|------|------|
| {페이지명} | 배너/보상형 | {위치} | {설명} |

## 페이지별 상세

### {페이지명}
- **광고 유형**: 배너 / 보상형
- **위치**: {레이아웃 내 위치}
- **노출 조건**: {언제 노출되는지}
- **UX 고려사항**: {사용자 경험에 미치는 영향}
```

#### d. 상태 정의
- 기본/로딩/빈/에러 상태별 화면
- 각 상태에서 사용할 TDS 컴포넌트 (예: 로딩 → Skeleton, 에러 → EmptyState)

#### d. 인터랙션
- 선택/입력 방식, 페이지 전환, 결과 표시 방식

### [2-3] 구현 → Vite 프리뷰

DESIGN.md 작성 후:
1. `app-developer` 에이전트가 TDS 컴포넌트로 구현
2. `npm run dev`로 Vite dev server 실행
3. 사용자가 브라우저에서 실제 화면 확인

### [4] 피드백 루프

- 사용자가 화면을 보고 피드백 → DESIGN.md 수정 → 재구현
- **최대 2회 피드백** 후 확정하고 다음 페이지로 진행

### 설계 원칙
- 한 번에 전체 페이지를 나열하지 말고, **한 페이지씩** 순서대로 설계한다
- TDS 컴포넌트 제안 시 **2~3가지 선택지**를 보여준다
- ASCII 레이아웃으로 구조를 먼저 합의한 후 컴포넌트 매핑
- 사용자가 "알아서 해줘"라고 하면 최적안으로 결정하고 구현 후 프리뷰만 보여준다
- 디자인 확정 후 plan.md의 화면 구성 섹션도 필요 시 업데이트한다

## Step 6: API 명세 협의 (back-developer 채택 시)

back-developer가 채택된 경우, 프론트↔백엔드 간 API 계약을 사용자와 협의합니다.
**back-api** 스킬의 API.md 템플릿을 활용합니다.

### 진행 방식

1. **엔드포인트 도출**: plan.md의 기능/화면 구성에서 필요한 API 엔드포인트를 도출한다
2. **엔드포인트별 협의**: 각 엔드포인트의 요청/응답 구조를 제안하고 사용자와 논의한다
3. **API.md 작성**: 협의 결과를 `docs/API.md`에 기록한다

### 엔드포인트별 협의 항목

각 엔드포인트마다 다음을 제안하고 사용자 피드백을 반영한다:

#### a. 기본 정보
- HTTP Method + Path
- 역할 설명 (한 줄)

#### b. 요청/응답 타입
- Request Body 또는 Query Parameters (TypeScript 인터페이스)
- Response 타입 (TypeScript 인터페이스)
- 각 필드의 required/optional, 기본값

#### c. 에러 케이스
- 상태 코드 + 에러 코드 + 설명
- 주요 실패 시나리오

#### d. 동작 로직 (서버 내부)
- 비즈니스 로직 요약 (예: 프리셋 매칭 → 추출, 아니면 → GPT 호출)

### 협의 원칙
- plan.md와 DESIGN.md를 기반으로 필요한 엔드포인트를 **자동 도출**한다
- 공통 응답 형식(SuccessResponse, ErrorResponse)을 먼저 확정한다
- 사용자가 "알아서 해줘"라고 하면 최적안으로 결정하고 결과만 보여준다
- 인증이 필요한지 여부를 확인한다
- API.md 작성 후 DESIGN.md의 API 연동 섹션과 일치하는지 검증한다

### 조건
- back-developer가 채택되지 않은 프로젝트에서는 이 단계를 건너뛴다
- 서버 없이 프론트만으로 동작하는 경우 Skip

## Step 6.5: 인프라 세팅 (back-developer 채택 시)

서버가 필요한 프로젝트에서는 API 명세 협의 후, 인프라를 세팅한다.
인프라 생성은 별도 프로젝트(Terraform)에서 관리하므로 여기서는 **리소스 결정 + 요청**만 한다.

### 조건
- back-developer가 채택된 프로젝트에서만 실행
- 서버 없는 프로젝트에서는 Skip

### 진행 방식

#### a. ECR 레포지토리 결정
사용자에게 확인:
- ECR 레포지토리 이름: `{projectName}` (기본값)
- 별도 인프라 프로젝트에서 ECR 생성 필요 → 사용자에게 안내

```
ECR: {AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/{projectName}
```

#### b. API 서버 도메인 결정
사용자에게 확인:
- 도메인 패턴: `{projectName}-api.jubianix.com` (기본값)
- 또는 사용자가 원하는 서브도메인

```
API 도메인: {projectName}-api.jubianix.com
```

#### c. plan.md에 인프라 정보 기록

```markdown
## 인프라
- **ECR**: {AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/{projectName}
- **API 도메인**: {projectName}-api.jubianix.com
- **정적 파일 저장**: s3://jubianix-public-assets/{projectName}/{env}/
- **정적 파일 조회**: https://assets.jubianix.com/{projectName}/{env}/
- **AWS 프로파일**: private
- **리전**: ap-northeast-2
```

#### d. API Secret 미들웨어 세팅

토스(AIT)에서 오는 요청만 허용하기 위해, 모든 API 요청에 `secret` 헤더 검증 미들웨어를 추가한다.

- `.env`에 `SECRET_KEY` 환경변수 추가
- `/api` 경로에 미들웨어 적용, 헬스체크(`GET /actuator/health`)는 제외
- 불일치 시 `403 Forbidden` 응답

```typescript
// server/src/index.ts — /api 라우트 등록 전에 추가
app.use('/api', (req, res, next) => {
  const secret = req.headers['secret'];
  if (secret !== process.env.SECRET_KEY) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: '유효하지 않은 접근입니다.' },
    });
    return;
  }
  next();
});
```

- `.env`에 `SECRET_KEY={projectName}-secret-key` 추가
- Developer Center 콘솔 > 서버 설정 > 요청 헤더에 동일한 값 등록

#### e. Dockerfile 생성

`{projectName}/Dockerfile` 작성:
```dockerfile
FROM --platform=linux/arm64 node:20-alpine AS builder
WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY server/ .
RUN npm run build

FROM --platform=linux/arm64 node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

#### f. GitHub Actions 워크플로우 생성

`.github/workflows/{projectName}-build.yml` 작성 (루트 `.github/workflows/`에 생성):
- **workflow-template.yml** 레퍼런스를 복사하여 `{projectName}`을 실제 이름으로 치환
- `VALUES_PATH`는 인프라 레포의 Helm values 경로에 맞게 조정
- 배포(apply/rollout)는 인프라 레포 PR 머지로 처리

---

## Step 7: CLAUDE.md 작성

plan.md와 구성된 에이전트 팀을 기반으로 오케스트레이터용 설정 문서를 작성합니다.

→ `{projectName}/CLAUDE.md`에 작성
→ 템플릿과 작성 원칙은 **project-start-claude-md.md** 레퍼런스 참고
→ back-developer 채택 시 **핵심 문서** 섹션에 `docs/API.md` 경로 반드시 포함

## Step 8: 디렉토리 구조 생성

### 필수
```
{projectName}/
├── .claude/
│   ├── agents/
│   └── skills/
├── app/                 # 프론트엔드 (React + TDS)
├── docs/
│   ├── ads/             # 광고 계획 AD.md
│   ├── design/          # 페이지별 DESIGN.md
│   └── knowledge/       # 개발 규칙 (루트에서 복사)
├── plan.md
└── CLAUDE.md
```

### 선택 (back-developer 채택 시)
```
├── server/              # 백엔드 API
└── Dockerfile           # 서버 Docker 빌드

# 루트 레벨 (하위 프로젝트 밖)
.github/workflows/{projectName}-build.yml  # CI/CD (Docker build → ECR push)
```

### knowledge 복사

하위 프로젝트가 루트로 동작하므로, 루트의 `docs/knowledge/`를 복사한다:

```bash
cp -r docs/knowledge/ {projectName}/docs/knowledge/
```

→ 하위 프로젝트 CLAUDE.md의 Knowledge 섹션에서 `docs/knowledge/` 경로로 참조

## 문서 신선도

번들 문서가 stale일 수 있다. API·정책·규격이 불확실하면 공홈 조회를 우선하라: https://developers-apps-in-toss.toss.im/
