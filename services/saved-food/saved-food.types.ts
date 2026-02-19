/**
 * @file services/saved-food/saved-food.types.ts
 * @description 구한 음식(Saved Food) 관련 타입 정의
 */

/**
 * 사용자별 구한 음식 요약 정보
 */
export interface SavedFoodSummary {
  /** 오늘 구한 음식 무게 (g) */
  today_saved_g: number;
  
  /** 전체 누적 구한 음식 무게 (g) */
  total_saved_g: number;
  
  /** 오늘 절감한 CO2 무게 (g) */
  today_co2_saved_g: number;
  
  /** 전체 누적 절감한 CO2 무게 (g) */
  total_co2_saved_g: number;
  
  /** 최근 기록 시점 (선택사항) */
  last_saved_at?: string | null;
}

/**
 * 구한 음식 로그 데이터
 */
export interface SavedFoodLog {
  id: string;
  user_id: string;
  order_id: string;
  product_id: string;
  saved_weight_g: number;
  co2_saved_g: number;
  created_at: string;
}

/**
 * 전체 서비스 통계 (모든 사용자 합산)
 */
export interface GlobalStats {
  /** 전체 서비스 누적 구한 음식 무게 (g) */
  total_saved_g: number;
  
  /** 전체 서비스 누적 절감한 CO2 무게 (g) */
  total_co2_saved_g: number;
  
  /** 참여 멤버 수 (BUYER 역할 사용자 총 수) */
  total_members: number;
}
