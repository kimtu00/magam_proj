-- 리뷰 테이블 생성
-- 소비자가 완료된 주문에 대해 리뷰를 작성할 수 있는 기능

CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id TEXT NOT NULL REFERENCES profiles(clerk_id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),  -- 1~5점 별점
  content TEXT,  -- 리뷰 내용 (선택)
  image_url TEXT,  -- 리뷰 이미지 (선택)
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 같은 주문에 대해 중복 리뷰 방지
  UNIQUE(order_id)
);

-- 리뷰 답글 테이블
-- 사장님이 리뷰에 답변을 달 수 있는 기능
CREATE TABLE IF NOT EXISTS review_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL REFERENCES profiles(clerk_id) ON DELETE CASCADE,
  content TEXT NOT NULL,  -- 답글 내용
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 한 리뷰당 하나의 답글만 (사장님 답글)
  UNIQUE(review_id)
);

-- 리뷰 신고 테이블
-- 부적절한 리뷰를 신고할 수 있는 기능
CREATE TABLE IF NOT EXISTS review_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL REFERENCES profiles(clerk_id) ON DELETE CASCADE,
  reason TEXT NOT NULL,  -- 신고 사유
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED')),
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 같은 사람이 같은 리뷰를 중복 신고 방지
  UNIQUE(review_id, reporter_id)
);

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_buyer_id ON reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status);

-- RLS 활성화 (개발 중에는 모든 접근 허용)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

-- 개발용 정책 (모든 접근 허용)
DROP POLICY IF EXISTS "Dev Policy Reviews" ON reviews;
CREATE POLICY "Dev Policy Reviews" ON reviews 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Dev Policy Review Replies" ON review_replies;
CREATE POLICY "Dev Policy Review Replies" ON review_replies 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Dev Policy Review Reports" ON review_reports;
CREATE POLICY "Dev Policy Review Reports" ON review_reports 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 권한 부여
GRANT ALL ON TABLE reviews TO anon;
GRANT ALL ON TABLE reviews TO authenticated;
GRANT ALL ON TABLE review_replies TO anon;
GRANT ALL ON TABLE review_replies TO authenticated;
GRANT ALL ON TABLE review_reports TO anon;
GRANT ALL ON TABLE review_reports TO authenticated;
