# Analytics API

```tsx
import { Analytics } from '@apps-in-toss/web-framework';
```

## 인터페이스

```typescript
type LoggerParams = {
  log_name?: string;
} & {
  [key: string]: string | number | boolean | null | undefined;
};

Analytics: {
  screen(params?: LoggerParams): Promise<void> | undefined;
  impression(params?: LoggerParams): Promise<void> | undefined;
  click(params?: LoggerParams): Promise<void> | undefined;
}
```

## 메서드

### screen
화면 진입 시 호출. 페이지별 조회 수를 추적합니다.

```typescript
Analytics.screen({ log_name: 'calculator_home' });
```

### impression
요소가 사용자에게 노출될 때 호출.

```typescript
Analytics.impression({
  log_name: 'result_section',
  calculator_type: 'dsr',
});
```

### click
사용자 클릭 이벤트 추적.

```typescript
Analytics.click({
  log_name: 'calculate_button',
  calculator_type: 'dsr',
  input_amount: 300000000,
});
```

## 사용 예시

```tsx
import { useEffect } from 'react';
import { Analytics } from '@apps-in-toss/web-framework';

function CalculatorPage({ type }: { type: string }) {
  // 화면 진입 로깅
  useEffect(() => {
    Analytics.screen({
      log_name: 'calculator_page',
      calculator_type: type,
    });
  }, [type]);

  const handleCalculate = () => {
    // 클릭 로깅
    Analytics.click({
      log_name: 'calculate_button',
      calculator_type: type,
    });

    // 계산 로직 실행
    calculate();
  };

  return (
    <Button onClick={handleCalculate}>계산하기</Button>
  );
}
```

## 커스텀 파라미터
`log_name` 외에 자유롭게 key-value를 추가할 수 있습니다.
값은 `string | number | boolean | null | undefined` 타입만 가능합니다.

```typescript
Analytics.click({
  log_name: 'share_result',
  calculator_type: 'transfer_tax',
  result_amount: 15000000,
  has_multiple_houses: true,
});
```
