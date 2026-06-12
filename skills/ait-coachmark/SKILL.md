---
name: ait-coachmark
description: 앱인토스 온보딩/코치마크 구현 가이드. TDS Tooltip 기반 첫 사용자 경험(FTUE) 설계. 사용자가 온보딩, 튜토리얼, 코치마크, 첫 사용자, 가이드 표시, 도움말 등을 언급하면 이 스킬을 사용한다.
---

# 온보딩/코치마크 구현 가이드

## 온보딩이 필요한 경우

- 핵심 기능이 직관적이지 않을 때
- 첫 진입 시 사용자가 "뭘 해야 하지?" 할 때
- 숨겨진 기능이 있을 때 (스와이프, 길게 누르기 등)

## TDS 기반 온보딩 패턴

### 패턴 1: Tooltip 코치마크

```tsx
import { Tooltip } from '@toss/tds-mobile';

// 특정 요소를 가리키는 말풍선
<Tooltip
  open={showTooltip}
  onClose={() => setShowTooltip(false)}
  content="여기를 눌러 상황을 선택하세요"
  placement="bottom"
>
  <Button>상황 선택</Button>
</Tooltip>
```

### 패턴 2: BottomSheet 안내

```tsx
import { BottomSheet } from '@toss/tds-mobile';

// 첫 진입 시 사용법 안내
<BottomSheet open={isFirstVisit} onClose={() => setFirstVisit(false)}>
  <BottomSheet.Header>사용법 안내</BottomSheet.Header>
  <Paragraph>
    <Paragraph.Text t="t5">1. 상황을 선택하세요</Paragraph.Text>
    <Paragraph.Text t="t5">2. 분위기를 고르세요</Paragraph.Text>
    <Paragraph.Text t="t5">3. 대화 주제를 받아보세요!</Paragraph.Text>
  </Paragraph>
  <BottomSheet.CTA>
    <Button onClick={() => setFirstVisit(false)}>시작하기</Button>
  </BottomSheet.CTA>
</BottomSheet>
```

### 패턴 3: 단계별 ProgressStepper

```tsx
import { ProgressStepper } from '@toss/tds-mobile';

// 단계별 진행 표시
<ProgressStepper current={currentStep} total={3} />
```

### 패턴 4: Result 빈 상태 → 행동 유도

```tsx
import { Result } from '@toss/tds-mobile';

// 데이터 없을 때 첫 행동 유도
<Result
  title="아직 기록이 없어요"
  description="첫 번째 대화 주제를 받아보세요"
  action={<Button onClick={handleStart}>시작하기</Button>}
/>
```

## FTUE (First Time User Experience) 설계

### 스토리지 기반 방문 여부 판단

```tsx
import { getStorageItem, setStorageItem } from '@apps-in-toss/web-framework';

const ONBOARDING_KEY = 'onboarding_completed';

// 첫 방문 확인
const isFirstVisit = !(await getStorageItem(ONBOARDING_KEY));

// 온보딩 완료 후 저장
await setStorageItem(ONBOARDING_KEY, 'true');
```

### 온보딩 흐름 설계 원칙

1. **3단계 이내** — 길면 스킵됨
2. **즉시 가치 제공** — "이걸 하면 이런 게 나와요"
3. **스킵 가능** — 강제 온보딩은 이탈 유발
4. **한 번만** — 스토리지로 완료 여부 저장, 재방문 시 미표시
5. **진입 시 바텀시트 자동 열림 금지** — 검수 기준! 사용자 액션 후에만 열기

## 주의사항

- **진입 시 바텀시트 자동 열림**: 검수 반려 사유. 반드시 사용자 액션(탭/버튼) 후에 열기
- 온보딩은 최초 1회만. `getStorageItem`으로 확인 후 조건부 표시
- 토스앱 내에서는 뒤로가기 시 온보딩이 다시 뜨지 않도록 상태 관리
- **클릭 유도 문구(코치마크 카피·CTA 레이블)** 작성 시 `knowledge/copy-deliberation.md` 절차(다중 에이전트 의논)를 따른다.

## 문서 신선도

번들 문서가 stale일 수 있다. API·정책·규격이 불확실하면 공홈 조회를 우선하라: https://developers-apps-in-toss.toss.im/
