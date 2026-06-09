# Post (리치 텍스트/콘텐츠)

```tsx
import { Post } from '@toss/tds-mobile';
```

## 설명
공지사항, 이벤트 페이지 등 포스트 형태의 스타일 콘텐츠를 제공하는 컴포넌트.

## 서브 컴포넌트

### 제목
- `Post.H1` - 가장 큰 제목
- `Post.H2` - 두번째 제목
- `Post.H3` - 세번째 제목
- `Post.H4` - 네번째 제목

### 본문
- `Post.Paragraph` - 본문 텍스트 (typography, paddingBottom)

### 목록
- `Post.Ol` - 순서 목록 (번호)
- `Post.Ul` - 비순서 목록 (불릿)
- `Post.Li` - 목록 항목

### 구분선
- `Post.Hr` - 수평 구분선

## 공통 Props

```typescript
{
  typography?: string;          // t1~t7, st1~st13
  paddingBottom?: string | number; // 하단 간격 (px)
}
```

## 사용 예시

```tsx
// 제목
<Post.H1>대제목</Post.H1>
<Post.H2>중제목</Post.H2>

// 본문
<Post.Paragraph typography="t7" paddingBottom={24}>
  본문 텍스트 내용
</Post.Paragraph>

// 순서 목록
<Post.Ol typography="t6" paddingBottom={16}>
  <Post.Li>첫번째 항목</Post.Li>
  <Post.Li>두번째 항목</Post.Li>
</Post.Ol>

// 비순서 목록
<Post.Ul paddingBottom={24} typography="t7">
  <Post.Li>본 계산 결과는 참고용이며, 실제 세액은 전문가에게 확인하시기 바랍니다.</Post.Li>
  <Post.Li>세율 및 기준은 관련 법령 개정에 따라 변경될 수 있습니다.</Post.Li>
</Post.Ul>

// 구분선
<Post.Hr />
```

## 프로젝트 사용 패턴
- `BottomInfo` + `Post.Ul/Li` 조합으로 면책 고지 표시
- `BoardRow` 내부에서 리치 콘텐츠로 사용

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
