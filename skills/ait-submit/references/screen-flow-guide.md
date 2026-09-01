# screen-flow-guide — 화면 흐름도 제작 표준 (미니앱용)

APP-SPEC.md에 임베드하는 **화면 흐름도**(`docs/screen-flow.png`)의 스타일·제작 절차 단일 출처.

> 원 표준: `appintoss-business` 플러그인 `skills/doc-design/flow-guide.md`(의뢰인 발송 문서용).
> 여기서는 **미니앱 파이프라인용으로 적응**했다 — 문서번호·발송본 등재 절차를 제거하고,
> Phase 3에서 이미 확보한 **실촬 스크린샷(`qa-screens/`)을 프레임에 넣는 모드**를 기본으로 삼는다.

---

## ① 원칙

화면 흐름도는 **실기기 목업 캔버스** 방식으로 만든다. 기준 해상도 프레임에 실제 화면을 넣고
축소 배치한 뒤, 화살표로 화면 간 이동을 연결한다.

**추상 노드 박스 순서도(START/S01 같은 사각 박스 + 화살표 + 별도 설명 표)는 화면 흐름도로
인정하지 않는다.** 실제 화면 모습이 없는 순서도로는 "이 버튼을 누르면 이 화면으로 넘어가는구나"를
눈으로 확인할 수 없다.

**두 가지 모드**

| 모드 | 언제 | 프레임 내용 |
|---|---|---|
| **A. 실촬(기본)** | Phase 3 비주얼 검증을 마쳐 `qa-screens/`에 스크린샷이 있을 때 | `<img src="../qa-screens/{화면}.png">` 를 프레임에 채운다 — 손으로 다시 그리지 않는다 |
| **B. 목업** | 스크린샷이 아직 없을 때(기획 단계 문서 등) | 기준 해상도 기준으로 `.frame` 안에 실제 UI 요소(헤더·카드·버튼·탭바)를 직접 그린다 |

**모드 A를 우선한다.** 실촬 이미지가 이미 있는데 목업을 새로 그리는 것은 중복 작업이고,
실제 구현과 어긋날 위험이 있다.

---

## ② 필수 스타일 규칙

| 규칙 | 내용 |
|---|---|
| 단일 페이지 캔버스 | `@page{size:{W}px {H}px;margin:0}` — 표지 없이 **내용 전체 크기에 맞춘 커스텀 캔버스 1장**. A4 다쪽 문서가 아니다 |
| 화면 프레임 | `DESIGN.md`에 명시한 **기준 논리 해상도**(세로형 360×640~420×740 중 택1, `knowledge/toss-ux-writing.md` 3절)로 그린 뒤 `.frame`에 `transform:scale(...)` 축소(`transform-origin:top left`), 둥근 모서리·그림자 적용 |
| 배치 | `.slot{position:absolute}` 절대 좌표. **기능 그룹별로 세로 레인**을 만들고 레인 상단에 그룹 헤더(`.col-t`)를 둔다 |
| 캡션 | 프레임 아래 `A1. 화면명` + 1줄 설명(`.cap` + `.cap .sub`). **코드(A1·B2…)는 APP-SPEC「앱 내 기능 — 상세」표의 행과 1:1로 맞춘다** |
| 연결선 | 기본 흐름(보라 실선) / 예외·실패(주황 점선) / 부가 이동(회색 점선). 캔버스 우상단에 범례 표기 |
| 딥링크 표기 | 콘솔에 등록하는 기능(최대 3개)에 해당하는 화면에는 `intoss://{appName}/경로` 배지를 단다 — 검수 시 "URL 미접속" 반려를 사전 점검할 수 있다 |
| 색 | 프레임 **내부는 앱의 실제 디자인 색**을 그대로 둔다. 범례·레인 헤더·타이틀 등 문서 요소에만 중립 색을 쓴다 |
| 서체 | 시스템 폰트 폴백 우선(`-apple-system`). 웹폰트는 CDN 차단 환경에서 tofu가 되므로 필수 요소에 쓰지 않는다 |

---

## ③ 골격 HTML/CSS

`{...}` 자리만 채우고 `.slot`을 화면 수만큼 복제한다.

```html
<meta charset="utf-8"><title>{앱이름} — 화면 흐름도</title><style>
  @page{size:{W}px {H}px;margin:0}
  html,body{overflow:hidden}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,'Apple SD Gothic Neo','SF Pro Text',system-ui,sans-serif;
    background:#EEF0F4;color:#111827;-webkit-font-smoothing:antialiased}

  .page{position:relative;width:{W}px;height:{H}px;background:#EEF0F4}
  h1{position:absolute;left:56px;top:36px;font-size:26px;font-weight:800;letter-spacing:-.8px}
  h1 span{display:block;font-size:13.5px;font-weight:500;color:#6B7280;margin-top:7px;letter-spacing:0}

  /* 화면 슬롯 · 기준 해상도 프레임 */
  .slot{position:absolute}
  .frame{position:relative;width:{FW}px;height:{FH}px;border-radius:26px;overflow:hidden;
    background:#F9FAFB;box-shadow:0 6px 24px rgba(17,24,39,.13);transform-origin:top left}
  .frame img{width:100%;height:100%;object-fit:cover;display:block}  /* 모드 A: 실촬 스크린샷 */

  /* 캡션(코드 + 1줄 설명) */
  .cap{position:absolute;font-size:13px;font-weight:700;color:#374151;letter-spacing:-.2px}
  .cap .sub{display:block;font-size:11px;font-weight:500;color:#9CA3AF;margin-top:2px}

  /* 레인(그룹) 헤더 · 배경 */
  .col-t{position:absolute;font-size:15px;font-weight:800;color:#fff;padding:7px 16px;
    border-radius:999px;letter-spacing:-.3px;box-shadow:0 2px 8px rgba(79,70,229,.3)}
  .grp{position:absolute;border:2px dashed #C7D2FE;border-radius:22px;background:rgba(199,210,254,.13)}

  /* 배지 — 딥링크 등록 화면 / 상태 표시 */
  .pin{position:absolute;font-size:11px;font-weight:800;letter-spacing:-.2px;padding:4px 10px;
    border-radius:99px;z-index:5;box-shadow:0 2px 6px rgba(15,23,42,.13);
    background:#111827;color:#fff}

  /* 연결선 */
  svg.wires{position:absolute;inset:0;pointer-events:none;overflow:visible}
  svg.wires path{fill:none;stroke:#8B5CF6;stroke-width:2.4}
  svg.wires .alt{stroke:#F59E0B;stroke-dasharray:7 5}
  svg.wires .gray{stroke:#9CA3AF;stroke-dasharray:4 4;stroke-width:2}

  /* 연결선 위 라벨(전환 조건) */
  .lbl{position:absolute;font-size:11.5px;font-weight:700;color:#5B21B6;background:#fff;
    padding:3px 8px;border-radius:6px;border:1px solid #DDD6FE;white-space:nowrap}
  .lbl.mid{transform:translate(-50%,-50%)}
</style>

<div class="page">
  <h1>{앱이름} · 화면 흐름도
    <span>기능 그룹별로 위에서 아래로 진행합니다.</span></h1>

  <!-- 범례: 우상단 -->
  <div style="position:absolute;right:56px;top:44px;display:flex;gap:20px;font-size:12.5px;color:#4B5563;align-items:center">
    <span style="display:flex;align-items:center;gap:7px"><span style="width:26px;height:2.6px;background:#8B5CF6;display:inline-block"></span>기본 흐름</span>
    <span style="display:flex;align-items:center;gap:7px"><span style="width:26px;height:0;border-top:2.6px dashed #F59E0B;display:inline-block"></span>예외 · 실패</span>
    <span style="display:flex;align-items:center;gap:7px"><span style="width:26px;height:0;border-top:2px dashed #9CA3AF;display:inline-block"></span>부가 이동</span>
  </div>

  <!-- 레인(기능 그룹) -->
  <div class="grp" style="left:38px;top:130px;width:238px;height:1050px"></div>
  <div class="col-t" style="left:38px;top:88px;background:#4F46E5">{그룹명}</div>

  <!-- 화면 슬롯 (모드 A: 실촬) -->
  <div class="slot" style="left:56px;top:150px;width:202px;height:438px">
    <div class="frame" style="transform:scale({SCALE})">
      <img src="../qa-screens/{화면파일}.png" alt="{화면명}">
    </div>
    <div class="pin" style="left:8px;top:8px">intoss://{appName}/</div>   <!-- 딥링크 등록 화면만 -->
  </div>
  <div class="cap" style="left:56px;top:599px;width:202px">A1. {화면명}<span class="sub">{1줄 설명}</span></div>

  <!-- 연결선 -->
  <svg class="wires">
    <defs>
      <marker id="arp" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#8B5CF6"/></marker>
      <marker id="aralt" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#F59E0B"/></marker>
      <marker id="argray" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#9CA3AF"/></marker>
    </defs>
    <path d="M157,618 L157,672" marker-end="url(#arp)"/>          <!-- 기본 흐름 -->
    <!-- 예외·실패: class="alt" marker-end="url(#aralt)" / 부가 이동: class="gray" marker-end="url(#argray)" -->
  </svg>
  <div class="lbl mid" style="left:157px;top:645px">{전환 조건}</div>
</div>
```

- `{FW}×{FH}` = 기준 논리 해상도(예: 390×740). `{SCALE}` = 슬롯 폭 ÷ `{FW}`(예: 202/390 ≈ 0.52).
- 모드 B는 `<img>` 대신 `.frame` 안에 UI 요소를 직접 마크업한다.

---

## ④ 제작 절차

1. **화면 목록을 APP-SPEC「앱 내 기능 — 상세」표에서 가져온다.** 표에 없는 화면을 흐름도에만
   그리지 않는다 — 두 산출물의 화면 집합은 일치해야 한다.
2. 골격을 `docs/screen-flow.html`로 복사하고 `{W}` `{H}` `{앱이름}` `{FW}` `{FH}` 를 채운다.
3. 기능 그룹별로 레인(x축), 같은 레인 내 순서별로 슬롯(y축)을 배치한다. 화면이 늘면
   `.page` height와 `@page size` 세로값을 함께 늘린다 — **단일 캔버스라 넘침 개념이 없다.**
4. 연결선을 그린다. **기본 흐름 외에 예외·실패 경로를 최소 1개는 표기한다** — 오류·미로그인·
   결제 실패 같은 분기가 없는 앱은 거의 없다.
5. `node skills/ait-submit/scripts/render-flow.cjs docs/screen-flow.html` 로 PNG를 뽑는다.
6. `docs/APP-SPEC.md`「화면 흐름도」섹션에 `![screen-flow](screen-flow.png)` 로 임베드한다.

**자가 점검**
- [ ] 프레임 안이 비어 있지 않다(실촬 또는 목업이 채워져 있다)
- [ ] 캡션 코드가 APP-SPEC「앱 내 기능 — 상세」표와 1:1 대응한다
- [ ] 콘솔 등록 딥링크 화면에 배지가 있다
- [ ] 예외·실패 경로가 1개 이상 있다
- [ ] PNG가 잘리지 않았다(캔버스 높이 부족 여부 확인)

---

## ⑤ 제출 에셋(화면 예시)과의 관계

`docs/assets/screenshot-1~3.png`(콘솔 제출용 화면 예시)는 **스토어 노출용 대표 화면**이고,
화면 흐름도는 **전 화면의 연결 지도**다. 서로 대체하지 않으며 용도가 다르다.
흐름도는 콘솔에 업로드하지 않는다 — APP-SPEC 내부 문서 자산이다.
