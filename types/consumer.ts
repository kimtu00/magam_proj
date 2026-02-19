/**
 * @file types/consumer.ts
 * @description 소비자 마이페이지 API 타입 정의
 * 
 * 이 파일은 소비자 마이페이지에서 사용하는 모든 데이터 타입을 정의합니다.
 * 각 타입은 Supabase 테이블 스키마와 일치하며, API 요청/응답에 사용됩니다.
 */

import type { ApiSuccessResponse, ApiErrorResponse, ApiResponse, PaginatedResponse, DateRange, ReceiptStatus } from "./common";
export type { ApiSuccessResponse, ApiErrorResponse, ApiResponse, DateRange, ReceiptStatus } from "./common";
export { isApiSuccess, isApiError } from "./common";

// --------------------------------------------------------
// 1. 쿠폰 관련 타입
// --------------------------------------------------------

/** 쿠폰 할인 타입 */
export type DiscountType = "percent" | "amount";

/** 쿠폰 상태 */
export type UserCouponStatus = "available" | "used" | "expired";

/** 쿠폰 정의 (관리자가 생성) */
export interface CouponData {
  id: string;
  code: string | null;
  name: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  valid_from: string;
  valid_until: string;
  total_quantity: number | null;
  issued_count: number;
  is_active: boolean;
  created_at: string;
}

/** 사용자별 쿠폰 */
export interface UserCouponData {
  id: string;
  user_id: string;
  coupon_id: string;
  status: UserCouponStatus;
  used_at: string | null;
  used_order_id: string | null;
  acquired_at: string;
  coupon?: CouponData; // JOIN으로 가져온 쿠폰 정보
}

/** 쿠폰 목록 조회 응답 */
export interface CouponsResponse {
  coupons: UserCouponData[];
  total: number;
  available_count: number;
  used_count: number;
  expired_count: number;
}

/** 프로모션 코드 등록 요청 */
export interface RedeemPromoCodeRequest {
  code: string;
}

/** 프로모션 코드 등록 응답 */
export interface RedeemPromoCodeResponse {
  success: boolean;
  coupon?: UserCouponData;
  message: string;
}

// --------------------------------------------------------
// 2. 포인트 관련 타입
// --------------------------------------------------------

/** 포인트 거래 타입 */
export type PointTransactionType = "earn" | "spend" | "payback" | "expire";

/** 포인트 거래 내역 */
export interface PointTransaction {
  id: string;
  user_id: string;
  type: PointTransactionType;
  amount: number;
  balance_after: number;
  description: string | null;
  related_order_id: string | null;
  created_at: string;
}

/** 포인트 요약 정보 */
export interface PointSummary {
  current_balance: number;
  next_payback: {
    amount: number;
    date: string | null;
  };
  lifetime_earned: number;
  lifetime_spent: number;
}

/** 포인트 데이터 (요약 + 최근 거래) */
export interface PointData {
  summary: PointSummary;
  recent_transactions: PointTransaction[];
}

/** 포인트 이력 조회 응답 */
export interface PointHistoryResponse {
  transactions: PointTransaction[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// --------------------------------------------------------
// 3. 계좌 관련 타입
// --------------------------------------------------------

/** 계좌 정보 */
export interface BankAccountData {
  id: string;
  user_id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

/** 계좌 등록/수정 요청 */
export interface BankAccountRequest {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

// --------------------------------------------------------
// 4. 영수증 관련 타입
// --------------------------------------------------------

/** 영수증 제출 내역 */
export interface ReceiptData {
  id: string;
  user_id: string;
  order_id: string | null;
  image_url: string;
  status: ReceiptStatus;
  reject_reason: string | null;
  payback_amount: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

/** 영수증 제출 요청 */
export interface SubmitReceiptRequest {
  order_id?: string;
  image_url: string;
}

/** 영수증 목록 조회 응답 */
export interface ReceiptsResponse {
  receipts: ReceiptData[];
  total: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
}

// --------------------------------------------------------
// 5. 프로필 관련 타입
// --------------------------------------------------------

/** 빠른 통계 (마이페이지 메인 화면) */
export interface QuickStats {
  coupons: number;
  points: number;
  orders: number;
  reviews: number;
}

/** 소비자 프로필 요약 */
export interface ConsumerProfile {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
  hero_level: string;
  hero_tier: number;
  quick_stats: QuickStats;
  created_at: string;
}

/** 프로필 수정 요청 */
export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  profile_image?: string;
}

// --------------------------------------------------------
// 6. 주문 관련 타입 (기존 타입 재사용)
// --------------------------------------------------------

/** 주문 상태 필터 */
export type OrderStatusFilter = "all" | "RESERVED" | "COMPLETED" | "CANCELED";

/** 주문 목록 조회 쿼리 */
export interface OrdersQuery {
  status?: OrderStatusFilter;
  page?: number;
  per_page?: number;
}

// --------------------------------------------------------
// 7. 혜택 관련 타입
// --------------------------------------------------------

/** 혜택 타입 */
export type BenefitType = "discount" | "free_delivery" | "priority" | "exclusive";

/** 혜택 상태 */
export type BenefitStatus = "active" | "locked";

/** 혜택 정보 */
export interface BenefitData {
  id: string;
  type: BenefitType;
  title: string;
  description: string;
  icon: string;
  required_tier: number;
  status: BenefitStatus;
  unlock_condition?: string;
}

/** 혜택 목록 조회 응답 */
export interface BenefitsResponse {
  benefits: BenefitData[];
  user_tier: number;
  active_count: number;
  locked_count: number;
}

// --------------------------------------------------------
// 8. 히어로 관련 타입 (기존 타입 확장)
// --------------------------------------------------------

/** 환경 기여 요약 */
export interface EnvironmentSummary {
  saved_meals: number;
  co2_reduced: number; // kg
  trees_planted_equivalent: number;
}

/** 히어로 상세 정보 (기존 HeroStatus + 환경 기여) */
export interface HeroDetailData {
  level: string;
  tier: number;
  current_points: number;
  next_tier_points: number;
  progress_percentage: number;
  environment: EnvironmentSummary;
  badges: any[]; // BadgeService에서 가져온 배지 목록
  benefits: BenefitData[];
}

// --------------------------------------------------------
// 9. 알림 설정 타입
// --------------------------------------------------------

/** 알림 설정 */
export interface NotificationSettings {
  order_updates: boolean;
  marketing: boolean;
  event: boolean;
  night_mode: boolean; // 야간 알림 수신 거부
}

/** 알림 설정 수정 요청 */
export interface UpdateNotificationSettingsRequest {
  order_updates?: boolean;
  marketing?: boolean;
  event?: boolean;
  night_mode?: boolean;
}

// --------------------------------------------------------
// 10. 페이지네이션 타입 (공통 PaginatedResponse 사용)
// --------------------------------------------------------

export type { PaginatedResponse } from "./common";
