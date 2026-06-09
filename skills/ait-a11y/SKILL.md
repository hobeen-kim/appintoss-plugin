---
name: ait-a11y
description: 앱인토스 프론트엔드 접근성(a11y) 가이드. 역할, 레이블, 상태, 구조, 대체 텍스트 등 4대 원칙 기반 체크리스트. 사용자가 접근성, a11y, aria, 스크린리더, 대체 텍스트, 키보드 접근 등을 언급하면 이 스킬을 사용한다.
---

# 프론트엔드 접근성 가이드

> 참고: https://frontend-fundamentals.com/a11y/

접근성 검증은 **정적 체크리스트 + Phase 3 axe-core 자동 스캔 병행**으로 수행한다.

## 4대 원칙

| 원칙 | 핵심 | 위반 시 문제 |
|------|------|-------------|
| **구조** | HTML 중첩 규칙 준수 | 스크린리더가 요소를 인식 못함 |
| **의미** | 모든 인터랙티브 요소에 이름 부여 | "버튼", "링크"로만 읽힘 |
| **예측성** | 역할과 동작 일치 | 키보드 사용자가 조작 불가 |
| **시각정보 보완** | 이미지/아이콘에 대체 텍스트 | 시각 정보 전달 불가 |

---

## 1. 구조 — HTML 중첩 규칙

### 버튼 안에 버튼 넣지 않기

```tsx
// BAD — 중첩 버튼, 스크린리더가 내부 버튼 인식 불가
<button onClick={goToDetail}>
  <span>상품명</span>
  <button onClick={addToCart}>담기</button>  {/* 접근 불가 */}
</button>

// GOOD — 영역 분리
<div>
  <button onClick={goToDetail}>상품명</button>
  <button onClick={addToCart}>담기</button>
</div>
```

### 테이블 행에 직접 onClick 붙이지 않기

```tsx
// BAD — tr은 인터랙티브 요소가 아님
<tr onClick={goToDetail}>
  <td>항목</td>
</tr>

// GOOD — 셀 안에 링크/버튼 배치
<tr>
  <td><a href="/detail/1">항목</a></td>
</tr>
```

**규칙**: 인터랙티브 동작은 반드시 `<button>`, `<a>`, `<input>` 등 인터랙티브 HTML 요소에만 부여한다.

---

## 2. 의미 — 레이블과 역할

### 모든 인터랙티브 요소에 이름 붙이기

```tsx
// BAD — 아이콘만 있는 버튼, 스크린리더가 "버튼"으로만 읽음
<IconButton icon="icon-search-mono" onClick={onSearch} />

// GOOD — aria-label로 이름 부여
<IconButton icon="icon-search-mono" onClick={onSearch} aria-label="검색" />
```

### 같은 이름의 요소에는 설명 추가하기

```tsx
// BAD — "더보기" 버튼이 여러 개면 구분 불가
<button>더보기</button>  {/* 뉴스 더보기? 댓글 더보기? */}

// GOOD — aria-label로 구분
<button aria-label="뉴스 더보기">더보기</button>
<button aria-label="댓글 더보기">더보기</button>
```

### 역할(Role) 3가지 부여 방법

| 방법 | 예시 | 우선순위 |
|------|------|---------|
| 시맨틱 HTML | `<button>`, `<nav>`, `<main>` | 1순위 (권장) |
| `role` 속성 | `<div role="button">` | 2순위 |
| `aria-*` 속성 | `aria-label`, `aria-expanded` | 보조 |

```tsx
// BAD — div에 onClick, 키보드 접근 불가
<div onClick={handleClick}>클릭</div>

// GOOD — 시맨틱 HTML 사용
<button onClick={handleClick}>클릭</button>

// 부득이할 때 — role + tabIndex + onKeyDown
<div role="button" tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown}>
  클릭
</div>
```

---

## 3. 상태 — 동적 UI 상태 전달

### 주요 aria 상태 속성

| 속성 | 용도 | 적용 대상 |
|------|------|----------|
| `aria-expanded` | 열림/닫힘 | 아코디언, 드롭다운 |
| `aria-selected` | 선택 여부 | 탭, 리스트 항목 |
| `aria-checked` | 체크 여부 | 체크박스, 스위치 |
| `aria-disabled` | 비활성 | 버튼, 입력 |
| `aria-hidden` | 스크린리더 숨김 | 장식 요소 |
| `aria-live` | 동적 변경 알림 | 토스트, 알림 |

```tsx
// 아코디언 — 열림/닫힘 상태 전달
<button aria-expanded={isOpen} onClick={toggle}>
  FAQ 항목
</button>
{isOpen && <div>답변 내용</div>}

// 탭 — 선택 상태 전달
<div role="tablist">
  <button role="tab" aria-selected={activeTab === 0}>탭1</button>
  <button role="tab" aria-selected={activeTab === 1}>탭2</button>
</div>
```

---

## 4. 시각정보 보완 — 대체 텍스트

### 이미지

```tsx
// BAD — alt 누락
<img src="/banner.png" />
<Asset.Image src="/banner.png" />

// GOOD — 의미 있는 대체 텍스트
<img src="/banner.png" alt="3월 신규 이벤트 배너" />
<Asset.Image src="/banner.png" alt="3월 신규 이벤트 배너" />

// 장식 이미지 — 빈 alt로 스크린리더 무시
<img src="/divider.png" alt="" />
```

### 아이콘

```tsx
// BAD — 아이콘에 텍스트 없음
<Asset.Icon type="icon-arrow-left-mono" />

// GOOD — 단독 아이콘은 aria-label 또는 동반 텍스트
<button aria-label="뒤로가기">
  <Asset.Icon type="icon-arrow-left-mono" />
</button>

// 텍스트와 함께면 아이콘은 장식 → aria-hidden
<button>
  <Asset.Icon type="icon-arrow-left-mono" aria-hidden="true" />
  뒤로가기
</button>
```

---

## 5. 예측성 — 역할과 동작 일치

### 가짜 버튼 금지

```tsx
// BAD — span에 onClick, 키보드로 동작 안 함
<span onClick={handleClick} style={{ cursor: 'pointer' }}>삭제</span>

// GOOD
<button onClick={handleClick}>삭제</button>
```

### 링크와 버튼 구분

| 요소 | 용도 | 키보드 |
|------|------|--------|
| `<a>` | 페이지 이동, URL 변경 | Enter |
| `<button>` | 동작 실행 (토글, 제출, 삭제) | Enter + Space |

```tsx
// BAD — 페이지 이동인데 button
<button onClick={() => navigate('/detail')}>상세보기</button>

// GOOD — 링크로 이동
<a href="/detail">상세보기</a>
// 또는 react-router
<Link to="/detail">상세보기</Link>
```

### 입력 요소는 form으로 감싸기

```tsx
// BAD — form 없이 Enter 제출 불가
<input value={query} onChange={setQuery} />
<button onClick={handleSearch}>검색</button>

// GOOD — form + onSubmit, Enter키로 제출 가능
<form onSubmit={handleSearch}>
  <input value={query} onChange={setQuery} />
  <button type="submit">검색</button>
</form>
```

---

## TDS 컴포넌트별 접근성 체크

| TDS 컴포넌트 | 필수 접근성 | 예시 |
|-------------|-----------|------|
| `IconButton` | `aria-label` 필수 | `aria-label="검색"` |
| `Checkbox` | `aria-label` (레이블 텍스트 없을 때) | `aria-label="동의"` |
| `Rating` | `aria-label` 권장 | `aria-label="별점 평가"` |
| `Toast` | `aria-live` 자동 적용 | 기본값 사용 |
| `BoardRow` (expandable) | `aria-expanded` 자동 적용 | TDS가 처리 |
| `BottomSheet` | 포커스 트랩 자동 | TDS가 처리 |
| `Asset.Image` | `alt` 필수 | `alt="이벤트 배너"` |
| `Asset.Icon` (단독) | 부모에 `aria-label` | 버튼으로 감싸기 |

---

## 구현 시 체크리스트

- [ ] 모든 `<img>`, `Asset.Image`에 `alt` 속성 있는가
- [ ] 단독 아이콘 버튼에 `aria-label` 있는가
- [ ] `div`/`span`에 `onClick` 쓰지 않았는가 (button/a 사용)
- [ ] 버튼 안에 버튼이 중첩되지 않았는가
- [ ] 동일 텍스트 버튼이 여러 개면 `aria-label`로 구분했는가
- [ ] 아코디언/드롭다운에 `aria-expanded` 있는가
- [ ] 탭에 `role="tablist"` + `aria-selected` 있는가
- [ ] 검색/입력 UI가 `<form>`으로 감싸져 있는가
- [ ] 페이지 이동은 `<a>`/`<Link>`, 동작은 `<button>` 구분했는가
- [ ] 장식 이미지는 `alt=""`, 장식 아이콘은 `aria-hidden="true"` 처리했는가

## 문서 신선도

번들 문서가 stale일 수 있다. API·정책·규격이 불확실하면 공홈 조회를 우선하라: https://developers-apps-in-toss.toss.im/
