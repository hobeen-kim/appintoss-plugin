# BottomCTA (하단 고정 CTA)

```tsx
import { BottomCTA } from '@toss/tds-mobile';
```

## BottomCTA.Single Props

```typescript
interface BottomCTASingleProps {
  children: React.ReactNode;                    // required
  background?: "default" | "none";              // default: "default" - 그라데이션/배경 표시
  hasSafeAreaPadding?: boolean;                 // default: true - 디바이스 safe area 패딩
  hasPaddingBottom?: boolean;                   // default: true - false 시 하단 패딩 0
  fixedAboveKeyboard?: boolean;                 // 키보드 활성화 시 키보드 위로 고정
  hideOnScroll?: boolean;                       // default: false - 스크롤 시 자동 숨김
  showAfterDelay?: { animation: "slide" | "fade" | "scale"; delay: number };
  containerStyle?: React.CSSProperties;         // 최외곽 컨테이너 스타일
  topAccessory?: React.ReactNode;              // CTA 위 콘텐츠
  bottomAccessory?: React.ReactNode;           // CTA 아래 콘텐츠
}
```

## 사용 예시

```tsx
// 단일 버튼
<BottomCTA.Single hasSafeAreaPadding={true}>
  <Button display="full">계산하기</Button>
</BottomCTA.Single>

// 스크롤 시 숨김
<BottomCTA.Single hideOnScroll>
  <Button display="full">확인</Button>
</BottomCTA.Single>

// 더블 CTA (두 버튼) - FixedBottomCTA.Double 사용 (tds-fixed-bottom-cta.md 참고)
<FixedBottomCTA.Double
  leftButton={<CTAButton color="dark" variant="weak">취소</CTAButton>}
  rightButton={<CTAButton>확인</CTAButton>}
/>
```

---
> 검증: 2026-06-07 공홈 대조 [갱신됨: hasPaddingBottom·containerStyle prop 추가, 미확인 show prop 제거, 더블 CTA 예시를 FixedBottomCTA.Double로 정정]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
