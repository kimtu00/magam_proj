-- --------------------------------------------------------
-- 사장님 대시보드용 테이블 생성
--
-- 이 마이그레이션은 사장님 대시보드에서 사용할 다음 테이블을 생성합니다:
-- 1. settlements: 정산 내역 (월별 정산 관리)
-- 2. store_promotions: 가게별 프로모션 현황 (쿠폰 사용, 수수료 조정)
-- --------------------------------------------------------

-- --------------------------------------------------------
-- 1. settlements (정산 내역)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- 정산 기간
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- 매출 정보
  total_sales INTEGER NOT NULL DEFAULT 0,           -- 총 매출
  total_orders INTEGER NOT NULL DEFAULT 0,          -- 총 주문 건수
  
  -- 수수료
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,  -- 수수료율 (%)
  commission_amount INTEGER NOT NULL DEFAULT 0,     -- 수수료 금액
  
  -- 정산 금액
  settlement_amount INTEGER NOT NULL DEFAULT 0,     -- 실제 정산 금액 (매출 - 수수료)
  
  -- 상태
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- 정산 완료 시각
  settled_at TIMESTAMPTZ,
  
  -- 메타데이터
  notes TEXT,                                       -- 관리자 메모
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 중복 방지 (가게당 기간당 1개)
  CONSTRAINT unique_store_period UNIQUE (store_id, period_start, period_end)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_settlements_store_id ON settlements(store_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_period ON settlements(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_settlements_store_period ON settlements(store_id, period_start DESC);

-- --------------------------------------------------------
-- 2. store_promotions (가게별 프로모션 현황)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS store_promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  
  -- 프로모션 정보
  name TEXT NOT NULL,                               -- 프로모션명
  description TEXT,                                 -- 설명
  type TEXT NOT NULL CHECK (type IN ('platform', 'store')), -- 플랫폼/가게 프로모션
  
  -- 사용 현황
  used_count INTEGER DEFAULT 0,                     -- 사용된 횟수
  
  -- 수수료 조정
  commission_adjustment DECIMAL(5,2) DEFAULT 0,     -- 수수료 조정 (% 또는 고정액)
  adjustment_type TEXT CHECK (adjustment_type IN ('percent', 'amount')),
  
  -- 활성화
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_store_promotions_store_id ON store_promotions(store_id);
CREATE INDEX IF NOT EXISTS idx_store_promotions_active ON store_promotions(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_store_promotions_coupon ON store_promotions(coupon_id) WHERE coupon_id IS NOT NULL;

-- --------------------------------------------------------
-- 3. 정산 자동 계산 함수
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION calculate_settlement(
  p_store_id UUID,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS TABLE (
  total_sales INTEGER,
  total_orders INTEGER,
  commission_amount INTEGER,
  settlement_amount INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_commission_rate DECIMAL(5,2) := 10.00;  -- 기본 수수료율 10%
  v_total_sales INTEGER;
  v_total_orders INTEGER;
  v_commission INTEGER;
  v_settlement INTEGER;
BEGIN
  -- 기간 내 완료된 주문 집계
  SELECT 
    COALESCE(SUM(p.discount_price * o.quantity), 0),
    COALESCE(COUNT(*), 0)
  INTO v_total_sales, v_total_orders
  FROM orders o
  INNER JOIN products p ON o.product_id = p.id
  WHERE p.store_id = p_store_id
    AND o.status = 'COMPLETED'
    AND DATE(o.completed_at) >= p_period_start
    AND DATE(o.completed_at) <= p_period_end;
  
  -- 수수료 계산
  v_commission := ROUND(v_total_sales * v_commission_rate / 100);
  v_settlement := v_total_sales - v_commission;
  
  RETURN QUERY SELECT 
    v_total_sales::INTEGER,
    v_total_orders::INTEGER,
    v_commission::INTEGER,
    v_settlement::INTEGER;
END;
$$;

-- --------------------------------------------------------
-- 4. 일별 매출 조회 함수
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION get_daily_sales(
  p_store_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  sale_date DATE,
  orders_count INTEGER,
  total_sales INTEGER,
  commission_amount INTEGER,
  settlement_amount INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(o.completed_at) AS sale_date,
    COUNT(*)::INTEGER AS orders_count,
    SUM(p.discount_price * o.quantity)::INTEGER AS total_sales,
    ROUND(SUM(p.discount_price * o.quantity) * 0.10)::INTEGER AS commission_amount,
    (SUM(p.discount_price * o.quantity) - ROUND(SUM(p.discount_price * o.quantity) * 0.10))::INTEGER AS settlement_amount
  FROM orders o
  INNER JOIN products p ON o.product_id = p.id
  WHERE p.store_id = p_store_id
    AND o.status = 'COMPLETED'
    AND DATE(o.completed_at) >= p_start_date
    AND DATE(o.completed_at) <= p_end_date
  GROUP BY DATE(o.completed_at)
  ORDER BY sale_date DESC;
END;
$$;

-- --------------------------------------------------------
-- 5. 샘플 데이터 (개발용)
-- --------------------------------------------------------

-- 샘플 정산 내역 (최근 3개월)
DO $$
DECLARE
  v_store_id UUID;
BEGIN
  -- 첫 번째 가게 ID 가져오기
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  
  IF v_store_id IS NOT NULL THEN
    -- 1월 정산
    INSERT INTO settlements (
      store_id, period_start, period_end,
      total_sales, total_orders, commission_rate, commission_amount, settlement_amount,
      status, settled_at
    )
    VALUES (
      v_store_id, '2026-01-01', '2026-01-31',
      280000, 45, 10.00, 28000, 252000,
      'completed', '2026-02-05 10:00:00'
    )
    ON CONFLICT (store_id, period_start, period_end) DO NOTHING;
    
    -- 12월 정산
    INSERT INTO settlements (
      store_id, period_start, period_end,
      total_sales, total_orders, commission_rate, commission_amount, settlement_amount,
      status, settled_at
    )
    VALUES (
      v_store_id, '2025-12-01', '2025-12-31',
      310000, 52, 10.00, 31000, 279000,
      'completed', '2026-01-05 10:00:00'
    )
    ON CONFLICT (store_id, period_start, period_end) DO NOTHING;
    
    -- 2월 정산 (진행중)
    INSERT INTO settlements (
      store_id, period_start, period_end,
      total_sales, total_orders, commission_rate, commission_amount, settlement_amount,
      status
    )
    VALUES (
      v_store_id, '2026-02-01', '2026-02-28',
      0, 0, 10.00, 0, 0,
      'pending'
    )
    ON CONFLICT (store_id, period_start, period_end) DO NOTHING;
  END IF;
END $$;

-- 샘플 프로모션
DO $$
DECLARE
  v_store_id UUID;
  v_coupon_id UUID;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  SELECT id INTO v_coupon_id FROM coupons WHERE code = 'WELCOME2026' LIMIT 1;
  
  IF v_store_id IS NOT NULL THEN
    INSERT INTO store_promotions (
      store_id, coupon_id, name, description, type,
      used_count, commission_adjustment, adjustment_type,
      is_active, valid_from, valid_until
    )
    VALUES (
      v_store_id, v_coupon_id, '신규 가입 환영 쿠폰', '플랫폼 전체 프로모션',
      'platform', 8, -2.00, 'percent',
      true, '2026-01-01', '2026-12-31'
    )
    ON CONFLICT DO NOTHING;
    
    INSERT INTO store_promotions (
      store_id, coupon_id, name, description, type,
      used_count, commission_adjustment, adjustment_type,
      is_active, valid_from, valid_until
    )
    VALUES (
      v_store_id, NULL, '우리 가게 단골 할인', '단골 고객 10% 추가 할인',
      'store', 15, 0, NULL,
      true, '2026-02-01', '2026-02-28'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- --------------------------------------------------------
-- 6. RLS 정책 (개발 중에는 비활성화)
-- --------------------------------------------------------

-- 개발 편의를 위해 RLS는 비활성화
-- 프로덕션 배포 전 RLS 활성화 및 정책 추가 필요

-- --------------------------------------------------------
-- 7. 마이그레이션 로그
-- --------------------------------------------------------

DO $$ 
BEGIN
  RAISE NOTICE '✅ 사장님 대시보드 테이블 생성 완료';
  RAISE NOTICE '   - settlements (정산 내역)';
  RAISE NOTICE '   - store_promotions (프로모션 현황)';
  RAISE NOTICE '   - calculate_settlement() 함수';
  RAISE NOTICE '   - get_daily_sales() 함수';
END $$;
