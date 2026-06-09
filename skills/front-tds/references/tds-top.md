# Top (페이지 상단 타이틀)

```tsx
import { Top } from '@toss/tds-mobile';
```

## Props

```typescript
interface TopProps {
  title: React.ReactNode; // required
  upperGap?: number; // default: 24 (상단 패딩)
  lowerGap?: number; // default: 24 (하단 패딩)
  upper?: React.ReactNode;         // 타이틀 위 영역
  lower?: React.ReactNode;         // 타이틀 아래 영역
  subtitleTop?: React.ReactNode;   // 타이틀 위 부제목
  subtitleBottom?: React.ReactNode; // 타이틀 아래 부제목
  right?: React.ReactNode;         // 우측 영역
  rightVerticalAlign?: "center" | "end"; // default: 'center'
}
```

## 서브 컴포넌트
- `Top.TitleParagraph` - 메인 타이틀 (size: 22|28)
- `Top.TitleTextButton` - 타이틀 영역 텍스트 버튼
- `Top.TitleSelector` - 타이틀 선택기
- `Top.SubtitleParagraph` - 부제목 (size: 13|15|17)
- `Top.RightButton` - 우측 버튼
- `Top.LowerButton` - 하단 버튼
- `Top.LowerCTA` - 하단 CTA

## 사용 예시

```tsx
// 기본 타이틀
<Top
  title={<Top.TitleParagraph>취득세 계산기</Top.TitleParagraph>}
/>

// 부제목 포함
<Top
  title={<Top.TitleParagraph>취득세 계산기</Top.TitleParagraph>}
  subtitleBottom={
    <Top.SubtitleParagraph>
      부동산 취득 시 납부해야 할 세금을 계산해요
    </Top.SubtitleParagraph>
  }
/>

// 우측 버튼
<Top
  title={<Top.TitleParagraph>계산 결과</Top.TitleParagraph>}
  right={<Top.RightButton onClick={handleReset}>초기화</Top.RightButton>}
/>
```

---
> 검증: 2026-06-07 공홈 대조 [일치: props·서브컴포넌트 일치 (공홈에는 SubtitleTextButton/SubtitleSelector/SubtitleBadges/UpperAssetContent/LowerCTAButton/RightAssetContent 등 추가 서브컴포넌트 존재 — 본 문서는 핵심 부분집합)]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
