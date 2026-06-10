# appintoss-plugin

앱인토스(Apps in Toss) 미니앱 **무개입 생성 파이프라인** Claude Code 플러그인. 주제 한 줄로 검수 통과 수준의 미니앱(코드 + `.ait` 번들 + 검수리포트 + 콘솔 제출 에셋)을 페이즈 머신으로 완성한다.

## 개요

- **입력**: 주제 한 줄 (`"가계부 미니앱"`)
- **산출물**: `src/` 코드 · `{appName}.ait` 번들 · `REVIEW-REPORT.md` 검수리포트 · `docs/assets/` 콘솔 제출 에셋(아이콘·화면예시·썸네일) · 완료 보고서
- **구성**: 커맨드 4개(create/update/improve/sync-docs) · 에이전트 6개 · 스킬 21개
- **원칙**: TDS-only(라이트모드) · 스펙 먼저 · YAGNI · Presentation/Logic 분리 · 증거 없는 PASS 금지
- 마지막에 **완료 보고서를 생성하고 승인 대기로 종료**한다 — 사람의 유일한 개입 지점은 보고서 승인 1회.

## 설치

```
/plugin marketplace add hobeen-kim/appintoss-plugin
/plugin install appintoss@appintoss-plugin
```

업데이트(새 버전 반영):

```
/plugin marketplace update appintoss-plugin
```

## 사용법

```
/appintoss:create "가계부 미니앱"          # 신규 생성 — Phase 0~7 무개입 완주
/appintoss:update "월별 통계 추가"         # 기존 앱 기능 추가·수정 — 영향 분석 후 증분 적용
/appintoss:improve ./app                  # 개선점 1건 발굴 → 자동 update
/appintoss:sync-docs                      # 번들 reference를 공홈과 대조·갱신
```

`--auto` 플래그를 붙이면 보고서 승인 대기 없이 git 커밋·push까지 자동 완주한다(정책 금지 주제·반려 5회 초과·빌드 실패 시에는 자동 모드라도 중단).

## 범위 외

콘솔 업로드·검수 요청(수동), 앱빌더(Deus) 자동화, 백엔드 실배포, 다크모드, 실기기 테스트
