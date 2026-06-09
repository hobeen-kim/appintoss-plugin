---
name: ait-docs
description: 앱인토스 공식 문서 검색 가이드. ax CLI 기반 Developer Center, TDS 문서 검색. 사용자가 문서 찾기, API 문서, TDS 문서, 공식 가이드, 개발 문서 등을 언급하면 이 스킬을 사용한다.
---

# 앱인토스 문서 검색 가이드

## ax CLI + MCP (1순위)

토스 공식 AI 개발 도구다. **MCP가 연결된 세션에서는 `apps-in-toss` ax MCP 도구를 직접 사용하는 것이 1순위** — 앱인토스 문서·코드 예제를 AI가 직접 참조할 수 있다.

```bash
# ax CLI 설치
brew tap toss/tap && brew install ax

# MCP 등록
claude mcp add --transport stdio apps-in-toss ax mcp start
```

## llms.txt 인덱스 (수단 폴백)

ax MCP·docs-search를 못 쓰면 다음 인덱스를 직접 조회한다(WebFetch 등).

| 인덱스 | URL |
|------|-----|
| 개발자 센터 인덱스 | https://developers-apps-in-toss.toss.im/llms.txt |
| 개발자 센터 전문 | https://developers-apps-in-toss.toss.im/llms-full.txt |
| TDS Mobile 전문 | https://tossmini-docs.toss.im/tds-mobile/llms-full.txt |

## toss/apps-in-toss-skills의 docs-search 활용

`knowledge-skills@apps-in-toss-skills` 플러그인이 활성화되어 있으면 `docs-search` 스킬을 사용할 수 있다.

### 검색 명령

```bash
# Apps-in-Toss Developer Center 검색
bash skills/docs-search/run-ax.sh search docs --query "검색어" --limit 10

# TDS React Native 문서 검색
bash skills/docs-search/run-ax.sh search tds-rn --query "Button" --limit 10

# TDS Web 문서 검색
bash skills/docs-search/run-ax.sh search tds-web --query "BottomSheet" --limit 10
```

### 문서 조회 명령

```bash
# 특정 문서 조회
bash skills/docs-search/run-ax.sh get doc --slug "문서-슬러그"

# TDS 컴포넌트 상세
bash skills/docs-search/run-ax.sh get tds-web --slug "Button"

# 예제 코드 조회
bash skills/docs-search/run-ax.sh get example --slug "with-rewarded-ad"
```

## 공식 문서 URL

| 문서 | URL |
|------|-----|
| 서비스 오픈 정책 | https://developers-apps-in-toss.toss.im/intro/guide.html |
| 개발자 센터 | https://developers-apps-in-toss.toss.im |
| TDS 문서 | https://tossmini-docs.toss.im/tds-mobile/ |

## MCP vs 스킬 — 언제 뭘 쓰나

| | 스킬 (Skills) | MCP |
|---|---|---|
| **비유** | 교과서 펼쳐놓고 크림 | 도서관에서 찾기 |
| **특징** | 항상 로드됨, 빠름 | 필요할 때 호출, 최신 |
| **적합** | 자주 쓰는 패턴, 규칙 | 특정 문서 검색, 최신 API |
| **예시** | front-tds, ait-review | docs-search |

### 추천 전략
- **기본**: 프로젝트에 복사한 스킬(front-tds, ait-sdk 등)로 해결
- **스킬에 없을 때**: docs-search로 공식 문서 검색
- **최신 정보 필요**: WebFetch로 공식 URL 직접 확인
