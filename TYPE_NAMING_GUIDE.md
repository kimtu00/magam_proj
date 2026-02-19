# Type & Naming 지침서

> UI ~ DB 간 타입 네이밍 규칙, 필드 매핑, 불일치 목록을 정리한 문서입니다.

---

## 1. 레이어별 네이밍 원칙

| 레이어 | 컨벤션 | 예시 |
|--------|--------|------|
| **DB (Supabase/PostgreSQL)** | `snake_case` | `original_price`, `buyer_id`, `created_at` |
| **Service Layer** (`services/*/`) | `snake_case` (DB 동일) | `ProductData.original_price` |
| **공통 유틸리티** (`types/common.ts`) | `camelCase` | `ApiSuccessResponse`, `ReceiptStatus`, `DateRange` |
| **UI Layer** (`types/store-admin.ts`, `types/admin.ts`) | `camelCase` | `StoreProduct.originalPrice`, `StoreOrder.buyerId` |
| **UI Layer** (`types/consumer.ts`) | `snake_case` 혼용 ⚠️ | `CouponData.discount_type` |

### 변환 원칙

- **변환 시점**: API Route(`app/api/`) 또는 Server Action에서 DB/Service → UI 매핑
- **변환 방향**: DB/Service(snake_case) → UI(camelCase) 단방향
- **변환 예시**: `app/api/store/products/route.ts`의 `GET` 핸들러

```typescript
// DB/Service → UI 변환 패턴 (app/api/store/products/route.ts)
const products: StoreProduct[] = dbProducts.map((p) => ({
  id: p.id,
  name: p.name,
  originalPrice: p.original_price,      // snake_case → camelCase
  discountPrice: p.discount_price,      // snake_case → camelCase
  weight: p.weight_value ?? 0,          // 필드명 변경 주의
  reservedCount: p.reserved_quantity ?? 0, // 예약 수량
  deadline: p.pickup_deadline,          // 필드명 단축
  status: mapProductStatus(p.status, p.pickup_deadline), // 값 변환
  createdAt: p.created_at,
}));
```

---

## 2. 테이블별 필드 매핑

### 2-1. products 테이블

| DB 컬럼 (`snake_case`) | Service Type (`ProductData`) | UI Type (`StoreProduct`) | 비고 |
|------------------------|------------------------------|--------------------------|------|
| `id` | `id` | `id` | |
| `store_id` | `store_id` | - | UI에서 미사용 |
| `name` | `name` | `name` | |
| `original_price` | `original_price` | `originalPrice` | camelCase 변환 |
| `discount_price` | `discount_price` | `discountPrice` | camelCase 변환 |
| `image_url` | `image_url` | - | UI 테이블에서 미사용 |
| `is_instant` | `is_instant` | - | UI 테이블에서 미사용 |
| `pickup_deadline` | `pickup_deadline` | `deadline` | **필드명 변경** |
| `status` | `status` (`AVAILABLE\|RESERVED\|SOLD\|SOLD_OUT`) | `status` (`ACTIVE\|CLOSED`) | **값 변환 필요** → `mapProductStatus()` |
| `quantity` | `quantity` | `quantity` | |
| `weight_value` | `weight_value` | `weight` | **필드명 변경** |
| `weight_unit` | `weight_unit` | - | UI 단위 별도 처리 |
| `category` | `category` | `category` | |
| `template_id` | `template_id` | - | UI에서 미사용 |
| `early_access_from` | `early_access_from` | - | UI에서 미사용 |
| `visible_from` | `visible_from` | - | UI에서 미사용 |
| `created_at` | `created_at` | `createdAt` | camelCase 변환 |
| *(computed)* | `reserved_quantity` | `reservedCount` | ✅ 필드명 정정 완료 (`soldCount` → `reservedCount`) |

> ✅ **수정 완료**: `reserved_quantity`(현재 예약된 수량)를 UI에서 `reservedCount`로 정확하게 매핑하도록 수정됨.

---

### 2-2. orders 테이블

| DB 컬럼 | Service Type (`OrderData`) | UI Type (`StoreOrder`) | 비고 |
|---------|---------------------------|------------------------|------|
| `id` | `id` | `id` | |
| `buyer_id` | `buyer_id` | `buyerId` | ✅ `customerId` → `buyerId` 수정 완료 |
| `product_id` | `product_id` | `productId` | camelCase 변환 |
| `quantity` | `quantity` | `quantity` | |
| `preferred_pickup_time` | `preferred_pickup_time` | `pickupTime` | **필드명 단축** |
| `status` | `status` (`RESERVED\|COMPLETED\|CANCELED`) | `status` (`RESERVED\|COMPLETED\|CANCELED`) | ✅ DB와 일치하도록 수정 완료 |
| `completed_at` | `completed_at?` | `completedAt` | ✅ Service 타입에 추가 완료 |
| `created_at` | `created_at` | `createdAt` | camelCase 변환 |

> ✅ **수정 완료**: `buyer_id` → `buyerId` 통일, Order Status `RESERVED`/`CANCELED`로 DB 기준 정렬 완료.

---

### 2-3. stores 테이블

| DB 컬럼 | Service Type (`StoreData`) | 비고 |
|---------|---------------------------|------|
| `id` | `id` | |
| `owner_id` | `owner_id` | Clerk User ID |
| `name` | `name` | |
| `address` | `address` | |
| `phone` | `phone` | |
| `image_url` | `image_url` | |
| `latitude` | `latitude` | |
| `longitude` | `longitude` | |
| `created_at` | `created_at` | |

> Store 타입은 Service 레이어(`StoreData`)와 DB가 1:1 일치. UI 전용 타입 없음 (Good).

---

### 2-4. reviews 테이블

| DB 컬럼 | Service Type (`ReviewData`) | 비고 |
|---------|-----------------------------|------|
| `id` | `id` | |
| `order_id` | `order_id` | |
| `buyer_id` | `buyer_id` | |
| `store_id` | `store_id` | |
| `product_id` | `product_id` | |
| `rating` | `rating` | |
| `content` | `content` | |
| `image_url` | `image_url` | |
| `created_at` | `created_at` | |
| `updated_at` | `updated_at` | |

---

### 2-5. settlements 테이블

| DB 컬럼 | Service/UI Type (`SettlementData`) | 비고 |
|---------|------------------------------------|------|
| `id` | `id` | |
| `store_id` | `storeId` | camelCase 변환 |
| `period_start` | `periodStart` | camelCase 변환 |
| `period_end` | `periodEnd` | camelCase 변환 |
| `total_sales` | `totalSales` | camelCase 변환 |
| `total_orders` | `totalOrders` | camelCase 변환 |
| `commission_rate` | `commissionRate` | camelCase 변환 |
| `commission_amount` | `commissionAmount` | camelCase 변환 |
| `settlement_amount` | `settlementAmount` | camelCase 변환 |
| `status` | `status` (`pending\|processing\|completed\|failed`) | 소문자 사용 ⚠️ |
| `settled_at` | `settledAt` | camelCase 변환 |
| `created_at` | `createdAt` | camelCase 변환 |
| `notes` | - | UI 미사용 (관리자 메모) |
| `updated_at` | - | UI 미사용 (수정 시각) |

---

### 2-6. cart_items 테이블

| DB 컬럼 | Service Type (`CartItemData`) | 비고 |
|---------|-------------------------------|------|
| `id` | `id` | |
| `buyer_id` | `buyer_id` | |
| `product_id` | `product_id` | |
| `quantity` | `quantity` | |
| `preferred_pickup_time` | `preferred_pickup_time` | |
| `created_at` | `created_at` | |

---

### 2-7. coupons 테이블

| DB 컬럼 | Service Type | UI Type (`CouponData` in `types/consumer.ts`) | 비고 |
|---------|-------------|-----------------------------------------------|------|
| `id` | - | `id` | |
| `code` | - | `code` | snake_case 그대로 ⚠️ |
| `name` | - | `name` | |
| `description` | - | `description` | |
| `discount_type` | - | `discount_type` | snake_case 그대로 ⚠️ |
| `discount_value` | - | `discount_value` | snake_case 그대로 ⚠️ |
| `min_order_amount` | - | `min_order_amount` | snake_case 그대로 ⚠️ |
| `max_discount` | - | `max_discount` | snake_case 그대로 ⚠️ |
| `valid_from` | - | `valid_from` | snake_case 그대로 ⚠️ |
| `valid_until` | - | `valid_until` | snake_case 그대로 ⚠️ |
| `total_quantity` | - | `total_quantity` | snake_case 그대로 ⚠️ |
| `issued_count` | - | `issued_count` | snake_case 그대로 ⚠️ |
| `is_active` | - | `is_active` | snake_case 그대로 ⚠️ |
| `created_at` | - | `created_at` | snake_case 그대로 ⚠️ |

> Service 레이어 타입 없음. `types/consumer.ts`의 `CouponData`가 DB 컬럼을 snake_case 그대로 사용. 다른 UI 타입(`store-admin.ts`, `admin.ts`)의 camelCase 컨벤션과 불일치.

---

### 2-8. user_coupons 테이블

| DB 컬럼 | UI Type (`UserCouponData` in `types/consumer.ts`) | 비고 |
|---------|--------------------------------------------------|------|
| `id` | `id` | |
| `user_id` | `user_id` | snake_case 그대로 ⚠️ |
| `coupon_id` | `coupon_id` | snake_case 그대로 ⚠️ |
| `status` | `status` (`available\|used\|expired`) | 소문자 사용, 다른 enum과 컨벤션 불일치 |
| `used_at` | `used_at` | snake_case 그대로 ⚠️ |
| `used_order_id` | `used_order_id` | snake_case 그대로 ⚠️ |
| `acquired_at` | `acquired_at` | snake_case 그대로 ⚠️ |

---

### 2-9. point_transactions 테이블

| DB 컬럼 | UI Type (`PointTransaction` in `types/consumer.ts`) | 비고 |
|---------|---------------------------------------------------|------|
| `id` | `id` | |
| `user_id` | `user_id` | snake_case 그대로 ⚠️ |
| `type` | `type` (`earn\|spend\|payback\|expire`) | 소문자, DB와 1:1 일치 |
| `amount` | `amount` | |
| `balance_after` | `balance_after` | snake_case 그대로 ⚠️ |
| `description` | `description` | |
| `related_order_id` | `related_order_id` | snake_case 그대로 ⚠️ |
| `created_at` | `created_at` | snake_case 그대로 ⚠️ |

---

### 2-10. bank_accounts 테이블

| DB 컬럼 | UI Type (`BankAccountData` in `types/consumer.ts`) | 비고 |
|---------|---------------------------------------------------|------|
| `id` | `id` | |
| `user_id` | `user_id` | snake_case 그대로 ⚠️ |
| `bank_name` | `bank_name` | snake_case 그대로 ⚠️ |
| `account_number` | `account_number` | snake_case 그대로 ⚠️ |
| `account_holder` | `account_holder` | snake_case 그대로 ⚠️ |
| `is_verified` | `is_verified` | snake_case 그대로 ⚠️ |
| `created_at` | `created_at` | snake_case 그대로 ⚠️ |
| `updated_at` | `updated_at` | snake_case 그대로 ⚠️ |

---

### 2-11. receipts 테이블

| DB 컬럼 | UI Type (`ReceiptData` in `types/consumer.ts`) | 비고 |
|---------|----------------------------------------------|------|
| `id` | `id` | |
| `user_id` | `user_id` | snake_case 그대로 ⚠️ |
| `order_id` | `order_id` | snake_case 그대로 ⚠️ |
| `image_url` | `image_url` | snake_case 그대로 ⚠️ |
| `status` | `status` (`pending\|approved\|rejected`) | `ReceiptStatus` → ✅ `types/common.ts`로 통합 (중복 제거) |
| `reject_reason` | `reject_reason` | snake_case 그대로 ⚠️ |
| `payback_amount` | `payback_amount` | snake_case 그대로 ⚠️ |
| `reviewed_by` | `reviewed_by` | snake_case 그대로 ⚠️ |
| `reviewed_at` | `reviewed_at` | snake_case 그대로 ⚠️ |
| `created_at` | `created_at` | snake_case 그대로 ⚠️ |

---

### 2-12. store_promotions 테이블

| DB 컬럼 | UI Type (`StorePromotionData` in `types/store-admin.ts`) | 비고 |
|---------|---------------------------------------------------------|------|
| `id` | `id` | |
| `store_id` | `storeId` | camelCase 변환 |
| `coupon_id` | `couponId` | camelCase 변환 |
| `name` | `name` | |
| `description` | `description` | |
| `type` | `type` (`platform\|store`) | DB와 일치 |
| `used_count` | `usedCount` | camelCase 변환 |
| `commission_adjustment` | `commissionAdjustment` | camelCase 변환 |
| `adjustment_type` | `adjustmentType` | camelCase 변환 |
| `is_active` | `isActive` | camelCase 변환 |
| `valid_from` | `validFrom` | camelCase 변환 |
| `valid_until` | `validUntil` | camelCase 변환 |
| `created_at` | `createdAt` | camelCase 변환 |
| `updated_at` | - | UI 미사용 |

> `store_promotions`은 `store-admin.ts`의 `StorePromotionData`와 잘 매핑됨. Service 레이어 타입 없음.

---

## 3. Status Enum 매핑

### 3-1. Order Status

```
DB / Service                    UI (store-admin)              UI (buyer)
─────────────                   ────────────────              ──────────
RESERVED  (예약됨)        →      RESERVED   ✅ 일치           RESERVED
COMPLETED (픽업완료)      →      COMPLETED  ✅ 일치           COMPLETED
CANCELED  (취소됨)        →      CANCELED   ✅ 일치           CANCELED
```

✅ **수정 완료**: 모든 레이어가 DB enum 기준 `RESERVED / COMPLETED / CANCELED`로 통일됨.

**`types/consumer.ts`의 `OrderStatusFilter`**:
```typescript
// 수정 전 (불일치)
OrderStatusFilter = "all" | "completed" | "cancelled"

// 수정 후 (DB 기준 통일)
OrderStatusFilter = "all" | "RESERVED" | "COMPLETED" | "CANCELED"
```
✅ `app/api/user/orders/route.ts`의 필터 로직도 함께 대문자 기준으로 수정 완료.

---

### 3-2. Product Status

```
DB 값          Service 값      UI 값 (mapProductStatus 변환)
──────────     ──────────      ──────────────────────────────
AVAILABLE  →  AVAILABLE   →   ACTIVE  (마감 전)
AVAILABLE  →  AVAILABLE   →   CLOSED  (마감 후, 픽업 시간 경과)
RESERVED   →  RESERVED    →   CLOSED
SOLD       →  SOLD         →   CLOSED
SOLD_OUT   →  SOLD_OUT     →   CLOSED
```

변환 함수 위치: `app/api/store/products/route.ts`의 `mapProductStatus(dbStatus, pickupDeadline)`

---

### 3-3. Settlement Status

```
DB / UI 값     의미
──────────     ────────────────
pending        정산 대기
processing     정산 처리 중
completed      정산 완료
failed         정산 실패
```

> 소문자 사용. 다른 상태값(UPPERCASE)과 컨벤션 불일치.

---

### 3-4. Receipt Status (consumer)

```
DB / UI 값     의미
──────────     ────────────────
pending        심사 대기
approved       승인
rejected       반려
```

> 소문자 사용. Settlement와 동일 패턴.

---

## 4. 불일치 목록 및 수정 현황

### ✅ 해결 완료 항목

| # | 파일 | 불일치 내용 | 수정 결과 |
|---|------|------------|-----------|
| 1 | `types/store-admin.ts` | `RecentOrder.status`: `'PENDING'` → DB는 `'RESERVED'` | ✅ `RESERVED`로 수정 |
| 2 | `types/store-admin.ts` | `StoreOrder.status`: `'CANCELLED'` → DB는 `'CANCELED'` | ✅ `CANCELED`로 수정 |
| 3 | `types/store-admin.ts` | `StoreOrder.customerId` → DB는 `buyer_id` | ✅ `buyerId`로 수정 |
| 5 | `app/api/store/products/route.ts` | `soldCount: p.reserved_quantity` → 예약 수량을 판매 수량으로 오해 가능 | ✅ `reservedCount`로 전체 rename |
| 7 | `services/order/order.types.ts` | `OrderData`에 `completed_at` 필드 없음 | ✅ `completed_at?: string \| null` 추가 |
| 8 | `types/consumer.ts` | `OrderStatusFilter` 소문자 + 영국식 철자 (`completed`, `cancelled`) | ✅ `"all" \| "RESERVED" \| "COMPLETED" \| "CANCELED"`로 수정 |
| 9 | `consumer.ts` / `admin.ts` / `store-admin.ts` | 공통 타입 3개 파일에 중복 정의 | ✅ `types/common.ts`로 추출 후 re-export |
| 10 | `types/consumer.ts` / `types/admin.ts` | `ReceiptStatus` 두 파일에 중복 정의 | ✅ `types/common.ts`로 이동 후 공유 |

### ⚠️ 미해결 항목 (의도적 유지)

| # | 파일 | 내용 | 유지 이유 |
|---|------|------|-----------|
| 4 | `types/consumer.ts` | `CouponData` 필드가 snake_case 혼용 | DB를 직접 사용하는 consumer 패턴으로, 변경 시 연쇄 영향 큼. 별도 검토 필요 |
| 6 | `types/store-admin.ts` | Settlement/Receipt status가 소문자 (`pending`, `processing`, ...) | DB CHECK 제약조건이 소문자이므로 DB 기준에 부합 — 변경 불필요 |

---

## 5. 파일별 타입 위치 가이드

```
프로젝트
├── services/
│   ├── product/product.types.ts   → ProductData, CreateProductInput, UpdateProductInput
│   ├── order/order.types.ts       → OrderData (completed_at 포함), OrderDetailData, SellerOrderDetailData
│   ├── store/store.types.ts       → StoreData, CreateStoreInput, UpdateStoreInput
│   ├── review/review.types.ts     → ReviewData, ReviewWithDetails, StoreReviewStats
│   ├── cart/cart.types.ts         → CartItemData, CartItemWithProduct
│   └── favorite/favorite.types.ts → FavoriteStoreData
│
├── types/
│   ├── common.ts        → ApiSuccessResponse, ApiErrorResponse, ApiResponse,    ← ✅ 신규
│   │                       PaginatedResponse, PaginationMeta, DateRange,
│   │                       ReceiptStatus, isApiSuccess, isApiError
│   ├── store-admin.ts   → StoreProduct, StoreOrder (buyerId), SettlementData,    (공통 타입 re-export)
│   │                       ActiveProduct (reservedCount), DashboardStats (UI camelCase)
│   ├── admin.ts         → AdminDashboardStats, ConsumerListItem, ProducerListItem (공통 타입 re-export)
│   │                       InventoryItem (reservedCount) (UI camelCase)
│   └── consumer.ts      → CouponData, UserCouponData, PointTransaction, ReceiptData (혼용)
│                           OrderStatusFilter = "all"|"RESERVED"|"COMPLETED"|"CANCELED"
│
└── app/seller/actions.ts → ProductData (재export from services/product)
```

---

## 6. 변환 패턴 참조

### snake_case → camelCase 변환이 필요한 위치

| 위치 | 역할 | 예시 |
|------|------|------|
| `app/api/store/products/route.ts` `GET` | DB Product → StoreProduct | `original_price` → `originalPrice` |
| `app/api/store/products/[id]/status/route.ts` | DB Order → StoreOrder | 구현 필요 |
| `app/api/store/orders/route.ts` | DB Order → StoreOrder | 구현 필요 |

### 변환이 불필요한 위치 (snake_case 그대로 사용)

| 위치 | 이유 |
|------|------|
| `app/seller/*` (Server Component) | `ProductData`, `StoreData` 직접 사용 |
| `app/buyer/*` (Server Component) | `OrderDetailData`, `CartItemWithProduct` 직접 사용 |
| `app/mypage/*` (Server Component) | `CouponData`, `PointTransaction` 직접 사용 |
