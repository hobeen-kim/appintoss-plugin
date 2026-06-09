---
name: ait-deus
description: Deus 앱빌더 코드를 프로젝트에 통합하는 가이드. 사용자가 Deus 코드를 붙여넣거나, 앱빌더, Deus, 디자인 코드 변환 등을 언급하면 이 스킬을 사용한다.
---

# Deus 앱빌더 코드 통합 가이드

> Deus는 앱인토스 파트너용 웹 기반 UI 디자인 도구. 개발자 모드에서 `@toss/tds-mobile` 코드를 직접 추출할 수 있다.

## Deus 코드 인식 패턴

사용자가 다음과 같은 코드를 붙여넣으면 Deus 출력이다:
- `@toss/tds-mobile`에서 import하는 컴포넌트 코드
- `@tds/token`에서 `adaptive` import
- `## code` / `## css` 섹션으로 구분된 출력
- CSS에 `🌈 Quick_` 접두사가 붙은 레이어 이름

## 통합 규칙

### 1. code 블록만 사용, css 블록은 무시

```
## code   ← 이것만 사용
## css    ← 무시 (Deus 내부 레이어 구조, 실제 스타일링에 불필요)
```

CSS의 `🌈 Quick_결과화면 - iOS 42 - Navigation 30` 같은 키는 Deus 내부 컴포넌트 트리 경로이며, 실제 구현에 쓸 수 없다.

### 2. Deus 코드를 그대로 복붙하지 않는다

Deus는 정적 UI만 출력한다. 다음을 추가해야 한다:

| 추가할 것 | 예시 |
|-----------|------|
| 상태 관리 | `useState`, `useEffect` |
| 이벤트 핸들러 | `onClick`, `onSubmit` |
| 라우팅 | `useNavigate`, `useParams` |
| API 호출 | fetch, axios |
| 조건부 렌더링 | 로딩, 에러, 빈 상태 |
| 접근성 보강 | `aria-label` 등 (Deus가 누락할 수 있음) |

### 3. Deus 컴포넌트 → 프로젝트 코드 매핑

Deus 출력의 주요 컴포넌트와 props:

| Deus 컴포넌트 | import | 주요 props |
|--------------|--------|-----------|
| `Text` | `@toss/tds-mobile` | `display`, `color`, `typography`, `fontWeight`, `textAlign` |
| `Spacing` | `@toss/tds-mobile` | `size` |
| `AssetImage` | `@toss/tds-mobile` | `frameShape`, `src`, `backgroundColor`, `aria-hidden` |
| `AssetContentImage` | `@toss/tds-mobile` | 콘텐츠 이미지용 |
| `CTAButton` | `@toss/tds-mobile` | `color`, `variant`, `display` |
| `FixedBottomCTADouble` | `@toss/tds-mobile` | `leftButton`, `rightButton` |
| `adaptive` | `@tds/token` | `grey800`, `grey700` 등 색상 토큰 |
| `assetFrameShape` | `@toss/tds-mobile` | `CleanW100` 등 프리셋 |

### 4. 통합 순서

```
[1] Deus code 블록에서 컴포넌트 구조 파악
    ↓
[2] 정적 텍스트를 동적 데이터로 교체
    예: "완료 상황에서 사용해요" → {title}
    ↓
[3] 이벤트 핸들러 연결
    예: <CTAButton> → <CTAButton onClick={handleConfirm}>
    ↓
[4] 상태/훅 추가
    ↓
[5] 기존 페이지 구조에 맞게 배치
    (라우팅, 레이아웃, 헤더 등)
```

### 5. 주의사항

- **Deus가 생성한 Navigation 컴포넌트는 무시** — 앱인토스에서 네비게이션 바는 프레임워크가 자동 제공
- **`adaptive` 색상 토큰 사용 가능** — `import { adaptive } from '@tds/token'`
- **`assetFrameShape` 프리셋 확인** — Deus가 쓴 프리셋이 실제 존재하는지 확인 필요
- **Presentation/Logic 분리** — Deus 코드를 페이지에 그대로 넣지 말고, 로직은 훅으로 분리

## 문서 신선도

번들 문서가 stale일 수 있다. API·정책·규격이 불확실하면 공홈 조회를 우선하라: https://developers-apps-in-toss.toss.im/
