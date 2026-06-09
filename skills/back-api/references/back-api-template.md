# API.md 템플릿

## 전체 문서 구조

```markdown
# API 명세

## Base URL
- 개발: `http://localhost:{port}/api`
- 운영: `https://{domain}/api`

## 인증
{인증 방식 설명 (Bearer Token, Session 등)}

## 공통 응답 형식

### 성공
​```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
}
​```

### 에러
​```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;        // 에러 코드 (예: "INVALID_INPUT")
    message: string;     // 사용자 표시용 메시지
  };
}
​```

## 엔드포인트

### [카테고리명]

#### [동작 설명]
- **Method**: `GET` | `POST` | `PUT` | `PATCH` | `DELETE`
- **Path**: `/api/...`
- **설명**: 이 엔드포인트가 하는 일

**Request**
​```typescript
// Query Parameters (GET인 경우)
interface GetSomethingParams {
  id: string;
  page?: number;       // default: 1
  limit?: number;      // default: 20
}

// Request Body (POST/PUT인 경우)
interface CreateSomethingRequest {
  name: string;        // required - 이름
  description?: string; // optional - 설명
}
​```

**Response**
​```typescript
interface Something {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}

// 200 OK
type CreateSomethingResponse = SuccessResponse<Something>;

// 목록인 경우
interface SomethingListData {
  items: Something[];
  total: number;
  page: number;
  limit: number;
}
type GetSomethingListResponse = SuccessResponse<SomethingListData>;
​```

**에러**
| 상태 코드 | 에러 코드 | 설명 |
|----------|----------|------|
| 400 | INVALID_INPUT | 입력값 유효성 검증 실패 |
| 404 | NOT_FOUND | 리소스 없음 |
| 500 | INTERNAL_ERROR | 서버 내부 오류 |
```

## 엔드포인트별 체크리스트
- [ ] Method, Path 명시
- [ ] Request 타입 (params/body) TypeScript 인터페이스로 정의
- [ ] Response 타입 TypeScript 인터페이스로 정의
- [ ] 각 필드에 required/optional, 기본값, 설명 포함
- [ ] 에러 케이스별 상태 코드 + 에러 코드 명시
