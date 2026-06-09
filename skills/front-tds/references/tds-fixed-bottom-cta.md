# FixedBottomCTA (간편 하단 고정 버튼)

```tsx
import { FixedBottomCTA } from '@toss/tds-mobile';
```

## 사용법

화면 하단에 고정되는 CTA 버튼. 단일/이중 버튼 형태를 지원합니다.

```tsx
// 단일 버튼
<FixedBottomCTA onClick={handleClick}>
  계산하기
</FixedBottomCTA>
```

## 서브 컴포넌트

### FixedBottomCTA.Double
좌/우 두 개의 버튼을 렌더링합니다. 버튼은 `CTAButton`을 사용합니다.

```tsx
import { FixedBottomCTA, CTAButton } from '@toss/tds-mobile';

<FixedBottomCTA.Double
  leftButton={<CTAButton color="dark" variant="weak">취소</CTAButton>}
  rightButton={<CTAButton>확인</CTAButton>}
/>
```

## 주요 Props
- `hideOnScroll?: boolean` - 아래로 스크롤 시 자동 숨김, 위로 스크롤 시 다시 표시(애니메이션)

## 프로젝트 사용 패턴
- 커스텀 래퍼 `CalculatorCTA.tsx`에서 폼 검증 상태와 함께 사용
- `onClick` 핸들러에 폼 검증 + 계산 실행 로직 연결

---
> 검증: 2026-06-07 공홈 대조 [갱신됨: FixedBottomCTA.Double 서브컴포넌트 + CTAButton 추가, hideOnScroll prop 추가, 부정확한 "간편 래퍼" 설명 정정]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
