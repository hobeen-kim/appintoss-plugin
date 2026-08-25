# 인앱 광고 (인앱 광고 2.0 ver2 통합 SDK)

토스 애즈(Toss Ads)와 구글 애드몹(Google AdMob)을 통합한 광고 솔루션.
환경에 따라 최적의 광고를 자동 선택한다.

## 광고 유형

| 유형 | 설명 | 테스트 ID |
|------|------|-----------|
| 전면형 | 화면 전체를 덮는 광고. **사용자 명시 액션(버튼) 직후 등 예측 가능한 시점에만 노출** — 로딩/인트로 등 일시 화면 노출 금지 | `ait-ad-test-interstitial-id` |
| 보상형(리워드) | 사용자가 선택해서 시청 후 보상 수령 | `ait-ad-test-rewarded-id` |
| 배너 리스트형 | 96px 높이 고정. 콘텐츠 하단/리스트 중간 배치 | `ait-ad-test-banner-id` |
| 배너 피드형 | 410px 높이 고정. 피드 사이 배치 | `ait-ad-test-native-image-id` |

> **중요**: 테스트는 반드시 테스트용 ID를 사용. 운영 ID 사용 시 제재 대상.
> 운영 광고 ID 신청은 앱 승인(hasApproved=true) 후 가능 — 그 전엔 테스트 ID 사용, 승인 후 `ad-apply`→`ad-id-watch`로 발급·스왑.
> 운영 광고 ID 발급 후에는 `ait-console ad-id-watch`가 발급 여부를 자동 감시하여 config 상수 파일의 테스트 ID를 실 ID로 스왑하고 테스트 재배포까지 자동 처리한다.
> **환경 전환 원칙**: 테스트→운영 전환은 런타임 분기가 아닌 **config 값 스왑 + 재빌드**다. 스왑 대상 값은 단일 constants 파일에 모은다(ait-env.md "test vs prod 구분" 참조).

## Import

```tsx
import {
  TossAds,
  loadFullScreenAd,
  showFullScreenAd,
} from '@apps-in-toss/web-framework';
```

## 전면형/리워드 광고

> **필수 — 노출 시점 예측가능성 (검수 반려 직결, ait-review-checklist 110-111행)**
> - 인트로/로딩/컷신/팝업 모달 등 **일시적 화면에 전면 광고 노출 금지** (공홈)
> - 사용자가 **예상하기 어려운 순간에 노출 금지** — 화면 전환·navigate 직전 자동 노출, useEffect 자동 노출이 대표 위반 패턴
> - 전면 광고는 **사용자 명시 액션(버튼 클릭)에 결합**해 예측 가능하게 노출한다(Clear Action) — 예: "결과 보기" 버튼 onClick에서 `await showAd()` 후 navigate

### 사전 로드 → 표시 패턴

```typescript
// 1. 로드
loadFullScreenAd(params: {
  options: { adGroupId: string };
  onEvent: (event: { type: 'loaded' }) => void;
  onError: (err: unknown) => void;
}): () => void;  // cleanup 함수 반환

// 2. 표시
showFullScreenAd(params: {
  options: { adGroupId: string };
  onEvent: (event: ShowFullScreenAdEvent) => void;
  onError: (err: unknown) => void;
}): () => void;

type ShowFullScreenAdEvent =
  | { type: 'requested' }
  | { type: 'show' }
  | { type: 'impression' }
  | { type: 'clicked' }
  | { type: 'dismissed' }
  | { type: 'failedToShow' }
  | { type: 'userEarnedReward'; data: { unitType: string; unitAmount: number } };

// 지원 여부 확인
loadFullScreenAd.isSupported(): boolean;
showFullScreenAd.isSupported(): boolean;
```

## 배너 광고 (TossAds)

```typescript
// 초기화
TossAds.initialize(options: TossAdsInitializeOptions): void;

// 배너 부착
TossAds.attachBanner(
  adGroupId: string,
  target: string | HTMLElement,
  options?: TossAdsAttachBannerOptions
): TossAdsAttachBannerResult;  // result.destroy()로 개별 제거

// 전체 제거
TossAds.destroyAll(): void;
```

### 스타일 커스터마이징

| 옵션 | 값 | 설명 |
|------|-----|------|
| `theme` | `auto` / `light` / `dark` | 다크모드 대응 (auto: 시스템 설정 따름) |
| `tone` | `blackAndWhite` / `grey` | 배경 색상 |
| `variant` | `expanded` / `card` | 전체 너비 확장형 vs 둥근 카드형 |

## 사용 예시

### 전면 광고 훅

```tsx
function useFullScreenAd(adGroupId: string) {
  const adLoadedRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const loadAd = useCallback(() => {
    if (!loadFullScreenAd?.isSupported?.()) return;

    cleanupRef.current = loadFullScreenAd({
      options: { adGroupId },
      onEvent: (event) => {
        if (event.type === 'loaded') adLoadedRef.current = true;
      },
      onError: () => { adLoadedRef.current = false; },
    });
  }, [adGroupId]);

  const showAd = useCallback((): Promise<void> => {
    if (!adLoadedRef.current) return Promise.resolve();
    if (!showFullScreenAd?.isSupported?.()) return Promise.resolve();

    return new Promise((resolve) => {
      showFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          if (event.type === 'dismissed' || event.type === 'failedToShow') {
            adLoadedRef.current = false;
            loadAd(); // 다음 광고 미리 로드
            resolve();
          }
        },
        onError: () => { adLoadedRef.current = false; loadAd(); resolve(); },
      });
    });
  }, [adGroupId, loadAd]);

  useEffect(() => { loadAd(); return () => cleanupRef.current?.(); }, [loadAd]);

  return { showAd, isLoaded: () => adLoadedRef.current };
}
```

```tsx
// ✅ 올바른 사용 — 사용자 명시 액션(버튼)에 결합 (예측 가능)
<Button onClick={async () => { await showAd(); navigate('/result'); }}>결과 보기</Button>

// ❌ 위반 — 로딩/분석 화면에서 자동 노출 (일시 화면 + 예측 불가, 검수 반려)
useEffect(() => {
  if (analysisDone) { showAd().then(() => navigate('/result')); }
}, [analysisDone]);
```

### 보상형 광고

```tsx
function RewardAdButton() {
  const handleShowAd = () => {
    if (!showFullScreenAd.isSupported()) return;

    showFullScreenAd({
      options: { adGroupId: 'MY_REWARD_AD_GROUP' },
      onEvent: (event) => {
        if (event.type === 'userEarnedReward') {
          // 시청 완료 이벤트에서만 보상 지급
          const { unitType, unitAmount } = event.data;
        }
        if (event.type === 'dismissed') {
          // 광고 닫힘
        }
      },
      onError: (error) => console.error(error),
    });
  };

  return <Button onClick={handleShowAd}>광고 보고 보상 받기</Button>;
}
```

## 광고 그룹 ID 관리

```typescript
// constants/ads.ts
/** 전면 광고 — 운영 ID 발급 전까지 테스트 ID 사용 */
export const FULLSCREEN_AD_GROUP_ID = 'ait-ad-test-interstitial-id';
export const REWARD_AD_GROUP_ID = 'ait-ad-test-rewarded-id';
export const BANNER_AD_GROUP_ID = 'ait-ad-test-banner-id';
export const FEED_AD_GROUP_ID = 'ait-ad-test-native-image-id';
```

## 필수 주의사항

- `isSupported()` 체크 후 사용 (AIT 환경이 아니면 동작하지 않음)
- cleanup 함수를 반드시 호출하여 리소스 정리
- 광고 재생 중 앱 사운드는 자동 중단, 종료 후 자동 재개
- 보상형 광고는 `userEarnedReward` 이벤트에서만 보상 지급 (중도 이탈 시 보상 없음)
- 중복 보상 방지 로직 필수 구현

## 금지 행위 — 토스애즈 SSP 운영 정책 (공홈)

정책에 명시되지 않았더라도 **광고 노출·클릭·성과를 인위적으로 유도하거나 사용자가 오해하게 만드는 행위**는 위반으로 판단될 수 있다.

### ① UI/UX 품질 저하
- 광고를 "추천 서비스", "금융 팁" 등으로 **위장**
- Toss Ads 가이드 외 광고 단위의 **색상·글꼴 변경**, 타이틀·라벨·CTA 문구·디자인 임의 수정
- 버튼·게임 플레이 영역 등 **상호작용 요소와 인접 배치**해 오클릭을 유발하는 구조
- **같은 화면에 동일 포맷 광고 2개 이상 배치**
- 화면 종료·이전 화면 이동이 어려운 **막다른(Dead-end) 구조**
- 광고와 서비스 CTA를 구분하기 어렵게 구성 / 서비스 이용에 필요한 CTA를 인지·접근하기 어렵게 구성
> 기준: 광고는 반드시 **"Ad" 표기 유지**, 모든 광고 UI는 **web-base 표준 컴포넌트** 사용

### ② 광고 호출 동작 변조
- SDK **Click / Impression 이벤트 변조**
- 광고 SDK를 거치지 않고 자체 로직으로 광고 호출, SDK 이벤트 우회 구현
- **Back 버튼 차단**·비정상 제어로 화면 종료를 방해
> 기준: SDK 기본 이벤트 구조 변조 금지, **SDK 외부 API 호출 불가**

### ③ 비정상 트래픽·성과 조작
- 광고 영역 **주기적 Refresh**
- 인위적 클릭·노출 발생
> 기준: 비정상 패턴 확인 시 **광고 제한·제재·정산 보류**

### ④ 보상·참여형 클릭 유도
- "광고 클릭 즉시 리워드 제공", "광고 클릭하면 포인트 제공"
> 기준: **광고 소비를 보상과 직접 연결하는 구조 금지**, 클릭 보상성 문구·이벤트 연동 금지 (보상은 `userEarnedReward` 기준의 **시청 완료**에만 연결한다)

### ⑤ 광고 은닉·겹침
- 투명 광고, 다른 카드 UI 뒤에 광고 DOM 삽입
> 기준: 광고는 **노출 상태가 명확히 확인 가능**해야 함

### 제재·이의제기
- 위반 누적에 따라 단계적으로 제한되지만, 유형·심각성에 따라 **1회 위반으로 즉시 30일 또는 영구 제한**이 적용될 수 있다. 동시에 확인된 위반은 슬롯 수와 무관하게 1회로 계산된다.
- 정책 위반·무효 트래픽으로 생긴 수익은 **부당 수익**으로 지급 보류·거절되며, 이미 지급된 금액도 환수될 수 있다.
- 이용 제한 통지 후 **30일 이내** 채널톡으로 이의제기할 수 있다(검토 약 1주). 이의제기는 **제재의 적절성**을 심사하며, 위반을 수정했거나 재발 방지 계획을 냈다는 사실만으로는 해제되지 않는다.

### 개발·운영 필수 사항 (공홈)
- 테스트는 **반드시 테스트용 ID**로 한다. 운영 ID로 테스트하면 제재를 받을 수 있다.
- 광고 재생 중 앱 사운드는 멈추고 종료 후 자동 재개되어야 한다.
- 광고 그룹 ID는 구글 등록까지 **최대 2시간**이 걸릴 수 있다. 생성 후 발급된 ID로 개발한다.
- 앱인토스 인앱 광고는 **구글 애드몹 광고 정책**을 따른다.
- 인앱 광고를 붙이려면 **사업자 정보 등록 → 정산 정보 등록(검토 영업일 2~3일)**이 선행되어야 한다. 예금주명은 통장 사본과 한 글자도 달라선 안 된다.
- 수익 정산: 매월 1일~말일 수익이 다음 달 1일에 확정되고, 그달 말일에 입금된다. 성과 데이터는 매일 오전 10시 갱신.

### 광고 성과 진단 (콘솔 분석 탭, SDK 2.7.0+)
`광고 요청 → 광고 수신 → 노출 시도 → 노출 성공` 단계별 수치를 본다.
- 요청 대비 **수신**이 낮다 → No Fill(채울 광고 부족)
- 수신 대비 **노출 시도**가 낮다 → `load`/`show` 호출 타이밍 문제
- 노출 시도 대비 **성공**이 낮다 → 렌더 실패. SDK 버전·호출 순서 점검

`예상 수익 = 노출 수 × eCPM ÷ 1,000`. 노출 빈도가 올랐는데 eCPM이 떨어지면 광고 피로도를 의심한다.

## 광고 운영 정량 기준 (커뮤니티 실측)

- 광고 ID별 **일 1만 노출** 전에는 최적화가 의미 없음 — 그 이하 트래픽에서 eCPM 변동은 노이즈
- 배너는 **폴드라인에 1개만** 배치, 상하 2개 배치 비권장
- 한 지면에는 **단일 광고 ID**로 통일
- 보상형/전면형은 AdMob+토스애즈 혼합(**토스애즈 비중 5~30%**), 배너는 토스애즈 단독 권장
- **리워드 수령과 동시에 토스포인트 지급 불가(공식 확인)** — "리워드 적립 후 포인트 교환" 우회 구조 필수
- `userEarnedReward` 미발화 사례 보고 — 공홈 API에는 정의돼 있으나(상단 ShowFullScreenAdEvent union 참조) 환경에 따라 이벤트가 오지 않았다는 커뮤니티 보고가 있음. 완주 판정을 이 이벤트에만 의존하지 말고 미발화 폴백(예: 종료 이벤트 + 시청 시간)을 두고 실측 검증할 것
- 신규 광고 ID는 약 **4주 학습 기간** 필요 — 초기 eCPM 변동을 성과로 오판하지 말 것. 여러 ID를 같은 화면에서 번갈아 쓰면 학습 방해(출처: https://techchat-apps-in-toss.toss.im/t/ecpm/3926 )
- **IAA(인앱광고) 수수료 15%는 일정 미확정** — 2026-06-01 기준 수취 보류, 공지 확인 필요(수수료 15% 근거: https://techchat-apps-in-toss.toss.im/t/4-1/3171 ; 수취 보류 근거: https://techchat-apps-in-toss.toss.im/t/topic/3985 )

> 출처 (2026-06-10 수집):
> - https://techchat-apps-in-toss.toss.im/t/ecpm/3926
> - https://techchat-apps-in-toss.toss.im/t/topic/3962
> - https://techchat-apps-in-toss.toss.im/t/2-0-70/818

## UX 원칙 (Toss Principles)

- **Simplicity**: 추가 설명 없이 의미 이해 가능해야 함
- **Clear Action**: 클릭 후 발생 행동 예측 가능해야 함
- **No Deception**: 예상치 못한 순간/형태/위치에 등장 금지
- **Value First**: 사용자 서비스 목표를 방해하지 않음

---
> 갱신: 2026-08-25 공홈 대조 — 금지 행위를 토스애즈 SSP 운영 정책 5유형(UI/UX 품질 저하·호출 변조·비정상 트래픽·보상형 클릭 유도·은닉/겹침)으로 전면 재작성, 제재·이의제기 절차(30일·환수·이의제기 심사 기준), 개발 필수사항(테스트 ID·광고그룹 ID 2시간·애드몹 정책·사업자/정산 선행), 광고 성과 4단계 진단·eCPM 공식 추가. 근거: https://developers-apps-in-toss.toss.im/guide/monetization/in-app-ad
> 검증: 2026-06-07 공홈 대조 [갱신됨: 전면/리워드 광고는 loadFullScreenAd/showFullScreenAd가 공홈 정식 API → GoogleAdMob.loadAppsInTossAdMob/showAppsInTossAdMob 직접사용 섹션 및 보상형 예시를 showFullScreenAd로 교체 / ShowFullScreenAdEvent를 union 타입으로 정정하고 userEarnedReward에 data:{unitType, unitAmount} 추가 / 배너는 TossAds.initialize·attachBanner·destroyAll만 공홈 확인되어 attach()·destroy(slotId) 제거(attachBanner result.destroy 사용)] [공홈 미검증: GoogleAdMob 네임스페이스 객체·isAppsInTossAdMobLoaded는 공홈 reference 미노출이라 삭제. 테스트 ID 및 스타일 옵션(theme/tone/variant)은 공홈 일치] 근거: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/IntegratedAd.html , .../광고/BannerAd.html
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
