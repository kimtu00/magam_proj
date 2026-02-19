-- 구매확정 처리 기능 추가
-- 사장님 수동 확정 & 자동 확정 시스템 구현

-- --------------------------------------------------------
-- 1. orders 테이블에 완료 관련 컬럼 추가
-- --------------------------------------------------------

-- 완료 처리 방법 ENUM 타입
DO $$ BEGIN
  CREATE TYPE completion_type AS ENUM ('SELLER', 'AUTO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 완료 시점 기록 컬럼 추가
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 완료 처리 주체 기록 컬럼 추가 (SELLER: 사장님 수동, AUTO: 자동)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_by completion_type;

-- 완료된 주문 조회 성능 향상을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_orders_completed_at ON orders(completed_at) WHERE completed_at IS NOT NULL;

COMMENT ON COLUMN orders.completed_at IS '구매확정(픽업완료) 처리 시점';
COMMENT ON COLUMN orders.completed_by IS '구매확정 처리 주체: SELLER(사장님 수동), AUTO(자동)';

-- --------------------------------------------------------
-- 2. 사장님 수동 구매확정 RPC 함수
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION complete_order(
  p_order_id UUID,
  p_seller_clerk_id TEXT
) RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_product RECORD;
  v_store_owner_id TEXT;
BEGIN
  -- 1. 주문 정보 조회 (잠금)
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', '주문을 찾을 수 없습니다.'
    );
  END IF;

  -- 2. 상태 검증 (RESERVED만 완료 처리 가능)
  IF v_order.status != 'RESERVED' THEN
    RETURN json_build_object(
      'success', false,
      'message', '완료 처리할 수 없는 주문입니다.'
    );
  END IF;

  -- 3. 상품 정보 및 가게 소유자 확인
  SELECT p.*, s.owner_id INTO v_product
  FROM products p
  JOIN stores s ON p.store_id = s.id
  WHERE p.id = v_order.product_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', '상품 정보를 찾을 수 없습니다.'
    );
  END IF;

  -- 4. 권한 검증: 해당 가게의 사장님만 완료 처리 가능
  IF v_product.owner_id != p_seller_clerk_id THEN
    RETURN json_build_object(
      'success', false,
      'message', '권한이 없습니다. 본인 가게의 주문만 처리할 수 있습니다.'
    );
  END IF;

  -- 5. 주문 완료 처리
  UPDATE orders
  SET 
    status = 'COMPLETED',
    completed_at = now(),
    completed_by = 'SELLER'
  WHERE id = p_order_id;

  -- 6. 상품 상태를 SOLD로 변경
  UPDATE products
  SET status = 'SOLD'
  WHERE id = v_order.product_id;

  RETURN json_build_object(
    'success', true,
    'message', '픽업이 완료되었습니다.',
    'completed_at', now()
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'message', '시스템 오류가 발생했습니다: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION complete_order(UUID, TEXT) IS '사장님이 주문을 픽업 완료 처리합니다. 권한 검증 포함.';

-- --------------------------------------------------------
-- 3. 자동 구매확정 RPC 함수 (Cron Job용)
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION auto_complete_orders()
RETURNS JSON AS $$
DECLARE
  v_completed_count INTEGER := 0;
  v_order RECORD;
BEGIN
  -- 1. 자동 완료 대상 주문 찾기 및 처리
  -- 조건: pickup_deadline + 12시간이 지났고, status가 RESERVED인 주문
  FOR v_order IN
    SELECT o.id, o.product_id
    FROM orders o
    JOIN products p ON o.product_id = p.id
    WHERE o.status = 'RESERVED'
      AND p.pickup_deadline + INTERVAL '12 hours' < now()
    FOR UPDATE OF o
  LOOP
    -- 주문 완료 처리
    UPDATE orders
    SET 
      status = 'COMPLETED',
      completed_at = now(),
      completed_by = 'AUTO'
    WHERE id = v_order.id;

    -- 상품 상태를 SOLD로 변경
    UPDATE products
    SET status = 'SOLD'
    WHERE id = v_order.product_id;

    v_completed_count := v_completed_count + 1;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'completed_count', v_completed_count,
    'message', v_completed_count || '건의 주문이 자동 완료되었습니다.',
    'processed_at', now()
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'message', '자동 완료 처리 중 오류가 발생했습니다: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_complete_orders() IS '픽업 마감 12시간 후 예약 상태인 주문을 자동으로 완료 처리합니다.';

-- --------------------------------------------------------
-- 4. 권한 부여
-- --------------------------------------------------------

-- complete_order는 인증된 사용자(사장님)만 실행 가능
GRANT EXECUTE ON FUNCTION complete_order(UUID, TEXT) TO authenticated;

-- auto_complete_orders는 서비스 역할만 실행 가능 (Cron Job용)
-- anon이나 authenticated에게는 권한 부여 안 함 (보안)
REVOKE EXECUTE ON FUNCTION auto_complete_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auto_complete_orders() TO service_role;
