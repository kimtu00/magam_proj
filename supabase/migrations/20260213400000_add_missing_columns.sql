-- --------------------------------------------------------
-- Migration: 누락된 데이터베이스 컬럼 추가
-- Created: 2026-02-13
-- Description: 
--   1. bank_accounts.is_primary 컬럼 추가 (기본 계좌 여부)
--   2. orders.coupon_id 컬럼 추가 (쿠폰 사용 추적)
-- --------------------------------------------------------

-- ========================================================
-- 1. bank_accounts 테이블에 is_primary 컬럼 추가
-- ========================================================

-- is_primary 컬럼 추가 (기본 계좌 여부)
ALTER TABLE bank_accounts 
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false NOT NULL;

-- 기존 레코드가 있다면 각 user_id별 첫 번째 계좌를 primary로 설정
-- (user_id가 UNIQUE 제약이므로 현재는 유저당 하나의 계좌만 존재)
UPDATE bank_accounts 
  SET is_primary = true 
  WHERE user_id IN (SELECT DISTINCT user_id FROM bank_accounts);

-- 컬럼 주석 추가
COMMENT ON COLUMN bank_accounts.is_primary IS '기본 계좌 여부 (향후 다중 계좌 지원 대비, 현재는 user_id UNIQUE 제약으로 계좌 1개만 가능)';

-- ========================================================
-- 2. orders 테이블에 coupon_id 컬럼 추가
-- ========================================================

-- coupon_id 컬럼 추가 (사용된 user_coupon ID)
-- NULL 허용: 쿠폰 미사용 주문 가능
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS coupon_id UUID 
  REFERENCES user_coupons(id) ON DELETE SET NULL;

-- 성능 향상을 위한 인덱스 (쿠폰 사용 통계 조회 시)
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id 
  ON orders(coupon_id) 
  WHERE coupon_id IS NOT NULL;

-- 컬럼 주석 추가
COMMENT ON COLUMN orders.coupon_id IS '사용된 user_coupon ID (nullable). user_coupons.used_order_id와 양방향 관계';

-- ========================================================
-- 참고사항
-- ========================================================
-- 
-- 1. user_coupons.used_order_id와 orders.coupon_id는 양방향 관계를 형성합니다.
--    - user_coupons.used_order_id: 이 쿠폰이 어느 주문에 사용되었는지
--    - orders.coupon_id: 이 주문에 어떤 쿠폰이 사용되었는지
-- 
-- 2. 데이터 일관성은 애플리케이션 레벨에서 관리:
--    - 주문 생성 시 coupon_id 설정
--    - 쿠폰 사용 시 user_coupons.used_order_id 업데이트
--    - reserve_product RPC 함수에서 처리 가능
-- 
-- 3. 기존 주문 데이터:
--    - coupon_id는 NULL로 유지 (과거 주문은 쿠폰 정보 없음)
--    - 새로운 주문부터 쿠폰 추적 가능
-- 
-- ========================================================
