-- ============================================================
-- Migration: 메뉴 템플릿에 무게/용량, 단위, 카테고리 추가
-- Description: 메뉴 템플릿 등록 시 상품 정보를 더 상세하게 입력
-- ============================================================

-- 1. menu_templates 테이블에 컬럼 추가
ALTER TABLE menu_templates
ADD COLUMN IF NOT EXISTS weight_value NUMERIC,
ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'g',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '기타';

-- 2. 무게 단위 제약 조건 추가
ALTER TABLE menu_templates
ADD CONSTRAINT check_weight_unit 
CHECK (weight_unit IN ('g', 'kg', 'ml', 'L'));

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_menu_templates_category ON menu_templates(category);

-- 4. 코멘트 추가
COMMENT ON COLUMN menu_templates.weight_value IS '상품 무게/용량 (숫자)';
COMMENT ON COLUMN menu_templates.weight_unit IS '무게/용량 단위 (g, kg, ml, L)';
COMMENT ON COLUMN menu_templates.category IS '상품 카테고리';

-- 5. 검증
DO $$
BEGIN
  RAISE NOTICE '✓ menu_templates 테이블에 weight_value 컬럼 추가';
  RAISE NOTICE '✓ menu_templates 테이블에 weight_unit 컬럼 추가';
  RAISE NOTICE '✓ menu_templates 테이블에 category 컬럼 추가';
  RAISE NOTICE '✓ weight_unit 제약 조건 추가';
  RAISE NOTICE '✓ 인덱스 생성 완료';
END $$;
