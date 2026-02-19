-- --------------------------------------------------------
-- 마감 히어로 시스템
--
-- 소비자의 픽업 횟수 또는 구한 음식 무게 기반 등급 시스템입니다.
-- 픽업 완료 시 자동으로 등급을 판정하고 승급 처리합니다.
-- --------------------------------------------------------

-- --------------------------------------------------------
-- 1. hero_grade_config 테이블 (등급 설정)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS hero_grade_config (
  id SERIAL PRIMARY KEY,
  grade_level INTEGER NOT NULL UNIQUE,
  grade_name TEXT NOT NULL,
  grade_emoji TEXT,
  required_pickups INTEGER NOT NULL CHECK (required_pickups >= 0),
  required_weight_kg DECIMAL(10,2) NOT NULL CHECK (required_weight_kg >= 0),
  condition_type TEXT NOT NULL DEFAULT 'OR' CHECK (condition_type IN ('OR', 'AND')),
  benefits_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  tree_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hero_grade_config_level ON hero_grade_config(grade_level);
CREATE INDEX IF NOT EXISTS idx_hero_grade_config_active ON hero_grade_config(is_active) WHERE is_active = true;

COMMENT ON TABLE hero_grade_config IS '히어로 등급 설정 테이블';
COMMENT ON COLUMN hero_grade_config.grade_level IS '등급 레벨 (숫자가 클수록 높은 등급)';
COMMENT ON COLUMN hero_grade_config.condition_type IS '조건 타입: OR(둘 중 하나) 또는 AND(둘 다)';
COMMENT ON COLUMN hero_grade_config.benefits_json IS '등급 혜택 목록 (JSON 배열)';

-- --------------------------------------------------------
-- 2. user_hero 테이블 (사용자 히어로 상태)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_hero (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES profiles(clerk_id) ON DELETE CASCADE,
  grade_level INTEGER NOT NULL DEFAULT 0,
  total_pickup_count INTEGER NOT NULL DEFAULT 0 CHECK (total_pickup_count >= 0),
  total_saved_weight_g DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_saved_weight_g >= 0),
  upgraded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_hero_user_id ON user_hero(user_id);
CREATE INDEX IF NOT EXISTS idx_user_hero_grade ON user_hero(grade_level);

COMMENT ON TABLE user_hero IS '사용자별 히어로 등급 및 누적 통계';
COMMENT ON COLUMN user_hero.user_id IS 'Clerk User ID';
COMMENT ON COLUMN user_hero.grade_level IS '현재 등급 레벨';
COMMENT ON COLUMN user_hero.total_pickup_count IS '총 픽업 완료 횟수';
COMMENT ON COLUMN user_hero.total_saved_weight_g IS '총 구한 음식 무게 (g)';
COMMENT ON COLUMN user_hero.upgraded_at IS '최근 등급 상승 시점';

-- --------------------------------------------------------
-- 3. hero_upgrade_log 테이블 (승급 이력)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS hero_upgrade_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(clerk_id) ON DELETE CASCADE,
  from_level INTEGER NOT NULL,
  to_level INTEGER NOT NULL CHECK (to_level > from_level),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('pickup_count', 'weight', 'both', 'manual')),
  trigger_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hero_upgrade_log_user ON hero_upgrade_log(user_id, created_at DESC);

COMMENT ON TABLE hero_upgrade_log IS '히어로 등급 상승 이력';
COMMENT ON COLUMN hero_upgrade_log.trigger_type IS '승급 조건: pickup_count, weight, both, manual';
COMMENT ON COLUMN hero_upgrade_log.trigger_value IS '승급 당시 값 (예: "15회" or "12.5kg")';

-- --------------------------------------------------------
-- 4. Seed 데이터 (히어로 등급 설정)
-- --------------------------------------------------------

INSERT INTO hero_grade_config (grade_level, grade_name, grade_emoji, required_pickups, required_weight_kg, benefits_json)
VALUES
(1, '새싹 히어로', '🌱', 1, 0, '["welcome_badge"]'::jsonb),
(2, '동네 히어로', '🌿', 10, 10, '["welcome_badge","early_access_popular"]'::jsonb),
(3, '나라 히어로', '🌍', 30, 30, '["welcome_badge","early_access_popular","nation_perks"]'::jsonb),
(4, '지구 히어로', '🌳', 50, 50, '["welcome_badge","early_access_popular","nation_perks","priority_alarm"]'::jsonb);

-- --------------------------------------------------------
-- 5. 트리거 함수: 픽업 완료 시 히어로 등급 업데이트
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION update_hero_on_order_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_product RECORD;
  v_weight_g DECIMAL;
  v_user_hero RECORD;
  v_new_pickup_count INTEGER;
  v_new_weight_g DECIMAL;
  v_new_weight_kg DECIMAL;
  v_new_grade INTEGER;
  v_old_grade INTEGER;
  v_trigger_type TEXT;
  v_trigger_value TEXT;
  v_grade_config RECORD;
BEGIN
  -- 상태가 COMPLETED로 변경된 경우만 처리
  IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
    
    -- 1. 상품 정보 조회 (무게 정보)
    SELECT weight_value, weight_unit INTO v_product
    FROM products
    WHERE id = NEW.product_id;
    
    -- 2. 무게를 g 단위로 변환 (없으면 0)
    IF v_product.weight_value IS NULL OR v_product.weight_value <= 0 THEN
      v_weight_g := 0;
    ELSIF v_product.weight_unit = 'kg' THEN
      v_weight_g := v_product.weight_value * 1000;
    ELSE
      v_weight_g := v_product.weight_value;
    END IF;
    
    -- 주문 수량 곱하기
    v_weight_g := v_weight_g * NEW.quantity;
    
    -- 3. user_hero 레코드 UPSERT (픽업 횟수 +1, 무게 누적)
    INSERT INTO user_hero (user_id, grade_level, total_pickup_count, total_saved_weight_g, updated_at)
    VALUES (NEW.buyer_id, 0, 1, v_weight_g, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET
      total_pickup_count = user_hero.total_pickup_count + 1,
      total_saved_weight_g = user_hero.total_saved_weight_g + EXCLUDED.total_saved_weight_g,
      updated_at = now()
    RETURNING * INTO v_user_hero;
    
    -- UPSERT 결과가 없으면 다시 조회
    IF v_user_hero IS NULL THEN
      SELECT * INTO v_user_hero
      FROM user_hero
      WHERE user_id = NEW.buyer_id;
    END IF;
    
    v_old_grade := v_user_hero.grade_level;
    v_new_pickup_count := v_user_hero.total_pickup_count;
    v_new_weight_g := v_user_hero.total_saved_weight_g;
    v_new_weight_kg := v_new_weight_g / 1000.0;
    
    -- 4. 등급 판정 (가장 높은 달성 가능 등급 찾기)
    v_new_grade := v_old_grade;
    
    FOR v_grade_config IN
      SELECT * FROM hero_grade_config
      WHERE is_active = true
        AND grade_level > v_old_grade
      ORDER BY grade_level ASC
    LOOP
      -- OR 조건: 픽업 횟수 또는 무게 중 하나만 충족하면 됨
      IF v_grade_config.condition_type = 'OR' THEN
        IF v_new_pickup_count >= v_grade_config.required_pickups 
           OR v_new_weight_kg >= v_grade_config.required_weight_kg THEN
          v_new_grade := v_grade_config.grade_level;
        ELSE
          EXIT; -- 이 등급을 달성 못했으면 더 높은 등급도 불가능
        END IF;
      -- AND 조건: 픽업 횟수와 무게 둘 다 충족해야 함
      ELSIF v_grade_config.condition_type = 'AND' THEN
        IF v_new_pickup_count >= v_grade_config.required_pickups 
           AND v_new_weight_kg >= v_grade_config.required_weight_kg THEN
          v_new_grade := v_grade_config.grade_level;
        ELSE
          EXIT;
        END IF;
      END IF;
    END LOOP;
    
    -- 5. 등급 상승 처리
    IF v_new_grade > v_old_grade THEN
      -- 등급 업데이트
      UPDATE user_hero
      SET 
        grade_level = v_new_grade,
        upgraded_at = now(),
        updated_at = now()
      WHERE user_id = NEW.buyer_id;
      
      -- 승급 트리거 타입 결정
      SELECT * INTO v_grade_config
      FROM hero_grade_config
      WHERE grade_level = v_new_grade;
      
      IF v_new_pickup_count >= v_grade_config.required_pickups 
         AND v_new_weight_kg >= v_grade_config.required_weight_kg THEN
        v_trigger_type := 'both';
        v_trigger_value := v_new_pickup_count || '회 & ' || ROUND(v_new_weight_kg, 1) || 'kg';
      ELSIF v_new_pickup_count >= v_grade_config.required_pickups THEN
        v_trigger_type := 'pickup_count';
        v_trigger_value := v_new_pickup_count || '회';
      ELSE
        v_trigger_type := 'weight';
        v_trigger_value := ROUND(v_new_weight_kg, 1) || 'kg';
      END IF;
      
      -- 승급 이력 기록
      INSERT INTO hero_upgrade_log (user_id, from_level, to_level, trigger_type, trigger_value)
      VALUES (NEW.buyer_id, v_old_grade, v_new_grade, v_trigger_type, v_trigger_value);
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_hero_on_order_complete() IS '주문 완료 시 히어로 등급 자동 판정 및 승급 처리';

-- --------------------------------------------------------
-- 6. 트리거 등록
-- --------------------------------------------------------

DROP TRIGGER IF EXISTS trigger_update_hero_grade ON orders;
CREATE TRIGGER trigger_update_hero_grade
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_hero_on_order_complete();

-- --------------------------------------------------------
-- 7. RLS (Row Level Security) 정책
-- --------------------------------------------------------

-- user_hero 테이블 RLS
ALTER TABLE user_hero ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hero status"
ON user_hero
FOR SELECT
TO authenticated
USING (user_id = auth.jwt() ->> 'sub');

-- hero_upgrade_log 테이블 RLS
ALTER TABLE hero_upgrade_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own upgrade history"
ON hero_upgrade_log
FOR SELECT
TO authenticated
USING (user_id = auth.jwt() ->> 'sub');

-- hero_grade_config는 모든 사용자가 조회 가능
ALTER TABLE hero_grade_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view grade config"
ON hero_grade_config
FOR SELECT
TO authenticated
USING (is_active = true);

-- --------------------------------------------------------
-- 완료 메시지
-- --------------------------------------------------------

DO $$
DECLARE
  v_config_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_config_count FROM hero_grade_config;
  
  RAISE NOTICE '✅ hero_grade_config 테이블이 생성되었습니다. (등급 설정 %건)', v_config_count;
  RAISE NOTICE '✅ user_hero 테이블이 생성되었습니다. (사용자 히어로 상태)';
  RAISE NOTICE '✅ hero_upgrade_log 테이블이 생성되었습니다. (승급 이력)';
  RAISE NOTICE '✅ update_hero_on_order_complete() 트리거가 설정되었습니다.';
  RAISE NOTICE '✅ RLS 정책이 적용되었습니다.';
  RAISE NOTICE '🎉 마감 히어로 시스템이 준비되었습니다!';
END $$;
