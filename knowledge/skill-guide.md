# 스킬 가이드

## Skill vs Hook vs MCP

| 도구 | 비유 | 동작 | 예시 |
|------|------|------|------|
| **Skill** | 안장(Saddle) | 필요할 때 올라타는 전문 지식 (확률적) | front-tds, ait-sdk |
| **Hook** | 멍에(Yoke) | 예외 없이 강제 실행 (경정분적) | lint, format |
| **MCP** | 고삐 연장 | 외부 세계 연결 | Supabase, Brave Search |
| **Command** | 고삐(Reins) | 직접 조종, 명시적 호출 | /init, /validate |

## 핵심 차이

- Skill은 "하면 좋겠다" → AI가 상황에 따라 참조
- Hook은 "반드시 한다" → 코드 수정하면 무조건 실행
- 둘을 혼동하면 안 된다

## 현재 스킬 목록

### 앱인토스 플랫폼
| 스킬 | 용도 |
|------|------|
| `ait-sdk` | SDK API — 네이티브 브릿지, 저장소, 권한, 광고, 이벤트 |
| `ait-build` | granite CLI — 빌드, 번들링, 개발 서버, 트러블슈팅 |
| `ait-review` | 검수 기준 및 출시 전 11단계 체크리스트 (실제 반려 사례 기반) |
| `ait-submit` | 제출 전 최종 검수 + 출시노트/기능 목록(docs/SUBMIT.md) 작성 |
| `ait-deeplink` | 딥링크, 페이지 네비게이션, 백/홈 이벤트 처리 |
| `ait-analytics` | Analytics API — 화면 조회, 노출, 클릭 이벤트 로깅 |
| `ait-login` | 토스 로그인(OAuth2) 연동 — mTLS 인증서, 연동 해제 콜백 |
| `ait-promotion-reward` | 프로모션/리워드 — 출석 보상, 공유 리워드, 미션, 인앱결제 |
| `ait-smart-message` | 토스 푸시 알림 마케팅 소재 생성 — CTR 문구, 세그먼트, A/B 테스트 |
| `ait-coachmark` | 온보딩/코치마크 — TDS Tooltip 기반 첫 사용자 경험(FTUE) |
| `ait-a11y` | 프론트엔드 접근성(a11y) 가이드 — 4대 원칙 기반 체크리스트 |
| `ait-deus` | Deus 앱빌더 코드를 프로젝트에 통합 |
| `ait-docs` | 공식 문서 검색 — ax CLI 기반 Developer Center, TDS 문서 |
| `ait-assets` | 콘솔 제출 에셋(앱 아이콘·화면 예시·썸네일) 자동 생성 |
| `ait-setup` | 파이프라인 프로젝트 설정(.appintoss.json) 초기화 |
| `ait-console` | 콘솔 자동화 — 앱 등록·에셋·테스트 버전·테스트 발송·검토 요청·출시(명시 명령)·비동기 watcher(release/광고 ID 발급/템플릿 심사) |

### 개발
| 스킬 | 용도 |
|------|------|
| `front-tds` | TDS(@toss/tds-mobile) 컴포넌트 사용법 |
| `front-design` | 페이지별 디자인 명세(docs/design/{page}/DESIGN.md) 작성 |
| `back-api` | API 명세 문서(docs/API.md) 작성 |

### 워크플로우
| 스킬 | 용도 |
|------|------|
| `pipeline` | 무개입 생성 파이프라인의 페이즈·게이트·반려 규칙 단일 출처 |
| `orchestrator` | 라우팅 보조 — 개별 작업 요청 시 에이전트/스킬 안내 |
| `project-start` | 새 프로젝트 초기 세팅 — plan.md 작성 후 에이전트/스킬 선별 |
| `bug-report` | 플러그인 동작 이상(게이트 반복 반려·예외·API 드리프트) 감지 시 이슈 초안 작성 → 사용자 승인 후 GitHub 이슈 발행 |

## 환경 구성 원칙 (test → prod)

.ait 번들에는 런타임 isTest 플래그·test/prod 자동 스위치가 **없다**. SDK가 제공하는 것은 isAIT 휴리스틱·`env.getDeploymentId`·`isMinVersionSupported`·`getServerTime`뿐이다.

test와 prod의 차이는 **config 상수 값**으로만 구분한다:
- 광고: 테스트 ID(`ait-ad-test-*`) vs 운영 unit ID
- 프로모션: `TEST_{code}` vs 실 코드 (TEST_는 포인트 차감·지급 없음)
- 토스페이: `isTestPayment: true` vs `false`

따라서:
- test→prod 전환 = **config 값 스왑 + 재빌드 + 재업로드** (테스트 번들 ≠ 출시 번들)
- 스왑 지점은 **단일 constants 파일**(예: `src/constants/index.ts`)에 일원화한다
- 광고 ID 스왑·재빌드·재배포는 `ait-console ad-id-watch`가 자동화; 프로모션 코드도 동일 패턴(TEST_ 제거)

## 스킬 사용 원칙

1. **Progressive Disclosure** — CLAUDE.md에는 규칙만, 상세는 스킬이 알아서
2. **Agent is not a Linter** — 에이전트에게 린터 역할 시키지 않는다. 린터는 Hook으로
3. **Less is More** — 스킬도 300줄 이내. 넘으면 분리
