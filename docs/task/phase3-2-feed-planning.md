# Phase 3-2: 메인 피드 (Feed) 개발 계획 수립

**작업 일시:** 2026-01-06  
**작업 유형:** 계획 수립 (Planning)  
**관련 Phase:** Phase 3 - 사용자(학생) 기능 개발 (Demand Side)

---

## 작업 개요

Phase 3-2 메인 피드(Feed) 개발을 위한 상세 계획을 수립했습니다. 학생들이 로그인하여 주변 가게의 마감 할인 상품을 조회하고 필터링할 수 있는 기능을 구현하기 위한 개발 계획을 문서화했습니다.

---

## 작업 내용

### 1. 기존 코드 분석

#### 참고한 파일들:
- `app/seller/actions.ts`: 사장님용 상품 조회 로직 (`getMyProducts()`)
- `components/product/product-card.tsx`: 사장님용 상품 카드 컴포넌트
- `app/buyer/page.tsx`: 현재 임시 페이지 (추후 구현 예정 안내)
- `supabase/migrations/DB.sql`: 데이터베이스 스키마 (products 테이블 구조)

#### 주요 인사이트:
1. **상품 조회 로직**: 사장님용 `getMyProducts()`를 참고하여 buyer용 `getAvailableProducts()` 구현 필요
2. **상품 카드 컴포넌트**: 사장님용 카드를 참고하되, buyer 피드에 최적화된 디자인 필요
3. **필터 요구사항**: PRD.md 기준 3가지 필터 (바로 섭취, 조리용, 만원의 행복)

### 2. 개발 계획 수립

#### 2-1. Buyer 상품 조회 Server Action 구현
- **파일**: `app/buyer/actions.ts` (신규 생성)
- **함수**: `getAvailableProducts(filter?: FilterOptions)`
- **기능**:
  - `status = 'AVAILABLE'`인 모든 상품 조회
  - 필터 옵션 지원:
    - `is_instant: true` - 바로 섭취 필터 (😋바로섭취)
    - `is_instant: false` - 조리용 필터 (🍳조리용)
    - `max_price: 10000` - 만원 이하 필터 (💸만원이하)
  - 픽업 마감 시간이 현재 시간보다 미래인 상품만 조회
  - 최신순 정렬 (`created_at DESC`)
- **타입**: `ProductData` 타입 정의 (seller와 동일하게 재사용)

#### 2-2. 필터 탭 컴포넌트 구현
- **파일**: `components/product/feed-filter-tabs.tsx` (신규 생성)
- **타입**: 클라이언트 컴포넌트 (`'use client'`)
- **기능**:
  - 필터 탭 구성: [전체], [😋바로섭취], [🍳조리용], [💸만원이하]
  - 활성화된 필터 강조 표시
  - 필터 변경 시 URL 쿼리 파라미터 업데이트 또는 상태 관리
  - Mobile-First 디자인 (가로 스크롤 가능한 탭)

#### 2-3. 피드용 상품 카드 컴포넌트 구현
- **파일**: `components/product/feed-product-card.tsx` (신규 생성)
- **디자인 요구사항**:
  - 사진 (이미지 없을 때 플레이스홀더)
  - 할인율 표시 (빨간색 강조, 큰 폰트)
  - 가격 표시 (할인가 / 정가 취소선)
  - 바로 섭취 뱃지 표시 (`is_instant`)
  - 픽업 마감 시간 표시
  - 상품 클릭 시 `/buyer/product/[id]` 경로로 이동 (Link)
  - Mobile-First 디자인 (세로 카드 레이아웃)

#### 2-4. 메인 피드 페이지 구현
- **파일**: `app/buyer/page.tsx` (기존 임시 페이지 교체)
- **타입**: Server Component
- **기능**:
  - URL 쿼리 파라미터에서 필터 옵션 읽기 (`searchParams`)
  - 필터에 따른 상품 조회 (`getAvailableProducts()`)
  - 필터 탭 + 상품 리스트 그리드 렌더링
  - 빈 상태 처리 (상품이 없을 때 안내 문구)
  - 로딩 상태 처리 (Suspense 사용 고려)

#### 2-5. 빈 상태 컴포넌트 구현
- **파일**: `components/product/empty-feed.tsx` (신규 생성)
- **기능**:
  - 등록된 상품이 없을 때 안내 문구 표시
  - "지금 등록된 상품이 없습니다" 메시지

---

## TODO.md 업데이트 내역

`docs/TODO.md` 파일의 **Phase 3-2. 메인 피드 (Feed)** 섹션에 다음 내용을 추가했습니다:

### 추가된 항목들:
1. **Buyer 상품 조회 Server Action 구현**
2. **필터 탭 컴포넌트 구현**
3. **피드용 상품 카드 컴포넌트 구현**
4. **메인 피드 페이지 구현**
5. **빈 상태 컴포넌트 구현**

각 항목은 원래 todo 항목 하위에 구분선(`---`)과 **"추가 개발 사항"** 섹션으로 명시적으로 추가되었습니다.

---

## 참고 문서

- `docs/PRD.md`: 기능 요구사항 및 라우팅 구조
- `docs/TODO.md`: 전체 개발 로드맵
- `supabase/migrations/DB.sql`: 데이터베이스 스키마

---

## 다음 단계

Phase 3-2 메인 피드 개발을 시작하기 전에 다음 사항을 확인해야 합니다:

1. ✅ 개발 계획 수립 완료
2. ⏳ 개발 작업 시작 (구현 단계)
3. ⏳ 테스트 및 검증
4. ⏳ TODO.md 체크리스트 업데이트

---

## 참고 사항

- **필터 로직**: 필터는 클라이언트 측에서 URL 쿼리 파라미터로 관리하거나, 서버 측에서 `searchParams`로 처리 가능
- **상품 카드 재사용**: 사장님용 `product-card.tsx`를 참고하되, buyer 피드에 최적화된 별도 컴포넌트 생성 권장
- **성능 최적화**: 상품 리스트가 많을 경우 페이지네이션 또는 무한 스크롤 고려 필요 (초기 구현에서는 전체 리스트 조회)
