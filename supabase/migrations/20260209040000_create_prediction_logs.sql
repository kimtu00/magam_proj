-- ============================================================
-- Migration: 예측 로그 테이블
-- Description: ML 예측 결과를 기록하여 예측 정확도 분석
-- ============================================================

-- 1. 예측 로그 테이블 생성
CREATE TABLE prediction_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 관련 엔티티
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  
  -- 예측 결과
  predicted_sell_through DECIMAL(5,4) NOT NULL CHECK (
    predicted_sell_through >= 0 AND predicted_sell_through <= 1
  ),
  
  -- 실제 결과 (마감 후 업데이트)
  actual_sell_through DECIMAL(5,4) CHECK (
    actual_sell_through IS NULL OR (actual_sell_through >= 0 AND actual_sell_through <= 1)
  ),
  
  -- 예측 시 사용한 피처 (JSON 형태로 저장)
  features JSONB,
  
  -- 예측 메타 정보
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  confidence_score DECIMAL(3,2),
  model_version TEXT,  -- 예측 시 사용한 모델 버전
  
  -- 타임스탬프
  predicted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  actual_recorded_at TIMESTAMPTZ,  -- 실제 결과 기록 시각
  
  -- 예측 오차 (실제 결과 기록 후 계산)
  prediction_error DECIMAL(5,4),  -- |actual - predicted|
  
  CONSTRAINT prediction_logs_product_unique UNIQUE (product_id)
);

-- 2. 인덱스 생성
CREATE INDEX idx_prediction_logs_product ON prediction_logs(product_id);
CREATE INDEX idx_prediction_logs_store ON prediction_logs(store_id);
CREATE INDEX idx_prediction_logs_predicted_at ON prediction_logs(predicted_at);
CREATE INDEX idx_prediction_logs_actual_recorded ON prediction_logs(actual_recorded_at) WHERE actual_recorded_at IS NOT NULL;

-- 3. 코멘트
COMMENT ON TABLE prediction_logs IS 'ML 예측 결과 로그 및 정확도 추적';
COMMENT ON COLUMN prediction_logs.predicted_sell_through IS '예측 소진율 (0~1)';
COMMENT ON COLUMN prediction_logs.actual_sell_through IS '실제 소진율 (마감 후 업데이트)';
COMMENT ON COLUMN prediction_logs.features IS '예측 시 사용한 피처 데이터 (JSON)';
COMMENT ON COLUMN prediction_logs.prediction_error IS '예측 오차 = |actual - predicted|';

-- 4. 실제 결과 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_prediction_actual_result()
RETURNS TRIGGER AS $$
DECLARE
  v_sold_quantity INT;
  v_actual_sell_through DECIMAL(5,4);
  v_predicted_sell_through DECIMAL(5,4);
BEGIN
  -- 상품이 마감되었을 때만 실행
  IF NEW.pickup_deadline < now() AND (OLD.pickup_deadline >= now() OR OLD.id IS NULL) THEN
    
    -- 예측 로그가 있는지 확인
    SELECT predicted_sell_through INTO v_predicted_sell_through
    FROM prediction_logs
    WHERE product_id = NEW.id;
    
    IF FOUND THEN
      -- 실제 판매 수량 계산
      SELECT COALESCE(SUM(quantity), 0) INTO v_sold_quantity
      FROM orders
      WHERE product_id = NEW.id
        AND status = 'COMPLETED';
      
      -- 실제 소진율 계산
      IF NEW.quantity > 0 THEN
        v_actual_sell_through := v_sold_quantity::DECIMAL / NEW.quantity;
      ELSE
        v_actual_sell_through := 0;
      END IF;
      
      -- 예측 로그 업데이트
      UPDATE prediction_logs
      SET 
        actual_sell_through = v_actual_sell_through,
        actual_recorded_at = now(),
        prediction_error = ABS(v_actual_sell_through - v_predicted_sell_through)
      WHERE product_id = NEW.id;
      
      RAISE NOTICE '✓ 예측 로그 업데이트: product_id=%, actual=%, predicted=%, error=%',
        NEW.id, v_actual_sell_through, v_predicted_sell_through, 
        ABS(v_actual_sell_through - v_predicted_sell_through);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_prediction_actual_result IS '상품 마감 시 예측 로그의 실제 결과 자동 업데이트';

-- 5. 트리거 생성
CREATE TRIGGER trigger_update_prediction_actual
AFTER UPDATE OF pickup_deadline ON products
FOR EACH ROW
EXECUTE FUNCTION update_prediction_actual_result();

COMMENT ON TRIGGER trigger_update_prediction_actual ON products IS '마감 시 예측 정확도 자동 기록';

-- 6. RLS 정책
ALTER TABLE prediction_logs ENABLE ROW LEVEL SECURITY;

-- 읽기: 자신의 가게 예측 로그만 조회
CREATE POLICY "Sellers can view their own prediction logs"
  ON prediction_logs
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE clerk_user_id = auth.jwt()->>'sub'
    )
  );

-- 쓰기: service_role만 (API를 통한 기록)
-- (RLS는 service_role을 우회하므로 별도 정책 불필요)

-- 7. 예측 정확도 조회 뷰
CREATE OR REPLACE VIEW prediction_accuracy_summary AS
SELECT 
  pl.store_id,
  COUNT(*) FILTER (WHERE pl.actual_sell_through IS NOT NULL) as completed_predictions,
  AVG(pl.prediction_error) FILTER (WHERE pl.actual_sell_through IS NOT NULL) as avg_error,
  AVG(ABS(pl.actual_sell_through - pl.predicted_sell_through)) FILTER (WHERE pl.actual_sell_through IS NOT NULL) as mae,
  SQRT(AVG(POWER(pl.actual_sell_through - pl.predicted_sell_through, 2))) FILTER (WHERE pl.actual_sell_through IS NOT NULL) as rmse,
  -- 정확도 (100% - 평균 오차%)
  (1 - AVG(pl.prediction_error) FILTER (WHERE pl.actual_sell_through IS NOT NULL)) * 100 as accuracy_percent
FROM prediction_logs pl
WHERE pl.actual_sell_through IS NOT NULL
GROUP BY pl.store_id;

COMMENT ON VIEW prediction_accuracy_summary IS '가게별 예측 정확도 요약';

-- 8. 검증
DO $$
BEGIN
  RAISE NOTICE '✓ prediction_logs 테이블 생성 완료';
  RAISE NOTICE '✓ update_prediction_actual_result() 함수 생성 완료';
  RAISE NOTICE '✓ trigger_update_prediction_actual 트리거 생성 완료';
  RAISE NOTICE '✓ prediction_accuracy_summary 뷰 생성 완료';
  RAISE NOTICE '✓ RLS 정책 설정 완료';
END $$;
