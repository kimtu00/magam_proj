# Phase 3-3: 예약 시스템 (Reservation) 개발 구현

**작업 일시:** 2026-01-06  
**작업 유형:** 기능 구현 (Implementation)  
**관련 Phase:** Phase 3 - 사용자(학생) 기능 개발 (Demand Side)

---

## 작업 개요

Phase 3-3 예약 시스템(Reservation) 개발을 완료했습니다. 학생이 메인 피드에서 상품을 클릭하여 상세 페이지로 이동하고, 예약 버튼을 클릭하여 상품을 예약할 수 있는 기능을 구현했습니다.

---

## 구현 완료 항목

### 1. 상품 상세 조회 Server Action 구현 ✅

**파일**: `app/buyer/actions.ts` (기존 파일 수정)

**구현 내용**:
- `getProductById(productId: string)` 함수 구현
- products 테이블과 stores 테이블 조인하여 가게 정보 포함
- 반환 타입: `ProductDetailData` (ProductData + store 정보)
- 타입 정의:
  - `StoreData`: 가게 정보 타입
  - `ProductDetailData`: 상품 상세 정보 타입 (가게 정보 포함)
- 에러 처리 (상품이 없을 때 null 반환)
- PGRST116 에러 코드 처리 (상품 없음)

### 2. 예약 Server Action 구현 ✅

**파일**: `app/buyer/actions.ts` (기존 파일 수정)

**구현 내용**:
- `reserveProduct(productId: string)` 함수 구현
- Clerk 인증 확인 (`auth().userId`)
- Supabase RPC 호출: `supabase.rpc('reserve_product', { p_product_id, p_buyer_id })`
- 반환 타입: `ReserveProductResult` (`{ success: boolean; message?: string; order_id?: string }`)
- 에러 처리 및 검증
- 경로 revalidate 처리:
  - `revalidatePath('/buyer')`
  - `revalidatePath('/buyer/product/[id]')`
- RPC 함수 응답 파싱 (JSON 형태)

### 3. 예약 버튼 컴포넌트 구현 ✅

**파일**: `components/product/reserve-button.tsx` (신규 생성)

**구현 내용**:
- 클라이언트 컴포넌트 (`'use client'`)
- `reserveProduct` Server Action 호출
- 로딩 상태 관리:
  - 버튼 비활성화 (`disabled` prop)
  - 로딩 스피너 표시 (Loader2 아이콘)
  - "예약 중..." 텍스트 표시
- 예약 성공 시 성공 팝업 표시 (`ReservationSuccessDialog`)
- 예약 실패 시 에러 메시지 표시
- 상태 관리:
  - `isLoading`: 로딩 상태
  - `isSuccessDialogOpen`: 성공 팝업 표시 여부
  - `orderId`: 주문 ID
  - `errorMessage`: 에러 메시지

### 4. 예약 성공 팝업 구현 ✅

**파일**: `components/product/reservation-success-dialog.tsx` (신규 생성)

**구현 내용**:
- shadcn/ui Dialog 컴포넌트 사용
- 예약 성공 메시지 표시 ("예약 완료!")
- 주문 ID 표시 (선택)
- "내 예약 확인하기" 버튼
- 버튼 클릭 시 다이얼로그 닫기 및 `/buyer/reservations`로 리다이렉트
- `useRouter` 훅 사용
- Mobile-First 디자인 (max-width: 430px)

### 5. 상품 상세 페이지 구현 ✅

**파일**: `app/buyer/product/[id]/page.tsx` (신규 생성)

**구현 내용**:
- Server Component로 구현
- Next.js 15 async `params` 패턴 사용
- 동적 라우트 `[id]`를 사용하여 상품 ID로 상품 정보 조회
- 상품 정보 표시:
  - 이미지 (큰 사이즈, 전체 너비, aspect-ratio 4:3)
  - 할인율 배지 (우상단, 빨간색)
  - 바로 섭취 뱃지 (좌상단, 파란색)
  - 상태 뱃지 (예약됨/판매완료, 하단 중앙)
  - 상품명 (큰 폰트)
  - 가격 정보 (정가/할인가, 취소선)
  - 픽업 마감 시간 (카드 형태)
  - 가게 정보 (카드 형태: 가게명, 주소, 전화번호)
- 상품 상태 표시 (AVAILABLE/RESERVED/SOLD)
- 예약 버튼:
  - 하단 고정 (`fixed bottom-20`)
  - 상태가 AVAILABLE일 때만 활성화
  - 비활성화 상태일 때 안내 메시지 표시
- 빈 상태 처리: 상품이 없을 때 `notFound()` 호출 (404 페이지)
- Mobile-First 디자인

---

## 구현된 파일 목록

### 신규 생성 파일
1. `app/buyer/product/[id]/page.tsx` - 상품 상세 페이지
2. `components/product/reserve-button.tsx` - 예약 버튼 컴포넌트
3. `components/product/reservation-success-dialog.tsx` - 예약 성공 팝업

### 수정된 파일
1. `app/buyer/actions.ts` - 상품 조회 및 예약 Server Action 추가
   - `getProductById()` 함수 추가
   - `reserveProduct()` 함수 추가
   - 타입 정의 추가 (`StoreData`, `ProductDetailData`, `ReserveProductResult`)

---

## 데이터 흐름

```
[FeedProductCard 클릭]
  ↓
[/buyer/product/[id] 경로 이동]
  ↓
[getProductById(productId) 호출]
  ↓
[상품 정보 + 가게 정보 조회 (JOIN)]
  ↓
[상품 상세 페이지 렌더링]
  ↓
[예약 버튼 클릭]
  ↓
[reserveProduct(productId) Server Action 호출]
  ↓
[Supabase RPC: reserve_product 실행]
  ↓
[트랜잭션: 상품 상태 변경 + 주문 생성]
  ↓
[성공 응답]
  ↓
[성공 팝업 표시]
  ↓
[내 예약 페이지로 리다이렉트 (/buyer/reservations)]
```

---

## 주요 기능

### 1. 상품 상세 페이지 조회
- 동적 라우트를 통한 상품 ID로 상품 정보 조회
- products 테이블과 stores 테이블 조인하여 가게 정보 포함
- 상품이 없을 때 404 페이지 표시

### 2. 예약 기능
- Clerk 인증 확인
- Supabase RPC 함수 `reserve_product` 호출
- 트랜잭션 처리 (DB 함수 내부에서 `FOR UPDATE`로 동시성 제어)
- 예약 성공 시 주문 생성 및 상품 상태 변경
- 예약 실패 시 에러 메시지 표시

### 3. 사용자 경험
- 로딩 상태 표시 (버튼 비활성화, 로딩 스피너)
- 예약 성공 팝업 표시
- 예약 성공 후 내 예약 페이지로 자동 리다이렉트
- 에러 메시지 표시

---

## 에러 처리

### 상품 조회 실패
- 상품이 없을 때: `notFound()` 호출 (404 페이지)
- 권한 에러: null 반환 (에러 로그 기록)

### 예약 실패
- 상품이 이미 예약됨: "이미 예약되었거나 판매된 상품입니다" 메시지
- 인증 에러: "로그인이 필요합니다" 메시지
- 시스템 에러: "시스템 오류가 발생했습니다" 메시지
- RPC 함수 에러: 에러 메시지 표시

---

## 테스트 방법

### 1. 상품 상세 페이지 조회
1. 메인 피드(`/buyer`)에서 상품 클릭
2. 상세 페이지(`/buyer/product/[id]`)로 이동 확인
3. 상품 정보가 올바르게 표시되는지 확인:
   - 이미지
   - 상품명
   - 가격 정보
   - 할인율 배지
   - 바로 섭취 뱃지
   - 픽업 마감 시간
   - 가게 정보

### 2. 예약 기능 테스트
1. AVAILABLE 상태일 때 예약 버튼 활성화 확인
2. 예약 버튼 클릭 시 로딩 상태 확인
3. 예약 성공 시 성공 팝업 표시 확인
4. 예약 실패 시 에러 메시지 표시 확인
5. 예약 성공 후 내 예약 페이지로 리다이렉트 확인

### 3. 상태별 테스트
1. RESERVED 상태일 때 예약 버튼 비활성화 확인
2. SOLD 상태일 때 예약 버튼 비활성화 확인
3. 비활성화 상태일 때 안내 메시지 표시 확인

### 4. 동시성 테스트
1. 두 명의 사용자가 동시에 같은 상품 예약 시도
2. 먼저 예약한 사용자만 성공하는지 확인
3. 두 번째 사용자에게 실패 메시지 표시 확인

---

## TODO.md 업데이트 내역

`docs/TODO.md` 파일의 **Phase 3-3. 예약 시스템 (Reservation)** 섹션에서 다음 항목들을 체크했습니다:

### 기본 항목
- [x] 상세 페이지 (경로 수정: `/buyer/product/[id]`)
- [x] 예약 액션 (Server Action)

### 추가 개발 사항
- [x] 상품 상세 조회 Server Action 구현
- [x] 예약 Server Action 구현
- [x] 예약 버튼 컴포넌트 구현
- [x] 예약 성공 팝업 구현
- [x] 상품 상세 페이지 구현

---

## 다음 단계

Phase 3-3 예약 시스템 개발이 완료되었습니다. 다음 작업은:

### Phase 3-4: 내 예약 확인
- 예약 내역 리스트 조회 (`orders` 테이블에서 내 아이디로 조회)
- 상태 표시 (예약중/픽업완료/취소됨 뱃지)
- 예약 상세 페이지 구현

---

## 참고 문서

- `docs/PRD.md`: 기능 요구사항 및 라우팅 구조
- `docs/TODO.md`: 전체 개발 로드맵
- `supabase/migrations/DB.sql`: 데이터베이스 스키마 및 `reserve_product` 함수
- `docs/task/phase3-3-reservation-planning.md`: 개발 계획 문서 (참고)

---

## 기술 스택 및 패턴

### Server Components
- Next.js 15 App Router 패턴 사용
- async `params` 처리
- Server Actions를 통한 데이터 조회 및 수정

### 클라이언트 컴포넌트
- `'use client'` 지시어 사용
- `useRouter`, `useState` 훅 활용
- 상태 관리 (로딩, 에러, 성공)

### Supabase RPC
- `supabase.rpc('reserve_product', { ... })` 호출
- 트랜잭션 처리 (DB 함수 내부)
- JSON 응답 파싱

### 스타일링
- Tailwind CSS v4 사용
- Mobile-First 디자인 (max-width: 430px)
- shadcn/ui 컴포넌트 활용 (Dialog, Button)
