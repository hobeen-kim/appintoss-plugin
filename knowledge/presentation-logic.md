# Presentation / Logic 분리

## 원칙

UI 스킬과 비즈니스 로직 스킬은 반드시 분리한다. AI가 쉽지 않다.

## 구조

```
pages/
  SomePage.tsx          ← Presentation (TDS 컴포넌트 조합, 레이아웃)

hooks/
  useSomeLogic.ts       ← Logic (상태관리, API 호출, 계산)

calculators/ or utils/
  someCalculator.ts     ← Pure Logic (순수 함수, 테스트 가능)
```

## NEVER

1. **페이지 컴포넌트에 비즈니스 로직 금지** — useState/useEffect 외의 로직은 hook으로 분리
2. **hook에 JSX 금지** — hook은 데이터만 반환, 렌더링은 컴포넌트 책임
3. **계산 함수에 React 의존성 금지** — 순수 함수로 작성, 프레임워크 독립

## ALWAYS

1. **에이전트별 경계 준수** — app-developer는 Presentation, calc-engine/back-developer는 Logic
2. **인터페이스 먼저** — 컴포넌트와 hook 사이의 인터페이스(파라미터, 반환값)를 먼저 정의
3. **테스트 가능하게** — Logic 레이어는 독립 테스트 가능해야 한다

## 왜 분리하는가

- AI가 한 파일에서 UI와 로직을 동시에 수정하면 둘 다 망가진다
- 분리하면 각 에이전트가 자기 영역만 수정 → 충돌 최소화
- 테스트 가능성 향상 → TDD 전환 시 필수
