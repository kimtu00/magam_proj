/**
 * @file prediction.types.ts
 * @description 마감 소진율 예측 시스템 타입 정의
 */

/**
 * 학습 데이터 (DB: prediction_training_data)
 */
export interface PredictionTrainingData {
  id: string;
  
  // 타겟 변수
  sell_through_rate: number;  // 0.0 ~ 1.0
  
  // 연속형 피처
  product_register_hour: number | null;
  product_register_minute: number | null;
  original_price: number | null;
  discount_price: number | null;
  discount_rate: number | null;
  product_quantity: number | null;
  deadline_hours_remaining: number | null;
  store_avg_rating: number | null;
  store_total_reviews: number | null;
  store_total_sales: number | null;
  weather_temperature: number | null;
  distance_from_station: number | null;
  
  // 범주형 피처
  product_category: string | null;
  register_day_of_week: string | null;
  store_region: string | null;
  time_slot: string | null;
  is_holiday: boolean | null;
  is_weekend: boolean | null;
  
  // 메타
  product_id: string | null;
  store_id: string | null;
  recorded_at: string;
}

/**
 * 일괄 수집 결과
 */
export interface CollectionBatchResult {
  collected_count: number;
  skipped_count: number;
  error_count: number;
}

/**
 * 학습 데이터 통계
 */
export interface TrainingDataStats {
  total_records: number;
  avg_sell_through_rate: number;
  records_by_category: Record<string, number>;
  records_by_time_slot: Record<string, number>;
  date_range: {
    earliest: string;
    latest: string;
  };
}
