/**
 * Analytics 관련 타입 정의
 */

/**
 * 매출 통계 요약
 */
export interface SalesSummary {
  totalSales: number;      // 총 매출액
  totalOrders: number;     // 총 주문 건수
  averageOrder: number;    // 평균 주문 금액
  completionRate: number;  // 완료율 (완료/전체)
}

/**
 * 일별 매출 데이터
 */
export interface DailySales {
  date: string;           // YYYY-MM-DD
  sales: number;          // 매출액
  orders: number;         // 주문 건수
}

/**
 * 주별 매출 데이터
 */
export interface WeeklySales {
  weekStart: string;      // 주 시작일 (YYYY-MM-DD)
  weekEnd: string;        // 주 종료일 (YYYY-MM-DD)
  weekLabel: string;      // 표시용 레이블 (예: "1월 1주")
  sales: number;          // 매출액
  orders: number;         // 주문 건수
}

/**
 * 월별 매출 데이터
 */
export interface MonthlySales {
  month: string;          // YYYY-MM
  monthLabel: string;     // 표시용 레이블 (예: "2026년 1월")
  sales: number;          // 매출액
  orders: number;         // 주문 건수
}

/**
 * 상품별 매출 순위
 */
export interface ProductSalesRank {
  productId: string;
  productName: string;
  productImage: string | null;
  totalSales: number;      // 총 매출액
  totalOrders: number;     // 총 주문 건수
  totalQuantity: number;   // 총 판매 수량
}

/**
 * 매출 분석 데이터 (전체)
 */
export interface SalesAnalytics {
  summary: SalesSummary;
  dailySales: DailySales[];
  weeklySales: WeeklySales[];
  monthlySales: MonthlySales[];
  topProducts: ProductSalesRank[];
}

/**
 * 기간 타입
 */
export type PeriodType = 'daily' | 'weekly' | 'monthly';
