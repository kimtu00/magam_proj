# Phase 3-2: 메인 피드 (Feed) 개발 구현

**작업 일시:** 2026-01-06  
**작업 유형:** 기능 구현 (Implementation)  
**관련 Phase:** Phase 3 - 사용자(학생) 기능 개발 (Demand Side)

---

## 작업 개요

Phase 3-2 메인 피드(Feed) 개발을 완료했습니다. 학생들이 로그인하여 주변 가게의 마감 할인 상품을 조회하고 필터링할 수 있는 기능을 구현했습니다.

---

## 구현 완료 항목

### 1. Buyer 상품 조회 Server Action 구현 ✅

**파일**: `app/buyer/actions.ts` (신규 생성)

**구현 내용**:
- `getAvailableProducts(filter?: FilterOptions)` 함수 구현
- `status = 'AVAILABLE'`인 모든 상품 조회
- 필터 옵션 지원:
  - `is_instant: true` - 바로 섭취 필터 (😋바로섭취)
  - `is_instant: false` - 조리용 필터 (🍳조리용)
  - `max_price: 10000` - 만원 이하 필터 (💸만원이하)
- 픽업 마감 시간이 현재 시간보다 미래인 상품만 조회
- 최신순 정렬 (`created_at DESC`)
- `ProductData` 타입 정의 (seller와 동일하게 재사용)
- `FilterOptions` 타입 정의

### 2. 빈 상태 컴포넌트 구현 ✅

**파일**: `components/product/empty-feed.tsx` (신규 생성)

**구현 내용**:
- 등록된 상품이 없을 때 표시되는 컴포넌트
- "지금 등록된 상품이 없습니다" 메시지 표시
- Mobile-First 디자인

### 3. 피드용 상품 카드 컴포넌트 구현 ✅

**파일**: `components/product/feed-product-card.tsx` (신규 생성)

**구현 내용**:
- 할인율 배지 (우상단, 빨간색 강조)
- 바로 섭취 뱃지 (좌상단, 파란색)
- 이미지 영역 (이미지 없을 때 플레이스홀더)
- 가격 정보 (할인가 / 정가 취소선)
- 픽업 마감 시간 표시
- 상품 클릭 시 `/buyer/product/[id]` 경로로 이동 (Link)
- Mobile-First 디자인 (세로 카드 레이아웃)
- 호버 효과 (이미지 확대, 그림자 강화)

### 4. 필터 탭 컴포넌트 구현 ✅

**파일**: `components/product/feed-filter-tabs.tsx` (신규 생성)

**구현 내용**:
- 클라이언트 컴포넌트로 구현 (`'use client'`)
- 필터 탭 구성: [전체], [😋바로섭취], [🍳조리용], [💸만원이하]
- 활성화된 필터 강조 표시 (primary 색상)
- 필터 변경 시 URL 쿼리 파라미터 업데이트
- Mobile-First 디자인 (가로 스크롤 가능한 탭)
- sticky positioning (스크롤 시 상단 고정)

### 5. 메인 피드 페이지 구현 ✅

**파일**: `app/buyer/page.tsx` (기존 임시 페이지 교체)

**구현 내용**:
- Server Component로 구현
- Next.js 15 async `searchParams` 패턴 사용
- URL 쿼리 파라미터에서 필터 옵션 읽기
- 필터에 따른 상품 조회 (`getAvailableProducts()`)
- 필터 탭 + 상품 리스트 그리드 렌더링 (2열 그리드)
- 빈 상태 처리 (`EmptyFeed` 컴포넌트)
- 로딩 상태 처리 (Suspense 사용)
- 페이지 제목 및 설명 추가

---

## 구현된 파일 목록

### 신규 생성 파일
1. `app/buyer/actions.ts` - Buyer 상품 조회 Server Action
2. `components/product/empty-feed.tsx` - 빈 상태 컴포넌트
3. `components/product/feed-product-card.tsx` - 피드용 상품 카드
4. `components/product/feed-filter-tabs.tsx` - 필터 탭 컴포넌트

### 수정된 파일
1. `app/buyer/page.tsx` - 메인 피드 페이지 (임시 페이지 → 실제 구현)

---

## 기술 스택 및 패턴

### Server Components
- Next.js 15 App Router 패턴 사용
- async `searchParams` 처리
- Server Actions를 통한 데이터 조회

### 클라이언트 컴포넌트
- `'use client'` 지시어 사용
- `useRouter`, `useSearchParams` 훅 활용
- URL 쿼리 파라미터 기반 상태 관리

### 스타일링
- Tailwind CSS v4 사용
- Mobile-First 디자인 (max-width: 430px)
- shadcn/ui 컴포넌트 활용 (Button)

### 데이터 조회
- Supabase 클라이언트 사용 (`lib/supabase/server.ts`)
- 동적 필터링 (WHERE 조건 추가)
- 시간 기반 필터링 (픽업 마감 시간)

---

## 주요 기능

### 1. 상품 리스트 조회
- `status = 'AVAILABLE'`인 상품만 표시
- 픽업 마감 시간이 현재보다 미래인 상품만 표시
- 최신순 정렬 (가장 최근에 등록된 상품 먼저)

### 2. 필터링 기능
- **전체**: 모든 AVAILABLE 상품 표시
- **바로섭취** (😋): `is_instant = true` 상품만 표시
- **조리용** (🍳): `is_instant = false` 상품만 표시
- **만원이하** (💸): `discount_price <= 10000` 상품만 표시

### 3. 상품 카드 표시
- 이미지 (또는 플레이스홀더)
- 할인율 배지 (우상단, 빨간색)
- 바로 섭취 뱃지 (좌상단, 파란색)
- 상품명
- 가격 정보 (할인가 / 정가 취소선)
- 픽업 마감 시간

---

## TODO.md 업데이트 내역

`docs/TODO.md` 파일의 **Phase 3-2. 메인 피드 (Feed)** 섹션에서 다음 항목들을 체크했습니다:

### 기본 항목
- [x] 상품 리스트 조회
- [x] 필터 UI 구현
- [x] 카드 UI 디자인

### 추가 개발 사항
- [x] Buyer 상품 조회 Server Action 구현
- [x] 필터 탭 컴포넌트 구현
- [x] 피드용 상품 카드 컴포넌트 구현
- [x] 메인 피드 페이지 구현
- [x] 빈 상태 컴포넌트 구현

---

## 테스트 방법

### 1. 기본 기능 테스트
1. `/buyer` 경로로 접속
2. 등록된 상품이 있으면 그리드 형태로 표시되는지 확인
3. 상품이 없으면 빈 상태 메시지가 표시되는지 확인

### 2. 필터 기능 테스트
1. 필터 탭 클릭 시 URL 쿼리 파라미터가 변경되는지 확인
2. 각 필터 적용 시 해당 조건에 맞는 상품만 표시되는지 확인:
   - 전체: 모든 상품 표시
   - 바로섭취: `is_instant = true` 상품만
   - 조리용: `is_instant = false` 상품만
   - 만원이하: `discount_price <= 10000` 상품만

### 3. 상품 카드 테스트
1. 이미지가 정상적으로 표시되는지 확인
2. 할인율 배지가 올바르게 계산되어 표시되는지 확인
3. 바로 섭취 뱃지가 조건에 맞게 표시되는지 확인
4. 상품 클릭 시 `/buyer/product/[id]` 경로로 이동하는지 확인 (상세 페이지는 추후 구현)

### 4. 반응형 디자인 테스트
1. 모바일 화면(430px 이하)에서 레이아웃이 올바르게 표시되는지 확인
2. 필터 탭이 가로 스크롤이 가능한지 확인
3. 상품 카드가 2열 그리드로 표시되는지 확인

---

## 다음 단계

Phase 3-2 메인 피드 개발이 완료되었습니다. 다음 작업은:

### Phase 3-3: 예약 시스템 (Reservation)
- 상품 상세 페이지 구현 (`/buyer/product/[id]`)
- 예약 Server Action 구현 (`reserve_product` 함수 호출)
- 예약 성공 팝업 구현

### 개선 사항 (선택)
- 페이지네이션 또는 무한 스크롤 추가 (상품이 많을 경우)
- 가게 정보 표시 (상품 카드에 가게 이름 추가)
- 검색 기능 추가 (상품명 검색)

---

## 참고 문서

- `docs/PRD.md`: 기능 요구사항 및 라우팅 구조
- `docs/TODO.md`: 전체 개발 로드맵
- `supabase/migrations/DB.sql`: 데이터베이스 스키마
- `docs/task/phase3-2-feed-planning.md`: 개발 계획 문서
