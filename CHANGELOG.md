# Changelog

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
