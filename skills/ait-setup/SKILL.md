---
name: ait-setup
description: 앱인토스 파이프라인 프로젝트 설정(.appintoss.json) 초기화 가이드 — git remote·branch, 자동 모드 기본값, .gitignore 안내
---

# ait-setup — 프로젝트 설정 초기화

앱인토스 파이프라인 프로젝트의 설정 파일 `.appintoss.json`을 초기화한다. 자동 모드(`--auto`)·Phase 9 git 자동 푸시·`/appintoss:improve`가 이 설정을 참조한다.

## `.appintoss.json` 스키마

프로젝트 루트에 둔다.

```json
{
  "git": {
    "remote": "origin",
    "branch": "appintoss/auto"
  },
  "autoMode": false
}
```

| 키 | 의미 | 기본값 |
|---|---|---|
| `git.remote` | push 대상 remote 이름. 없으면 push 생략(로컬 커밋만) | `origin` |
| `git.branch` | Phase 9가 커밋·push할 브랜치. 설정 시 그 브랜치 사용 | 현재 브랜치 |
| `autoMode` | 커맨드에 `--auto` 미지정 시 적용할 자동 모드 기본값 | `false` |

- `autoMode: false`(기본)면 Phase 8 수동 승인으로 종료한다. `--auto` 플래그가 항상 우선한다.
- `git.branch`를 지정하면 Phase 9가 기본 브랜치(main) 직접 push 대신 그 브랜치를 사용한다(파괴적 작업 방지 권장).
- **알림·메신저·외부 전송 키는 넣지 않는다.** 모니터링·결과 확인은 터미널과 보고서 파일로 한다.

## 초기화 절차

1. 프로젝트 루트에 `.appintoss.json`이 없으면 위 스키마로 생성한다(값은 프로젝트에 맞게 조정).
2. `.gitignore`에 빌드 산출물과 의존성을 추가한다:
   ```
   node_modules/
   dist/
   *.ait
   ```
   (`.ait` 번들은 용량이 크므로 저장소에 커밋하지 않는 것을 권장. 커밋이 필요하면 이 줄을 제외한다.)
3. git remote를 공유 저장소로 쓰고 자동 모드를 켤 계획이면 `git.branch`를 별도 브랜치로 설정해 main 직접 push를 피한다.
