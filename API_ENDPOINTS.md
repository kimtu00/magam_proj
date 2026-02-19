# API Endpoints 문서

> **자동 생성일**: 2026-02-13  
> **기준**: 프로젝트 소스 코드 기반 (실제 존재하는 endpoint만 포함)

---

## 목차

- [1. 소비자 (Consumer/Buyer)](#1-소비자-consumerbuyer)
  - [1.1 API Routes](#11-api-routes)
  - [1.2 Server Actions](#12-server-actions)
- [2. 사장님 (Producer/Seller)](#2-사장님-producerseller)
  - [2.1 API Routes](#21-api-routes)
  - [2.2 Server Actions](#22-server-actions)
- [3. 관리자 (Admin)](#3-관리자-admin)
  - [3.1 API Routes](#31-api-routes)
  - [3.2 Server Actions](#32-server-actions)
- [4. 공통 (Common)](#4-공통-common)
  - [4.1 API Routes](#41-api-routes)
  - [4.2 Server Actions](#42-server-actions)
- [5. 크론잡 (Cron Jobs)](#5-크론잡-cron-jobs)
- [6. 요약 통계](#6-요약-통계)

---

## 1. 소비자 (Consumer/Buyer)

### 1.1 API Routes

#### 프로필

| 메서드 | 경로 | 설명 | 인증 | 비고 |
|--------|------|------|------|------|
| `GET` | `/api/user/profile` | 프로필 정보 + 빠른 통계(쿠폰, 포인트, 주문, 리뷰 수) 조회 | Clerk `auth()` | |
| `PUT` | `/api/user/profile` | 프로필 정보 수정 | Clerk `auth()` | |

<details>
<summary>요청/응답 상세</summary>

**PUT /api/user/profile**
- 요청: `{ name?: string, phone?: string, profile_image?: string }`
- 응답: `{ success: boolean, data: ConsumerProfile }`

</details>

#### 계좌

| 메서드 | 경로 | 설명 | 인증 | 비고 |
|--------|------|------|------|------|
| `GET` | `/api/user/bank-account` | 계좌 정보 조회 | Clerk `auth()` | |
| `POST` | `/api/user/bank-account` | 계좌 등록/수정 (UPSERT) | Clerk `auth()` | |

<details>
<summary>요청/응답 상세</summary>

**POST /api/user/bank-account**
- 요청: `{ bank_name: string, account_number: string, account_holder: string }`
- 응답: `{ success: boolean, data: BankAccount | null }`

</details>

#### 주문

| 메서드 | 경로 | 설명 | 인증 | 비고 |
|--------|------|------|------|------|
| `GET` | `/api/user/orders` | 주문 내역 목록 조회 (상태별 필터, 페이지네이션) | Clerk `auth()` | |
| `GET` | `/api/user/orders/[id]` | 특정 주문 상세 조회 | Clerk `auth()` | |

<details>
<summary>요청/응답 상세</summary>

**GET /api/user/orders**
- Query: `status?: string, page?: number, per_page?: number`
- 응답: `{ success: boolean, data: { orders: Order[], meta: PaginationMeta } }`

**GET /api/user/orders/[id]**
- Params: `id` (주문 UUID)
- 응답: `{ success: boolean, data: Order }`

</details>

#### 쿠폰 & 포인트

| 메서드 | 경로 | 설명 | 인증 | 비고 |
|--------|------|------|------|------|
| `GET` | `/api/user/coupons` | 쿠폰 목록 조회 (탭별 필터) | Clerk `auth()` | |
| `POST` | `/api/user/promo-codes/redeem` | 프로모션 코드로 쿠폰 등록 | Clerk `auth()` | |
| `GET` | `/api/user/points` | 포인트 잔액 + 통계 + 다음 페이백 정보 조회 | Clerk `auth()` | |
| `GET` | `/api/user/points/history` | 포인트 거래 내역 조회 (페이지네이션) | Clerk `auth()` | |

<details>
<summary>요청/응답 상세</summary>

**GET /api/user/coupons**
- Query: `tab?: 'available' | 'used' | 'expired' | 'all'`
- 응답: `{ success: boolean, data: CouponsResponse }`

**POST /api/user/promo-codes/redeem**
- 요청: `{ code: string }`
- 응답: `{ success: boolean, coupon: UserCoupon, message: string }`

**GET /api/user/points**
- 응답: `{ success: boolean, data: PointData }`

**GET /api/user/points/history**
- Query: `page?: number, per_page?: number`
- 응답: `{ success: boolean, data: PointHistoryResponse }`

</details>

#### 영수증 & 배지

| 메서드 | 경로 | 설명 | 인증 | 비고 |
|--------|------|------|------|------|
| `GET` | `/api/user/receipts` | 영수증 제출 내역 조회 (상태별 통계 포함) | Clerk `auth()` | |
| `POST` | `/api/user/receipts` | 영수증 제출 | Clerk `auth()` | |
| `GET` | `/api/user/badges` | 보유 배지 목록 조회 | Clerk `auth()` | |

<details>
<summary>요청/응답 상세</summary>

**POST /api/user/receipts**
- 요청: `{ order_id?: string, image_url: string }`
- 응답: `{ success: boolean, data: Receipt }`

</details>

#### 히어로 & 혜택

| 메서드 | 경로 | 설명 | 인증 | 비고 |
|--------|------|------|------|------|
| `GET` | `/api/user/hero` | 히어로 등급 정보 조회 | Clerk `auth()` | |
| `GET` | `/api/user/benefits` | 등급에 따른 혜택 목록 조회 (활성/잠김 상태) | Clerk `auth()` | |

---

### 1.2 Server Actions

#### `app/buyer/actions.ts` — 소비자 메인 액션

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getAvailableProducts` | 판매 가능 상품 리스트 조회 (거리 필터링, 즐겨찾기 우선 정렬) | `auth()` (선택) |
| `getProductById` | 상품 상세 정보 조회 | `auth()` (선택) |
| `reserveProduct` | 상품 예약 | `auth()` |
| `getMyOrders` | 현재 사용자의 예약 내역 조회 | `auth()` |
| `cancelOrder` | 예약 취소 | `auth()` |

#### `actions/cart.ts` — 장바구니

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `addToCart` | 장바구니에 상품 추가 | `auth()` |
| `getCartItems` | 장바구니 조회 | `auth()` |
| `getCartCount` | 장바구니 항목 수 조회 (네비 뱃지용) | `auth()` |
| `updateCartQuantity` | 장바구니 항목 수량 변경 | `auth()` |
| `updateCartPickupTime` | 장바구니 항목 픽업 시간 변경 | `auth()` |
| `removeFromCart` | 장바구니에서 상품 삭제 | `auth()` |
| `clearCart` | 장바구니 비우기 | `auth()` |
| `checkoutFromCart` | 장바구니 선택 예약 (체크아웃) | `auth()` |

#### `actions/address.ts` — 주소

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getBuyerAddress` | 현재 소비자의 주소 정보 조회 | `auth()` |
| `updateBuyerAddress` | 소비자의 주소 정보 저장/수정 | `auth()` |

#### `actions/favorite.ts` — 즐겨찾기

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `addFavoriteStore` | 즐겨찾기 추가 | `auth()` |
| `removeFavoriteStore` | 즐겨찾기 제거 | `auth()` |
| `getFavoriteStoreIds` | 즐겨찾기 목록 조회 | `auth()` |
| `getFavoriteStoreIdsServer` | 즐겨찾기 목록 조회 (서버 전용) | `auth()` |
| `checkIsFavorite` | 즐겨찾기 여부 확인 | `auth()` |

#### `actions/badge.ts` — 배지

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getUserBadges` | 현재 사용자의 보유 배지 목록 조회 | `auth()` |

#### `actions/saved-food.ts` — 구한 음식

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getSavedFood` | 현재 사용자의 구한 음식 요약 조회 | `auth()` |
| `getSavedFoodByDateRange` | 특정 기간의 구한 음식 조회 | `auth()` |
| `getGlobalStats` | 전체 서비스 통계 조회 | 없음 (공개) |

#### `actions/hero.ts` — 히어로

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getHeroStatus` | 히어로 등급 및 진행도 조회 | `auth()` |
| `getHeroUpgradeHistory` | 등급 상승 이력 조회 | `auth()` |

---

## 2. 사장님 (Producer/Seller)

### 2.1 API Routes

#### 상품 관리

| 메서드 | 경로 | 설명 | 인증 | 비고 |
|--------|------|------|------|------|
| `POST` | `/api/store/products` | 상품 등록 | Clerk `auth()` + 가게 소유 확인 | FormData |
| `PUT` | `/api/store/products/[id]` | 상품 수정 | Clerk `auth()` + 가게 소유 확인 | FormData |
| `DELETE` | `/api/store/products/[id]` | 상품 삭제 (소프트 삭제: CLOSED 처리) | Clerk `auth()` + 가게 소유 확인 | |
| `PATCH` | `/api/store/products/[id]/status` | 상품 상태 변경 | Clerk `auth()` + 가게 소유 확인 | |

<details>
<summary>요청/응답 상세</summary>

**POST /api/store/products** (FormData)
- 요청: `name, category, originalPrice, discountPrice, quantity, deadline, description, image, weight?`
- 응답: `{ success: boolean, data: Product, message: string }`

**PATCH /api/store/products/[id]/status**
- 요청: `{ status: 'ACTIVE' | 'CLOSED' | 'SOLD' }`
- 응답: `{ success: boolean, data: Product, message: string }`

</details>

#### 주문 관리

| 메서드 | 경로 | 설명 | 인증 | 비고 |
|--------|------|------|------|------|
| `PATCH` | `/api/store/orders/[id]/pickup` | 주문 픽업 확인 (완료 처리 + 히어로 등급 업데이트 + 탄소 절감 누적) | Clerk `auth()` + 가게 소유 확인 | |

<details>
<summary>요청/응답 상세</summary>

**PATCH /api/store/orders/[id]/pickup**
- 응답: `{ success: boolean, order: Order, heroGradeUpdated: boolean, carbonReduced: number }`

</details>

#### AI 예측

| 메서드 | 경로 | 설명 | 인증 | 비고 |
|--------|------|------|------|------|
| `POST` | `/api/store/predict-sell-through` | 상품 등록 전 소진율 예측 | Clerk `auth()` + 가게 확인 | |
| `GET` | `/api/store/predict-sell-through` | ML 서비스 상태 및 학습 데이터 통계 조회 | Clerk `auth()` + 가게 확인 | |
| `GET` | `/api/store/prediction-report` | 예측 정확도 리포트 조회 | Clerk `auth()` + 가게 확인 | |

<details>
<summary>요청/응답 상세</summary>

**POST /api/store/predict-sell-through**
- 요청: `{ product_category: string, original_price: number, discount_price: number, product_quantity: number, deadline_hours: number }`
- 응답: `{ predicted_sell_through: number, predicted_sell_through_percent: number, predicted_sold_quantity: number, confidence: string, confidence_score: number, factors: object, suggestion: string }`

**GET /api/store/prediction-report**
- Query: `period?: 'week' | 'month'`
- 응답: `{ accuracy_percent, total_predictions, completed_predictions, avg_error, mae, rmse, predictions[], best_conditions, insights, period }`

</details>

---

### 2.2 Server Actions

#### `app/seller/actions.ts` — 사장님 메인 액션

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getStore` | 현재 사용자의 가게 정보 조회 | `auth()` |
| `createStore` | 가게 정보 생성 | `auth()` |
| `updateStore` | 가게 정보 수정 | `auth()` |
| `getMyProducts` | 내 가게 상품 리스트 조회 | `auth()` |
| `updateProductStatus` | 상품 상태 업데이트 (판매 완료 처리) | `auth()` |
| `sellInStore` | 매장 판매 처리 (수량 차감) | `auth()` |

#### `app/seller/products/[id]/edit/actions.ts` — 상품 수정

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `updateProduct` | 상품 수정 (이미지 업로드 포함) | `auth()` |

#### `app/seller/upload/actions.ts` — 상품 등록

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `createProduct` | 상품 등록 (이미지 업로드 포함) | `auth()` |

#### `app/seller/menu/actions.ts` — 메뉴 템플릿

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getMenuTemplates` | 메뉴 템플릿 목록 조회 | `auth()` |
| `createMenuTemplate` | 메뉴 템플릿 생성 | `auth()` |
| `updateMenuTemplate` | 메뉴 템플릿 수정 | `auth()` |
| `deleteMenuTemplate` | 메뉴 템플릿 삭제 | `auth()` |

#### `app/seller/reservations/actions.ts` — 예약 관리

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getStoreReservations` | 사장님의 가게 예약 내역 조회 | `auth()` |

#### `app/seller/analytics/actions.ts` — 매출 분석

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getSalesAnalytics` | 매출 분석 데이터 조회 | `auth()` |
| `getDefaultAnalytics` | 기본 기간 (최근 30일) 매출 데이터 조회 | `auth()` |

#### `app/store-admin/actions.ts` — 사장님 대시보드

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getDashboardStats` | 오늘 현황 통계 (매출, 판매 건수, 소진율, 평점) | `auth()` |
| `getSalesChartData` | 매출 추이 차트 데이터 | `auth()` |
| `getActiveProducts` | 현재 판매중 상품 목록 | `auth()` |
| `getRecentOrders` | 최근 주문 목록 (대시보드용) | `auth()` |

#### `app/store-admin/settlement/actions.ts` — 정산

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getSettlementSummary` | 이번 달 정산 요약 (실시간 계산) | `auth()` |
| `getSettlementHistory` | 월별 정산 이력 | `auth()` |
| `getDailySettlement` | 일별 매출 상세 (특정 월) | `auth()` |
| `getStoreBank` | 정산 계좌 정보 조회 | `auth()` |

#### `app/store-admin/promotions/actions.ts` — 프로모션

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getStorePromotions` | 내 가게 프로모션 현황 조회 | `auth()` |
| `getCouponUsageStats` | 쿠폰 사용 현황 조회 | `auth()` |

---

## 3. 관리자 (Admin)

### 3.1 API Routes

#### 회원 관리

| 메서드 | 경로 | 설명 | 인증 | 비고 |
|--------|------|------|------|------|
| `POST` | `/api/admin/users/[id]/coupons` | 회원에게 쿠폰 수동 지급 | `requireAdmin()` | 감사 로그 기록 |
| `PATCH` | `/api/admin/users/[id]/points` | 회원 포인트 수동 조정 (적립/차감) | `requireAdmin()` | 감사 로그 기록 |
| `PATCH` | `/api/admin/users/[id]/grade` | 회원 등급 수동 조정 | `requireAdmin()` | 감사 로그 기록 |
| `PATCH` | `/api/admin/users/[id]/status` | 회원 상태 변경 (active/inactive/blocked) | `requireAdmin()` | 감사 로그 기록 |

<details>
<summary>요청/응답 상세</summary>

**POST /api/admin/users/[id]/coupons**
- 요청: `{ couponId: string, reason?: string }`
- 응답: `{ success: boolean, data: { userId, couponId }, message: string }`

**PATCH /api/admin/users/[id]/points**
- 요청: `{ amount: number, description: string }`
- 응답: `{ success: boolean, data: { userId, amount, newPoints }, message: string }`

**PATCH /api/admin/users/[id]/grade**
- 요청: `{ newGrade: string, newTier: number, reason: string }`
- 응답: `{ success: boolean, data: { userId, newGrade, newTier }, message: string }`

**PATCH /api/admin/users/[id]/status**
- 요청: `{ status: 'active' | 'inactive' | 'blocked', reason: string }`
- 응답: `{ success: boolean, data: { userId, status }, message: string }`

</details>

#### 가게 관리

| 메서드 | 경로 | 설명 | 인증 | 비고 |
|--------|------|------|------|------|
| `PATCH` | `/api/admin/stores/[id]/status` | 가게 상태 변경 (approved/rejected/inactive) | `requireAdmin()` | 감사 로그 기록 |

<details>
<summary>요청/응답 상세</summary>

**PATCH /api/admin/stores/[id]/status**
- 요청: `{ status: string, reason: string }`
- 응답: `{ success: boolean, data: { storeId, status }, message: string }`

</details>

#### 영수증 심사

| 메서드 | 경로 | 설명 | 인증 | 비고 |
|--------|------|------|------|------|
| `PATCH` | `/api/admin/payback/receipts/[id]` | 영수증 심사 (승인 시 포인트 지급) | `requireAdmin()` | 감사 로그 기록 |

<details>
<summary>요청/응답 상세</summary>

**PATCH /api/admin/payback/receipts/[id]**
- 요청: `{ status: 'approved' | 'rejected', reason?: string, paybackAmount?: number }`
- 응답: `{ success: boolean, data: { receiptId, status, paybackAmount }, message: string }`

</details>

#### 히어로 시스템

| 메서드 | 경로 | 설명 | 인증 | 비고 |
|--------|------|------|------|------|
| `GET` | `/api/admin/hero/users` | 사용자 검색 (이름, 이메일, ID) | `requireAdmin()` | |
| `PATCH` | `/api/admin/hero/users/[id]/grade` | 사용자 등급 수동 조정 | `requireAdmin()` | 업그레이드 로그 기록 |
| `GET` | `/api/admin/hero/upgrade-logs` | 등급 상승 이력 조회 (페이지네이션) | `requireAdmin()` | |
| `GET` | `/api/admin/hero/stats` | 히어로 시스템 통계 (등급별 분포) | `requireAdmin()` | |
| `GET` | `/api/admin/hero/config` | 히어로 등급 설정 조회 | `requireAdmin()` | |
| `POST` | `/api/admin/hero/config` | 히어로 등급 설정 추가 | `requireAdmin()` | |
| `PUT` | `/api/admin/hero/config/[id]` | 히어로 등급 설정 수정 | `requireAdmin()` | |
| `DELETE` | `/api/admin/hero/config/[id]` | 히어로 등급 설정 삭제 (소프트 삭제) | `requireAdmin()` | |
| `GET` | `/api/admin/hero/app-config` | 앱 설정값 조회 | `requireAdmin()` | |
| `PUT` | `/api/admin/hero/app-config` | 앱 설정값 업데이트 | `requireAdmin()` | |

<details>
<summary>요청/응답 상세</summary>

**GET /api/admin/hero/users**
- Query: `q?: string, limit?: number`
- 응답: `{ data: User[] }`

**PATCH /api/admin/hero/users/[id]/grade**
- 요청: `{ grade_level: number, reason: string }`
- 응답: `{ data: UserHero }`

**GET /api/admin/hero/upgrade-logs**
- Query: `page?: number, limit?: number, user_id?: string`
- 응답: `{ data: UpgradeLog[], pagination: PaginationMeta }`

**POST /api/admin/hero/config**
- 요청: `{ grade_level, grade_name, grade_emoji, required_pickups, required_weight_kg, condition_type, benefits_json, tree_image_url }`
- 응답: `{ data: HeroGradeConfig }`

**PUT /api/admin/hero/app-config**
- 요청: `{ configs: [{ key: string, value: string }] }`
- 응답: `{ success: boolean }`

</details>

#### ML / AI 예측

| 메서드 | 경로 | 설명 | 인증 | 비고 |
|--------|------|------|------|------|
| `POST` | `/api/admin/ml/retrain` | 모델 재학습 수동 트리거 | `requireAdmin()` | |
| `GET` | `/api/admin/ml/model-info` | ML 모델 정보 및 통계 조회 | `requireAdmin()` | |
| `GET` | `/api/admin/prediction/stats` | 학습 데이터 통계 조회 | `requireAdmin()` | |
| `POST` | `/api/admin/prediction/migrate` | 과거 데이터 마이그레이션 (1회성) | `requireAdmin()` | |

---

### 3.2 Server Actions

#### `app/admin/actions.ts` — 관리자 대시보드

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getAdminDashboardStats` | 대시보드 전체 통계 (8칸) | `requireAdmin()` |
| `getWeeklySalesChart` | 7일 매출 차트 데이터 | `requireAdmin()` |
| `getGradeDistribution` | 등급 분포 (파이 차트) | `requireAdmin()` |
| `getRecentOrders` | 최근 주문 10건 | `requireAdmin()` |
| `getRecentSignups` | 최근 가입 5명 | `requireAdmin()` |

#### `app/admin/users/actions.ts` — 회원 관리

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getConsumerList` | 소비자 목록 조회 (페이지네이션) | `requireAdmin()` |
| `getProducerList` | 사장님 목록 조회 (페이지네이션) | `requireAdmin()` |
| `getConsumerDetail` | 소비자 상세 정보 | `requireAdmin()` |
| `getProducerDetail` | 사장님 상세 정보 | `requireAdmin()` |
| `getUserOrders` | 회원의 주문 이력 | `requireAdmin()` |
| `getUserBenefits` | 회원의 혜택 현황 (쿠폰, 포인트) | `requireAdmin()` |

#### `app/admin/stores/actions.ts` — 가게 관리

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getStoreList` | 가게 목록 조회 (페이지네이션) | `requireAdmin()` |
| `getStoreDetail` | 가게 상세 정보 | `requireAdmin()` |
| `getStoreProducts` | 가게의 상품 목록 | `requireAdmin()` |
| `getInventoryList` | 전체 재고 통합 목록 | `requireAdmin()` |

#### `app/admin/promotions/actions.ts` — 프로모션

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getCouponList` | 쿠폰 목록 조회 | `requireAdmin()` |
| `getPromoCodeList` | 프로모션 코드 목록 조회 | `requireAdmin()` |
| `getGradeBenefits` | 등급별 혜택 설정 조회 | `requireAdmin()` |
| `getPromotionStats` | 프로모션 성과 통계 | `requireAdmin()` |

#### `app/admin/payback/actions.ts` — 페이백 (영수증 심사)

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getPendingReceipts` | 영수증 심사 대기 목록 | `requireAdmin()` |
| `getPaybackHistory` | 페이백 처리 이력 | `requireAdmin()` |
| `getPointStats` | 포인트 통계 | `requireAdmin()` |
| `getMonthlyPaybackBatch` | 월간 페이백 대상 조회 | `requireAdmin()` |
| `getPaybackSettings` | 페이백 설정 조회 | `requireAdmin()` |

#### `app/admin/finance/actions.ts` — 재무 관리

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getCashFlow` | 기간별 현금 흐름 | `requireAdmin()` |
| `getDailyCashFlow` | 일별 현금 흐름 | `requireAdmin()` |
| `getIncomeStatement` | 손익계산서 | `requireAdmin()` |
| `getBalanceSheet` | 대차대조표 | `requireAdmin()` |
| `getProfitability` | 수익성 분석 | `requireAdmin()` |
| `getStoreProfitability` | 가게별 수익 기여도 | `requireAdmin()` |
| `getUnitEconomics` | 단위 경제학 | `requireAdmin()` |

#### `app/admin/settings/actions.ts` — 시스템 설정

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getSystemSettings` | 시스템 설정 조회 | `requireAdmin()` |
| `getAdminList` | 관리자 계정 목록 (Clerk) | `requireAdmin()` |
| `getNoticeList` | 공지사항 목록 | `requireAdmin()` |
| `getAuditLogsList` | 감사 로그 조회 | `requireAdmin()` |

---

## 4. 공통 (Common)

### 4.1 API Routes

| 메서드 | 경로 | 설명 | 인증 | 비고 |
|--------|------|------|------|------|
| `GET` | `/api/auth/check-admin` | 관리자 여부 확인 | Clerk `isAdmin()` | |
| `POST` | `/api/sync-user` | Clerk → Supabase 사용자 동기화 | Clerk `auth()` | 로그인 시 자동 호출 |
| `GET` | `/api/address/search` | 카카오 주소 검색 API 프록시 | 없음 (공개) | CORS 우회 |

<details>
<summary>요청/응답 상세</summary>

**GET /api/auth/check-admin**
- 응답: `{ isAdmin: boolean }`

**POST /api/sync-user**
- 응답: `{ success: boolean, user: Profile }`

**GET /api/address/search**
- Query: `query: string`
- 응답: `{ documents: AddressDocument[], meta: { total_count, pageable_count } }`

</details>

### 4.2 Server Actions

#### `app/onboarding/actions.ts` — 온보딩

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `updateUserRole` | 역할 선택 업데이트 (consumer/producer) | `auth()` |

#### `actions/config.ts` — 앱 설정

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `getAppConfig` | 앱 설정값 조회 | 없음 |
| `getAppConfigNumber` | 앱 설정값을 숫자로 조회 | 없음 |

#### `actions/review.ts` — 리뷰 (소비자 + 사장님 공통)

| 함수명 | 설명 | 인증 | 역할 |
|--------|------|------|------|
| `createReview` | 리뷰 작성 | `auth()` | 소비자 |
| `updateReview` | 리뷰 수정 | `auth()` | 소비자 |
| `deleteReview` | 리뷰 삭제 | `auth()` | 소비자 |
| `getMyReviews` | 내가 작성한 리뷰 조회 | `auth()` | 소비자 |
| `getProductReviews` | 상품 리뷰 조회 | `auth()` (선택) | 소비자 |
| `getStoreReviews` | 가게 리뷰 조회 | `auth()` | 사장님 |
| `getStoreReviewStats` | 가게 리뷰 통계 | `auth()` | 사장님 |
| `createReviewReply` | 리뷰 답글 작성 | `auth()` | 사장님 |
| `updateReviewReply` | 리뷰 답글 수정 | `auth()` | 사장님 |
| `deleteReviewReply` | 리뷰 답글 삭제 | `auth()` | 사장님 |
| `reportReview` | 리뷰 신고 | `auth()` | 공통 |

#### `actions/orders.ts` — 주문 완료

| 함수명 | 설명 | 인증 |
|--------|------|------|
| `completeOrder` | 주문 픽업 완료 처리 | `auth()` |

#### `app/storage-test/actions.ts` — 스토리지 테스트

| 함수명 | 설명 | 인증 | 비고 |
|--------|------|------|------|
| `listFiles` | 파일 목록 조회 | `auth()` | 테스트 전용 |
| `uploadFileToStorage` | 파일 업로드 | `auth()` | 테스트 전용 |
| `downloadFileFromStorage` | 파일 다운로드 | `auth()` | 테스트 전용 |
| `deleteFileFromStorage` | 파일 삭제 | `auth()` | 테스트 전용 |

---

## 5. 크론잡 (Cron Jobs)

| 메서드 | 경로 | 설명 | 인증 | 실행 주기 |
|--------|------|------|------|-----------|
| `GET/POST` | `/api/cron/retrain-model` | ML 모델 주간 재학습 | `CRON_SECRET` (Bearer) | 주 1회 |
| `GET` | `/api/cron/collect-training` | 마감 상품 학습 데이터 수집 | `CRON_SECRET` (Bearer) | 매일 새벽 2시 |
| `GET` | `/api/cron/auto-complete` | 자동 구매확정 처리 (픽업 마감 +12시간) | `CRON_SECRET` (Bearer) | 매시간 |

---

## 6. 요약 통계

### API Routes 총계

| 구분 | 파일 수 | endpoint 수 |
|------|---------|-------------|
| 소비자 (Consumer) | 11 | 14 |
| 사장님 (Producer) | 6 | 9 |
| 관리자 (Admin) | 16 | 22 |
| 공통 (Common) | 3 | 3 |
| 크론잡 (Cron) | 3 | 3 |
| **합계** | **39** | **51** |

### Server Actions 총계

| 구분 | 파일 수 | 함수 수 |
|------|---------|---------|
| 소비자 (Consumer) | 7 | 23 |
| 사장님 (Producer) | 9 | 24 |
| 관리자 (Admin) | 7 | 30 |
| 공통 (Common) | 5 | 17 |
| **합계** | **28** | **94** |

### HTTP 메서드 분포 (API Routes)

| 메서드 | 개수 |
|--------|------|
| `GET` | 25 |
| `POST` | 9 |
| `PUT` | 3 |
| `PATCH` | 9 |
| `DELETE` | 2 |

### 인증 방식 분류

| 방식 | 설명 | 사용처 |
|------|------|--------|
| Clerk `auth()` | 로그인 사용자 확인 | 소비자/사장님 API Routes + 대부분의 Server Actions |
| `requireAdmin()` | 관리자 권한 확인 (Clerk 기반) | 관리자 API Routes + Server Actions |
| `CRON_SECRET` | Bearer Token | 크론잡 전용 |
| 없음 (공개) | 인증 불필요 | 주소 검색, 앱 설정, 전체 통계 |
