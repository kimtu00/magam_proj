-- --------------------------------------------------------
-- 히어로 혜택 시스템
--
-- 환영 배지 + 인기 상품 선공개 기능
-- --------------------------------------------------------

-- --------------------------------------------------------
-- 1. app_config 테이블 (앱 설정값 관리)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS app_config (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key);

COMMENT ON TABLE app_config IS '앱 설정값 저장 테이블';
COMMENT ON COLUMN app_config.key IS '설정 키 (EARLY_ACCESS_MINUTES 등)';
COMMENT ON COLUMN app_config.value IS '설정 값 (문자열)';

-- Seed 데이터
INSERT INTO app_config (key, value, description)
VALUES ('EARLY_ACCESS_MINUTES', '10', '선공개 기간(분): 동네 히어로 이상에게 먼저 노출되는 시간');

-- --------------------------------------------------------
-- 2. user_badge 테이블 (사용자 배지)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_badge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(clerk_id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('welcome', 'grade_1', 'grade_2', 'grade_3', 'grade_4')),
  badge_name TEXT NOT NULL,
  badge_emoji TEXT,
  badge_image_url TEXT,
  earned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, badge_type)
);

CREATE INDEX IF NOT EXISTS idx_user_badge_user_id ON user_badge(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badge_earned ON user_badge(earned_at DESC);

COMMENT ON TABLE user_badge IS '사용자가 획득한 배지 목록';
COMMENT ON COLUMN user_badge.badge_type IS '배지 종류: welcome(환영), grade_1~4(등급별)';
COMMENT ON COLUMN user_badge.badge_name IS '배지 이름 (예: "새싹 히어로")';
COMMENT ON COLUMN user_badge.badge_emoji IS '배지 이모지 (예: "🌱")';

-- --------------------------------------------------------
-- 3. products 테이블에 선공개 컬럼 추가
-- --------------------------------------------------------

ALTER TABLE products ADD COLUMN IF NOT EXISTS early_access_from TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS visible_from TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_products_early_access ON products(early_access_from) WHERE early_access_from IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_visible_from ON products(visible_from) WHERE visible_from IS NOT NULL;

COMMENT ON COLUMN products.early_access_from IS '선공개 시작 시각 (동네 히어로 이상 접근 가능)';
COMMENT ON COLUMN products.visible_from IS '전체 공개 시각 (모든 사용자 접근 가능)';

-- --------------------------------------------------------
-- 4. 트리거 함수 업데이트: 등급 상승 시 배지 부여
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
  v_grade_level INTEGER;
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
      
      -- ========================================
      -- 배지 부여 로직 (신규 추가)
      -- ========================================
      
      -- 첫 승급(0 -> 1): 환영 배지 + 1등급 배지
      IF v_old_grade = 0 AND v_new_grade >= 1 THEN
        -- 환영 배지
        INSERT INTO user_badge (user_id, badge_type, badge_name, badge_emoji)
        VALUES (NEW.buyer_id, 'welcome', '환영합니다!', '👋')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
      END IF;
      
      -- 달성한 모든 등급의 배지 부여 (중간 등급 포함)
      FOR v_grade_level IN (v_old_grade + 1)..v_new_grade LOOP
        SELECT * INTO v_grade_config
        FROM hero_grade_config
        WHERE grade_level = v_grade_level;
        
        IF v_grade_config IS NOT NULL THEN
          INSERT INTO user_badge (
            user_id, 
            badge_type, 
            badge_name, 
            badge_emoji
          )
          VALUES (
            NEW.buyer_id,
            'grade_' || v_grade_level,
            v_grade_config.grade_name,
            v_grade_config.grade_emoji
          )
          ON CONFLICT (user_id, badge_type) DO NOTHING;
        END IF;
      END LOOP;
      
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_hero_on_order_complete() IS '주문 완료 시 히어로 등급 자동 판정, 승급 처리, 배지 부여';

-- --------------------------------------------------------
-- 5. RLS (Row Level Security) 정책
-- --------------------------------------------------------

-- user_badge 테이블 RLS
ALTER TABLE user_badge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges"
ON user_badge
FOR SELECT
TO authenticated
USING (user_id = auth.jwt() ->> 'sub');

-- app_config는 모든 사용자가 조회 가능
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view app config"
ON app_config
FOR SELECT
TO authenticated, anon
USING (true);

-- --------------------------------------------------------
-- 완료 메시지
-- --------------------------------------------------------

DO $$
DECLARE
  v_config_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_config_count FROM app_config;
  
  RAISE NOTICE '✅ app_config 테이블이 생성되었습니다. (설정 %건)', v_config_count;
  RAISE NOTICE '✅ user_badge 테이블이 생성되었습니다.';
  RAISE NOTICE '✅ products 테이블에 early_access_from, visible_from 컬럼이 추가되었습니다.';
  RAISE NOTICE '✅ update_hero_on_order_complete() 트리거가 업데이트되었습니다. (배지 부여 로직 추가)';
  RAISE NOTICE '✅ RLS 정책이 적용되었습니다.';
  RAISE NOTICE '🎉 히어로 혜택 시스템이 준비되었습니다!';
END $$;
