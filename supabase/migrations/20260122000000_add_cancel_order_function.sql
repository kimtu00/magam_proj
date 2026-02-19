-- 예약 취소 RPC 함수 추가
-- 소비자가 자신의 예약을 취소할 수 있는 함수

CREATE OR REPLACE FUNCTION cancel_order(
  p_order_id UUID,
  p_buyer_id TEXT
) RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_product_id UUID;
BEGIN
  -- 1. 예약 정보 조회 및 검증
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id AND buyer_id = p_buyer_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', '예약을 찾을 수 없습니다.'
    );
  END IF;

  -- 2. 상태 검증 (RESERVED만 취소 가능)
  IF v_order.status != 'RESERVED' THEN
    RETURN json_build_object(
      'success', false,
      'message', '취소할 수 없는 예약입니다.'
    );
  END IF;

  v_product_id := v_order.product_id;

  -- 3. 주문 상태 업데이트
  UPDATE orders
  SET status = 'CANCELED'
  WHERE id = p_order_id;

  -- 4. 상품 상태 복원
  UPDATE products
  SET status = 'AVAILABLE'
  WHERE id = v_product_id;

  RETURN json_build_object(
    'success', true,
    'message', '예약이 취소되었습니다.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수 설명 추가
COMMENT ON FUNCTION cancel_order(UUID, TEXT) IS '소비자가 자신의 예약을 취소하고 상품 상태를 AVAILABLE로 복원합니다.';


