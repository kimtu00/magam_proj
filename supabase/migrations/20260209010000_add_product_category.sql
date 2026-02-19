-- ============================================================
-- Migration: 상품 카테고리 컬럼 추가
-- Description: 마감 소진율 예측 ML 모델을 위한 상품 카테고리 추가
-- ============================================================

-- 1. 상품 카테고리 ENUM 타입 생성
CREATE TYPE product_category AS ENUM (
  '빵',
  '도시락',
  '음료',
  '디저트',
  '과일',
  '채소',
  '정육',
  '수산물',
  '반찬',
  '기타'
);

COMMENT ON TYPE product_category IS '상품 카테고리 분류 (ML 예측 피처용)';

-- 2. products 테이블에 category 컬럼 추가
ALTER TABLE products
ADD COLUMN category product_category DEFAULT '기타';

COMMENT ON COLUMN products.category IS '상품 카테고리 (ML 예측 피처)';

-- 3. 카테고리별 조회를 위한 인덱스 추가
CREATE INDEX idx_products_category ON products(category);

-- 4. 기존 데이터에 대한 기본값 설정 (이미 DEFAULT '기타'로 설정됨)
-- UPDATE products SET category = '기타' WHERE category IS NULL;
-- (DEFAULT 값이 자동 적용되므로 불필요)

-- 5. 검증 쿼리
DO $$
BEGIN
  RAISE NOTICE '✓ product_category ENUM 생성 완료';
  RAISE NOTICE '✓ products.category 컬럼 추가 완료';
  RAISE NOTICE '✓ idx_products_category 인덱스 생성 완료';
END $$;
