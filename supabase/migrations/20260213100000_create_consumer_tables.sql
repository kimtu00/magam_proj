-- --------------------------------------------------------
-- 소비자 마이페이지용 테이블 생성
--
-- 이 마이그레이션은 소비자 마이페이지에서 사용할 다음 테이블을 생성합니다:
-- 1. coupons: 쿠폰 정의 (관리자가 생성)
-- 2. user_coupons: 사용자별 쿠폰 보유 현황
-- 3. point_transactions: 포인트 내역 (적립/사용/페이백)
-- 4. bank_accounts: 페이백 수령용 계좌 정보
-- 5. receipts: 영수증 제출 및 심사 내역
-- --------------------------------------------------------

-- --------------------------------------------------------
-- 1. coupons (쿠폰 정의)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE,                    -- 프로모션 코드 (null이면 자동 발급)
  name TEXT NOT NULL,                  -- 쿠폰명 (예: "신규 가입 축하 쿠폰")
  description TEXT,                    -- 쿠폰 설명
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'amount')), -- 할인 타입
  discount_value INTEGER NOT NULL,     -- 할인값 (% 또는 원)
  min_order_amount INTEGER DEFAULT 0,  -- 최소 주문금액
  max_discount INTEGER,                -- 최대 할인금액 (percent일 때만)
  valid_from TIMESTAMPTZ NOT NULL,     -- 사용 시작일
  valid_until TIMESTAMPTZ NOT NULL,    -- 사용 만료일
  total_quantity INTEGER,              -- 총 발급 수량 (NULL=무제한)
  issued_count INTEGER DEFAULT 0,      -- 현재까지 발급 수
  is_active BOOLEAN DEFAULT true,      -- 활성화 여부
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, valid_from, valid_until);

-- --------------------------------------------------------
-- 2. user_coupons (사용자별 쿠폰)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(clerk_id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'used', 'expired')),
  used_at TIMESTAMPTZ,
  used_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  acquired_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 사용자는 같은 쿠폰을 여러 번 받을 수 없음
  CONSTRAINT unique_user_coupon UNIQUE (user_id, coupon_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_status ON user_coupons(status);
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_status ON user_coupons(user_id, status);

-- --------------------------------------------------------
-- 3. point_transactions (포인트 내역)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(clerk_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'payback', 'expire')),
  amount INTEGER NOT NULL,             -- (+) 적립, (-) 사용/만료
  balance_after INTEGER NOT NULL,      -- 거래 후 잔액
  description TEXT,                    -- 거래 설명
  related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_created ON point_transactions(user_id, created_at DESC);

-- --------------------------------------------------------
-- 4. bank_accounts (계좌 정보)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES profiles(clerk_id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,             -- 은행명
  account_number TEXT NOT NULL,        -- 계좌번호
  account_holder TEXT NOT NULL,        -- 예금주
  is_verified BOOLEAN DEFAULT false,   -- 계좌 인증 여부
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);

-- --------------------------------------------------------
-- 5. receipts (영수증 제출)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(clerk_id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,             -- 영수증 이미지 URL (Supabase Storage)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reject_reason TEXT,                  -- 반려 사유
  payback_amount INTEGER,              -- 승인된 페이백 금액
  reviewed_by TEXT,                    -- 심사자 (관리자 clerk_id)
  reviewed_at TIMESTAMPTZ,             -- 심사 완료 시각
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_user_status ON receipts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);

-- --------------------------------------------------------
-- 6. Storage 버킷 (영수증 이미지용)
-- --------------------------------------------------------

-- receipts 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS 정책: 사용자는 자신의 영수증만 업로드/조회 가능
CREATE POLICY "Users can upload their own receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] = (SELECT auth.jwt() ->> 'sub')
  );

CREATE POLICY "Users can view their own receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] = (SELECT auth.jwt() ->> 'sub')
  );

CREATE POLICY "Users can delete their own receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] = (SELECT auth.jwt() ->> 'sub')
  );

-- 관리자는 모든 영수증 조회 가능
CREATE POLICY "Admins can view all receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'receipts' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE clerk_id = (SELECT auth.jwt() ->> 'sub')
      AND role IN ('admin', 'super_admin')
    )
  );

-- --------------------------------------------------------
-- 7. RLS 정책 (개발 중에는 비활성화, 프로덕션에서 활성화)
-- --------------------------------------------------------

-- 개발 편의를 위해 RLS는 비활성화
-- ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- 프로덕션 배포 전 RLS 활성화 및 정책 추가 필요

-- --------------------------------------------------------
-- 8. 헬퍼 함수: 포인트 잔액 조회
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION get_point_balance(p_user_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  balance INTEGER;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO balance
  FROM point_transactions
  WHERE user_id = p_user_id;
  
  RETURN balance;
END;
$$;

-- --------------------------------------------------------
-- 9. 샘플 데이터 (개발용)
-- --------------------------------------------------------

-- 샘플 쿠폰 생성
INSERT INTO coupons (code, name, description, discount_type, discount_value, min_order_amount, valid_from, valid_until, total_quantity)
VALUES 
  ('WELCOME2026', '신규 가입 축하', '첫 구매 시 2,000원 할인', 'amount', 2000, 0, '2026-01-01', '2026-12-31', NULL),
  ('HERO10', '히어로 10% 할인', '전체 상품 10% 할인', 'percent', 10, 5000, '2026-01-01', '2026-12-31', 100),
  ('WEEKEND5000', '주말 특가', '5,000원 이상 구매 시 1,000원 할인', 'amount', 1000, 5000, '2026-02-01', '2026-02-28', 500)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- 10. 마이그레이션 로그
-- --------------------------------------------------------

DO $$ 
BEGIN
  RAISE NOTICE '✅ 소비자 마이페이지 테이블 생성 완료';
  RAISE NOTICE '   - coupons';
  RAISE NOTICE '   - user_coupons';
  RAISE NOTICE '   - point_transactions';
  RAISE NOTICE '   - bank_accounts';
  RAISE NOTICE '   - receipts';
  RAISE NOTICE '   - receipts storage bucket';
  RAISE NOTICE '   - 헬퍼 함수: get_point_balance';
END $$;
