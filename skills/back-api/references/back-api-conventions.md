# API 규약

## URL 네이밍
- 복수형 명사 사용: `/api/users`, `/api/calculations`
- kebab-case: `/api/tax-calculations`
- 중첩 리소스: `/api/users/{userId}/calculations`
- 동사 금지: ~~`/api/getUser`~~ → `/api/users/{id}`

## HTTP 메서드
| 메서드 | 용도 | 예시 |
|--------|------|------|
| `GET` | 조회 | `GET /api/users` |
| `POST` | 생성 | `POST /api/users` |
| `PUT` | 전체 수정 | `PUT /api/users/{id}` |
| `PATCH` | 부분 수정 | `PATCH /api/users/{id}` |
| `DELETE` | 삭제 | `DELETE /api/users/{id}` |

## 상태 코드
| 코드 | 의미 | 사용 |
|------|------|------|
| 200 | OK | 조회/수정 성공 |
| 201 | Created | 생성 성공 |
| 204 | No Content | 삭제 성공 |
| 400 | Bad Request | 입력 유효성 실패 |
| 401 | Unauthorized | 인증 필요 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 중복/충돌 |
| 500 | Internal Server Error | 서버 오류 |

## 에러 코드 네이밍
- UPPER_SNAKE_CASE 사용
- `{도메인}_{원인}` 형식 권장
- 예: `USER_NOT_FOUND`, `INVALID_INPUT`, `AUTH_TOKEN_EXPIRED`

## 날짜/시간
- ISO 8601 형식: `2026-03-12T11:00:00.000Z`
- 필드명: `createdAt`, `updatedAt`, `deletedAt`

## 페이지네이션
```typescript
// 요청
interface PaginationParams {
  page?: number;    // default: 1
  limit?: number;   // default: 20, max: 100
}

// 응답에 포함
interface PaginationMeta {
  total: number;    // 전체 개수
  page: number;     // 현재 페이지
  limit: number;    // 페이지 크기
}
```

## 타입 정의 원칙
- 모든 요청/응답은 TypeScript 인터페이스로 정의
- `null` 가능한 필드는 `string | null`로 명시
- optional 필드는 `?`로 표시하고 기본값 주석 추가
- 날짜는 `string` (ISO 8601)으로, 숫자 ID는 `number`로
