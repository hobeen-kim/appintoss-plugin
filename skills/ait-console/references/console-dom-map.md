# 앱인토스 콘솔 DOM / API 맵 (ait-console v3.0.0 spike T1+T2)

- 대상: `https://apps-in-toss.toss.im` (콘솔), 인증 IdP `https://business.toss.im` (토스 비즈니스)
- 실사 일자: 2026-06-11, 워크스페이스 `27931`(주비아닉스), 앱 `22545`(my-fin-cal) 기준
- 수집 방식: Playwright persistent profile + 네트워크 훅(읽기 전용 순회). 쓰기 버튼(제출/배포/발송/저장/등록/롤백/검토요청) 클릭 안 함.
- 토큰·쿠키·OAuth code 실제 값은 본 문서에 일절 기록하지 않음(존재·헤더명·prefix만).

---

## 1. 로그인 방식 판정

### 분기 확정: **A (id/pw 폼 존재, 자동 입력 가능)**

- 콘솔(`/workspace`) 진입 시 미로그인이면 IdP `https://business.toss.im/account/sign-in?client_id=...&redirect_uri=...&state=/workspace` 로 리다이렉트.
- 로그인 폼 DOM:
  - ID: `input[placeholder="이메일 또는 ID"]` (`aria-label="이메일 또는 ID"`, `input[type=email]` 아님 — 텍스트 input)
  - PW: `input[type="password"]` (`placeholder="Password"`)
  - 제출: `button[type="submit"]` (text "Log in")
  - "Save email" 체크박스(`input[type=checkbox]`) 존재
- **자동 입력·제출 end-to-end 검증 완료**: env(`AIT_CONSOLE_ID`/`AIT_CONSOLE_PW`) → 폼 채움 → submit → IdP가 콘솔로 `?code=...&state=/workspace` (OAuth Authorization Code) 리다이렉트 → 콘솔이 code를 세션 쿠키로 교환 → 로그인 완료.
- 2FA/휴대폰 인증: 이번 계정·세션에서는 **발생하지 않음**(id/pw만으로 통과). 스크립트는 추가 인증 화면 텍스트 감지 시 안내 출력 + 최대 5분 폴링하도록 구현되어 있으나 이번 실사에서 트리거되지 않음 → 다른 계정/보안설정에서의 2FA 동작은 **미확인**.

### 로그인 상태 감지 마커

- **URL 마커**: `https://apps-in-toss.toss.im/...` origin 이면서 `sign-in`/`sign-up` 미포함. 미로그인은 `business.toss.im/account/sign-in` 으로 튕김.
- **DOM 마커**: `/workspace` 진입 성공 시 "{이름}님의 워크스페이스" 텍스트 + 워크스페이스 카드 렌더.
- **API 마커**: `GET /console/.../members/me/user-info` 가 `401`이면 미인증, `200`이면 인증. (세션 준비 전 초기 호출은 401 → 쿠키 세팅 후 200으로 전환되는 패턴 관측)

### 토큰 발급 가능 여부 → **쿠키 세션 only (Bearer 토큰 없음)**

- 캡처된 **모든** 콘솔/비즈니스 API 호출에서 `Authorization` 헤더 **부재**(`authorizationHeader=false`). Bearer/JWT 추출·재사용 경로 **없음**.
- 인증은 전적으로 **쿠키 세션**으로 이뤄짐. 핵심 인증 쿠키: **`TBIZAUTH`** (도메인 `*.toss.im` 공유). 동반 쿠키: `TGSID`, 그 외 분석/채널톡 쿠키(`_ga*`, `ch-*`, `_hj*`, `_fbp` 등 — 인증 무관).
- 따라서 **재사용 단위는 토큰이 아니라 쿠키 세션**: persistent profile(쿠키 저장소) 또는 `TBIZAUTH` 쿠키를 보유한 HTTP 클라이언트면 콘솔 API 직접 호출 가능.

---

## 2. API 인벤토리

베이스 경로: `https://apps-in-toss.toss.im/console/api-public/v3/appsintossconsole`
공통 인증: **쿠키 세션(`TBIZAUTH`)**, Bearer 없음. 응답 봉투: `{ resultType:"SUCCESS", success:{...} }`.
플레이스홀더: `{ws}`=workspaceId(27931), `{app}`=miniAppId(22545).

| 작업 | method + URL 패턴 | 인증 | 토큰 발급 경로 | API 대체 |
|---|---|---|---|---|
| 워크스페이스 목록 | `GET /workspaces` | 쿠키 | 없음(쿠키) | **가능** |
| 워크스페이스 상세 | `GET /workspaces/{ws}` | 쿠키 | 없음 | **가능** |
| 멤버 목록 | `GET /workspaces/{ws}/members` / `.../members/me` | 쿠키 | 없음 | **가능** |
| 내 사용자 정보 | `GET /members/me/user-info` | 쿠키 | 없음 | **가능** |
| **앱 목록** | `GET /workspaces/{ws}/mini-app` | 쿠키 | 없음 | **가능** |
| 앱 상세 | `GET /workspaces/{ws}/mini-app/{app}` | 쿠키 | 없음 | **가능** |
| **업로드된 버전 목록** | `GET /workspaces/{ws}/mini-app/{app}/bundles` | 쿠키 | 없음 | **가능** |
| **현재 배포(출시) 버전** | `GET /workspaces/{ws}/mini-app/{app}/bundles/deployed` | 쿠키 | 없음 | **가능** |
| 검수 상태(앱별) | `GET /workspaces/{ws}/mini-app/{app}/review-status` | 쿠키 | 없음 | **가능** |
| 검수 상태(워크스페이스 전체) | `GET /workspaces/{ws}/mini-apps/review-status` | 쿠키 | 없음 | **가능** |
| 앱 내 기능(+초안) | `GET /workspaces/{ws}/mini-app/{app}/feature/with-draft` | 쿠키 | 없음 | **가능** |
| 점검 작업 | `GET /workspaces/{ws}/mini-app/{app}/maintenance-jobs` | 쿠키 | 없음 | **가능** |
| 평점·리뷰 | `GET /workspaces/{ws}/mini-app/{app}/app-ratings` | 쿠키 | 없음 | **가능** |
| 고객센터 문의 내역 | `GET /workspaces/{ws}/mini-apps/{app}/user-reports` | 쿠키 | 없음 | **가능** |
| 인앱결제 환불 | `GET /workspaces/{ws}/mini-app/{app}/in-app-purchase/refunds` | 쿠키 | 없음 | **가능** |
| 핵심지표 | `GET /workspaces/{ws}/mini-app/{app}/core-metrics` | 쿠키 | 없음 | **가능** |
| 분석(DAU/리텐션) | `POST /workspaces/{ws}/mini-app/{app}/analytics/au` `/analytics/retention` | 쿠키 | 없음 | 가능(조회용 POST) |
| API 키 목록 | `GET /workspaces/{ws}/api-keys` | 쿠키 | 없음 | **가능** |
| 약관/이용동의 | `GET /console-user-terms/me`, `.../console-workspace-terms/{type}/skip-permission` | 쿠키 | 없음 | 가능 |
| **앱 생성** | (read-only 실사 — 미캡처) | 쿠키(추정) | 없음(추정) | **부분/미확인** — 쓰기 플로우 미진입 |
| **버전 업로드** | (read-only 실사 — 미캡처) | 쿠키(추정) | 없음(추정) | **부분/미확인** — `버전 등록` 버튼 미클릭 |
| **검수 제출 / 강제 배포 / 롤백** | (read-only 실사 — 미캡처) | 쿠키(추정) | 없음(추정) | **부분/미확인** — 쓰기 버튼 미클릭 |
| **스마트 발송 캠페인 생성** | (read-only 실사 — 미캡처) | 쿠키(추정) | 없음(추정) | **부분/미확인** |
| **고객센터 답변 등록** | (read-only 실사 — 미캡처) | 쿠키(추정) | 없음(추정) | **부분/미확인** |

> 쓰기(생성/업로드/제출/배포/발송/답변) 엔드포인트는 본 spike의 read-only 제약상 호출하지 않아 URL·바디 스키마 미캡처. 단 read 계열이 100% 동일 베이스 경로+쿠키 세션이므로 쓰기도 동일 인증(쿠키)·동일 베이스일 가능성 높음 → T4에서 해당 폼 1회 실제 제출 캡처로 확정 필요.

### 주요 응답 스키마 요약 (값 마스킹)

- **`GET /mini-app/{app}/bundles`** (업로드 버전 목록):
  `success.contents[]` = `{ miniAppId, appName, deploymentId[masked], versionName("20260611-23"), lastDeployedAt, memo("2.2.4"=노출용 버전명), releaseNote, reviewStatus("APPROVED"|"검토 필요"...), reviewReason, failureReason, isTested, deployed(bool), sdkVersion("2.6.1"), regTs, rejectMessages[] }`, `totalPage`, `currentPage`.
  - **`memo`**: 원천 키는 `memo`. 개발자가 `ait deploy -m`으로 남긴 시맨틱 버전("1.0.1" 등). 콘솔 자동 `versionName`과 별개로, "어떤 버전을 올렸/출시했는지" 판단의 핵심 신호.
- **`GET /mini-app/{app}/bundles/deployed`** (현재 배포 버전): 위 contents 단건과 동형(현재 출시본).
- **`GET /workspaces/{ws}/mini-app`** (앱 목록):
  `success[]` = `{ miniAppId, workspaceId, appName("my-fin-cal"=slug), title, titleEn, status("OPEN"), minAge, maxAge, iconUri, description, ... }` (워크스페이스 6개 앱).
- **`GET /mini-app/{app}`** (앱 상세): `success` = `{ isBeforeFirstReview, hasApproved, hasInReview, hasDraft, miniApp:{...메타+impression(category/keyword)+images+firstReleaseDate...} }`.
- **`GET /mini-app/{app}/review-status`**: `{ hasPolicyViolation, miniApps[]:{ miniAppId, title, serviceStatus, isCautionRegistered } }`.
- **`GET /mini-app/{app}/app-ratings`**: `{ ratings[]:{reviewId,rating,reviewText,userName,createdAt}, paging, averageRating, totalReviewCount }`.
- **`GET /mini-apps/{app}/user-reports`**: `{ reports[], nextCursor, hasMore }` (고객센터 문의; 이번엔 빈 배열).
- **`GET /mini-app/{app}/feature/with-draft`**: `{ approvalType, draft, current[]:{featureId,title,linkUri("intoss://..."),iconUri} }`.

---

## 3. DOM 셀렉터 표 (5개 영역)

콘솔은 SPA이며 좌측 내비게이션이 `<a>`가 아니라 **`button[role="menuitem"]`(class `vkcghxd`)** 텍스트 클릭 방식. 워크스페이스/앱 카드도 anchor 아님 → 텍스트 클릭으로 진입.

| 라우트(확인) | URL 패턴 |
|---|---|
| 워크스페이스 선택 | `/workspace` (카드 텍스트=워크스페이스명 클릭) |
| 앱 목록 | `/workspace/{ws}/mini-app` |
| 앱 대시보드(홈) | `/workspace/{ws}/mini-app/{app}/home` |
| 앱 정보(스토어/메타) | `/workspace/{ws}/mini-app/{app}/meta` |
| 출시/버전 | `/workspace/{ws}/mini-app/{app}/app-build` |
| 문의 내역(고객센터) | `/workspace/{ws}/mini-app/{app}/report` |
| 평점·리뷰 | `/workspace/{ws}/mini-app/{app}/review/list` |
| 멤버 | `/workspace/{ws}/member` · API 키 `/workspace/{ws}/key` |

### ① 앱 등록 (이름·appName·유형)
- 진입: 앱 목록 페이지 `button` text **"등록하기"** (`/mini-app` 우상단).
- 폼 입력 필드(이름/appName/앱 유형 등): **미확인** — "등록하기"는 쓰기 생성 플로우라 read-only spike에서 클릭하지 않음. 폼 셀렉터는 T4에서 1회 진입 캡처 필요.

### ② 스토어 정보 · 에셋 file input
- 진입: 앱 상세 좌측 nav `[role="menuitem"]` text **"앱 정보"** → `/meta`.
- `/meta`는 **조회 전용 뷰**로 렌더(편집 모드 미진입): textarea 0, `input[type=file]` 0. 에셋은 표시용 링크로만 노출(`a` text "로고"/"썸네일" → `https://static.toss.im/appsintoss/{ws}/<uuid>.png`).
- 에셋 업로드 `input[type=file][accept=image/*]` 및 편집 필드: **미확인** — 편집 버튼 진입(쓰기) 필요.

### ③ 출시노트 · 앱내기능 · 검수 제출 버튼
- 진입: nav **"앱 출시"** → `/app-build`.
- 확인된 요소: 헤더 "앱 출시 / 버전을 등록하고 실제 토스 앱에 출시", 탭 버튼 **"버전 등록"** · **"내역"** · **"앱 내 기능"**, 버전 검색 `input[type=search][placeholder="버전 검색"]`, 버전 내역 테이블(생성일/번들 버전/SDK 버전/상태/메모/출시일시 컬럼), 행별 액션 버튼 **"검토 요청"**·**"롤백하기"**·**"테스트"**.
- 출시노트 textarea / 앱내기능 입력 / **"검수 제출"** 확정 버튼: **미확인** — "버전 등록"/"검토 요청"은 쓰기 플로우라 미클릭. (출시노트 데이터 자체는 bundles API의 `releaseNote`로 조회 가능)

### ④ 버전 업로드 file input · 강제 배포 버튼
- 진입: 동일 `/app-build` → `button` text **"버전 등록"** (업로드 모달/페이지 진입).
- 버전 업로드 `input[type=file]` (`.fif`/번들 accept) 및 **강제 배포/출시** 확정 버튼: **미확인** — "버전 등록" 미클릭. 행 액션 "롤백하기"(배포 변경)는 확인되나 클릭 금지 대상.

### ⑤ 발송 폼 textarea · 고객센터 답변 textarea · 등록 버튼
- 발송: nav **"스마트 발송"** 진입점 존재(앱 상세 좌측). 발송 작성 textarea/대상 선택/**"발송"** 버튼: **미확인** — 작성 플로우 미진입.
- 고객센터: nav **"문의 내역"** → `/report` (조회 뷰). 이번 계정 문의 0건(`user-reports` 빈 배열)이라 답변 `textarea` 및 **"답변 등록"** 버튼 렌더 안 됨 → **미확인**.

> 5개 영역의 *편집/제출 폼 셀렉터*가 대부분 "미확인"인 것은 구조 부재가 아니라 **본 spike의 read-only 원칙(쓰기 버튼 미클릭)** 때문. 진입 경로(라우트·nav 텍스트·진입 버튼 텍스트)는 모두 확정됨.

---

## 3-W. 쓰기 플로우 — 출시 상태머신 (v3.0.0 write spike 실측)

- 실측 대상: `today-lucky-draw` (ws 27931 / miniApp 41019), 실사 시작 시 버전 0개.
- 실측 일자: 2026-06-11. 업로드 번들: `today-lucky-draw.ait`(~4MB).
- **사용자 본인 전체 자율 권한 부여 하에 실제 수행한 비가역 동작**: ① .ait 업로드(버전 `20260611-1` 생성) ② 테스트 푸시 실제 발송(단말 푸시) ③ 검토 요청 클릭(→ 앱 정보 검토 선행 게이트에 막힘, 버전 검토 제출은 미발생) ④ 출시하기 클릭 시도(버튼 미노출이라 클릭 불가).
- 베이스 경로/인증: §2와 동일(`/console/api-public/v3/appsintossconsole`, 쿠키 세션 `TBIZAUTH`, Bearer 없음). 토큰·쿠키·deploymentId·presigned URL 실제값 마스킹.
- 2차 실측(2026-06-11): `fixed-cost-keeper`(ws 27931 / miniApp 41246) **신규 앱 등록(create)** + API 3-step 업로드(`application/zip` 확정) + test-push 실제 수행.

### 단계 0) 앱 등록 (create) — **실측 완료 (fixed-cost-keeper 생성)**
DOM 진입: 앱 목록 `/workspace/{ws}/mini-app` → 버튼 **`등록하기`** → 모달 `[role=dialog]` "앱 만들기 / 어떤 앱을 만들고 싶나요?".
- **폼 필드(DOM 순서, radix UI — label `for` 연결 없음 → input 순서로 매핑)**:
  1. `input` [0] = **앱 소개**(AI 분석용, placeholder 예시문). **10자 이상 필수**, 특수문자는 `:` `·` `?` 만 허용. 미충족 시 "10자 이상 입력해주세요" + `만들기` 비활성.
  2. `input` [1] = **앱 이름**(displayName, 라벨 "앱 이름", "나중에 수정할 수 있어요").
  3. `input` [2] = **appName**(영문 소문자 규칙).
  4. **앱 유형** = `[role=radiogroup]` 안의 radio 2개(게임/비게임). `getByRole('radio',{name:'비게임'})`.
  - 제출 버튼: text **`만들기`** (모든 검증 통과 시 활성).
- **등록 API(확정, 2-step)**:
  1. `POST /workspaces/{ws}/mini-app/entry-eligibility-check` body `{ idea: "<앱 소개>" }` → AI 출시 적격성 판정 `success{ enabled, decision("UNDETERMINED"/...), finalMessage, finalReason, requiredActions[], missingInformation[] }`. (등록 자체는 막지 않음 — UNDETERMINED여도 생성 진행됨.)
  2. `POST /workspaces/{ws}/mini-app` body `{ title, appName, appType("NON_GAME"/"GAME") }` → `success{ miniAppId, title, appName, appType }`. 쿠키 세션. **→ API 대체: 가능**(idea로 eligibility-check 후 title/appName/appType POST).
- 실측 결과: `fixed-cost-keeper`(title "고정비지킴이", NON_GAME) → **miniAppId 41246**, status `PREPARE` 생성.
- appName 중복 시: 사전 `GET /mini-app` 목록으로 중복 검사 권장(서버도 거부할 것이나 미실측).

### 단계 0-A) 에셋(아이콘/썸네일) 업로드 — **실측 완료 (fixed-cost-keeper 아이콘)**
DOM 진입: 앱 정보 `/mini-app/{app}/meta` → 버튼 **`수정하기`**(편집 모드) → "앱 로고, 썸네일" 영역에 file input 노출.
- **file input(편집 모드에서만 렌더, 4개)**: `input[type=file][accept=".png, .PNG"]`(로고/썸네일, class `_8t6e210`) + `input[type=file][accept=".jpg,.jpeg,.png"]`(스크린샷류, class `css-1hyfx7x`). 조회 모드(`수정하기` 전)에는 file input 0개.
- Playwright 업로드: `수정하기` 클릭 → `page.locator('input[type=file]').nth(0).setInputFiles('<icon>.png')`.
- **업로드 API(확정, 번들과 다름 — presigned S3 아님)**: `POST /console/api-public/v3/appsintossconsole/resource/{ws}/upload`, **`multipart/form-data`**, **파일 파트 필드명 = `resource`**(실측 확정; `file`/`image`/`multipartFile`/`files` 등은 errorCode 4000 거부), 쿠키 세션 → 응답 `{ resultType:"SUCCESS", success:"<발급 URL>" }`. **`success` 문자열이 발급된 `https://static.toss.im/appsintoss/{ws}/<uuid>.png`**. → **API 대체: 가능**(`multipart{ resource: file }` POST 1회로 URL 발급).
- 용도: 발급된 static URL을 ① 앱 정보 draft PUT 의 `miniApp.images[]`/`iconUri` 에 사용 ② granite.config.ts `brand.icon`. **brand.icon 은 반드시 이 콘솔 발급 static URL**.
- 실측: 아이콘·다크로고·스크린샷3·썸네일 모두 이 API로 업로드. 썸네일 업로드 시 서버가 `backgroundColor`(예 `#1a5882`)를 자동 추출해 images 항목에 채움.

### 단계 0-B) 앱 정보(스토어 정보) 등록 — **draft PUT API + readback (fixed-cost-keeper 실측)**
DOM 진입: `/meta` → **`수정하기`** → 2탭 폼(기본 정보 / 카테고리 및 노출, URL `?step=0|1` 이나 실제로는 단일 스크롤 폼). 편집 모드 진입 마커: `input[type=checkbox]`(약관) ≥5개 또는 textarea 등장.
- **폼 필드(텍스트 input DOM 순서)**: [0]한국어이름 [1]영어이름(≤15자) [2]부제(≤20자) [3]appName(readonly) [4]고객문의이메일 / textarea=상세설명 / file: 로고·다크로고(`accept=".png,.PNG"`, placeholder "파일 선택하기 (600 x 600px)"), 스크린샷(png), 썸네일(`accept=".jpg,.jpeg,.png"`) / 검색키워드 input(`placeholder*="키워드"`, 입력+Enter 칩) / 약관 체크박스 5개(`input[type=checkbox]`, radix id) / 사용연령 combobox.
- **저장 API(확정)**: `PUT /console/api-public/v3/appsintossconsole/workspaces/{ws}/mini-app/{app}/draft`, `application/json`, 쿠키 세션. 바디:
  ```
  { miniApp: { miniAppId, workspaceId, appName, title, titleEn, description(부제),
               detailDescription(상세설명), minAge, maxAge, csEmail, csChatUri, csContract,
               iconUri, darkModeIconUri, status, specialCategory, hasHarmfulContent,
               images:[ {imageType:"PREVIEW"|"THUMBNAIL", imageUrl, orientation:"VERTICAL"|"HORIZONTAL", displayOrder, backgroundColor, backgroundTheme} ] },
    impression: { keywordList:[..문자열10..], categoryPaths:[..], categoryList:[..], isGameCategory } }
  ```
  → `{resultType:"SUCCESS"}`. GET `.../draft` 로 readback(미니앱 + impression + savedAt).
- **API 한 방에 가능(readback 검증)**: GET draft → miniApp 병합(description/detailDescription/titleEn/images[PREVIEW+THUMBNAIL]) + impression.keywordList(10개) → PUT draft → GET draft 재검증.
  - readback 실측 OK: 부제·상세설명·영어이름·아이콘·**검색키워드 10개**·**스크린샷 PREVIEW 3장**·**썸네일 THUMBNAIL**·**카테고리 2개**.
- **카테고리 저장(확정, 프론트 번들 역추적 + readback 실측)**: impression 의 **쓰기 형식은 read 형식과 다름**. `categoryPaths`/`categoryList`(read 전용, group/category/subCategory 객체 트리)를 PUT 에 넣으면 서버가 **조용히 무시**함(keywordList 만 반영). 올바른 쓰기 형식은 **평탄한 ID 배열**:
  ```
  impression: { keywordList:[..], categoryIds:[3820,3882], subCategoryIds:[76,60] }
  ```
  - 카테고리 마스터 조회: **`GET /console/api-public/v3/appsintossconsole/impression/category-list`** (워크스페이스 무관, 쿠키 세션) → `success[]` = `{ categoryGroup:{id,name,isSelectable}, categoryList:[{id,name,isSelectable, subCategoryList:[{id,name,isSelectable}]}] }`. 그룹: 금융(3)·게임(5)·생활(7). 생활 하위 예: 편의(3820, sub: 도구76/구독·렌탈78/기타80), 정보(3882, sub: 뉴스56/도서58/기타60), 일상(3880), 콘텐츠(3834) 등.
  - **검증 규칙(프론트 Zl 함수)**: 생활(7) 그룹 카테고리는 `categoryIds`+`subCategoryIds` **둘 다 필수**, 비생활은 `categoryIds`만. 카테고리는 최대 2개(slice(0,2)).
  - readback: PUT 후 GET draft 의 `impression.categoryPaths`(read 형식)에 group>category>subCategory 트리로 채워져 돌아옴. fixed-cost-keeper 실측 OK: 생활>편의>도구 + 생활>정보>기타.
- **앱 정보 검토 제출(확정, 실측)**: **`POST /workspaces/{ws}/mini-app/review`**, `application/json`, 쿠키 세션. 바디(프론트 Ql 함수 산출):
  ```
  { workspaceId, miniApp:{ miniAppId, title, titleEn, iconUri, status, appName, minAge, maxAge,
      darkModeIconUri, csEmail, csContract, csChatUri, description, detailDescription,
      specialCategory, gameInfo(게임만), images:[THUMBNAIL(HORIZONTAL, backgroundColor?) 먼저, PREVIEW...] },
    impression:{ keywordList, categoryIds, subCategoryIds }, datingCheckListPdfUrl(DATING만) }
  ```
  → `success:{ miniAppId }`. readback: `GET /mini-app/{app}` 이 `hasInReview:true, hasDraft:false` 로 전이(fixed-cost-keeper 실측). 이후 토스 심사 통과 시 `hasApproved:true`(게이트 A 해제).
- 주의: 편집 모드 진입("수정하기" 클릭 후 체크박스 5개 등장)이 SPA 타이밍·세션에 따라 비결정적(여러 번 재시도 필요). 텍스트/에셋/키워드/카테고리 모두 draft PUT 으로 직접 넣는 게 DOM 보다 안정적. 쓰기 API 형식이 불명확하면 프론트 번들(`/static/main.*.js` → `bootstrap.*.js` → lazy chunk)에서 직렬화 함수를 역추적하는 방법이 유효(이번 카테고리 해결 경로).

### 출시 상태머신 (실측 — 게이트 2개 확정)
```
(없음) --upload(initialize+S3PUT+complete)--> PREPARE --(서버 빌드)--> BUILDING --(빌드완료)--> CREATED
   --(테스트푸시: POST bundles/test-push)--> isTested=true  [검토 요청 버튼 활성]
   --(검토 요청 클릭)--> ┌ 게이트A: 앱정보(meta) hasApproved=false 면 "앱 정보 검토를 먼저 완료" 다이얼로그로 차단
                        └ 게이트A 통과(meta APPROVED) 시 → 출시노트 폼 → 제출 → 검토 필요(IN_REVIEW)
   --(토스 심사)--> reviewStatus APPROVED  [출시하기 버튼 노출]
   --(출시하기)--> deployed=true
   심사 거부 시: REJECTED
```
- 실측 전이: upload 직후 `PREPARE`(isTested=false) → 수 초 내 `BUILDING` → 빌드 완료 후 `CREATED`(`sdkVersion` null→채워짐, today-lucky-draw `2.6.1`/fixed-cost-keeper `2.6.2`). `isTested` 전환: today-lucky-draw(DOM 테스트→푸시 클릭)에서는 false→**true** 관측. 단 fixed-cost-keeper에서 **API `bundles/test-push`(200 SUCCESS) 직후에는 isTested가 즉시 true로 안 바뀜** → isTested=true 는 발송 자체가 아니라 **실제 단말에서 테스트 앱을 연 시점**에 올라가는 것으로 추정(발송 성공 ≠ 테스트 완료). 빌드 미완(sdkVersion=null) 버전에 test-push 하면 효과 없음 → 빌드 완료 후 호출 필요.
- **게이트 A(중요): 버전 검토 요청은 앱 정보(meta) 검토 승인이 선행 조건.** today-lucky-draw는 `GET /mini-app/{app}` 의 `hasApproved=false, hasInReview=true`(앱 정보 토스 심사 중)라, 검토 요청 클릭 시 출시노트 폼 대신 **"앱 정보 검토를 먼저 완료해 주세요 / 앱 정보가 승인되어야 앱을 출시할 수 있어요"** 다이얼로그(버튼 `닫기`/`이동하기`)가 떠 버전 검토 제출이 차단됨.
- 신호 필드(bundles API): `reviewStatus`, `isTested`(bool), `sdkVersion`, `deployed`(bool). 앱 정보 게이트 신호(mini-app API): `hasApproved`/`hasInReview`/`hasDraft`, `miniApp.status`(`PREPARE`/`OPEN`).

### 단계 1) 버전 업로드 — **API 3-step + presigned S3 PUT** (확정)
DOM 진입: `/app-build` → (버전 0개면) 본문 "첫 버전을 등록하고 출시해보세요" + 버튼 **`+ 등록하기`**, (버전 ≥1이면) 우상단 버튼 **`버전 등록`** → 모달 `[role=dialog]` "버전 등록하기".
- 모달 DOM: file input **`input[type=file][accept=".ait"]`** (id 예 `radix-:rNN:`, class `_8t6e210`), 메모 textarea `placeholder="입력하기"`, 권한 안내 문구, 제출 버튼 text **`등록`**.
- Playwright 업로드: `page.locator('input[type=file]').setInputFiles('<path>.ait')` 후 모달 내 **`등록`** 버튼 클릭.
- **네트워크 메커니즘(API 직접 호출 가능)**:
  1. `POST /workspaces/{ws}/mini-app/{app}/deployments/initialize` body `{ deploymentId }` → 응답 `success.uploadUrl`(**S3 presigned, ap-northeast-2, 만료 있음**) + `success.deployment{ versionName, reviewStatus:"PREPARE", isTested:false, deployed:false, sdkVersion:null }`. **deploymentId 는 반드시 UUIDv7**(시간순). UUIDv4(`crypto.randomUUID()`)는 errorCode **4000 "배포 ID가 유효하지 않습니다"**로 거부 — 실측 확정.
  2. **`PUT <uploadUrl>`** — .ait 바이트를 presigned S3 URL에 직접 업로드. **Content-Type 은 반드시 `application/zip`** (실측 확정, fixed-cost-keeper API 업로드 HTTP 200). presigned 서명 헤더가 `X-Amz-SignedHeaders=content-type;host`(AWS4-HMAC-SHA256)라, PUT 의 Content-Type 이 서명값과 정확히 일치해야 함. `application/octet-stream`·빈 문자열·헤더 생략은 모두 **HTTP 403 `SignatureDoesNotMatch`**. (.ait 는 zip 컨테이너 → 콘솔 DOM 업로드도 application/zip 으로 PUT.)
  3. `POST /workspaces/{ws}/mini-app/{app}/deployments/complete` body `{ deploymentId }` → `success:{}`. 이후 서버가 BUILDING→CREATED로 빌드.
  - 인증 쿠키 세션. → **API 대체: 가능**(initialize→S3 PUT→complete 3-step을 쿠키 세션으로 재현). create/update 파이프라인은 이 경로를 우선 채택 권장.
- readback: `GET .../bundles` 의 `contents[]` 에 새 `versionName` 등장(`reviewStatus` BUILDING→CREATED, `sdkVersion` 채워짐).

### 단계 2) 테스트 발송 ("푸시 보내기") — **실측 완료 (실제 단말 푸시 발송됨)**
- 진입: `/app-build` 버전 행 버튼 **`테스트`** (class `_3u0hjw0`). 클릭 시 모달 `[role=dialog]` **"{versionName} 테스트하기"** 노출 — QR 코드 + deeplink `intoss-private://today-lucky-draw?_deploymentId=<uuid>` + 버튼 **`푸시 보내기`**.
- 동작: `getByRole('button',{name:'테스트'})` → 다이얼로그의 **`푸시 보내기`** 클릭 → 확인 시 실제 단말로 테스트 푸시 발송.
- **발송 API(확정)**: `POST /workspaces/{ws}/mini-app/{app}/bundles/test-push` body `{ deploymentId }` → `{ resultType:"SUCCESS", success:{} }`. 쿠키 세션. 동반 read: `GET .../bundles/test-links`(QR/deeplink 조회).
- **효과(실측)**: 발송 직후 해당 버전 `isTested` **false→true** 즉시 전이 → "검토 요청" 버튼 활성화. → **API 대체: 가능**.

### 단계 3) 검토 요청 버튼 — 활성 조건 실측
- DOM: `/app-build` 버전 행 버튼 **`검토 요청`** (text 정확), class `_3u0hjw0`, `data-testid` 없음.
- **활성 감지**: `:disabled`/`aria-disabled`. 업로드 직후(`isTested=false`) `disabled=true`, 테스트 푸시 후(`isTested=true`) `disabled=false`로 전이 — 둘 다 실측.
- 권장: `getByRole('button',{name:'검토 요청'}).disabled` 평가, 또는 bundles API의 `isTested`로 DOM 없이 판정.

### 단계 4) 검토 요청 제출 + 출시노트 폼 — **게이트 A로 차단 (앱 정보 검토 선행 필요)**
- isTested=true로 "검토 요청"을 실제 클릭했으나, **출시노트 폼 대신 차단 다이얼로그**가 떴음: `[role=dialog]` 텍스트 **"앱 정보 검토를 먼저 완료해 주세요 / 앱 정보가 승인되어야 앱을 출시할 수 있어요"**, 버튼 `닫기`·`이동하기`(→ `/meta`). 폼에 textarea/contenteditable 0개(폼 미진입).
- 원인 확정: `GET /mini-app/{app}` `hasApproved=false, hasInReview=true` — 앱 정보(meta)가 토스 심사 중이라 미승인. **버전 검토 요청 전에 앱 정보 검토가 APPROVED 되어야 함.**
- 따라서 출시노트 textarea 셀렉터·검토 제출 API는 **미확인(BLOCKED by 게이트 A)** — meta 승인 후 재실측 필요. (참고: 기존 출시 앱들의 bundles `releaseNote`가 이 폼의 산출물.) 작성 준비한 출시노트(미제출): "오늘의 소비 뽑기" 소개 4줄(느낌표·과장·부정나열 없음) — `dumps-write/review-result.json`에 보관.

### 단계 5) "출시하기" 버튼 — 현재 미노출 (release-watch 크론용 감지)
- 버전 0개일 때 `/app-build`에는 출시/테스트/검토 버튼이 **렌더 안 됨**(release-buttons=[]). 버전 ≥1이어야 행 액션 노출.
- 현재(업로드+빌드완료+테스트완료, 검토 미통과) 노출 버튼: `버전 등록`·`테스트`·`검토 요청`. **"출시하기" 버튼은 미노출** — `reviewStatus==="APPROVED"` 이후 등장(기존 출시 앱들에서 출시본 확인). 실측 시 본문에 "출시하기" 문자열 부재 확인.
- **크론 감지 권장(둘 중 택1, API가 견고)**:
  1. **API(권장)**: `GET .../bundles` 의 각 버전 `reviewStatus`+`deployed`. `reviewStatus==="APPROVED" && deployed===false` 이면 "출시 가능" 신호 → 크론이 출시 트리거. DOM 불필요, 1시간 주기에 적합.
  2. **DOM**: `/app-build` 에서 `getByRole('button',{name:'출시하기'})` 존재 + `disabled===false`.
- 보조 게이트: `GET /mini-app/{app}` 의 `hasApproved`(앱 정보 승인 여부) — 이게 false면 버전이 APPROVED여도 출시 플로우 진입 불가. 크론은 `hasApproved===true && bundle.reviewStatus==="APPROVED" && !deployed` 를 함께 봐야 함.

### 캡처된 write API 목록 (실측)
| 동작 | method + URL | 인증 | 바디 → 응답 | 대체 |
|---|---|---|---|---|
| 출시 적격성 판정 | `POST /workspaces/{ws}/mini-app/entry-eligibility-check` | 쿠키 | `{idea}` → `{enabled,decision,finalMessage,missingInformation[]}` | **가능** |
| **앱 생성(create)** | `POST /workspaces/{ws}/mini-app` | 쿠키 | `{title,appName,appType}` → `{miniAppId,title,appName,appType}` | **가능** |
| 업로드 초기화 | `POST /workspaces/{ws}/mini-app/{app}/deployments/initialize` | 쿠키 | `{deploymentId(UUIDv7)}` → `{uploadUrl(S3 presigned), deployment{versionName,...}}` | **가능** |
| 번들 업로드 | `PUT <presigned S3 uploadUrl>` | presigned(서명에 content-type 포함) | `.ait` 바이트, **Content-Type: application/zip** (필수) | **가능** |
| 업로드 완료 | `POST /workspaces/{ws}/mini-app/{app}/deployments/complete` | 쿠키 | `{deploymentId}` → `{}` | **가능** |
| 테스트 푸시 발송 | `POST /workspaces/{ws}/mini-app/{app}/bundles/test-push` | 쿠키 | `{deploymentId}` → `{}` (단말 푸시; isTested는 단말 확인 시 true) | **가능** |
| 테스트 링크 조회 | `GET /workspaces/{ws}/mini-app/{app}/bundles/test-links` | 쿠키 | → QR/deeplink | 가능 |
| 에셋(아이콘) 업로드 | (아래 "단계 0-A" 참조) | 쿠키 | — | **가능** |
| 카테고리 마스터 조회 | `GET /impression/category-list` | 쿠키 | → 그룹/카테고리/서브카테고리 트리 | **가능** |
| 앱 정보 임시저장(카테고리 포함) | `PUT /workspaces/{ws}/mini-app/{app}/draft` | 쿠키 | impression 은 `{keywordList, categoryIds[], subCategoryIds[]}` (단계 0-B 참조) | **가능** |
| **앱 정보 검토 제출** | `POST /workspaces/{ws}/mini-app/review` | 쿠키 | `{workspaceId, miniApp{...}, impression{keywordList,categoryIds,subCategoryIds}}` → `{miniAppId}`; readback `hasInReview=true` | **가능** |
| 버전 검토 요청 제출 | (미확인 — 게이트 A 차단: 앱 정보 승인 대기) | 쿠키(추정) | releaseNote 포함(추정) | 미확인 |
| 출시하기 | (미확인 — 버튼 미노출) | 쿠키(추정) | (미확인) | 미확인 |

> 앱 생성·업로드(3-step, content-type=application/zip)·테스트 발송·**앱 정보 검토 제출(POST mini-app/review)** 은 **API 완전 대체 가능 확정**. 남은 미확정 2건은 상태 게이트 대기: 버전 검토 요청 제출은 앱 정보(meta) 검토 승인 대기(게이트 A — fixed-cost-keeper 는 hasInReview=true 로 심사 중), 출시는 버전 검토 승인 대기(토스 심사, 시간 소요). release-watch 크론이 `hasApproved`/`reviewStatus` 폴링으로 이어받음.

---

## 4. 후속 조정 (T4)

### 핵심 질문 답: 앱 목록·버전 조회를 Playwright 없이 API로?
- **앱 목록: 가능.** `GET /console/api-public/v3/appsintossconsole/workspaces/{ws}/mini-app` (쿠키 세션 `TBIZAUTH`).
- **현재 업로드된 버전 조회: 가능.** `GET .../mini-app/{app}/bundles`(전체 버전) + `.../bundles/deployed`(현재 출시본). versionName·sdkVersion·reviewStatus·releaseNote·deployed 플래그까지 포함.
- 단, **인증은 Bearer 토큰이 아니라 쿠키(`TBIZAUTH`) 세션**. 따라서 "토큰 발급 후 헤더에 실어 호출"이 아니라 "쿠키를 가진 HTTP 클라이언트로 호출". workspaceId/miniAppId는 `GET /workspaces`, `GET /workspaces/{ws}/mini-app` 로 사전 조회.

### 하이브리드(API 우선) 권고
- **읽기 작업(앱목록·버전조회·검수상태·평점·문의·핵심지표)** 은 전부 쿠키 세션 API로 직접 호출 → **Playwright 불필요**. 하이브리드에서 API 우선 경로로 전환 권고.
- 쿠키 확보 방법: (a) 기존 persistent profile(`/Users/hobeen/.appintoss-console/profile`)의 쿠키 스토어 재사용, 또는 (b) Playwright로 1회 로그인 후 `context.cookies()`에서 `TBIZAUTH`(+`TGSID`) 추출해 `fetch`/`axios`에 `Cookie` 헤더로 주입(값은 메모리 보관, 디스크/로그 노출 금지).
- **쓰기 작업(앱생성·버전업로드·검수제출·강제배포·발송·답변)** 은 엔드포인트·바디 미확정 → 당장은 **Playwright DOM 자동화 유지**. T4에서 각 폼 1회 실제 제출을 캡처해 쓰기 API를 확정하면 점진적으로 API 전환 가능(앱 슬러그=appName 영문, 노출 버전명=`memo` 등 매핑 주의).

### 분기 A/B 별 T4 조정
- **분기 A 확정**(id/pw 폼 자동입력 가능) → T4 로그인은 env 자격증명 자동 주입으로 무인화 가능. 단:
  - 세션 만료 시 IdP OAuth code 플로우를 재수행해야 함(spike에서 만료→자동 재로그인 성공 검증됨). code/state 쿼리는 민감값이므로 로그·문서에 남기지 말 것.
  - 2FA는 이 계정에서 미발생이나, 정책 변경/타 계정 대비 추가 인증 화면 폴링 로직은 유지.
- 분기 B(QR·앱 인증 전용)는 **해당 없음**.

---

## 부록. 미확인 / 차단(BLOCKED) 항목 정리
- 쓰기 API URL·바디 스키마(강제배포/발송/답변) — 미캡처. (앱생성·버전업로드·앱정보 검토제출은 §3-W 에서 확정됨. 버전 검토 요청 제출은 게이트 A 대기.)
- 편집/제출 폼 DOM 셀렉터(①앱등록 입력, ②에셋 file input, ③출시노트 textarea·검수제출, ④버전 file input·강제배포, ⑤발송 textarea·답변 textarea) — 쓰기 진입 버튼 미클릭으로 미확인.
- 2FA/휴대폰 인증 DOM — 이번 세션 미발생.
- 고객센터 답변 UI — 문의 0건이라 미렌더.
