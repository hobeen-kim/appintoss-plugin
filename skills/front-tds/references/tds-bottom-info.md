# BottomInfo (하단 안내 영역)

```tsx
import { BottomInfo } from '@toss/tds-mobile';
```

## 설명
페이지 하단에 면책 조항이나 안내 문구를 표시하는 컨테이너.

## Props

```typescript
interface BottomInfoProps {
  bottomGradient?: "none" | `linear-gradient(${string})`;
  // default: "linear-gradient(adaptive.greyBackground, rgba(255,255,255,0))"
  children?: React.ReactNode;
}
```

## 사용 예시

```tsx
// 기본
<BottomInfo>
  <Post.Ul paddingBottom={24} typography="t7">
    <Post.Li>본 계산 결과는 참고용이며, 실제 세액은 전문가에게 확인하시기 바랍니다.</Post.Li>
    <Post.Li>세율 및 기준은 관련 법령 개정에 따라 변경될 수 있습니다.</Post.Li>
  </Post.Ul>
</BottomInfo>

// 커스텀 그라디언트
<BottomInfo bottomGradient={`linear-gradient(${adaptive.greyBackground}, ${adaptive.blue100})`}>
  <Post.Ul paddingBottom={24} typography="t7">
    <Post.Li>안내 문구</Post.Li>
  </Post.Ul>
</BottomInfo>

// 그라디언트 없이
<BottomInfo bottomGradient="none">
  <Post.Ul paddingBottom={24} typography="t7">
    <Post.Li>안내 문구</Post.Li>
  </Post.Ul>
</BottomInfo>
```

## 참고
- 보통 `Post.Ul` / `Post.Li`와 함께 사용
- 현재 프로젝트에서는 사용하지 않음 (UI 규칙에 의해 제거됨)

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
