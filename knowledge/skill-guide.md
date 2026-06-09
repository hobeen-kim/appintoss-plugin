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
| `common-ait-rules` | 검수 기준, UI 제약, 번들 제한 |
| `ait-sdk` | 네이티브 브릿지, 저장소, 권한, 광고 |
| `ait-build` | granite CLI, 빌드, 번들링 |
| `ait-review` | 검수 체크리스트 |
| `ait-deeplink` | 딥링크, 네비게이션 |
| `ait-analytics` | 이벤트 로깅 |

### 개발
| 스킬 | 용도 |
|------|------|
| `front-tds` | TDS 컴포넌트 77개 사용법 |
| `front-design` | 페이지별 디자인 명세 |
| `back-api` | API 명세 문서 작성 |

### 워크플로우
| 스킬 | 용도 |
|------|------|
| `orchestrator` | 멀티 에이전트 조율 |
| `project-start` | 프로젝트 초기 세팅 |

### Obsidian
| 스킬 | 용도 |
|------|------|
| `save-plan` | 플랜 → vault 저장 |
| `save-impl` | 구현 요약 → vault 저장 |
| `save-note` | 범용 노트 → vault 저장 |
| `obsidian-to-issue` | 노트 → GitHub Issue |
| `obsidian-search` | vault 검색 |

## 스킬 사용 원칙

1. **Progressive Disclosure** — CLAUDE.md에는 규칙만, 상세는 스킬이 알아서
2. **Agent is not a Linter** — 에이전트에게 린터 역할 시키지 않는다. 린터는 Hook으로
3. **Less is More** — 스킬도 300줄 이내. 넘으면 분리
