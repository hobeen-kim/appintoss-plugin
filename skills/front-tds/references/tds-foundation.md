# TDS 파운데이션 - 색상 & 타이포그래피 토큰

## 색상 토큰

### 패키지
```tsx
import { colors } from '@toss/tds-colors';
// 사용 예: colors.blue500, colors.grey800
```

### Grey
| 토큰 | Hex |
|------|-----|
| `colors.grey50` | #f9fafb |
| `colors.grey100` | #f2f4f6 |
| `colors.grey200` | #e5e8eb |
| `colors.grey300` | #d1d6db |
| `colors.grey400` | #b0b8c1 |
| `colors.grey500` | #8b95a1 |
| `colors.grey600` | #6b7684 |
| `colors.grey700` | #4e5968 |
| `colors.grey800` | #333d4b |
| `colors.grey900` | #191f28 |

### Blue
| 토큰 | Hex |
|------|-----|
| `colors.blue50` | #e8f3ff |
| `colors.blue100` | #c9e2ff |
| `colors.blue200` | #90c2ff |
| `colors.blue300` | #64a8ff |
| `colors.blue400` | #4593fc |
| `colors.blue500` | #3182f6 |
| `colors.blue600` | #2272eb |
| `colors.blue700` | #1b64da |
| `colors.blue800` | #1957c2 |
| `colors.blue900` | #194aa6 |

### Red
| 토큰 | Hex |
|------|-----|
| `colors.red50` | #ffeeee |
| `colors.red100` | #ffd4d6 |
| `colors.red200` | #feafb4 |
| `colors.red300` | #fb8890 |
| `colors.red400` | #f66570 |
| `colors.red500` | #f04452 |
| `colors.red600` | #e42939 |
| `colors.red700` | #d22030 |
| `colors.red800` | #bc1b2a |
| `colors.red900` | #a51926 |

### Orange
| 토큰 | Hex |
|------|-----|
| `colors.orange50` | #fff3e0 |
| `colors.orange100` | #ffe0b0 |
| `colors.orange200` | #ffcd80 |
| `colors.orange300` | #ffbd51 |
| `colors.orange400` | #ffa927 |
| `colors.orange500` | #fe9800 |
| `colors.orange600` | #fb8800 |
| `colors.orange700` | #f57800 |
| `colors.orange800` | #ed6700 |
| `colors.orange900` | #e45600 |

### Yellow
| 토큰 | Hex |
|------|-----|
| `colors.yellow50` | #fff9e7 |
| `colors.yellow100` | #ffefbf |
| `colors.yellow200` | #ffe69b |
| `colors.yellow300` | #ffdd78 |
| `colors.yellow400` | #ffd158 |
| `colors.yellow500` | #ffc342 |
| `colors.yellow600` | #ffb331 |
| `colors.yellow700` | #faa131 |
| `colors.yellow800` | #ee8f11 |
| `colors.yellow900` | #dd7d02 |

### Green
| 토큰 | Hex |
|------|-----|
| `colors.green50` | #f0faf6 |
| `colors.green100` | #aeefd5 |
| `colors.green200` | #76e4b8 |
| `colors.green300` | #3fd599 |
| `colors.green400` | #15c47e |
| `colors.green500` | #03b26c |
| `colors.green600` | #02a262 |
| `colors.green700` | #029359 |
| `colors.green800` | #028450 |
| `colors.green900` | #027648 |

### Teal
| 토큰 | Hex |
|------|-----|
| `colors.teal50` | #edf8f8 |
| `colors.teal100` | #bce9e9 |
| `colors.teal200` | #89d8d8 |
| `colors.teal300` | #58c7c7 |
| `colors.teal400` | #30b6b6 |
| `colors.teal500` | #18a5a5 |
| `colors.teal600` | #109595 |
| `colors.teal700` | #0c8585 |
| `colors.teal800` | #097575 |
| `colors.teal900` | #076565 |

### Purple
| 토큰 | Hex |
|------|-----|
| `colors.purple50` | #f9f0fc |
| `colors.purple100` | #edccf8 |
| `colors.purple200` | #da9bef |
| `colors.purple300` | #c770e4 |
| `colors.purple400` | #b44bd7 |
| `colors.purple500` | #a234c7 |
| `colors.purple600` | #9128b4 |
| `colors.purple700` | #8222a2 |
| `colors.purple800` | #73228e |
| `colors.purple900` | #65237b |

### Grey Opacity
| 토큰 | Hex | 불투명도 |
|------|-----|---------|
| `colors.greyOpacity50` | #001733 | 2% |
| `colors.greyOpacity100` | #022047 | 5% |
| `colors.greyOpacity200` | #001b37 | 10% |
| `colors.greyOpacity300` | #001d3a | 18% |
| `colors.greyOpacity400` | #001936 | 31% |
| `colors.greyOpacity500` | #031832 | 46% |
| `colors.greyOpacity600` | #00132b | 58% |
| `colors.greyOpacity700` | #031228 | 70% |
| `colors.greyOpacity800` | #000c1e | 80% |
| `colors.greyOpacity900` | #020913 | 91% |

### 시맨틱 색상 (Adaptive)

adaptive 색상은 라이트/다크 모드에 따라 자동 전환됩니다. TDS 컴포넌트의 `color` prop에서 사용합니다.

```tsx
// Paragraph, Badge 등 TDS 컴포넌트의 color prop에서 사용
color="adaptive.grey900"        // 최강조 텍스트
color="adaptive.grey800"        // 기본 텍스트
color="adaptive.grey700"        // 주요 텍스트
color="adaptive.grey600"        // 보조 텍스트
color="adaptive.grey500"        // 3차 텍스트
color="adaptive.grey400"        // 비활성 텍스트
color="adaptive.blue500"        // 주요 액션, 선택 상태, 링크
color="adaptive.red500"         // 오류, 위험
color="adaptive.green500"       // 성공
color="adaptive.orange500"      // 경고
color="adaptive.greyOpacity50"  // 매우 얇은 배경
color="adaptive.greyOpacity100" // 얇은 배경
```

### 배경색
| 이름 | Hex | 설명 |
|------|-----|------|
| `background` | #FFFFFF | 기본 흰색 배경 |
| `greyBackground` | #f2f4f6 | 회색 배경 (grey100) |
| `layeredBackground` | #FFFFFF | 레이어 배경 |
| `floatedBackground` | #FFFFFF | 부유 요소 배경 |

### colors 객체 직접 사용 (CSS/스타일)

```tsx
import { colors } from '@toss/tds-colors';

// 인라인 스타일에서 사용
<div style={{ backgroundColor: colors.blue50, color: colors.grey800 }}>
  텍스트
</div>

// ProgressBar 등 color prop에서 사용
<ProgressBar progress={0.5} size="normal" color={colors.blue500} />
```

---

## 타이포그래피 토큰

### 폰트 패밀리
```
Toss Product Sans, Tossface, SF Pro KR, SF Pro Display, SF Pro Icons,
-apple-system, BlinkMacSystemFont, Basier Square, Apple SD Gothic Neo,
Roboto, Noto Sans KR, Noto Sans, Helvetica Neue, Helvetica, Arial, sans-serif
```

### 메인 토큰 (t1~t7)
| 토큰 | Font Size | Line Height | 용도 |
|------|-----------|-------------|------|
| `t1` | 30px | 40px | 대형 제목 |
| `t2` | 26px | 35px | 주요 제목 |
| `t3` | 22px | 31px | 섹션 제목 |
| `t4` | 20px | 29px | 중간 제목, 다이얼로그 타이틀 |
| `t5` | 17px | 25.5px | 본문/레이블 |
| `t6` | 15px | 22.5px | 보조 텍스트, 설명 |
| `t7` | 13px | 19.5px | 캡션/메타/면책 |

### 서브 토큰 (st1~st13)
| 토큰 | Font Size | Line Height |
|------|-----------|-------------|
| `st1` | 29px | 38px |
| `st2` | 28px | 37px |
| `st3` | 27px | 36px |
| `st4` | 25px | 34px |
| `st5` | 24px | 33px |
| `st6` | 23px | 32px |
| `st7` | 21px | 30px |
| `st8` | 19px | 28px |
| `st9` | 18px | 27px |
| `st10` | 16px | 24px |
| `st11` | 14px | 21px |
| `st12` | 12px | 18px |
| `st13` | 11px | 16.5px |

### fontWeight
- `light` - 얇게
- `regular` - 기본
- `medium` - 중간 굵기
- `semibold` - 약간 굵게
- `bold` - 굵게

### 접근성 - 텍스트 스케일링 (iOS)
| 설정 | 배율 | t1 예시 |
|------|------|---------|
| Large (기본) | 100% | 30px |
| xLarge | 110% | 33px |
| xxLarge | 120% | 36px |
| xxxLarge | 135% | 40.5px |
| A11y_Medium | 160% | 48px |
| A11y_Large | 190% | 57px |
| A11y_xLarge | 235% | 70.5px |
| A11y_xxLarge | 275% | 82.5px |
| A11y_xxxLarge | 310% | 93px |

Android 공식: `Base × NN% × 0.01` (최대 310%)

---
> 검증: 2026-06-07 공홈 대조 [갱신됨: fontWeight에 light 추가 / 색상·타이포 t1~t7 토큰 일치]
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
