# Changelog

## 3.11.0 (2026-09-01)

**화면 흐름도 산출물 신설** — `appintoss-business`의 `doc-design/flow-guide.md`(의뢰인 발송 문서 표준)를 미니앱 파이프라인용으로 차용·적응했다.

- **신설** `ait-submit/references/screen-flow-guide.md` — 실기기 목업 캔버스 방식 표준(골격 HTML/CSS·스타일 규칙·제작 절차·자가 점검). 원 표준에서 **문서번호·발송본 등재 절차를 제거**하고 미니앱 맥락으로 교체: 프레임 규격을 앱인토스 **논리 해상도(360×640~420×740)** 기준으로, **딥링크 배지**(`intoss://{appName}/`)를 추가해 "URL 미접속" 반려를 사전 점검
- **모드 A(실촬) 기본화** — 파이프라인은 Phase 3에서 이미 `qa-screens/`에 스크린샷을 캡처하므로, 프레임 안을 **실촬 이미지로 채우는 것을 기본**으로 삼는다(원 표준은 목업 직접 작성 전제). 스크린샷이 없는 기획 단계에서만 목업 모드
- **신설** `ait-submit/scripts/render-flow.cjs` — 단일 캔버스 HTML → PNG 렌더러. `.page` 실측 크기로 캡처(A4 페이징 없음), **playwright → 전역 npm root → Chrome headless 순 자동 폴백**. 빈 `.frame`·깨진 이미지를 감지해 **exit 3**으로 알린다(렌더는 되지만 내용 결손)
- `ait-submit/SKILL.md` — 「화면 흐름도」 작성 절차 추가. 캡션 코드(A1·B2…)를 **「앱 내 기능 — 상세」 표와 1:1 대응** 강제, 예외·실패 경로 최소 1개 표기, 추상 노드 박스 순서도 불인정
- `app-spec-template.md` — 「화면 흐름도」 섹션 신설(임베드 + 화면 수·레인·예외 경로 요약표)
- `pipeline/SKILL.md` — Phase 6 산출물·게이트에 `docs/screen-flow.png` 추가(render-flow exit 0), **Phase 6' 조건부 갱신 규칙**(화면 추가·삭제·이동 변경 시에만 재작성, 화면 내부만 바뀌면 실촬 이미지 교체 후 재렌더)

## 3.10.0 (2026-09-01)

열린 이슈 8건(#1·#8~#14) 조치 + 앱인토스 공식 웨비나(2026-08-21) 실측 지식 반영.

### 이슈 조치
- **feat(#8)**: 구독 서버 웹훅 페이로드 실측 구조 문서화 (`ait-iap.md`) — 상태는 최상위 `status`가 아니라 **`subscription.current.status`**, 판정 기준은 **`changeReason`**(CREATED/RENEWED/AUTO_RENEW_DISABLED/EXPIRED/REVOKED) 5종 처리표. **`RENEWED` 미처리는 갱신 결제 후 만료일 미연장 = 실결제 사고**로 경고
- **feat(#9)**: 콘솔 웹훅 인증 헤더는 **`Authorization: Bearer {등록값}`** 형식으로 전송됨을 명시 — Basic 가정 대조 시 401 반복. raw/Basic/Bearer 3형식 수용 예제 추가 (`ait-iap.md`, `back-api`)
- **feat(#10)**: OS별 구독 해지·환불 경로 신설 — iOS 해지는 **아이폰 설정 → Apple 계정 → 구독**, 환불은 **애플 전담이며 콘솔 [환불 내역]에 미표시**. 애플 환불 승인 지연(수 시간~1일+) 후 `REVOKED` 웹훅 도착
- **feat(#11)**: `ait-smart-message`에 **서버 직접 API 발송** 절 신설 — `messenger/send-message`·`send-bulk-message`·`send-test-message` 엔드포인트, 요청 한도(앱당 분당 15,000 / 사용자당 10 등), mTLS+토큰 인증, `{templateSetCode, context}` 본문, 오류 4종(HTTP 200 + `resultType: FAIL`). 콘솔 정기 발송의 **주기 전체 공통(매일/매주) 제약**과 이름 변수 한정 명시 → **개인별 스케줄 발송은 서버 API 필수** 판정문 추가
- **fix(#12)**: 카테고리 문서가 2단인데 콘솔은 **대/중/소 3단 셀렉터**라 등록이 막히던 문제 — `categories.md`에 3단 대응표(`##` 그룹=대분류 / 굵은 항목=중분류 / 나열=소분류)와 3단 전체 경로 표기 규칙, "한 경로만 선택" 명시. 부제·상세 설명의 **허용 특수문자 `:` `·` `?`** 를 `ait-submit`·`ait-console`에 추가
- **fix(#12 코멘트)**: `ait-login` 연동 해제 콜백 — 콘솔 입력란은 URL/메서드/**Basic Auth 헤더(base64 한 칸)** 3개이며 ID·PW 두 칸이 아님. `.env`의 USER/PASS → `base64(id:pw)` 변환 관계, **[테스트하기] 버튼**, "이름·이메일·성별 외 추가 항목 선택 시 필수"(조건부) 정정
- **feat(#13)**: `ait-ads.md` 광고 유형표에 **콘솔 표기·생김새 열** 추가 — `문구 강조`=배너 리스트형(96px), `이미지 강조`=배너 피드형(410px). 사용자에게는 콘솔 표기로 안내하도록 규칙화(전면형·보상형 콘솔 표기는 미확인으로 표기)
- **feat(#14)**: 알림동의문 등록 화면 입력 항목(발송 방법 라디오 선택 기준·화면 제목) 수록, `templateCode`는 **콘솔 → 스마트 발송 → `기능성` 탭**에서 확인(알림동의문 탭 아님)임을 정정, **`requestNotificationAgreement` deprecated → `Notification.requestAgreement`** 로 전면 교체
- **fix(#1)**: `console-dom-map.md`가 v3.8.0에서 제거된 `cmdSubmitReview`·`cancel-review` 자동 구현을 여전히 가리키던 드리프트 정정 — 해당 3종은 **MANUAL**(안내만 출력)임을 명시

### 웨비나 실측 지식 반영 (2026-08-21 「혼자 만든 미니앱으로 하루 150만원 매출까지」)
- **신설** `ait-analytics/references/growth-playbook.md` — 출시 후 성장 루프 전체: 노출 3계층(플랫폼/외부/플랫폼 확대), 채널별 실측 성과, 외부 채널 운영, **이탈 진단 → 기능성 푸시 처방(복귀율 40%, 최종 전환 9%→14%)**, 리텐션 설계, 문의 응대 자동화, 다앱 운영 3원칙, 점검 체크리스트
- `ait-analytics/SKILL.md` — **로그 설계 원칙** 절 신설("유저는 종료를 알려주지 않는다", AI 개발 지시에 로그를 포함시킬 것). 대시보드 지표표에 **연령·성별 분포**(외부 채널 선택 근거)와 **단계별 이탈** 행 추가
- `ait-ads.md` — **eCPM 실측 범위와 유형 선택 의사결정** 절 신설: 문구형 배너 2,000원 초반 / 리워드 약 3만 원, 전면형은 5초 스킵으로 UX 부담이 낮음. **전면형으로 시작 → 지표 검증 → 리워드 전환** 순서 권장(절대치 아님을 명시)
- `ait-smart-message/SKILL.md` — 광고성의 고유 가치(**미사용 유저 도달 유일 무료 수단**)와 기능성 실측 CTR 비교표, **기능성 알림 설계**(유형 A 이탈 처방 / 유형 B 리텐션)와 **발송 시점(요일·시간대)도 설계 대상**임을 추가
- `ait-iap.md` — **결제 전환 최적화 패턴** 절 신설: 결과화면→결제 전환 23%(이탈 개선이 결제 UI보다 우선), 선택지 다양화(무료 체험·첫 할인·재구독 할인), 부분 공개(티저), 단건+구독 병행, 가격은 실험으로 결정(2,000원→990원)
- `ait-promotion-reward/SKILL.md` — 프로모션은 **토스 「혜택」 탭 노출 = 신규 유입 채널**임을 명시, **공유 리워드 보상 설계**(광고 제거·과금 기능 개방 등 포인트 없이 바이럴 만드는 수단) 추가
- `front-tds/SKILL.md` — **TDS 피그마(`.fig`) 파일을 AI 디자인 도구에 이식**하는 세팅 절차 추가(최종 구현은 실제 TDS 컴포넌트로 해야 검수 통과)
- **문서** `docs/webinar-2026-08-21/` — 자막 전문(교정본·원본), 상세 요약, 발표자료 52장(pptx/pdf)

## 3.9.0 (2026-08-25)

공식문서 전수 대조(llms-full.txt 100개 문서 + npm 실측) 기반 전면 최신화. 열린 이슈 #3·#4·#5·#6·#7 조치.

### 이슈 조치
- **fix(#6)**: 세션 부트스트랩 빌드 지침 정정 — `npx ait build` 단독은 `dist/`를 재빌드하지 않고 **stale 번들을 포장**한다. `npm run build`(tsc+vite+ait)로 교체하고, `ait-build`에 stale dist 경고 + `.ait` 산출물 버전 grep 검증 절차 추가
- **fix(#3)**: "모든 앱 광고 필수" 주장 제거 — 공홈에 광고 도입 의무 없음. 체크리스트 7단계를 **조건부(광고 도입 시)**로 전환하고 프로젝트 컨벤션(권장)과 공홈 정책을 분리 표기. pipeline Phase 0 게이트에서 광고 미포함 차단 제거. **광고 포함 여부는 사용자에게 1회 확인**하는 절차 신설(사용자 지시) — 무응답 시 최소 배너 포함이 기본값
- **fix(#7)**: 검수 반려 실사례 2건 반영 — ① 토스 로그인 사용 앱은 **로그인 전 인트로 필수**(진입 즉시 `appLogin()` 자동 호출 금지) ② **탭바는 플로팅 형태 강제**(고정 바 금지, 탭 2~5개, TDS 미제공이라 직접 구현). checklist 4단계·반려사례·ait-login Phase 3·front-design·designer 동기화
- **feat(#4)**: SDK 3.x 전면 반영 — `granite.config.ts`→`apps-in-toss.config.ts`, brand는 `primaryColor`만, `webViewProps`→`webView`, `outdir`→`webBundleDir`, `web` 블록 삭제(→package.json scripts), `navigationBar` 신규. `ait-config.md`·`ait-build-config.md` 재작성, 20개 파일 표기 정정(2.x 각주 유지), 검수 1단계·11단계 재정의(3.x에 `displayName`·`icon` 없음 → **콘솔 앱 정보가 단일 출처**), `ait init --app-name <kebab> --skip-input`·`ait migrate v3` 표준 절차화, TDS 2.2.1→**2.5.1**
- **feat(#5)**: 토스 로그인 콘솔 설정 문서화 — `ait-login/references/login-console-setup.md`(대표관리자 게이트·스코프·약관 등록 2경로·만 14세 미만 기본값 함정·연결 끊기 referrer 3종·등록값 표) + `login-consent-catalog.md`(**공홈 미문서화** 처리 목적 4종·동의문 유형 17종·국외이전 유형 부재 우회). 외부 LLM 호출 시 **국외 이전 동의 필수** 명시

### 공식문서 최신화 (10건)
1. **SDK 3.x 스키마·CLI** — 실측(web-framework 3.1.1) 기준 타입·명령·플래그 반영, 버전 표 신설(latest/beta)
2. **서버 연동 규격 신설** (`back-api/references/ait-server-api.md`) — **CORS Origin 전환(2026-08-25 이후 업로드되는 3.x 번들은 `*.apps.tossmini.com`)**, mTLS, 방화벽 Inbound/Outbound IP, 공통 응답 봉투(비즈니스 오류도 HTTP 200), QPM 3,000, iframe 금지
3. **AIT Devtools 로컬 테스트** — 샌드박스 앱 절차를 로컬 브라우저 테스트로 교체, `intoss-private://` 테스트 스킴·QR 조건 명시
4. **검수 체크리스트 공홈 정합** — 내비게이션 바 세부(중앙 로고/이름·우측 버튼 1개·더보기 신고/공유), 앱 내 기능 스킴, 공유는 `intoss://`, 10초 내 최초 화면, 권한 사전 동의, HTTPS·암호화·CORS 보안 항목
5. **콘텐츠·서비스 정책 갱신** — 출시 불가에 **정치** 추가, **부동산·자동차 한시 입점 제한**, 조건부 카테고리 5종(웹보드·만남/소개팅·AI 채팅·채팅·중고거래), 민감 콘텐츠 3단계 등급, **사용 연령 만 19세 이상으로 정정**(기존 "만 14세+ 틴즈" 오기)
6. **검토 절차·기간 정정** — 앱 정보 1~2영업일 / 번들 최대 3영업일(카테고리별 7일+), 한 번에 한 버전, 요청 취소, 롤백(3.x→2.x 불가), 출시 후 1시간 노출, 사후 검수
7. **에셋 규격** — 로고 600×600 PNG **모서리 각짐·배경색 필수·투명 불가·토스 리소스 사용 금지**, 썸네일은 게임 앱 항목, 스크린샷 636×1048×3 또는 1504×741×1
8. **UX 라이팅·그래픽·해상도 지식 신설** (`knowledge/toss-ux-writing.md`) — 해요체·능동·긍정·캐주얼 경어·명사+명사 금지, 다이얼로그 왼쪽 **[닫기]** 통일, 그래픽 7원칙, 논리 해상도 360×640~420×740 + 1x/2x
9. **토스애즈 SSP 광고 정책** — 금지 행위 5유형(위장·오클릭 유발·동일 포맷 2개·Dead-end / 이벤트 변조 / 비정상 트래픽 / 클릭 보상 / 은닉), 제재·이의제기(30일·환수), 광고 성과 4단계 진단, 광고그룹 ID 2시간·사업자·정산 선행
10. **마케팅 스펙·콘솔 MCP** — 테스트 발송의 정체(내부 AI 학습, 최대 7일 / 클릭 25건·발송 2,500건), 워크스페이스당 10만 건, 재방문 캠페인 30일 100명 조건, 소재 2개·동적 변수 제한, 세그먼트 저장 옵션. **공식 콘솔 MCP 존재**(`mcp.toss.im/adapters/apps-in-toss-console/mcp`) 안내 — DOM 자동화 대체 후보로 표기. `ait-login`에 '유저 정보 불러오기'(`cud_` 키) 절 신설

### 도구
- `sync-docs`: npm **dist-tags 전수 대조**(beta 포함) + 타입 정의 실측 절차, 릴리즈 노트 `.md` 직접 조회로 단순화, 날짜 기반 정책 전환 별도 표시

## 3.8.1 (2026-06-12)
- create/update 파이프라인에서 콘솔 앱 자동 생성(register) 제외 — register CLI는 유지하되 콘솔 앱 생성은 사용자 직접 수행으로 환원. cmdReleaseWatch 미사용 ctx 파라미터 정리.

## 3.8.0 (2026-06-12)
- 콘솔 자동화 경계를 AUTO/MANUAL로 재설계: 자동은 register(첫 콘솔 앱 생성, REST 2-step)·upload(번들 배포, apiKey)·조회(apps/versions/release-status/app-approval-watch)로 한정
- set-app-info·submit-review·cancel-review·release·test-send를 MANUAL로 전환 — 실행 시 콘솔 직접 수행 안내 출력(exit 0), 자동 write 제거. release-watch는 감지·알림 전용(자동 출시 호출 절단)
- REPORT 발행 의무화 — 화면 변경 또는 버전 상승 또는 지시 완료 시 발행 필수, 마지막 섹션 "🙋 사용자가 해야 할 것"(콘솔 수동 작업 체크리스트) 필수
- 클릭 유도 문구는 다중 에이전트 의논 절차(knowledge/copy-deliberation.md)로 결정
- 기능성 알림동의문 입력 항목(동의문 이름·발송 시점) 명문화

## 3.7.0 (2026-06-12)
- 스마트발송 추천 문구에서 "토스에서" 포함 규칙 제거(사용자 지시) — 공홈 가이드는 비게임 포함을 권장하나 미사용으로 확정. ait-smart-message·ait-submit·app-spec-template 예시/규칙 동기화. 나머지 규칙(제목 7자·본문 25자·"~요." 마침표·게임 명시·금지 표현) 유지

## 3.6.1 (2026-06-12)
- fix(이슈 #2): 전면 광고 노출 시점 예측가능성 강조 — ait-ads.md 전면형 설명("화면 전환 시점 노출" 위반 유도 표현 제거)·필수 주의 블록·올바른/위반 사용 예 추가, pipeline Phase 6 광고 게이트에 일시 화면 노출 금지·예측 가능 노출(checklist 110-111행) 명시 편입, 7단계 정의·에이전트 지침 동기화. fixes #2

## 3.6.0 (2026-06-11)
- 마케팅 적극 추천 의무(사용자 지시): 광고성 푸시알림(스마트발송)·프로모션·광고를 create/update에서 적극 추천 — v3.5.0 "자동 제안 금지"를 정정, 수행만 사용자 직접 유지
- APP-SPEC.md 필수 섹션 2종 신설: 세그먼트 설계(3개 이상 — 카테고리 4종·AND/OR·정확도, segment/intro 출처)·스마트발송 캠페인 설계(캠페인·타겟·랜딩 URL·발송 기간 + 추천 문구)
- 스마트발송 추천 문구 규칙 명문화: 제목 띄어쓰기 포함 7자(광고성 ~하기/명사형) · 본문 25자 "~요." 마침표 필수 · 금지 표현(느낌표·이모지·과장·불안 조성·은어·특정인) — smart-message/intro 공식 가이드 정합

## 3.5.0 (2026-06-11)
- 사용자 직접 수행 영역 정책: 푸시알림 설정(알림동의문·캠페인)·로그인 설정(계약·인증서·키·콜백)·프로모션(등록·신청·충전)은 에이전트가 자동 수행·자동 제안하지 않음 — 사용자 직접 수행, 명시 요청 시 가이드만 (사용자 지시). pipeline 단일 출처 절 신설 + ait-smart-message·ait-login·ait-promotion-reward·update 커맨드 동기화. test-send 무조건 발송(v3.3.0)은 배포 검증 단계로 유지

## 3.4.0 (2026-06-11)
이슈 #1 "[ait-console] 출시 체인 부족분 5건" 조치 (fixes #1):
- upload: ait CLI가 `-m`/`--memo` 미지원인데 항상 부착해 업로드 전면 실패하던 버그 수정 — `ait deploy --help` 출력에서 지원 감지 시에만 부착, 미지원이면 1줄 안내 후 메모 없이 배포
- test-send: isTested 즉시 전이 강요(8회/40초 폴링 후 fatal) 제거 — isTested는 단말에서 테스트 앱 실행 시 전이(실측)이므로 3회/15초만 확인하고 미전이도 발송 성공으로 정상 종료(exit 0)
- submit-review: 실제 검토 제출 구현 — 게이트 검사 후 행별 "검토 요청" 클릭→"검토 요청하기" 모달에 출시 노트(`--note` 또는 SUBMIT.md "## 업데이트/출시 노트" 절, 필수) 입력→제출→reviewStatus 검토중 전이 확인. 첫 라이브 제출 시 검토 제출 API 네트워크 캡처 자동 기록(dumps-write/review-submit-capture.json)
- release: 출시하기 클릭 구현 — READY 게이트 후 "출시하기" 버튼 클릭(미노출 시 스크린샷+안전 중단)→deployed=true 확인. release API 자동 캡처(dumps-write/release-capture.json)
- cancel-review 신규 — 검토중 버전 행 "요청 취소" 클릭("검토 중"→"요청 취소됨"), `--confirm` 코드 강제(없으면 exit 2). API 자동 캡처(dumps-write/cancel-review-capture.json)

## 3.3.0 (2026-06-11)
- test-send 무조건 발송 정책: upload 성공 후 test-send를 모든 앱(실앱 포함)에서 무조건 수행 — 테스트 앱 한정 write 정책에서 upload·test-send 제외, 보류·생략 금지 (사용자 지시). ait-console §9·§8·자동 범위, pipeline Phase C/C', create·update 커맨드 동기화

## 3.2.0 (2026-06-11)
- bug-report 스킬 추가(자동 감지+승인 후 GitHub 이슈 발행) — 게이트 반복 반려·예외·콘솔 API 드리프트 감지 시 표준 양식 초안 제시, 사용자 승인 후 hobeen-kim/appintoss-plugin에 발행. .github/ISSUE_TEMPLATE/bug_report.md 동일 양식 제공

## 3.1.0 (2026-06-11)
- upload을 공식 ait deploy CLI 래퍼로 교체 — raw S3 3-step initialize→PUT→complete 방식은 콘솔 AccessDenied로 폐기(lib/api.cjs는 DEPRECATED 주석 보존)
- API 키 토큰 인증(ait token add), memo(-m) 지원, 토큰 없으면 AIT_DEPLOY_API_KEY env로 자동 등록 또는 NEEDS_CONTEXT(exit 2)
- 동일 번들 중복(Code 4097) 친절 안내: "코드 변경 후 ait build로 새 번들 빌드 후 재배포" + 빌드 전 버전 범프(npm version patch) 힌트 출력
- ait deploy 실패 시 stdout+stderr를 stripAnsi 후 스피너 줄을 제거한 의미있는 마지막 줄들 노출(기존 stderr만 출력 시 스피너 오염으로 안 보이던 문제 개선)
- upload 시그니처 변경: `upload <projectDir> [--memo] [--bundle]` (라이브 검증: deeplink 발급 성공)

## 3.0.1 (2026-06-11)
- fix(ait-console): 번들 업로드 버그 2건 수정 — deploymentId를 UUIDv7로 생성(기존 crypto.randomUUID() v4는 errorCode 4000 거부), presigned S3 PUT content-type을 application/zip으로 수정(기존 application/octet-stream은 403 SignatureDoesNotMatch). dom-map 실측값과 정합. upload 라이브 검증 통과.
- cmdUpload에 선택적 --deployment-id 인자 추가(빌드 deploymentId 주입 가능).

## 3.0.0 (2026-06-11)
- test/prod 환경 구성 원칙(config 값 스왑) 명문화: 런타임 isTest 플래그 없음·단일 constants 파일 스왑+재빌드로 전환 — ait-env.md·skill-guide·app-developer·planner·ait-ads·ait-promotion-reward·pipeline 동기화
- ait-console 완전 자동화: 단일 진입점 서브커맨드 13종(apps/versions/register/upload-assets/upload/test-send/submit-review/release-status/release/release-watch/ad-apply/ad-id-watch/template-watch)
- 쿠키 세션·storageState 영속·headless(2FA 실감지 시만 headed), 콘솔 내부 API 우선·DOM 폴백 하이브리드
- **create/update 파이프라인 통합(테스트 발송까지 자동)**: create 끝 register→upload-assets→upload→test-send, update 끝 upload→test-send 자동 수행
- **출시 상태머신(사용자 명시 명령 개시·자동 출시 금지)**: submit-review → release-watch 체인은 사용자 "출시해라" 명시 명령에서만 개시
- **콘솔 비동기 작업 cron watcher 일반화(async-watch)**: release-watch(APPROVED 폴링→출시하기), ad-id-watch(광고 ID 발급 감지→테스트 ID 스왑→재빌드→테스트 재배포), template-watch(템플릿 심사 통과 감지→발송 활성화 알림). 기본 1시간 폴링·API 우선 감지
- 테스트 앱(today-lucky-draw) 한정 write 정책
- 외부 심사 게이트로 일부 항목(검토 요청 폼/출시하기/광고 신청/템플릿 감지) 재캡처 대기: dom-map 갱신 후 이어서 구현 가능
- pipeline/SKILL.md Phase C/C' 콘솔 테스트 신설, 출시·watcher는 별도 명시 명령 분리 서술
- skill-guide에 ait-console 1행 추가(22번째 스킬)
- 수익화 정책 전환(광고 필수·프로모션 제안·ROI 검토·improve/update 반영)
- 프로모션 TEST_ 코드 컨벤션·비즈월렛·지급한도 반영 (출처: promotion/intro.html 2026-06-11)
- 에셋 다양성·텍스트 선택화: 썸네일 텍스트 선택화(비주얼-only 허용·카피 강제 금지), 컴포지션 아키타입 4종(직전 앱과 재사용 금지), 토스블루 기본 사용 금지(앱 도메인 팔레트 도출)

## 2.25.0 (2026-06-11)
- 공식 정책 드리프트 정합화: 검수 기간 최초 최대 7영업일/재검토 3영업일(2026-03-18 변경) 교체, 포인트 카테고리 신설(2026-06-16 시행) 반영, 혐오·차별 콘텐츠 10종 검수 항목 추가, 틴즈(만 14세+) 연령등급 고려를 Phase 0·검수에 추가
- toss-user-insights 보강: 성공 사례 실측 7건(용사단 키우기·두쫀쿠맵·점신 등), 카테고리 포화도 매트릭스(블루오션/검증·경쟁/포화·위험) 신설, 통합 미니앱 홈·앱 상세 페이지 환경 변화 휴리스틱 추가
- 수익화 최신화: IAP 정기결제(구독) 공홈 확인·문서화(메서드 3종), SDK 2.6.2 구독 콜백 버그·복구 패턴(getPendingOrders), 비게임 토스포인트 직접 지급(grantPromotionReward, SDK 2.0.8+) 보강, 신규 광고 ID 4주 학습 기간·수수료 현황 갱신
- 신규 콘솔 기능 통합: 전환 지표 설계 가이드(핵심 1+보조 2, ait-analytics)와 Phase 0·APP-SPEC 연결, 기능성 메시지(콘솔 발송) 가이드 신설, 고객센터 통합 운영 안내
- 검수·운영 실전 노하우: 구버전 캐싱(최대 30일) 대응 콘솔 강제 배포 단계, 앱 사전 등록 권고(심사 대기 병렬화), 샌드박스≠실환경 경고
- ait-console(콘솔 제출 자동화) spike 착수 — 콘솔 DOM 실사 보류 상태(스크립트만 포함), 후속 버전에서 완성 예정

## 2.24.1 (2026-06-10)
- 기존 프로젝트 마이그레이션 절 추가 — 구 단일파일 SUBMIT.md를 감지하면 손수 작성 내용(스토어 정보·로그인 동의항목·스마트발송 문구·업데이트 노트 history)을 APP-SPEC로 먼저 이관한 뒤 SUBMIT을 슬림화(유실 방지). update/create 커맨드 출력에 APP-SPEC.md 경로 추가

## 2.24.0 (2026-06-10)
- APP-SPEC.md(앱 전체 명세 마스터) 신설 + SUBMIT.md 콘솔 제출용 슬림화 — 2-문서 모델 전환. 광고 노출 트리거 명세·푸시 상세·수익모델·기술스택·기능 동작 상세를 APP-SPEC 전용 섹션으로 신규 추가
- `app-spec-template.md` 신설: 앱 전체 명세 템플릿(수익 모델·기술 스택·광고 트리거·푸시 상세·전체 기능 동작 상세 포함)
- `submit-template.md` 슬림화: 최상단 blockquote 교체, 각 섹션 안내 문구 1줄 압축. APP-SPEC 전용 헤비 섹션은 SUBMIT에서 제거
- `ait-submit/SKILL.md`: "SUBMIT.md 집약 규칙" → "2-문서 규칙(APP-SPEC + SUBMIT)" 섹션 교체. 실행 순서 2·3·4단계에 APP-SPEC 생성·전용 섹션 채우기 지침 추가
- `pipeline/SKILL.md`: Phase 6 산출물·게이트에 `docs/APP-SPEC.md` 추가, 2-문서 모델 설명으로 갱신. Phase 8·9 입력 목록 갱신. 페이즈 흐름 요약 반영
- SUBMIT.md를 출시/업데이트 노트 + 앱 내 기능 2개 섹션으로 최소화(에셋·스토어 정보·로그인·검수 안내 등은 APP-SPEC로 이전). 앱 내 기능 공식 규격(한 10자/영 15자/특수문자 제한/최소 1개) 반영

## 2.23.0 (2026-06-10)
- 스마트발송 스킬(ait-smart-message) 공식 규칙 정합화: 메시지 제목 7자·내용 25자·"~요." 형식·비게임 "토스에서" 필수, 금지 표현 목록(은어·밈·특정인명·과장·불안조성·띄어쓰기생략), 광고성 전용 명시(기능성 발송 불가)
- 발송 메커니즘 섹션 신설: 테스트→본 발송 흐름, 활성화 시간대별 자동 일정 표(00~04:59/05~11:59), 검수 3영업일+테스트 7일 기간 안내, AI pCTR 자동 최적화로 CTR 20% 오류 문구 대체
- SUBMIT.md 집약 규칙에 7번째 그룹 "스마트발송(선택)" 추가 및 3단계 스마트발송 하위 섹션 신설: 발송 유형(일회성/상시·반복) 필수 명시, 랜딩 URL 소재별 상이 불가 규칙, ait-smart-message 스킬 참조 연계
- submit-template.md 말미에 스마트발송 섹션(발송 유형 체크박스·캠페인제목·메시지제목·내용·세그먼트·랜딩URL 표) 추가

## 2.22.1 (2026-06-10)
- /appintoss:improve 보고서 생성 검증 게이트 추가: update --auto 호출 후 docs/REPORT-v{version}.md 실재를 확인하고 없으면 완료 처리 금지·Phase 8' 보고서 생성을 즉시 보완. improve가 IMPROVE-LOG만 기록하고 보고서 없이 종료하던 누락 경로 차단(실사례: IMPROVE-LOG와 REPORT 생성 시각 불일치). 5번에 Phase 8' 보고서 생성=자동 모드에서도 생략 불가 명시

## 2.21.1 (2026-06-10)
- ait-sdk 친구초대 reference 추가(ait-contacts-viral.md): contactsViral + 타입 4종 공홈 fetch 검증, 리워드 지급 구조(적립 후 교환) 연계 명시. 미수록 목록에서 제거

## 2.21.0 (2026-06-10)
- 게이트 무결성: PIPELINE-LOG 반려 누적 원장(재개 시 카운트 복원·리셋 금지)·재진입 재수행 범위, a11y 미실행=FAIL(A11Y-SKIPPED 조건부 통과), update 시나리오 게이트 이원화(부분집합 K)+회귀 스모크, eval/동적실행 사전 스캔(dist·주석·서드파티 포함)·외부링크 인지 UI 정적 검사 — pipeline·visual-qa·reviewer 동기화
- /appintoss:sync-docs 신설: 공홈 llms.txt·npm·릴리즈노트(lean.js 우회) 대조→reference 갱신. 파이프라인 드리프트는 docs/DRIFT.md 집계로 환류
- ait-sdk 1차 갱신: 버전 v1.14.1→2.6.1, 신규 reference 6종(공유·토스페이·화면제어·화면이동·인터랙션·데이터/파일, 공홈 fetch 검증), 2026년 신규 API(requestReview·requestNotificationAgreement·fetchAlbumItems·openPDFViewer) 수록, 미존재 SDK(QR·생체·NFC·클라 푸시) 확정 명시, SDK 3.0 beta 모니터링
- improve 환류: docs/IMPROVE-BACKLOG.md 백로그 저장·소비(재진단 생략)·staleness 무효 처리, --metrics 입력(성능 대시보드·광고 지표), 중복 비교 전체 확대
- SUBMIT.md 집약 규칙: 콘솔 업로드 관련 정보는 SUBMIT.md 한 파일에 집약(업로드 절차·검수 안내·자가점검 섹션 신설) — ait-submit·pipeline·ait-login·ait-assets 동기화
- 에셋 정체성 규칙: 에셋 컨셉 선언(주조색·기능 메타포·무드) 선행 + 템플릿 룩 금지 + 자가 점검 2문항 — Phase 7 게이트 편입 (배너·아이콘 앱별 차별화)
- ait-review 체크리스트 보강(표준 내비바·AOS 백버튼·종료 모달), 광고 운영 정량 기준(eCPM·배치·리워드 포인트 우회 구조), TDS 핵심 11컴포넌트 우선, 운영 벤치마크 수록, skill-guide 현행화

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
