# Asset (아이콘/이미지/로티/비디오)

```tsx
import { Asset } from '@toss/tds-mobile';
```

## 구조
Asset은 3가지 핵심 요소로 구성:
1. **Frame** - 일관된 크기/스타일 프레임워크
2. **Content** - 실제 미디어 (아이콘, 이미지, 비디오, 텍스트, Lottie)
3. **Union** - 부가 정보 (overlap, acc)

## Asset.Icon

```typescript
interface IconProps {
  name: string;              // required - 아이콘 이름
  size?: "xs" | "s" | "m" | "l" | "xl";
  color?: string;            // 예: "green", "red", "blue", "adaptive.blue500"
  frameShape?: FrameShape;
  backgroundColor?: string;
}
```

## Asset.Image

```typescript
interface ImageProps {
  src: string;               // required
  scaleType?: 'fit' | 'crop'; // default: 'fit'
  alt?: string;
  frameShape?: FrameShape;
}
```

## Asset.Lottie

```typescript
interface LottieProps {
  src: string;               // required - 로티 파일 URL
  scaleType?: 'fit' | 'crop';
  frameShape?: FrameShape;
}
```

## Asset.Video

```typescript
interface VideoProps {
  src: string;               // required
  autoPlay?: boolean;        // default: true
  loop?: boolean;            // default: true
  muted?: boolean;           // default: true
  controls?: boolean;        // default: false
  playsInline?: boolean;     // default: true
  frameShape?: FrameShape;
}
```

## Asset.Text
텍스트 콘텐츠 표시.

## Asset.ContentImage
액세서리용 이미지 콘텐츠.

## Frame Props (Asset 공통)

```typescript
{
  frameShape: FrameShape;              // required - 프리셋 또는 커스텀 {width, height}
  backgroundColor?: string;           // default: "adaptive.grey100"
  acc?: React.ReactNode;              // 액세서리 (뱃지/상태 표시)
  accPosition?: "bottom-right" | "top-left" | "top-right" | "bottom-left";
  accMasking?: "circle" | "none";
  overlap?: { color: string };        // 겹침 효과
  color?: string;                     // 콘텐츠 색상 (아이콘용)
  scale?: number;                     // 콘텐츠 스케일
}
```

## frameShape 프리셋

```tsx
// Square
Asset.frameShape.SquareSmall
Asset.frameShape.SquareMedium
Asset.frameShape.SquareLarge

// Rectangle
Asset.frameShape.RectangleMedium
Asset.frameShape.RectangleLarge

// Circle
Asset.frameShape.CircleSmall
Asset.frameShape.CircleMedium
Asset.frameShape.CircleLarge

// Card
Asset.frameShape.CardSmall
Asset.frameShape.CardMedium
Asset.frameShape.CardLarge

// Clean
Asset.frameShape.CleanH60

// 커스텀
{ width: 48, height: 48, radius: 12 }
```

## 사용 예시

```tsx
// 아이콘
<Asset.Icon name="house-line" />
<Asset.Icon name="house-line" color="adaptive.blue500" />
<Asset.Icon name="icon-arrow-down-mono" size="s" />
<Asset.Icon name="icon-arrow-up-mono" size="s" />

// 이미지
<Asset.Image src="https://example.com/image.png" alt="설명" />
<Asset.Image src="url" scaleType="crop" frameShape={Asset.frameShape.SquareMedium} />

// 로티
<Asset.Lottie src="https://example.com/animation.json" />

// 비디오
<Asset.Video src="video.mp4" controls autoPlay loop />

// 액세서리 (뱃지)
<Asset.Icon
  name="bank-toss"
  frameShape={Asset.frameShape.CircleMedium}
  acc={<Asset.ContentImage src="badge.png" />}
  accPosition="bottom-right"
/>

// overlap 효과
<Asset.Icon
  name="icon-name"
  frameShape={Asset.frameShape.SquareMedium}
  overlap={{ color: "blue" }}
/>
```

## 프로젝트 사용 패턴
- `icon-arrow-down-mono` / `icon-arrow-up-mono` - 계산 과정 토글 아이콘
- `Result` 컴포넌트의 figure에 `Asset.Image` 사용

---
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/ (컴포넌트 상세: https://tossmini-docs.toss.im/tds-mobile/components/)
