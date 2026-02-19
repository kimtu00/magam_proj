-- ============================================================
-- Migration: 마감 소진율 예측 학습 데이터 테이블
-- Description: ML 모델 학습을 위한 피처와 타겟 데이터 저장
-- ============================================================

-- 1. 학습 데이터 테이블 생성
CREATE TABLE prediction_training_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- ========== 타겟 변수 ==========
  sell_through_rate DECIMAL(5,4) NOT NULL CHECK (
    sell_through_rate >= 0 AND sell_through_rate <= 1
  ),  -- 소진율 (0.0000 ~ 1.0000)
  
  -- ========== 연속형 피처 ==========
  product_register_hour INT CHECK (product_register_hour >= 0 AND product_register_hour <= 23),
  product_register_minute INT CHECK (product_register_minute >= 0 AND product_register_minute <= 59),
  original_price INT,
  discount_price INT,
  discount_rate DECIMAL(5,2),  -- 할인율 (%)
  product_quantity INT,
  deadline_hours_remaining DECIMAL(6,2),  -- 마감까지 남은 시간 (시간)
  store_avg_rating DECIMAL(3,2) CHECK (store_avg_rating >= 0 AND store_avg_rating <= 5),
  store_total_reviews INT DEFAULT 0,
  store_total_sales INT DEFAULT 0,  -- 해당 가게의 누적 판매 건수
  
  -- 선택 피처 (향후 확장용)
  weather_temperature DECIMAL(5,2),  -- 기온 (°C)
  distance_from_station DECIMAL(8,2),  -- 가까운 역까지 거리 (m)
  
  -- ========== 범주형 피처 ==========
  product_category TEXT,  -- 상품 카테고리
  register_day_of_week TEXT CHECK (
    register_day_of_week IN ('월', '화', '수', '목', '금', '토', '일')
  ),
  store_region TEXT,  -- 가게 지역 (구/동 단위)
  time_slot TEXT CHECK (
    time_slot IN ('아침', '점심', '오후', '저녁', '심야')
  ),
  is_holiday BOOLEAN DEFAULT false,
  is_weekend BOOLEAN DEFAULT false,
  
  -- ========== 메타 정보 (추적용) ==========
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 중복 방지: 같은 상품에 대해 한 번만 기록
  UNIQUE(product_id)
);

-- 2. 인덱스 생성
CREATE INDEX idx_prediction_training_product ON prediction_training_data(product_id);
CREATE INDEX idx_prediction_training_store ON prediction_training_data(store_id);
CREATE INDEX idx_prediction_training_recorded_at ON prediction_training_data(recorded_at);
CREATE INDEX idx_prediction_training_category ON prediction_training_data(product_category);
CREATE INDEX idx_prediction_training_time_slot ON prediction_training_data(time_slot);

-- 3. 테이블 코멘트
COMMENT ON TABLE prediction_training_data IS 'ML 모델 학습을 위한 마감 소진율 예측 데이터';
COMMENT ON COLUMN prediction_training_data.sell_through_rate IS '타겟 변수: 마감 시 소진율 (0~1)';
COMMENT ON COLUMN prediction_training_data.product_register_hour IS '상품 등록 시각 (0~23)';
COMMENT ON COLUMN prediction_training_data.deadline_hours_remaining IS '등록 시점에서 마감까지 남은 시간';
COMMENT ON COLUMN prediction_training_data.time_slot IS '등록 시간대 구분 (아침/점심/오후/저녁/심야)';

-- 4. 검증
DO $$
DECLARE
  table_exists BOOLEAN;
  index_count INT;
BEGIN
  -- 테이블 존재 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'prediction_training_data'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✓ prediction_training_data 테이블 생성 완료';
  ELSE
    RAISE WARNING '✗ prediction_training_data 테이블 생성 실패';
  END IF;
  
  -- 인덱스 개수 확인
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'prediction_training_data';
  
  RAISE NOTICE '✓ 생성된 인덱스 개수: %', index_count;
END $$;
