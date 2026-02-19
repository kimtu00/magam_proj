-- --------------------------------------------------------
-- 누락된 인덱스 추가
-- 
-- 쿼리 성능 최적화를 위한 인덱스 추가
-- - orders.created_at: 최신순 정렬 최적화
-- - products.created_at: 최신순 정렬 최적화
-- - products.pickup_deadline: 마감 시간 필터링 최적화
-- --------------------------------------------------------

-- 1. orders 테이블: created_at 인덱스 추가
-- 용도: 최신 주문 내역 조회 시 성능 향상
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 2. products 테이블: created_at 인덱스 추가
-- 용도: 최신 상품 목록 조회 시 성능 향상
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- 3. products 테이블: pickup_deadline 인덱스 추가
-- 용도: 마감 시간 기준 필터링 시 성능 향상 (예: 1시간 이내 마감 상품)
CREATE INDEX IF NOT EXISTS idx_products_pickup_deadline ON products(pickup_deadline);

-- 4. 복합 인덱스: status + pickup_deadline
-- 용도: "판매 중이면서 마감 임박" 쿼리 최적화
CREATE INDEX IF NOT EXISTS idx_products_status_deadline 
ON products(status, pickup_deadline) 
WHERE status = 'AVAILABLE';

-- 인덱스 생성 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'Performance indexes have been added successfully.';
  RAISE NOTICE '- orders.created_at (DESC)';
  RAISE NOTICE '- products.created_at (DESC)';
  RAISE NOTICE '- products.pickup_deadline';
  RAISE NOTICE '- products(status, pickup_deadline) WHERE status = AVAILABLE';
END $$;


