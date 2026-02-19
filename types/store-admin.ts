/**
 * @file types/store-admin.ts
 * @description 사장님 대시보드용 타입 정의
 *
 * 이 파일은 사장님(생산자) 대시보드에서 사용하는 모든 데이터 타입을 정의합니다.
 *
 * 주요 타입:
 * 1. DashboardStats: 대시보드 메인 통계
 * 2. SalesChartData: 매출 추이 차트 데이터
 * 3. SettlementData: 정산 관련 데이터
 * 4. StorePromotionData: 프로모션 현황 데이터
 * 5. StoreProfileData: 가게 정보 데이터
 */

import type { ApiSuccessResponse, ApiErrorResponse, ApiResponse, PaginatedResponse, DateRange } from "./common";
export type { ApiSuccessResponse, ApiErrorResponse, ApiResponse, PaginatedResponse, DateRange } from "./common";

// --------------------------------------------------------
// Dashboard (대시보드)
// --------------------------------------------------------

/**
 * 오늘 현황 통계 (4칸)
 */
export interface DashboardStats {
  todaySales: number;          // 오늘 매출
  todayOrders: number;         // 오늘 판매 건수
  sellThroughRate: number;     // 소진율 (%)
  averageRating: number;       // 평균 평점
}

/**
 * 매출 추이 차트 데이터 (일별)
 */
export interface SalesChartData {
  date: string;                // 날짜 (YYYY-MM-DD)
  sales: number;               // 매출
  orders: number;              // 주문 건수
}

/**
 * 현재 판매중 상품 (대시보드용 간소화)
 */
export interface ActiveProduct {
  id: string;
  name: string;
  category: string;
  originalPrice: number;
  discountPrice: number;
  quantity: number;
  reservedCount: number;
  deadline: string;            // ISO 날짜
  status: 'ACTIVE' | 'CLOSED';
}

/**
 * 최근 주문 (대시보드용 간소화)
 */
export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  status: 'RESERVED' | 'COMPLETED' | 'CANCELED';
  createdAt: string;           // ISO 날짜
}

// --------------------------------------------------------
// Products (상품 관리)
// --------------------------------------------------------

/**
 * 상품 관리 테이블 데이터
 */
export interface StoreProduct {
  id: string;
  name: string;
  category: string;
  originalPrice: number;
  discountPrice: number;
  quantity: number;
  weight: number;
  status: 'ACTIVE' | 'CLOSED';
  deadline: string;
  reservedCount: number;
  createdAt: string;
}

/**
 * 상품 등록/수정 폼 데이터
 */
export interface ProductFormData {
  name: string;
  category: string;
  originalPrice: number;
  discountPrice: number;
  quantity: number;
  weight: number;
  deadline: string;            // ISO 날짜
  description?: string;
  images?: string[];           // 이미지 URL 배열
}

/**
 * 상품 등록 API 요청
 */
export interface CreateProductRequest extends ProductFormData {
  storeId: string;
}

/**
 * 상품 수정 API 요청
 */
export interface UpdateProductRequest extends Partial<ProductFormData> {
  productId: string;
}

// --------------------------------------------------------
// Orders (주문 관리)
// --------------------------------------------------------

/**
 * 주문 상태 타입
 */
export type OrderStatus = 'RESERVED' | 'COMPLETED' | 'CANCELED';

/**
 * 주문 테이블 데이터
 */
export interface StoreOrder {
  id: string;
  orderNumber: string;
  buyerId: string;
  customerName: string;
  productId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  status: OrderStatus;
  pickupTime?: string;         // 픽업 희망 시간
  completedAt?: string;        // 픽업 완료 시간
  createdAt: string;
}

/**
 * 픽업 확인 API 요청
 */
export interface PickupConfirmRequest {
  orderId: string;
}

/**
 * 픽업 확인 API 응답
 */
export interface PickupConfirmResponse {
  success: boolean;
  order: StoreOrder;
  heroGradeUpdated?: boolean;  // 히어로 등급 업데이트 여부
  carbonReduced?: number;      // 탄소 절감량 (g)
}

// --------------------------------------------------------
// Settlement (정산 관리)
// --------------------------------------------------------

/**
 * 정산 상태 타입
 */
export type SettlementStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * 이번 달 정산 요약
 */
export interface SettlementSummary {
  totalSales: number;          // 총 매출
  totalOrders: number;         // 총 주문 건수
  commissionRate: number;      // 수수료율 (%)
  commissionAmount: number;    // 수수료 금액
  settlementAmount: number;    // 정산 예정 금액
  settlementDate: string;      // 정산 예정일 (매월 5일)
}

/**
 * 월별 정산 이력
 */
export interface SettlementData {
  id: string;
  storeId: string;
  periodStart: string;         // 정산 기간 시작
  periodEnd: string;           // 정산 기간 종료
  totalSales: number;
  totalOrders: number;
  commissionRate: number;
  commissionAmount: number;
  settlementAmount: number;
  status: SettlementStatus;
  settledAt?: string;          // 정산 완료 시각
  createdAt: string;
}

/**
 * 일별 매출 상세
 */
export interface DailySettlement {
  saleDate: string;            // 날짜 (YYYY-MM-DD)
  ordersCount: number;         // 주문 건수
  totalSales: number;          // 매출
  commissionAmount: number;    // 수수료
  settlementAmount: number;    // 정산 금액
}

/**
 * 정산 계좌 정보
 */
export interface SettlementBankAccount {
  id: string;
  userId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isPrimary: boolean;
}

// --------------------------------------------------------
// Promotions (프로모션 현황)
// --------------------------------------------------------

/**
 * 프로모션 타입
 */
export type PromotionType = 'platform' | 'store';

/**
 * 프로모션 현황 데이터
 */
export interface StorePromotionData {
  id: string;
  storeId: string;
  couponId?: string;
  name: string;
  description?: string;
  type: PromotionType;
  usedCount: number;
  commissionAdjustment: number;  // 수수료 조정 (% 또는 금액)
  adjustmentType?: 'percent' | 'amount';
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  createdAt: string;
}

/**
 * 쿠폰 사용 현황
 */
export interface CouponUsageStats {
  couponCode: string;
  couponName: string;
  usedCount: number;
  totalDiscount: number;       // 총 할인액
  commissionImpact: number;    // 수수료 영향액
}

/**
 * 수수료 조정 이력
 */
export interface CommissionHistory {
  id: string;
  promotionName: string;
  adjustment: number;
  appliedOrders: number;
  totalImpact: number;
  date: string;
}

// --------------------------------------------------------
// Store Profile (가게 정보)
// --------------------------------------------------------

/**
 * 가게 정보 (편집용)
 */
export interface StoreProfileData {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  phone: string;
  description?: string;
  category: string[];
  openingHours?: string;       // JSON 문자열 또는 객체
  businessNumber?: string;     // 사업자번호
  ownerName?: string;          // 대표자명
  imageUrl?: string;           // 가게 이미지
  logoUrl?: string;            // 로고
  createdAt: string;
}

/**
 * 가게 정보 수정 폼 데이터
 */
export interface StoreProfileFormData {
  name: string;
  address: string;
  phone: string;
  description?: string;
  category: string[];
  openingHours?: string;
  businessNumber?: string;
  ownerName?: string;
}

/**
 * 가게 이미지 업로드 요청
 */
export interface StoreImageUploadRequest {
  storeId: string;
  imageType: 'image' | 'logo';
  imageUrl: string;
}

// --------------------------------------------------------
// Reviews (리뷰 관리)
// --------------------------------------------------------

/**
 * 리뷰 통계
 */
export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

/**
 * 리뷰 데이터 (사장님용)
 */
export interface StoreReviewData {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  productId: string;
  productName: string;
  rating: number;
  content: string;
  images?: string[];
  replyContent?: string;       // 사장님 답글
  replyCreatedAt?: string;
  createdAt: string;
}

/**
 * 리뷰 답글 작성 요청
 */
export interface CreateReviewReplyRequest {
  reviewId: string;
  replyContent: string;
}

// --------------------------------------------------------
// Predict (소진율 예측)
// --------------------------------------------------------

/**
 * 예측 입력 폼 데이터
 */
export interface PredictionInput {
  category: string;
  originalPrice: number;
  discountPrice: number;
  quantity: number;
  deadlineHours: number;       // 마감까지 남은 시간
}

/**
 * 예측 결과
 */
export interface PredictionResult {
  predictedSellThrough: number;  // 예상 소진율 (%)
  confidence: number;            // 신뢰도 (%)
  keyFactors: string[];          // 주요 영향 요인
  recommendation?: string;       // 추천 사항
}

/**
 * 예측 정확도 리포트
 */
export interface PredictionAccuracyReport {
  period: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  totalPredictions: number;
  averageAccuracy: number;      // 평균 정확도 (%)
  bestCategory: string;         // 가장 정확한 카테고리
  worstCategory: string;        // 가장 부정확한 카테고리
}

// --------------------------------------------------------
// Helper Types
// --------------------------------------------------------

/**
 * 페이지네이션 파라미터
 */
export interface PaginationParams {
  page: number;
  limit: number;
}
