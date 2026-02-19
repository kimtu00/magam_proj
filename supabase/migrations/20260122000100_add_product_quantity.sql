-- --------------------------------------------------------
-- 제품 수량 관리 기능 추가
-- 
-- 주요 변경사항:
-- 1. products 테이블에 quantity 컬럼 추가
-- 2. orders 테이블에 quantity 컬럼 추가
-- 3. SOLD_OUT 상태 추가
-- 4. reserve_product RPC 함수 수정 (수량 차감)
-- 5. cancel_order RPC 함수 수정 (수량 복원)
-- 6. sell_in_store RPC 함수 생성 (매장 판매)
-- 7. 자동 품절 처리 트리거 추가
-- --------------------------------------------------------

-- --------------------------------------------------------
-- 1. products 테이블에 quantity 컬럼 추가
-- --------------------------------------------------------

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

-- 기존 데이터에 대해 quantity = 1로 설정
UPDATE products SET quantity = 1 WHERE quantity IS NULL;

-- 인덱스 추가 (수량 기반 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);

-- --------------------------------------------------------
-- 2. SOLD_OUT 상태 추가
-- --------------------------------------------------------

DO $$ BEGIN
  ALTER TYPE product_status ADD VALUE IF NOT EXISTS 'SOLD_OUT';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- --------------------------------------------------------
-- 3. orders 테이블에 quantity 컬럼 추가
-- --------------------------------------------------------

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

-- 기존 데이터에 대해 quantity = 1로 설정
UPDATE orders SET quantity = 1 WHERE quantity IS NULL;

-- --------------------------------------------------------
-- 4. reserve_product RPC 함수 수정 (수량 관리)
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION reserve_product(
  p_product_id UUID, 
  p_buyer_id TEXT,
  p_quantity INTEGER DEFAULT 1  -- 예약 수량 파라미터 추가
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_product_quantity INTEGER;
  v_order_id UUID;
BEGIN
  -- 1. 현재 상품 수량 확인 (잠금 걸기)
  SELECT quantity INTO v_product_quantity
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  -- 2. 상품이 없으면 실패
  IF v_product_quantity IS NULL THEN
    RETURN json_build_object('success', false, 'message', '상품이 존재하지 않습니다.');
  END IF;

  -- 3. 재고 부족 체크
  IF v_product_quantity < p_quantity THEN
    RETURN json_build_object('success', false, 'message', '재고가 부족합니다. (남은 수량: ' || v_product_quantity || '개)');
  END IF;

  -- 4. 예약 처리 진행
  
  -- 재고 차감
  UPDATE products 
  SET quantity = quantity - p_quantity
  WHERE id = p_product_id;

  -- 주문 테이블에 추가 (수량 포함)
  INSERT INTO orders (buyer_id, product_id, quantity, status)
  VALUES (p_buyer_id, p_product_id, p_quantity, 'RESERVED')
  RETURNING id INTO v_order_id;

  -- 5. 성공 리턴
  RETURN json_build_object('success', true, 'order_id', v_order_id);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', '시스템 오류가 발생했습니다.');
END;
$$;

-- --------------------------------------------------------
-- 5. cancel_order RPC 함수 수정 (수량 복원)
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION cancel_order(
  p_order_id UUID,
  p_buyer_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- 1. 주문 정보 조회 (잠금)
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id AND buyer_id = p_buyer_id
  FOR UPDATE;

  -- 2. 주문 존재 여부 체크
  IF v_order.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', '주문을 찾을 수 없습니다.');
  END IF;

  -- 3. 예약 상태 체크
  IF v_order.status != 'RESERVED' THEN
    RETURN json_build_object('success', false, 'message', '예약 중인 주문만 취소할 수 있습니다.');
  END IF;

  -- 4. 취소 처리
  
  -- 주문 상태 변경
  UPDATE orders
  SET status = 'CANCELED'
  WHERE id = p_order_id;

  -- 상품 재고 복원 (수량 증가)
  UPDATE products
  SET quantity = quantity + v_order.quantity
  WHERE id = v_order.product_id;

  -- 5. 성공 리턴
  RETURN json_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', '시스템 오류가 발생했습니다.');
END;
$$;

-- --------------------------------------------------------
-- 6. sell_in_store RPC 함수 생성 (매장 판매)
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION sell_in_store(
  p_product_id UUID,
  p_store_id UUID,
  p_quantity INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_product_quantity INTEGER;
  v_product_store_id UUID;
BEGIN
  -- 1. 상품 정보 조회 (잠금)
  SELECT quantity, store_id INTO v_product_quantity, v_product_store_id
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  -- 2. 상품 존재 및 권한 체크
  IF v_product_quantity IS NULL THEN
    RETURN json_build_object('success', false, 'message', '상품을 찾을 수 없습니다.');
  END IF;

  IF v_product_store_id != p_store_id THEN
    RETURN json_build_object('success', false, 'message', '권한이 없습니다.');
  END IF;

  -- 3. 재고 부족 체크
  IF v_product_quantity < p_quantity THEN
    RETURN json_build_object('success', false, 'message', '재고가 부족합니다. (남은 수량: ' || v_product_quantity || '개)');
  END IF;

  -- 4. 재고 차감
  UPDATE products 
  SET quantity = quantity - p_quantity
  WHERE id = p_product_id;

  -- 5. 성공 리턴
  RETURN json_build_object('success', true, 'remaining_quantity', v_product_quantity - p_quantity);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', '시스템 오류가 발생했습니다.');
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION sell_in_store(UUID, UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION sell_in_store(UUID, UUID, INTEGER) TO authenticated;

-- --------------------------------------------------------
-- 7. 자동 품절 처리 트리거
-- --------------------------------------------------------

-- 트리거 함수: 수량이 0이 되면 자동 SOLD_OUT 처리
CREATE OR REPLACE FUNCTION auto_soldout_on_zero_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity = 0 AND OLD.quantity > 0 THEN
    NEW.status = 'SOLD_OUT';
  ELSIF NEW.quantity > 0 AND OLD.status = 'SOLD_OUT' THEN
    NEW.status = 'AVAILABLE';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 (있다면)
DROP TRIGGER IF EXISTS trigger_auto_soldout ON products;

-- 트리거 생성
CREATE TRIGGER trigger_auto_soldout
BEFORE UPDATE OF quantity ON products
FOR EACH ROW
EXECUTE FUNCTION auto_soldout_on_zero_quantity();

