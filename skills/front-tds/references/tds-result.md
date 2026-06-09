# Result (결과/오류 화면)

```tsx
import { Result } from '@toss/tds-mobile';
```

## Props

```typescript
interface ResultProps {
  figure?: React.ReactNode;     // 상단 비주얼 (아이콘/이미지)
  title?: React.ReactNode;      // 결과 제목
  description?: React.ReactNode; // 부연 설명
  button?: React.ReactNode;     // 액션 버튼
}
```

## 서브 컴포넌트
- `Result.Button` - 결과 화면 액션 버튼

## 사용 예시

```tsx
// 오류 화면
<Result
  figure={
    <Asset.Image
      src="https://static.toss.im/lotties/empty-2-spot-apng.png"
      frameShape={Asset.frameShape.CleanH60}
    />
  }
  title="다시 시도해주세요"
  description="시스템에 잠깐 문제가 생겨 화면을 불러오지 못했어요."
  button={<Result.Button>다시 시도하기</Result.Button>}
/>
```

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
