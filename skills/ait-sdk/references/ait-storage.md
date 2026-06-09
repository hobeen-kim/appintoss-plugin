# Storage (네이티브 저장소)

```tsx
import { Storage } from '@apps-in-toss/web-framework';
```

## 설명
네이티브 로컬 저장소에 접근하는 API. 앱 재시작 후에도 데이터가 유지됩니다.
모든 메서드는 Promise를 반환합니다.

## 메서드

### getItem
```typescript
Storage.getItem(key: string): Promise<string | null>
```

### setItem
```typescript
Storage.setItem(key: string, value: string): Promise<void>
```

### removeItem
```typescript
Storage.removeItem(key: string): Promise<void>
```

### clearItems
```typescript
Storage.clearItems(): Promise<void>
```

## 사용 예시

```tsx
import { Storage } from '@apps-in-toss/web-framework';

// 데이터 저장
await Storage.setItem('lastCalcResult', JSON.stringify(result));

// 데이터 읽기
const saved = await Storage.getItem('lastCalcResult');
if (saved) {
  const result = JSON.parse(saved);
}

// 데이터 삭제
await Storage.removeItem('lastCalcResult');

// 전체 삭제
await Storage.clearItems();
```

## 주의사항
- 값은 문자열만 저장 가능 → 객체는 `JSON.stringify()` / `JSON.parse()` 사용
- 웹 브라우저 환경에서는 localStorage로 폴백될 수 있음
- 토스 앱 환경에서는 AsyncStorage 사용 불가 (공홈 명시)
- 앱 삭제 시 데이터 삭제됨 → 영속 데이터는 자체 서버 연동 필요

---
> 검증: 2026-06-07 공홈 대조 [일치: Storage.getItem/setItem/removeItem/clearItems 시그니처·반환 타입(Promise)·import @apps-in-toss/web-framework 모두 공홈 일치] 근거: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/저장소/Storage.html
> 이 문서가 stale일 수 있다. 불확실하면 공홈 조회: https://developers-apps-in-toss.toss.im/
