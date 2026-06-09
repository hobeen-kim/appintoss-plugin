# BottomSheet (바텀시트)

```tsx
import { BottomSheet } from '@toss/tds-mobile';
```

## Props

```typescript
interface BottomSheetProps {
  open: boolean;                          // required
  onClose?: () => void;
  className?: string;
  dimmerClassName?: string;
  disableDimmer?: boolean;                // default: false - 딤 배경 숨김
  hasTextField?: boolean;                 // default: false - 키보드 활성화 시 시트 올림
  header?: React.ReactNode;
  headerDescription?: React.ReactNode;
  cta?: React.ReactNode;
  children?: React.ReactNode;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  disableChildrenDragging?: boolean;      // default: false
  expandBottomSheet?: boolean;            // default: false - 드래그로 풀스크린 확장
  maxHeight?: number;                     // 접힌 상태 높이 (px)
  expandedMaxHeight?: number;             // 확장 상태 높이 (px)
  expandBottomSheetWhenScroll?: boolean;  // default: false - 내부 스크롤 시 확장
  onExpanded?: () => void;
  onHandlerTouchStart?: (event: TouchEvent) => void;
  onHandlerTouchEnd?: (event: TouchEvent) => void;
  onDimmerClick?: () => void;
  onEntered?: () => void;                 // 열림 애니메이션 완료
  onExited?: () => void;                  // 닫힘 애니메이션 완료
  portalContainer?: HTMLElement;          // default: document.body
  ctaContentGap?: number;                 // default: 34 - CTA와 콘텐츠 간격
  UNSAFE_disableFocusLock?: boolean;
  UNSAFE_ignoreDimmerClick?: boolean;
  UNSAFE_ignoreBackEvent?: boolean;
  a11yIncludeHeaderInScroll?: boolean;    // default: true - 160%+ 텍스트 시 헤더 스크롤 포함
}
```

## 서브 컴포넌트

### BottomSheet.Header
h1 태그, t4 텍스트 스타일. Props: `children`, `className`

### BottomSheet.HeaderDescription
t6 텍스트 스타일. Props: `children`, `className`

### BottomSheet.CTA
단일 액션 버튼.

### BottomSheet.DoubleCTA
이중 버튼. Props: `leftButton`, `rightButton`

### BottomSheet.Select
라디오 선택 컴포넌트.
```typescript
{
  options: Array<{ name: string; value: string; className?: string; disabled?: boolean; hideUnCheckedCheckBox?: boolean }>;
  onChange: (event: ChangeEvent) => void;
  value?: string;
  className?: string;
  animation?: boolean;      // default: true
  animationDelay?: number;  // ms
}
```

## 사용 예시

```tsx
const [isOpen, setIsOpen] = React.useState(false);

// 기본
<BottomSheet open={isOpen} onClose={() => setIsOpen(false)}>
  <Post.Paragraph>콘텐츠</Post.Paragraph>
</BottomSheet>

// 헤더 + 설명 + CTA
<BottomSheet
  open={isOpen}
  onClose={() => setIsOpen(false)}
  header={<BottomSheet.Header>취득세 안내</BottomSheet.Header>}
  headerDescription={
    <BottomSheet.HeaderDescription>계산 방법 안내</BottomSheet.HeaderDescription>
  }
  cta={<BottomSheet.CTA onClick={() => setIsOpen(false)}>확인</BottomSheet.CTA>}
>
  <Paragraph typography="t6">콘텐츠 내용...</Paragraph>
</BottomSheet>

// 이중 버튼
cta={
  <BottomSheet.DoubleCTA
    leftButton={<Button color="dark" variant="weak">취소</Button>}
    rightButton={<Button color="primary">확인</Button>}
  />
}

// Select (라디오 선택)
<BottomSheet open={isOpen} onClose={() => setIsOpen(false)}>
  <BottomSheet.Select
    options={[
      { name: '주택', value: 'house' },
      { name: '토지', value: 'land' },
    ]}
    onChange={(e) => setSelected(e.target.value)}
    value={selected}
  />
</BottomSheet>
```

## 프로젝트 사용 패턴
- `SelectField` 컴포넌트에서 옵션 선택 드롭다운으로 사용
- `header` + `ListRow` 목록으로 옵션 나열

---
> 검증: 2026-06-07 공홈 대조 [일치: 주요 props·서브컴포넌트(Header/HeaderDescription/CTA/DoubleCTA/Select) 일치]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
