# 앱 썸네일/배너 컴포지션 (1932×828)

**스크린샷·폰 목업을 넣지 않는다.** 대신 **창의적인 브랜드 그래픽**으로 시선을 끈다 — 추상 도형·패턴·떠다니는 요소·큰 타이포·깊이감(레이어·그림자)을 조합한다. 화면 캡처는 "화면 예시"가 담당하므로 배너는 브랜드 무드 전달에 집중한다.

**텍스트는 선택이다 — 필요할 때만 넣는다.** "앱명 + 한 줄 카피"가 필수 전제가 아니다. 비주얼(모티프·그래픽)만으로 앱의 정체성이 충분히 전달되면 텍스트 없이 만든다. 불필요한 카피 강제 금지. 텍스트를 넣기로 했다면 짧게(키워드 1개~한 줄) 유지하고 배경과 충분한 대비를 확보한다.

## 팔레트 — 토스블루 기본 사용 금지

**토스블루(#3182f6) 그라데이션을 기본값으로 쓰지 말 것.** 주조색은 앱 도메인·무드에서 도출한다 — 절약/금융이라도 청록·딥그린 등이 가능하고, 운세=퍼플, 건강=그린, 음식=웜톤 등 앱마다 달라야 한다. granite primaryColor가 실제로 토스블루일 때만 토스블루를 사용한다. 액센트 컬러도 앱별로 새로 정한다.

## 컴포지션 아키타입 (앱마다 다른 것을 고른다)

아래 4종 중 앱 무드에 맞는 하나를 고른다. **직전 앱과 같은 아키타입 재사용 금지.**

- **(a) 풀블리드 대형 모티프 (텍스트 0)** — 앱 핵심 메타포를 화면을 꽉 채우는 초대형 그래픽으로. 일부는 블리드로 잘리게. 텍스트 없음.
- **(b) 중앙 심볼 + 반복 패턴** — 중앙에 심볼 1개, 배경에 앱 모티프의 반복 패턴(아이콘 타일·기하 패턴). 텍스트 없거나 키워드 1개.
- **(c) 비대칭 카피 + 그래픽** — 좌측/대각선 카피 + 반대편 그래픽 클러스터(기존 예시형). 카피가 정말 필요한 앱에만.
- **(d) 큰 타이포 only** — 후킹 키워드/수치를 초대형 타이포 자체가 그래픽이 되도록. 장식은 최소.

## 창의성 원칙 (단조로움 금지)

단순 그라데이션 배경 + 중앙 텍스트만 있는 배너는 **금지**. 아래 중 **최소 2가지 이상**을 적용해 깊이와 동세를 만든다:

1. **비대칭 레이아웃** — 카피를 좌측/대각선에 배치하고 반대편에 그래픽 클러스터를 둔다 (정중앙 정렬 지양).
2. **장식 그래픽** — 앱 컨셉을 상징하는 추상 도형(원·블롭·기하 패턴)을 크게 배치, 일부는 화면 밖으로 잘리게(블리드) 동세 부여.
3. **떠다니는 요소** — 앱 핵심을 상징하는 칩/뱃지/카드/이모지를 회전·그림자와 함께 흩뿌려 입체감(예: 가계부 → 동전·영수증·₩ 칩, 운세 → 별·카드).
4. **큰 수치/키워드 강조** — 앱의 후킹 포인트를 초대형 타이포로 (예: "1초 정산", "매일 +1").
5. **깊이감** — 반투명 레이어, blur 원, 그림자, 살짝 회전으로 평면 탈피.
6. **브랜드 컬러 변주** — 단색 대신 그라데이션 + 액센트 컬러 1개로 포인트.

앱 무드에 맞게 디자이너가 조합을 선택한다. 텍스트는 선택 — 넣는다면 짧게, 배경과 충분한 대비 확보.

## HTML + CSS 템플릿 (아키타입 (c)의 한 예시 — 비대칭 + 떠다니는 그래픽 + blur 깊이)

`thumbnail.html`로 저장한다. 아래는 4종 아키타입 중 **(c) 하나의 예시일 뿐**이다 — 이 구도를 기본값으로 복사하지 말고 앱에 맞는 아키타입을 먼저 고른다. 컬러는 앱 팔레트로(토스블루 기본 금지), 도형·카피·심볼은 앱 컨셉에 맞게 교체한다.

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <style>
    :root {
      --brand: #3182f6;     /* primaryColor */
      --brand-2: #1b64da;   /* 그라데이션 종점 */
      --accent: #ffd54a;    /* 포인트 액센트 */
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 1932px; height: 828px; }
    .thumb {
      position: relative;
      width: 1932px; height: 828px;
      overflow: hidden;
      background: linear-gradient(120deg, var(--brand) 0%, var(--brand-2) 100%);
      font-family: -apple-system, "Toss Product Sans", "Apple SD Gothic Neo", sans-serif;
      color: #fff;
    }
    /* 깊이용 blur 원 — 화면 밖으로 블리드 */
    .blob {
      position: absolute; border-radius: 50%;
      filter: blur(8px); opacity: 0.5;
    }
    .blob.a { width: 720px; height: 720px; right: -160px; top: -200px;
      background: radial-gradient(circle, var(--accent) 0%, transparent 70%); opacity: 0.35; filter: blur(40px); }
    .blob.b { width: 520px; height: 520px; right: 380px; bottom: -240px;
      background: radial-gradient(circle, #ffffff 0%, transparent 70%); opacity: 0.18; filter: blur(60px); }
    /* 기하 패턴 — 점선 그리드 또는 라인 (은은하게) */
    .grid {
      position: absolute; inset: 0; opacity: 0.10;
      background-image: radial-gradient(#fff 2px, transparent 2px);
      background-size: 56px 56px;
    }
    /* 좌측 카피 (비대칭) */
    .copy { position: absolute; left: 140px; top: 50%; transform: translateY(-50%); max-width: 1000px; }
    .badge {
      display: inline-block; padding: 14px 32px; border-radius: 999px;
      background: rgba(255,255,255,0.18); backdrop-filter: blur(4px);
      font-size: 34px; font-weight: 600; margin-bottom: 32px;
    }
    .app-name { font-size: 132px; font-weight: 800; line-height: 1.02; letter-spacing: -0.03em; }
    .tagline { margin-top: 28px; font-size: 46px; font-weight: 500; opacity: 0.94; }
    .accent-word { color: var(--accent); }
    /* 우측 떠다니는 칩 클러스터 — 앱 컨셉 상징 (이모지/심볼 교체) */
    .cluster { position: absolute; right: 150px; top: 50%; transform: translateY(-50%); width: 560px; height: 560px; }
    .chip {
      position: absolute; display: flex; align-items: center; justify-content: center;
      background: #fff; border-radius: 44px; box-shadow: 0 30px 60px rgba(0,0,0,0.22);
      font-size: 120px;
    }
    .chip.c1 { width: 280px; height: 280px; left: 120px; top: 40px; transform: rotate(-8deg); }
    .chip.c2 { width: 200px; height: 200px; left: 8px;  top: 280px; transform: rotate(7deg); background: var(--accent); }
    .chip.c3 { width: 180px; height: 180px; left: 360px; top: 320px; transform: rotate(-12deg); }
  </style>
</head>
<body>
  <div class="thumb">
    <div class="grid"></div>
    <div class="blob a"></div>
    <div class="blob b"></div>

    <div class="copy">
      <span class="badge">배지/카테고리</span>
      <div class="app-name">앱 이름</div>
      <div class="tagline"><span class="accent-word">핵심 키워드</span> 한 줄 소개</div>
    </div>

    <!-- 앱 컨셉 상징 — 이모지/심볼/도형으로 교체 (예: 가계부 💰🧾📊) -->
    <div class="cluster">
      <div class="chip c1">💰</div>
      <div class="chip c2">🧾</div>
      <div class="chip c3">📊</div>
    </div>
  </div>
</body>
</html>
```

> 위는 한 예시다. 앱 무드가 차분하면 칩 클러스터 대신 큰 추상 도형 1개 + 큰 수치 타이포로, 활발하면 칩을 더 흩뿌리는 식으로 변주한다. 텍스트가 불필요하면 (a)/(b) 아키타입으로 비주얼-only로 만든다. 핵심은 "창의성 원칙" 중 2가지 이상 적용 + 직전 앱과 다른 아키타입.

## Playwright 캡처 스니펫

```js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1932, height: 828 },
    deviceScaleFactor: 1, // 1932px viewport에서 1배 = 1932×828
  });
  await page.goto('file://' + require('path').resolve('thumbnail.html'), {
    waitUntil: 'networkidle',
  });
  await page.evaluate(() => document.fonts.ready); // 폰트 로딩 대기
  await page.locator('.thumb').screenshot({ path: 'docs/assets/thumbnail.png' });
  await browser.close();
})();
```

캡처 후 실측 검증:

```bash
sips -g pixelWidth -g pixelHeight docs/assets/thumbnail.png   # 1932 × 828 확인
```
