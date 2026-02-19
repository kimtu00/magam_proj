-- --------------------------------------------------------
-- 픽업 희망 시간 추가
-- --------------------------------------------------------
-- 설명: orders 테이블에 preferred_pickup_time 컬럼 추가 및 reserve_product RPC 함수 업데이트

-- 1. orders 테이블에 preferred_pickup_time 컬럼 추가 (이미 실행했지만 마이그레이션에 기록)
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS preferred_pickup_time TIMESTAMPTZ;

-- 2. reserve_product RPC 함수 업데이트 (preferred_pickup_time 파라미터 추가)
CREATE OR REPLACE FUNCTION reserve_product(
  p_product_id UUID, 
  p_buyer_id TEXT,
  p_quantity INTEGER DEFAULT 1,
  p_preferred_pickup_time TIMESTAMPTZ DEFAULT NULL  -- 픽업 희망 시간 파라미터 추가
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

  -- 주문 테이블에 추가 (수량 및 픽업 희망 시간 포함)
  INSERT INTO orders (buyer_id, product_id, quantity, preferred_pickup_time, status)
  VALUES (p_buyer_id, p_product_id, p_quantity, p_preferred_pickup_time, 'RESERVED')
  RETURNING id INTO v_order_id;

  -- 5. 성공 리턴
  RETURN json_build_object('success', true, 'order_id', v_order_id);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', '시스템 오류가 발생했습니다.');
END;
$$;

