-- --------------------------------------------------------
-- 상품 무게 필드 추가
--
-- products 테이블에 무게 정보 컬럼을 추가합니다.
-- - weight_value: 무게 숫자값 (DECIMAL)
-- - weight_unit: 무게 단위 (g 또는 kg)
-- --------------------------------------------------------

-- 1. products 테이블에 무게 컬럼 추가
ALTER TABLE products
ADD COLUMN IF NOT EXISTS weight_value DECIMAL,
ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'g';

-- 2. weight_unit 체크 제약 추가 (g 또는 kg만 허용)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_weight_unit_check'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT products_weight_unit_check 
    CHECK (weight_unit IN ('g', 'kg'));
  END IF;
END $$;

-- 3. weight_value 체크 제약 추가 (0보다 커야 함)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_weight_value_check'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT products_weight_value_check 
    CHECK (weight_value IS NULL OR weight_value > 0);
  END IF;
END $$;

-- 4. 인덱스 추가 (무게 기준 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_products_weight ON products(weight_value) 
WHERE weight_value IS NOT NULL;

-- 5. 기존 데이터에 대한 기본값 설정 (선택사항)
-- 기존 상품들의 weight_unit을 'g'로 설정 (이미 DEFAULT가 있지만 명시적 업데이트)
UPDATE products 
SET weight_unit = 'g' 
WHERE weight_unit IS NULL;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '상품 무게 필드가 추가되었습니다.';
  RAISE NOTICE '- weight_value: DECIMAL (NULL 허용, > 0)';
  RAISE NOTICE '- weight_unit: TEXT (기본값: g, g/kg만 허용)';
END $$;
