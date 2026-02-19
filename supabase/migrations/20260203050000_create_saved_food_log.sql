-- --------------------------------------------------------
-- 소비자 "구한 음식" 누적 기록 시스템
--
-- 소비자가 구매 완료한 상품의 무게를 g 단위로 기록합니다.
-- 오늘/전체 누적 무게를 조회하여 UI에 표시합니다.
-- --------------------------------------------------------

-- --------------------------------------------------------
-- 1. saved_food_log 테이블 생성
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS saved_food_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(clerk_id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  saved_weight_g DECIMAL NOT NULL CHECK (saved_weight_g > 0),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스: 오늘치 조회 성능 최적화
CREATE INDEX IF NOT EXISTS idx_saved_food_log_user_date 
ON saved_food_log(user_id, created_at DESC);

-- 인덱스: order_id로 중복 방지 체크
CREATE INDEX IF NOT EXISTS idx_saved_food_log_order 
ON saved_food_log(order_id);

COMMENT ON TABLE saved_food_log IS '소비자가 구매 완료한 상품의 무게 기록 (g 단위)';
COMMENT ON COLUMN saved_food_log.user_id IS '소비자 Clerk ID';
COMMENT ON COLUMN saved_food_log.order_id IS '완료된 주문 ID';
COMMENT ON COLUMN saved_food_log.product_id IS '상품 ID';
COMMENT ON COLUMN saved_food_log.saved_weight_g IS '구한 음식 무게 (g 단위, 항상 양수)';
COMMENT ON COLUMN saved_food_log.created_at IS '기록 생성 시점 (주문 완료 시점)';

-- --------------------------------------------------------
-- 2. DB Trigger: 주문 완료 시 자동으로 로그 기록
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION log_saved_food()
RETURNS TRIGGER AS $$
DECLARE
  v_product RECORD;
  v_weight_g DECIMAL;
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
    
    -- 5. saved_food_log에 기록 (중복 방지: order_id 기준)
    INSERT INTO saved_food_log (user_id, order_id, product_id, saved_weight_g, created_at)
    VALUES (NEW.buyer_id, NEW.id, NEW.product_id, v_weight_g, NEW.completed_at)
    ON CONFLICT (order_id) DO NOTHING; -- 이미 기록된 경우 무시
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- order_id에 UNIQUE 제약 추가 (중복 방지)
ALTER TABLE saved_food_log 
ADD CONSTRAINT saved_food_log_order_id_unique UNIQUE (order_id);

-- Trigger 생성: orders 테이블의 UPDATE 발생 시
DROP TRIGGER IF EXISTS trigger_log_saved_food ON orders;
CREATE TRIGGER trigger_log_saved_food
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION log_saved_food();

COMMENT ON FUNCTION log_saved_food() IS '주문 완료 시 saved_food_log에 자동으로 무게 기록';

-- --------------------------------------------------------
-- 3. RLS (Row Level Security) 정책
-- --------------------------------------------------------

-- RLS 활성화
ALTER TABLE saved_food_log ENABLE ROW LEVEL SECURITY;

-- 정책 1: 본인의 로그만 조회 가능
CREATE POLICY "Users can view own saved food logs"
ON saved_food_log
FOR SELECT
TO authenticated
USING (user_id = auth.jwt() ->> 'sub');

-- 정책 2: INSERT는 Trigger에서만 수행 (authenticated 사용자는 직접 불가)
-- Service role만 INSERT 가능하도록 설정
CREATE POLICY "Only service role can insert logs"
ON saved_food_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- --------------------------------------------------------
-- 4. 헬퍼 뷰 (선택사항): 사용자별 요약 조회
-- --------------------------------------------------------

CREATE OR REPLACE VIEW saved_food_summary AS
SELECT 
  user_id,
  -- 오늘 누적
  COALESCE(SUM(CASE 
    WHEN DATE(created_at) = CURRENT_DATE 
    THEN saved_weight_g 
    ELSE 0 
  END), 0) AS today_saved_g,
  -- 전체 누적
  COALESCE(SUM(saved_weight_g), 0) AS total_saved_g,
  -- 최근 기록 시점
  MAX(created_at) AS last_saved_at
FROM saved_food_log
GROUP BY user_id;

COMMENT ON VIEW saved_food_summary IS '사용자별 구한 음식 요약 (오늘/전체)';

-- --------------------------------------------------------
-- 완료 메시지
-- --------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '✅ saved_food_log 테이블이 생성되었습니다.';
  RAISE NOTICE '✅ 주문 완료 시 자동으로 무게를 기록하는 트리거가 설정되었습니다.';
  RAISE NOTICE '✅ RLS 정책이 적용되었습니다.';
END $$;
