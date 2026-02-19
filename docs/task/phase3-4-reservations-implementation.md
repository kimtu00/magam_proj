# Phase 3-4: 내 예약 확인 개발 구현

**작업 일시:** 2026-01-06  
**작업 유형:** 기능 구현 (Implementation)  
**관련 Phase:** Phase 3 - 사용자(학생) 기능 개발 (Demand Side)

---

## 작업 개요

Phase 3-4 내 예약 확인 개발을 완료했습니다. 학생이 자신이 예약한 상품 목록을 조회하고, 각 예약의 상태(예약중/픽업완료/취소됨)를 확인할 수 있는 기능을 구현했습니다.

---

## 구현 완료 항목

### 1. 예약 내역 조회 Server Action 구현 ✅

**파일**: `app/buyer/actions.ts` (기존 파일 수정)

**구현 내용**:
- `getMyOrders()` 함수 구현
- Clerk 인증 확인 (`auth().userId`)
- orders 테이블에서 `buyer_id`로 조회
- products 테이블과 조인하여 상품 정보 포함
- stores 테이블과 중첩 조인하여 가게 정보 포함
- 최신순 정렬 (`created_at DESC`)
- 반환 타입: `OrderData[]` (order 정보 + product 정보 + store 정보)
- 타입 정의: `OrderData` 타입 추가
- 에러 처리:
  - 인증 에러: 빈 배열 반환
  - DB 에러: 빈 배열 반환 (에러 로그 기록)
  - product/store 없을 때: 필터링 처리

### 2. 예약 내역 카드 컴포넌트 구현 ✅

**파일**: `components/product/order-card.tsx` (신규 생성)

**구현 내용**:
- 예약 내역 정보 표시:
  - 상품 이미지 (이미지 없을 때 플레이스홀더)
  - 상품명
  - 가격 정보 (할인가)
  - 가게 정보 (가게명)
  - 예약 날짜 표시
  - 픽업 마감 시간 표시
- 상태 뱃지 표시:
  - 예약중 (RESERVED): 초록색 뱃지 (`bg-emerald-100 text-emerald-700`)
  - 픽업완료 (COMPLETED): 회색 뱃지 (`bg-gray-200 text-gray-600`)
  - 취소됨 (CANCELED): 빨간색 뱃지 (`bg-red-100 text-red-700`)
- 상품 클릭 시 `/buyer/product/[id]` 경로로 이동 (Link)
- Mobile-First 디자인 (가로 카드 레이아웃)
- 호버 효과 (그림자 강화)

### 3. 빈 상태 컴포넌트 구현 ✅

**파일**: `components/product/empty-orders.tsx` (신규 생성)

**구현 내용**:
- 예약 내역이 없을 때 표시되는 컴포넌트
- "아직 예약한 상품이 없습니다" 메시지 표시
- "마감 할인 상품 둘러보기" 버튼으로 메인 피드(`/buyer`)로 이동 유도
- Mobile-First 디자인

### 4. 예약 내역 페이지 구현 ✅

**파일**: `app/buyer/reservations/page.tsx` (기존 임시 페이지 교체)

**구현 내용**:
- Server Component로 구현
- `getMyOrders()` Server Action 호출
- 예약 내역 리스트 렌더링 (`OrderCard` 컴포넌트)
- 빈 상태 처리 (`EmptyOrders` 컴포넌트)
- 로딩 상태 처리 (Suspense 사용)
- 페이지 제목 및 설명
- Mobile-First 디자인

---

## 구현된 파일 목록

### 신규 생성 파일
1. `components/product/order-card.tsx` - 예약 내역 카드 컴포넌트
2. `components/product/empty-orders.tsx` - 예약 내역 빈 상태 컴포넌트

### 수정된 파일
1. `app/buyer/actions.ts` - 예약 내역 조회 Server Action 추가
   - `getMyOrders()` 함수 추가
   - `OrderData` 타입 정의 추가
2. `app/buyer/reservations/page.tsx` - 예약 내역 페이지 (임시 페이지 → 실제 구현)

---

## 데이터 흐름

```
[내 예약 페이지 접속 (/buyer/reservations)]
  ↓
[getMyOrders() 호출]
  ↓
[Clerk 인증 확인 (userId)]
  ↓
[orders 테이블 조회 (buyer_id = userId)]
  ↓
[products 테이블 조인 (product 정보)]
  ↓
[stores 테이블 중첩 조인 (가게 정보)]
  ↓
[예약 내역 리스트 반환 (OrderData[])]
  ↓
[OrderCard 컴포넌트로 각 예약 내역 렌더링]
  ↓
[상태 뱃지 표시 (예약중/픽업완료/취소됨)]
```

---

## 타입 정의

### OrderData
```typescript
export type OrderData = {
  // Order 정보
  id: string;
  buyer_id: string;
  product_id: string;
  status: "RESERVED" | "COMPLETED" | "CANCELED";
  created_at: string;
  
  // Product 정보 (조인)
  product: {
    id: string;
    name: string;
    original_price: number;
    discount_price: number;
    image_url: string | null;
    is_instant: boolean;
    pickup_deadline: string;
  };
  
  // Store 정보 (조인)
  store: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
  };
};
```

---

## 상태 뱃지 디자인

### 예약중 (RESERVED)
- 라벨: "예약중"
- 색상: 초록색 (`bg-emerald-100 text-emerald-700`)

### 픽업완료 (COMPLETED)
- 라벨: "픽업완료"
- 색상: 회색 (`bg-gray-200 text-gray-600`)

### 취소됨 (CANCELED)
- 라벨: "취소됨"
- 색상: 빨간색 (`bg-red-100 text-red-700`)

---

## 주요 기능

### 1. 예약 내역 조회
- 로그인한 사용자의 예약 내역만 표시
- 최신순 정렬 (가장 최근에 예약한 상품 먼저)
- 상품 정보와 가게 정보 포함

### 2. 상태 표시
- 3가지 상태 뱃지:
  - 예약중 (초록색)
  - 픽업완료 (회색)
  - 취소됨 (빨간색)

### 3. 빈 상태 처리
- 예약 내역이 없을 때 안내 메시지 표시
- 메인 피드로 이동 유도

---

## 에러 처리

### 예약 내역 조회 실패
- 인증 에러: 빈 배열 반환
- DB 에러: 빈 배열 반환 (에러 로그 기록)
- product/store 없을 때: 해당 order는 필터링하여 제외

### 빈 상태 처리
- 예약 내역이 없을 때: `EmptyOrders` 컴포넌트 표시
- 메인 피드로 이동 유도

---

## 테스트 방법

### 1. 예약 내역 조회 테스트
1. `/buyer/reservations` 경로로 접속
2. 로그인한 사용자의 예약 내역만 표시되는지 확인
3. 최신순으로 정렬되는지 확인 (가장 최근 예약이 위에)
4. 상품 정보와 가게 정보가 올바르게 표시되는지 확인

### 2. 상태 뱃지 테스트
1. 예약중 상태인 예약 내역 확인
   - 초록색 뱃지 표시 확인
   - "예약중" 라벨 확인
2. 픽업완료 상태인 예약 내역 확인
   - 회색 뱃지 표시 확인
   - "픽업완료" 라벨 확인
3. 취소됨 상태인 예약 내역 확인
   - 빨간색 뱃지 표시 확인
   - "취소됨" 라벨 확인

### 3. 빈 상태 테스트
1. 예약 내역이 없는 사용자로 로그인
2. 빈 상태 메시지 표시 확인
3. "마감 할인 상품 둘러보기" 버튼 클릭 시 메인 피드로 이동 확인

### 4. 상품 상세 페이지 이동 테스트
1. 예약 내역 카드 클릭
2. 상품 상세 페이지(`/buyer/product/[id]`)로 이동 확인

---

## TODO.md 업데이트 내역

`docs/TODO.md` 파일의 **Phase 3-4. 내 예약 확인** 섹션에서 다음 항목들을 체크했습니다:

### 기본 항목
- [x] 예약 내역 리스트
- [x] 상태 표시

### 추가 개발 사항
- [x] 예약 내역 조회 Server Action 구현
- [x] 예약 내역 카드 컴포넌트 구현
- [x] 빈 상태 컴포넌트 구현
- [x] 예약 내역 페이지 구현

---

## 다음 단계

Phase 3-4 내 예약 확인 개발이 완료되었습니다. Phase 3의 모든 작업이 완료되었습니다.

### Phase 4: 배포 및 테스트
- 최종 테스트 (사장님/학생 역할로 동시 테스트)
- 배포 (Vercel)

### 추가 개선 사항 (선택)
- 예약 취소 기능 (취소 버튼 추가)
- 예약 상세 페이지 (예약 정보 상세 표시)
- 알림 기능 (예약 상태 변경 시 알림)

---

## 참고 문서

- `docs/PRD.md`: 기능 요구사항 및 라우팅 구조
- `docs/TODO.md`: 전체 개발 로드맵
- `supabase/migrations/DB.sql`: 데이터베이스 스키마
- `docs/task/phase3-4-reservations-planning.md`: 개발 계획 문서 (참고)

---

## 기술 스택 및 패턴

### Server Components
- Next.js 15 App Router 패턴 사용
- Server Actions를 통한 데이터 조회

### Supabase 조인
- 중첩 조인 쿼리: `orders(*) -> products(*) -> stores(*)`
- 타입 변환 처리 (배열 반환 시 첫 번째 요소 사용)

### 스타일링
- Tailwind CSS v4 사용
- Mobile-First 디자인 (max-width: 430px)
- 상태 뱃지 색상 정의
