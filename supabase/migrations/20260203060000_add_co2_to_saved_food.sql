-- --------------------------------------------------------
-- CO2 절감량 추가
--
-- saved_food_log 테이블에 CO2 절감량 컬럼을 추가하고,
-- 기존 트리거 함수를 업데이트하여 CO2 값도 자동으로 계산/저장합니다.
-- --------------------------------------------------------

-- --------------------------------------------------------
-- 1. saved_food_log 테이블에 co2_saved_g 컬럼 추가
-- --------------------------------------------------------

ALTER TABLE saved_food_log 
ADD COLUMN IF NOT EXISTS co2_saved_g DECIMAL NOT NULL DEFAULT 0 
CHECK (co2_saved_g >= 0);

COMMENT ON COLUMN saved_food_log.co2_saved_g IS '절감된 CO2 무게 (g 단위, 음식물 무게 × 2.5)';

-- --------------------------------------------------------
-- 2. 기존 데이터 백필 (saved_weight_g × 2.5)
-- --------------------------------------------------------

UPDATE saved_food_log
SET co2_saved_g = saved_weight_g * 2.5
WHERE co2_saved_g = 0 OR co2_saved_g IS NULL;

-- --------------------------------------------------------
-- 3. log_saved_food() 트리거 함수 업데이트
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION log_saved_food()
RETURNS TRIGGER AS $$
DECLARE
  v_product RECORD;
  v_weight_g DECIMAL;
  v_co2_g DECIMAL;
BEGIN
  -- 상태가 COMPLETED로 변경된 경우만 처리
  IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
    
    -- 1. 상품 정보 조회 (무게 정보)
    SELECT weight_value, weight_unit INTO v_product
    FROM products
    WHERE id = NEW.product_id;
    
    -- 2. 무게 정보가 없으면 로그를 기록하지 않음
    IF v_product.weight_value IS NULL OR v_product.weight_value <= 0 THEN
      RETURN NEW;
    END IF;
    
    -- 3. 무게를 g 단위로 변환
    IF v_product.weight_unit = 'kg' THEN
      v_weight_g := v_product.weight_value * 1000;
    ELSE
      v_weight_g := v_product.weight_value;
    END IF;
    
    -- 4. 주문 수량을 곱해서 총 무게 계산
    v_weight_g := v_weight_g * NEW.quantity;
    
    -- 5. CO2 절감량 계산 (음식물 무게 × 2.5)
    v_co2_g := v_weight_g * 2.5;
    
    -- 6. saved_food_log에 기록 (중복 방지: order_id 기준)
    INSERT INTO saved_food_log (user_id, order_id, product_id, saved_weight_g, co2_saved_g, created_at)
    VALUES (NEW.buyer_id, NEW.id, NEW.product_id, v_weight_g, v_co2_g, NEW.completed_at)
    ON CONFLICT (order_id) DO NOTHING; -- 이미 기록된 경우 무시
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_saved_food() IS '주문 완료 시 saved_food_log에 무게 및 CO2 절감량 자동 기록';

-- --------------------------------------------------------
-- 4. saved_food_summary 뷰 업데이트 (CO2 필드 추가)
-- --------------------------------------------------------

-- 기존 뷰를 먼저 삭제 (컬럼 순서 변경 때문)
DROP VIEW IF EXISTS saved_food_summary;

-- 새로운 뷰 생성 (CO2 필드 포함)
CREATE VIEW saved_food_summary AS
SELECT 
  user_id,
  -- 오늘 누적 음식
  COALESCE(SUM(CASE 
    WHEN DATE(created_at) = CURRENT_DATE 
    THEN saved_weight_g 
    ELSE 0 
  END), 0) AS today_saved_g,
  -- 전체 누적 음식
  COALESCE(SUM(saved_weight_g), 0) AS total_saved_g,
  -- 오늘 누적 CO2
  COALESCE(SUM(CASE 
    WHEN DATE(created_at) = CURRENT_DATE 
    THEN co2_saved_g 
    ELSE 0 
  END), 0) AS today_co2_saved_g,
  -- 전체 누적 CO2
  COALESCE(SUM(co2_saved_g), 0) AS total_co2_saved_g,
  -- 최근 기록 시점
  MAX(created_at) AS last_saved_at
FROM saved_food_log
GROUP BY user_id;

COMMENT ON VIEW saved_food_summary IS '사용자별 구한 음식 및 CO2 절감량 요약 (오늘/전체)';

-- --------------------------------------------------------
-- 완료 메시지
-- --------------------------------------------------------

DO $$
DECLARE
  v_total_records INTEGER;
  v_total_co2 DECIMAL;
BEGIN
  -- 백필된 레코드 수 확인
  SELECT COUNT(*), SUM(co2_saved_g) INTO v_total_records, v_total_co2
  FROM saved_food_log;
  
  RAISE NOTICE '✅ saved_food_log 테이블에 co2_saved_g 컬럼이 추가되었습니다.';
  RAISE NOTICE '✅ 기존 데이터 %건에 CO2 값이 백필되었습니다.', v_total_records;
  RAISE NOTICE '✅ 누적 CO2 절감량: %g', COALESCE(v_total_co2, 0);
  RAISE NOTICE '✅ log_saved_food() 트리거 함수가 업데이트되었습니다.';
  RAISE NOTICE '✅ saved_food_summary 뷰에 CO2 필드가 추가되었습니다.';
END $$;
