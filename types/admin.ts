/**
 * @file types/admin.ts
 * @description 플랫폼 관리자 대시보드용 타입 정의
 *
 * 이 파일은 관리자 대시보드에서 사용하는 모든 데이터 타입을 정의합니다.
 *
 * 주요 타입:
 * 1. AdminDashboardStats: 대시보드 메인 통계
 * 2. AdminUserListItem, AdminUserDetail: 회원 관리
 * 3. AdminStoreListItem, AdminStoreDetail: 가게 관리
 * 4. AdminCouponData, AdminPromoCodeData: 혜택 관리
 * 5. CashFlowData, FinancialStatement: 재무 관리
 * 6. PaybackItem, PaybackSettings: 페이백 관리
 * 7. AuditLogEntry: 감사 로그
 * 8. AdminSettings: 시스템 설정
 */

import type { ApiSuccessResponse, ApiErrorResponse, ApiResponse, PaginatedResponse, DateRange, ReceiptStatus } from "./common";
export type { ApiSuccessResponse, ApiErrorResponse, ApiResponse, PaginatedResponse, DateRange, ReceiptStatus } from "./common";

// --------------------------------------------------------
// Dashboard (대시보드)
// --------------------------------------------------------

/**
 * 관리자 대시보드 전체 현황 통계 (8칸)
 */
export interface AdminDashboardStats {
  todaySales: number;           // 오늘 매출
  todayOrders: number;          // 거래 건수
  newSignups: number;           // 신규 가입
  carbonReduced: number;        // 탄소 절감 (kg)
  activeStores: number;         // 활성 가게
  pendingReceipts: number;      // 영수증 대기
  pendingPayback: number;       // 페이백 예정 금액
  totalMembers: number;         // 총 회원
}

/**
 * 매출 차트 데이터 (일별)
 */
export interface SalesChartData {
  date: string;                 // 날짜 (YYYY-MM-DD)
  sales: number;                // 매출
  orders: number;               // 주문 건수
}

/**
 * 등급 분포 데이터 (파이 차트용)
 */
export interface GradeDistribution {
  grade: string;                // 등급명
  count: number;                // 회원 수
  percentage: number;           // 비율 (%)
}

/**
 * 최근 주문 (관리자용)
 */
export interface RecentOrderAdmin {
  id: string;
  orderNumber: string;
  customerName: string;
  storeName: string;
  productName: string;
  amount: number;
  status: string;
  createdAt: string;
}

/**
 * 최근 가입 회원
 */
export interface RecentSignup {
  userId: string;
  name: string;
  email: string;
  role: "consumer" | "producer";
  createdAt: string;
}

// --------------------------------------------------------
// Users (회원 관리)
// --------------------------------------------------------

/**
 * 회원 타입
 */
export type UserType = "consumer" | "producer";

/**
 * 회원 상태
 */
export type UserStatus = "active" | "inactive" | "blocked";

/**
 * 소비자 목록 행
 */
export interface ConsumerListItem {
  userId: string;               // Clerk user ID
  name: string;
  age?: number;
  gender?: string;
  heroGrade: string;            // 히어로 등급
  heroTier: number;
  purchaseCount: number;        // 구매 횟수
  points: number;               // 포인트
  status: UserStatus;
  createdAt: string;
}

/**
 * 사장님 목록 행
 */
export interface ProducerListItem {
  userId: string;               // Clerk user ID
  name: string;
  storeName?: string;
  storeId?: string;
  region?: string;
  productCount: number;         // 등록 상품 수
  totalSales: number;           // 총 판매액
  sellThroughRate: number;      // 평균 소진율 (%)
  status: UserStatus;
  createdAt: string;
}

/**
 * 소비자 상세 정보
 */
export interface ConsumerDetail {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  age?: number;
  gender?: string;
  profileImage?: string;
  
  // 히어로 등급
  heroGrade: string;
  heroTier: number;
  heroProgress: number;
  
  // 통계
  purchaseCount: number;
  totalSpent: number;
  points: number;
  savedMeals: number;
  carbonReduced: number;
  
  // 혜택 현황
  activeCoupons: number;
  usedCoupons: number;
  
  // 메타
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
}

/**
 * 사장님 상세 정보
 */
export interface ProducerDetail {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  
  // 가게 정보
  storeId?: string;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  storeImage?: string;
  
  // 통계
  productCount: number;
  totalSales: number;
  totalOrders: number;
  averageRating: number;
  sellThroughRate: number;
  
  // 정산
  commissionRate: number;
  lastSettlement?: string;
  
  // 메타
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
}

/**
 * 회원 상태 변경 요청
 */
export interface UpdateUserStatusRequest {
  userId: string;
  status: UserStatus;
  reason: string;               // 변경 사유
}

/**
 * 등급 수동 조정 요청
 */
export interface AdjustGradeRequest {
  userId: string;
  newGrade: string;
  newTier: number;
  reason: string;
}

/**
 * 포인트 수동 조정 요청
 */
export interface AdjustPointsRequest {
  userId: string;
  amount: number;               // 양수: 적립, 음수: 차감
  description: string;
}

/**
 * 쿠폰 수동 지급 요청
 */
export interface AssignCouponRequest {
  userId: string;
  couponId: string;
  reason?: string;
}

// --------------------------------------------------------
// Stores (가게 관리)
// --------------------------------------------------------

/**
 * 가게 상태
 */
export type StoreStatus = "pending" | "approved" | "rejected" | "inactive";

/**
 * 가게 목록 행
 */
export interface StoreListItem {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  address?: string;
  region?: string;
  productCount: number;
  sellThroughRate: number;      // 평균 소진율 (%)
  averageRating: number;
  status: StoreStatus;
  createdAt: string;
}

/**
 * 가게 상세 정보
 */
export interface StoreDetail {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  address?: string;
  phone?: string;
  description?: string;
  imageUrl?: string;
  category?: string[];
  openingHours?: string;
  
  // 통계
  productCount: number;
  activeProductCount: number;
  totalSales: number;
  totalOrders: number;
  sellThroughRate: number;
  averageRating: number;
  reviewCount: number;
  
  // 정산
  commissionRate: number;
  totalCommission: number;
  
  // 메타
  status: StoreStatus;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

/**
 * 가게 상태 변경 요청
 */
export interface UpdateStoreStatusRequest {
  storeId: string;
  status: StoreStatus;
  reason: string;
}

/**
 * 수수료율 개별 조정 요청
 */
export interface AdjustCommissionRequest {
  storeId: string;
  commissionRate: number;       // 새 수수료율 (%)
  reason: string;
}

/**
 * 전체 재고 통합 뷰 (모든 가게)
 */
export interface InventoryItem {
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  category: string;
  originalPrice: number;
  discountPrice: number;
  quantity: number;
  reservedCount: number;
  weight: number;
  status: string;
  deadline: string;
  createdAt: string;
}

// --------------------------------------------------------
// Promotions (혜택/프로모션)
// --------------------------------------------------------

/**
 * 쿠폰 데이터 (관리자용)
 */
export interface AdminCouponData {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: "percent" | "amount";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  totalQuantity?: number;
  issuedCount: number;
  usedCount?: number;
  isActive: boolean;
  createdAt: string;
}

/**
 * 쿠폰 생성/수정 요청
 */
export interface CouponFormData {
  code: string;
  name: string;
  description?: string;
  discountType: "percent" | "amount";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  totalQuantity?: number;
  isActive: boolean;
}

/**
 * 프로모 코드 데이터
 */
export interface AdminPromoCodeData {
  id: string;
  code: string;
  name: string;
  channel?: string;             // 유입 채널 추적
  discountType: "percent" | "amount";
  discountValue: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * 등급 혜택 데이터
 */
export interface GradeBenefitData {
  grade: string;
  tier: number;
  benefits: {
    discountRate: number;       // 추가 할인율 (%)
    pointsRate: number;          // 포인트 적립률 (%)
    freeShipping: boolean;
    prioritySupport: boolean;
    exclusiveCoupons: boolean;
  };
}

/**
 * 프로모션 성과 통계
 */
export interface PromotionStats {
  totalCouponsIssued: number;
  totalCouponsUsed: number;
  usageRate: number;            // 사용률 (%)
  totalDiscount: number;        // 총 할인액
  averageOrderValue: number;    // 평균 주문액
  conversionRate: number;       // 전환율 (%)
}

// --------------------------------------------------------
// Finance (재무/수익)
// --------------------------------------------------------

/**
 * 현금 흐름 데이터
 */
export interface CashFlowData {
  period: string;               // 기간 (YYYY-MM)
  inflow: number;               // 유입 (매출)
  outflow: number;              // 유출 (정산, 운영비)
  netFlow: number;              // 순흐름
}

/**
 * 일별 현금 흐름
 */
export interface DailyCashFlow {
  date: string;
  sales: number;                // 매출 (유입)
  settlements: number;          // 정산 (유출)
  operations: number;           // 운영비 (유출)
  net: number;                  // 순현금흐름
}

/**
 * 손익계산서
 */
export interface IncomeStatement {
  period: string;
  revenue: number;              // 매출액
  commissionRevenue: number;    // 수수료 수익
  operatingExpenses: number;    // 운영비
  grossProfit: number;          // 매출총이익
  operatingProfit: number;      // 영업이익
  netProfit: number;            // 순이익
}

/**
 * 대차대조표
 */
export interface BalanceSheet {
  asOf: string;                 // 기준일
  assets: {
    cash: number;
    receivables: number;        // 미수금
    total: number;
  };
  liabilities: {
    payables: number;           // 미지급금 (정산 예정)
    total: number;
  };
  equity: {
    capital: number;
    retainedEarnings: number;
    total: number;
  };
}

/**
 * 수익성 분석
 */
export interface ProfitabilityData {
  period: string;
  revenueGrowth: number;        // 매출 성장률 (%)
  profitMargin: number;         // 이익률 (%)
  roi: number;                  // 투자수익률 (%)
  ltv: number;                  // 고객 생애 가치
  cac: number;                  // 고객 획득 비용
}

/**
 * 가게별 기여도
 */
export interface StoreContribution {
  storeId: string;
  storeName: string;
  totalSales: number;
  commission: number;
  contribution: number;         // 기여도 (%)
  orderCount: number;
}

/**
 * 단위 경제학
 */
export interface UnitEconomics {
  averageOrderValue: number;    // 평균 주문 금액
  averageCommission: number;    // 평균 수수료
  averageCost: number;          // 평균 비용
  averageProfit: number;        // 평균 이익
  breakEvenOrders: number;      // 손익분기 주문 수
}

// --------------------------------------------------------
// Payback (페이백 관리)
// --------------------------------------------------------

/**
 * 영수증 심사 항목
 */
export interface PaybackReceiptItem {
  id: string;
  userId: string;
  userName: string;
  orderId: string;
  orderNumber: string;
  imageUrl: string;
  status: ReceiptStatus;
  rejectReason?: string;
  paybackAmount?: number;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

/**
 * 영수증 심사 요청
 */
export interface ReviewReceiptRequest {
  receiptId: string;
  status: "approved" | "rejected";
  reason?: string;              // 거절 사유
  paybackAmount?: number;       // 승인 시 페이백 금액
}

/**
 * 포인트 관리 항목
 */
export interface PointManagementItem {
  userId: string;
  userName: string;
  currentPoints: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lastTransaction?: string;
}

/**
 * 월간 페이백 대상
 */
export interface PaybackBatchItem {
  userId: string;
  userName: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  paybackAmount: number;
  status: "pending" | "processed" | "failed";
  processedAt?: string;
}

/**
 * 페이백 설정
 */
export interface PaybackSettings {
  pointsPerPurchase: number;    // 구매당 포인트 (%)
  minPaybackAmount: number;     // 최소 페이백 금액
  paybackDay: number;           // 매월 페이백 처리일
  receiptValidDays: number;     // 영수증 유효 기간 (일)
}

// --------------------------------------------------------
// Audit Logs (감사 로그)
// --------------------------------------------------------

/**
 * 감사 로그 항목
 */
export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail?: string;
  action: string;               // 액션 유형
  targetType: string;           // 대상 유형
  targetId: string;
  targetName?: string;
  details?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  createdAt: string;
}

/**
 * 감사 로그 필터
 */
export interface AuditLogFilter {
  adminId?: string;
  action?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
}

// --------------------------------------------------------
// Settings (시스템 설정)
// --------------------------------------------------------

/**
 * 관리자 계정 (Clerk)
 */
export interface AdminAccount {
  userId: string;               // Clerk user ID
  name: string;
  email: string;
  role: "admin" | "super_admin";
  createdAt: string;
  lastLoginAt?: string;
}

/**
 * 시스템 설정
 */
export interface AdminSettings {
  // 수수료
  defaultCommissionRate: number;
  
  // 알림
  emailNotifications: boolean;
  pushNotifications: boolean;
  
  // CO2 환산
  co2PerMeal: number;           // 식사 1회당 CO2 절감량 (g)
  
  // 기타
  serviceName: string;
  maintenanceMode: boolean;
}

/**
 * 공지사항
 */
export interface NoticeData {
  id: string;
  title: string;
  content: string;
  type: "system" | "event" | "maintenance";
  targetRole?: "consumer" | "producer" | "all";
  isActive: boolean;
  startDate: string;
  endDate?: string;
  createdBy: string;
  createdAt: string;
}

// --------------------------------------------------------
// Helper Types
// --------------------------------------------------------

/**
 * 정렬 옵션
 */
export interface SortOption {
  field: string;
  order: "asc" | "desc";
}

/**
 * 필터 옵션 (범용)
 */
export interface FilterOptions {
  search?: string;
  status?: string;
  category?: string;
  dateRange?: DateRange;
  sort?: SortOption;
}

/**
 * CSV 내보내기 옵션
 */
export interface ExportOptions {
  type: UserType;
  filters?: FilterOptions;
  fields?: string[];            // 내보낼 필드 선택
}
