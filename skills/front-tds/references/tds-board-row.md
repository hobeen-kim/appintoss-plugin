# BoardRow (아코디언/접힘 패널)

```tsx
import { BoardRow } from '@toss/tds-mobile';
```

## 설명
제한된 공간에서 많은 정보를 깔끔하게 정리해 표시하는 아코디언 컴포넌트. Q&A 스타일 정보 표시에 적합.

## Props

```typescript
interface BoardRowProps {
  title: React.ReactNode;       // required - 타이틀 텍스트
  initialOpened?: boolean;      // default: false - 초기 열림 상태
  isOpened?: boolean;           // default: false - 외부 제어 열림 상태
  onOpen?: () => void;          // 열릴 때 콜백
  onClose?: () => void;         // 닫힐 때 콜백
  prefix?: React.ReactNode;     // 타이틀 앞 요소 (BoardRow.Prefix)
  icon?: React.ReactNode;       // 타이틀 뒤 아이콘 (BoardRow.ArrowIcon)
  children?: React.ReactNode;   // 콘텐츠 영역 (BoardRow.Text 또는 Post)
}
```

## 서브 컴포넌트

### BoardRow.Text
```typescript
interface BoardRowTextProps {
  typography?: string; // default: "t6"
}
```

### BoardRow.Prefix
```typescript
interface BoardRowPrefixProps {
  typography?: string;                                    // default: "st8"
  fontWeight?: "regular" | "medium" | "semibold" | "bold"; // default: "regular"
  color?: string;                                         // default: "adaptive.blue500"
}
```

### BoardRow.ArrowIcon
```typescript
interface BoardRowIconProps {
  name?: string;   // default: "icon-arrow-right-mono"
  color?: string;  // default: "adaptive.grey400"
  size?: number;   // default: 24
}
```

## 사용 예시

```tsx
// 기본 사용
<BoardRow
  title="매도 환전이 무엇인가요?"
  prefix={<BoardRow.Prefix>Q</BoardRow.Prefix>}
  icon={<BoardRow.ArrowIcon />}
>
  <BoardRow.Text>주식 거래가 실시간이 아니기 때문에...</BoardRow.Text>
</BoardRow>

// 초기 열림 상태
<BoardRow
  initialOpened
  title="자주 묻는 질문"
  prefix={<BoardRow.Prefix>Q</BoardRow.Prefix>}
  icon={<BoardRow.ArrowIcon />}
>
  <BoardRow.Text>초기부터 콘텐츠 영역이 열려 있어요.</BoardRow.Text>
</BoardRow>

// 외부 상태 제어
function Controlled() {
  const [isOpened, setIsOpened] = React.useState(false);
  return (
    <BoardRow
      title="질문"
      isOpened={isOpened}
      onOpen={() => setIsOpened(true)}
      onClose={() => setIsOpened(false)}
      prefix={<BoardRow.Prefix>Q</BoardRow.Prefix>}
      icon={<BoardRow.ArrowIcon />}
    >
      <BoardRow.Text>답변 내용</BoardRow.Text>
    </BoardRow>
  );
}

// Post 컴포넌트와 함께 (리치 콘텐츠)
<BoardRow
  title="질문을 적어주세요."
  prefix={<BoardRow.Prefix>Q</BoardRow.Prefix>}
  icon={<BoardRow.ArrowIcon />}
  initialOpened
>
  <Post.Paragraph paddingBottom={24} typography="t6">
    상세한 답변 내용...
  </Post.Paragraph>
  <Post.Ul paddingBottom={24} typography="t6">
    <Post.Li>추가 설명 항목</Post.Li>
  </Post.Ul>
</BoardRow>
```

## 접근성
- `<button>` 태그로 시맨틱 인터랙션 제공
- `aria-expanded` 속성 자동 적용

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
