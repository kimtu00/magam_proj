# Supabase Migrations

이 디렉토리는 Supabase 데이터베이스 마이그레이션 파일을 포함합니다.

## 마이그레이션 파일 목록

### 활성 마이그레이션 (타임스탬프 순서)

1. **20260106141956_create_lastchance_schema.sql**
   - 메인 스키마 생성
   - 테이블: profiles, stores, products, orders
   - ENUM: user_role, product_status, order_status
   - 함수: reserve_product()
   - 기본 인덱스 및 RLS 정책

2. **20260106150000_create_products_storage.sql**
   - products 스토리지 버킷 생성
   - 상품 이미지 업로드용 (공개 버킷)
   - RLS 정책 설정

3. **20260121000000_drop_legacy_users_table.sql**
   - 레거시 users 테이블 삭제
   - profiles 테이블로 완전 대체

4. **20260121000100_add_missing_indexes.sql**
   - 성능 최적화 인덱스 추가
   - orders.created_at, products.created_at, products.pickup_deadline
   - 복합 인덱스: products(status, pickup_deadline)

5. **20260121000200_verify_foreign_keys.sql**
   - 외래키 제약조건 확인
   - ON DELETE CASCADE 검증

6. **20260121000300_verify_schema.sql**
   - 전체 스키마 검증 쿼리
   - 테이블, 인덱스, 외래키, ENUM, 함수, Storage 버킷 확인

### 참고용 파일 (실행 안 함)

- **setup_schema.sql.deprecated**
  - 레거시 users 테이블 마이그레이션 (더 이상 사용 안 함)
  - profiles 테이블로 대체됨

- **DB.sql.reference**
  - 초기 스키마 설계 문서 (참고용)
  - 실제 마이그레이션은 20260106141956_create_lastchance_schema.sql 사용

- **setup_storage.sql**
  - uploads 버킷 생성 (일반 파일 업로드용)
  - 개발 초기 테스트용으로 생성됨

### 예제 파일 (학습용)

- **20250101000000_example_rls_policies.sql**
  - RLS 정책 예제

- **20250101000001_create_instruments_example.sql**
  - 테이블 생성 예제

## 마이그레이션 실행 순서

마이그레이션은 파일명의 타임스탬프 순서대로 자동 실행됩니다:

```
YYYYMMDDHHmmss_description.sql
```

## 새 마이그레이션 생성 방법

```bash
# Supabase CLI 사용
supabase migration new <description>

# 예시
supabase migration new add_user_preferences_table
```

## 마이그레이션 적용

```bash
# 로컬 개발 환경
supabase db reset

# 프로덕션 (Supabase Dashboard에서 자동 실행)
# 또는 CLI로 직접 실행
supabase db push
```

## 주의사항

1. **타임스탬프 파일만 실행됨**
   - `.deprecated`, `.reference` 확장자는 무시됨
   - 예제 파일은 학습용으로만 사용

2. **마이그레이션 순서 중요**
   - 의존성이 있는 마이그레이션은 순서대로 실행
   - 외래키, 인덱스는 테이블 생성 후에 추가

3. **롤백 불가**
   - Supabase는 자동 롤백을 지원하지 않음
   - 롤백이 필요하면 새 마이그레이션 파일 생성

4. **프로덕션 배포 전 테스트**
   - 로컬 환경에서 충분히 테스트
   - `supabase db reset`으로 전체 마이그레이션 재실행 확인

## 현재 스키마 상태

### 테이블 (4개)
- profiles (사용자 정보)
- stores (가게 정보)
- products (상품 정보)
- orders (주문 내역)

### ENUM 타입 (3개)
- user_role (BUYER, SELLER)
- product_status (AVAILABLE, RESERVED, SOLD)
- order_status (RESERVED, COMPLETED, CANCELED)

### Storage 버킷 (2개)
- uploads (일반 파일)
- products (상품 이미지)

### 함수 (1개)
- reserve_product(product_id, buyer_id)

### 인덱스 (11개)
- 기본 인덱스 (7개)
- 성능 최적화 인덱스 (4개)

## 문제 해결

### 마이그레이션 실패 시

1. 에러 메시지 확인
2. 로컬 DB 리셋: `supabase db reset`
3. 문제가 되는 마이그레이션 파일 수정
4. 다시 실행

### 스키마 검증

```sql
-- 20260121000300_verify_schema.sql 실행
-- 모든 테이블, 인덱스, 외래키, ENUM 확인
```

## 참고 문서

- [Supabase Migrations 공식 문서](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL 마이그레이션 가이드](https://www.postgresql.org/docs/current/ddl.html)
- 프로젝트 PRD: `docs/PRD.md`
- 아키텍처 리뷰: `docs/architecture-review.md`


