# Changelog

## 2.20.0 (2026-06-09)
- SessionStart hook 추가: 핵심 운영 규칙(스크린샷 md 임베드, 산출물 절대경로 보고, ait build+버전범프, 이름 필수·복호화, 자동 진행, 공홈 확인)을 매 세션 컨텍스트에 주입. 스킬 미로드 간단 지시에도 메인 에이전트가 규칙을 따르게 함

## 2.19.0 (2026-06-09)
- 스크린샷 보고 규칙 강제: 채팅에 경로 나열 금지 → md 파일에 `![](경로)` 임베드 후 md 절대경로 1줄만 제시(터미널 이미지 인라인 불가). 보고 전 Read로 이미지 확인. visual-qa·pipeline 증거 원칙에 명시

## 2.18.0 (2026-06-09)
- [오류 정정] ait-login: user_name은 필수 동의 강제(실측) → 동의 0개 불가, 복호화(키·AAD·로직) 항상 필요. '운영자가 정함/동의 0개 가능' 추측 문구 제거. 콜백 트리거는 생년월일·국적·휴대폰·CI만. login-me 평문/암호화 공홈값 정정
- 검색 키워드 5→10개

## 2.17.0 (2026-06-09)
- ait-login 자동 진행 원칙 추가(되묻기 금지): 코드로 동의항목 판정→약관·복호화·콜백 자동 산출→콘솔 수동항목만 1회 일괄 요청. 콘솔 설정값은 권장값 단정 제시
- oauth-consent에 핵심 사실 명시: userKey=평문 식별자(sub 아님, 항상 제공), 필수/선택은 운영자 콘솔 설정(토스 강제 아님), 암호화 필드 켜면 복호화 필수, 약관 URL 별도 필수

## 2.16.0 (2026-06-09)
- 약관 URL 확보: `legal-templates.md`(서비스 이용약관·개인정보 처리방침 골격, 수집항목=동의항목 자동반영, 법적검토 면책). back-developer가 서버 공개 GET 정적 라우트(/legal/*.html)로 서빙→URL 확보. SUBMIT.md에 약관 URL 기록

## 2.15.0 (2026-06-09)
- 토스 로그인 동의 항목 추천(`oauth-consent-guide.md`): 7종 scope 최소수집 추천, 콜백 필수 자동 판정(이름·이메일·성별 외 항목 시), userKey로 식별 충분. SUBMIT.md에 '토스 로그인 설정' 섹션(동의항목표+콜백+약관) 산출

## 2.14.0 (2026-06-09)
- ait-login 공홈 검증·갱신: OAuth 엔드포인트 경로 정정(prefix /api-partner/v1/apps-in-toss/user/oauth2/), 토큰/login-me 응답 필드, 복호화 AES-256-GCM(IV+AAD), 연동 해제 콜백 규격, base URL. 'OAuth 설정 빠른 시작' 섹션 신설

## 2.13.0 (2026-06-09)
- 실제 콘솔 카테고리 트리 반영(`categories.md`, 게임·생활 그룹). isSelectable=true만 추천, 금융 그룹·틴즈/민원/결혼은 선택 불가 명시. SUBMIT.md에 카테고리 2개(1순위+대안) 추천

## 2.12.0 (2026-06-09)
- 아이콘 SVG 창의성 가이드(그라데이션·다중 레이어·액센트·컨셉 모티프, 단색 심볼 탈피)
- 출시노트·상세설명 톤 규칙: "~없습니다/안 됩니다" 부정·방어 나열 금지, 강박적 프라이버시 고지 금지, 사용자 가치 중심 자연스러운 문장
- 카테고리: 공홈 미문서화 명시 → 콘솔 트리에서 확정, 추천1+대안1 제안

## 2.11.2 (2026-06-09)
- 썸네일/배너 창의성 강화: 단조로운 그라데이션+중앙텍스트 금지. 비대칭 레이아웃·추상 도형(blur blob)·떠다니는 칩 클러스터·큰 타이포·깊이감 중 2가지 이상 적용 규칙 + 창의 예시 템플릿 (스크린샷은 여전히 미포함)

## 2.11.1 (2026-06-09)
- 아이콘 심볼 크기 규칙 추가(캔버스 70%+, 한 변 420px↑) — 심볼이 작게 박히는 문제 수정
- 썸네일(배너)에서 스크린샷·폰 목업 제거 → 브랜드 표현(앱명·카피·심볼)만

## 2.11.0 (2026-06-09)
- improve 진단 재설계: 1차 근거를 **코드+실제 화면**으로 변경. REPORT/IMPROVE-LOG/PLAN/DESIGN은 보조(있으면 참고). 보조 파일 부재 시 dev 서버 스크린샷+axe·tsc/lint/번들·검수 11단계를 **직접 측정**해 진단. 보조 파일 없다는 이유로 진단 스킵·'변경 없음' 종료 금지 (스펙 없으면 코드 역분석)

## 2.10.1 (2026-06-09)
- 완료 보고에 주요 산출물 **절대경로** 출력 명시 (REPORT·SUBMIT·REVIEW-REPORT·.ait·assets). create·update·improve 공통 — 사용자가 바로 열람 가능

## 2.10.0 (2026-06-09)
- SUBMIT.md를 콘솔 등록 단일 문서로 확장: 출시노트(최초) + **업데이트 노트(버전별 누적)** + **제출 에셋 임베드**(아이콘·화면예시 3·썸네일/배너 상대경로+미리보기). create·update 공통

## 2.9.1 (2026-06-09)
- update 보고서에 §3-1 업데이트 노트 추가 (이번 버전 변경 요약, 사용자 관점 + 버전 변화). SUBMIT.md 출시노트와 동일 반영

## 2.9.0 (2026-06-09)
- **autoMode 설정 연결**: create/update에서 `--auto` 미지정 시 `.appintoss.json`의 `autoMode`(기본 false)를 읽어 적용 — 모드 결정 우선순위 명령행 `--auto` > autoMode > 기본 수동(pipeline Phase 8 명시)
- **버전·개수 표기 정정**: README/plugin.json의 버전·skills 개수(21)·commands 개수(3) 실제값으로 정정
- **improve 근거 파일 부재 처리**: 근거 파일(REPORT-v*/IMPROVE-LOG) 없는 축은 진단 스킵, uiux/quality 부재 시 feature 트렌드 폴백, 전 축 부재+트렌드 갭 없으면 "변경 없음" 종료
- **백엔드 검증 게이트**: API 주제 Phase 2 게이트에 서버 빌드·기동·API.md 엔드포인트 스모크(상태코드·스키마) 추가, 3-B는 실기동 로컬 서버 호출(mock 아님). back-developer에 스모크 계약 확인 1절
- **a11y 자동 스캔**: Phase 3에 Playwright+axe-core 스캔(critical/serious 0건 게이트) 추가, visual-qa에 절차·미설치 시 명시 규칙, ait-a11y 병행 명시
- **시나리오 전수 실행 강제**: DESIGN.md 시나리오 N과 qa-flows.cjs 실행 M 일치 게이트, PIPELINE-LOG에 `시나리오: 정의 N / 실행 M / 통과 K` 기록, reviewer Phase 4 교차확인
- **Phase 3-C 판정 취합 주체 명확화**: 오케스트레이터가 3관점 판정 취합·합의 게이트 적용, visual-qa는 점수만 제출(최종 판정자 아님)
- **수익화**: Phase 0 수익 모델 결정(기본 없음, 보수적 도입) PLAN.md 기록, designer 광고/리워드 슬롯 배치 규칙, app-developer ads API+isSupported+보상형 중복 방지, Phase 6 광고 검수 7단계 위반 0건 게이트

## 2.8.0 (2026-06-09)
- `/appintoss:improve` 개선 대상 3축 명시(feature·uiux·quality) + `--focus` 옵션. 기본 `auto`는 3축 진단 후 ROI 최상위 1건 선택. uiux는 직전 비주얼 점수·3-C 패널 지적, quality는 REVIEW-REPORT·번들 크기를 근거로 발굴

## 2.7.1 (2026-06-09)
- `/appintoss:watch` → **`/appintoss:improve`** 이름 변경 (개선 발굴 동작에 더 직관적). 로그 `WATCH-LOG.md` → `IMPROVE-LOG.md`

## 2.7.0 (2026-06-09)
- **Phase 3-C 디자인 패널 합의 신설**: 3-A에서 visual-qa가 캡처한 스크린샷을 designer(의도 부합)·reviewer(규칙 준수)·visual-qa(객관 점수) 3관점이 함께 검토·합의. 한 명이라도 critical 지적 시 Phase 2 반려, critical 없고 minor만이면 과반(2/3) PASS로 통과(지적은 보고서 기록), 전원 CHANGES면 반려. 오케스트레이터가 스크린샷 경로를 각 관점에 중계(서브에이전트 직접 통신 불가). create·update 공통 적용
- Phase 3 게이트 = 3-A 85점↑ AND 3-B 100% AND 3-C 패널 합의 통과 (새 Phase 번호 추가 없음, 3-C는 Phase 3 내부)
- update 모드 Phase 3'은 변경 화면만 3-A/3-B/3-C 동일 수행 — 3-C는 before/after를 패널이 비교(designer 개선 의도, reviewer 회귀 여부)
- report-template §4 게이트 표에 3-C 행 추가, §2에 패널 minor 지적 기록란 추가

## 2.6.0 (2026-06-09)
- **자동 모드(`--auto`)**: Phase 8 승인 게이트를 수동 승인(기본)/자동 모드 2가지로 개편 — 자동 모드는 보고서 생성 후 승인 대기 없이 Phase 9로 진행. 단 정책 금지영역·반려 5회 초과·빌드 실패 시에는 자동 모드라도 무조건 중단·보고
- **Phase 9 git 자동 푸시 신설**(자동 모드 한정): `git init`→`add`→커밋(`feat(appintoss): {앱명} v{version}`)→remote 있으면 push. force push·history rewrite 금지, `.appintoss.json` git.branch 설정 지원. 결과를 보고서에 기록. reviewer 담당
- **`/appintoss:improve` 신규 커맨드**: 트렌드 모니터링 1회 실행 → WebSearch 기반 개선 후보 1건 도출 → `/appintoss:update --auto` 적용 → `docs/IMPROVE-LOG.md` 기록. 1회당 update 1건·중복 개선안 금지(무한 자동변경 방지), 반복은 `/loop`·cron으로
- **실시간 트렌드**: planner Step 0에 정적 인사이트 + WebSearch 실시간 트렌드 병행 조회 추가
- **`ait-setup` 스킬 신규**: `.appintoss.json`(git remote/branch·autoMode 기본값) 초기화 + `.gitignore` 안내

## 2.5.2 (2026-06-08)
- `submit-store-guide.md` 신규 — 콘솔 등록 필드별 작성 규칙(부제 느낌표·비속어 금지, 상세 설명 구체성, 카테고리, 에셋 규격) 공홈 기준 정리

## 2.5.1 (2026-06-07)
- SUBMIT.md에 스토어 노출 정보 추가: 부제(20자)·상세 설명(200~500자, 카피 보이스 일관)·카테고리 추천·검색 키워드 5개 — Phase 6에서 자동 생성

## 2.5.0 (2026-06-07)
- **기능 동작 E2E 게이트**: Phase 3을 3-A(비주얼 85점) + 3-B(핵심 플로우 시나리오 100% 통과)로 확장 — DESIGN.md의 Given/When/Then 시나리오를 Playwright 인터랙션으로 전수 실행, 실패 시 증거와 함께 Phase 2 반려
- **파이프라인 재개(resume)**: PIPELINE-LOG 표준 형식(`판정: PASS|FAIL`) + 마지막 PASS 페이즈·산출물 교차 확인 후 다음 페이즈부터 이어가기
- 실행 경험(드리프트·반려 패턴·트러블슈팅)을 Phase 8에서 Honcho conclusion으로 저장 (도구 없으면 보고서에 기록)

## 2.4.0 (2026-06-07)
- **Phase 8 완료 보고·승인 게이트 신설** — 파이프라인 종료 시 `docs/REPORT-v{version}.md` 생성 후 사용자 승인 대기 (승인이 유일한 사람 개입 지점)
- 보고 양식 표준화: `pipeline/references/report-template.md` (요약·화면 스크린샷 임베드·변경 내역·게이트 결과표·빌드·검수·승인 체크박스)
- update 모드: Phase 0'에서 변경 전(before) 화면 캡처 → Phase 8'에서 before/after 나란히 비교

## 2.3.0 (2026-06-07)
- 공식 AI 바이브 코딩 가이드 통합 (developers-apps-in-toss.toss.im/tutorials/ai-vibe-coding.html)
  - 문서 조회 우선순위 명시: ① ax MCP(apps-in-toss)/docs-search → ② llms-full.txt → ③ 공홈 WebFetch
  - preflight에 ax CLI+MCP 권장 항목 추가 (미설치 시 brew 설치 시도, 실패해도 llms.txt 폴백)
  - Phase 2 스캐폴드: `npx create-ait-app` 공식 생성기 우선, 수동 스캐폴드 폴백
  - ait-docs에 ax MCP 1순위·llms.txt 인덱스 3종 보강, README에 공식 도구 연동 섹션

## 2.2.0 (2026-06-07)
- Phase 0 개편: 토스 사용자층·행태 기반 **멀티 에이전트 브레인스토밍** — planner 컨셉 초안(2~3안) → designer(UX)·reviewer(정책) 코멘트 → planner 수렴, 최대 2라운드. 게이트에 "designer·reviewer 컨셉 합의" 추가
- `knowledge/toss-user-insights.md` 신규 — 사용자 규모·연령·행태(사실/가설 구분, 출처 명기), 인기 카테고리, 주제 구체화 휴리스틱 6종
- PLAN.md에 "토스 적합 컨셉" 섹션 신설 (타겟·행태 근거·차별점·라운드 기록)

## 2.1.1 (2026-06-07)
- Phase 6 산출물에 `docs/SUBMIT.md`(콘솔 출시노트·기능 목록) 추가 — `ait-submit` 스킬을 파이프라인에 연결
- Phase 6 게이트에 SUBMIT.md 존재 조건 추가

## 2.1.0 (2026-06-07)
- 비주얼 루브릭 6항목 개편: "개성·트렌디함 10점" 신설 (시그니처 모먼트 -5 / 기본 문구 빈 상태 -3 / 템플릿 반복 -2), 상태 완성도 15→10
- designer에 Step 0 "디자인 컨셉" 선행 단계 추가 (무드·액센트 컬러·카피 보이스·시그니처 모먼트)
- `front-design-trend-guide.md` 신규 — TDS 제약 내 차별화 기법 7종 + 안티패턴

## 2.0.0 (2026-06-07)
- v1(에이전트 4·스킬 18) 전면 재설계 — 무개입 페이즈 머신 도입
- `/appintoss:create`·`/appintoss:update` 커맨드, 에이전트 6종, `pipeline`·`ait-assets` 스킬 신설
- 게이트: 비주얼 85/100, tsc·lint 0건, 정적 검사 0건, .ait 100MB 이하, 검수 11단계 전항목 PASS. 반려 5회 한도
- 빌드: `granite build` 폐기 반영 → `npx ait build` + 매 빌드 `npm version patch` 규칙
- 공홈 대조 갱신: TDS 핵심 12종 정밀 + spot-check 5종, SDK 9종(IAP·permissions·ads 중대 드리프트 수정), 검수 체크리스트 보강
- 스토어 에셋 자동 생성: 아이콘 600×600 / 화면예시 636×1048 ×3 / 썸네일 1932×828
