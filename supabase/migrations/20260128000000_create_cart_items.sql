-- 장바구니 항목 테이블 생성
-- 소비자가 상품을 장바구니에 담아 나중에 일괄 예약할 수 있는 기능

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES profiles(clerk_id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  preferred_pickup_time TIMESTAMPTZ, -- 소비자가 선택한 희망 픽업 시간 (선택)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 같은 사용자가 같은 상품을 중복 추가 방지
  UNIQUE(buyer_id, product_id)
);

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_cart_items_buyer_id ON cart_items(buyer_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- RLS 활성화 (개발 중에는 모든 접근 허용)
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- 개발용 정책 (모든 접근 허용)
DROP POLICY IF EXISTS "Dev Policy Cart Items" ON cart_items;
CREATE POLICY "Dev Policy Cart Items" ON cart_items 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 권한 부여
GRANT ALL ON TABLE cart_items TO anon;
GRANT ALL ON TABLE cart_items TO authenticated;
