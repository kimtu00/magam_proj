-- 사용자 즐겨찾기 가게 테이블 생성
-- 소비자가 특정 가게를 즐겨찾기할 수 있는 기능

CREATE TABLE IF NOT EXISTS user_favorite_stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Clerk user ID
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 한 사용자가 같은 가게를 중복 즐겨찾기 못하도록
  UNIQUE(user_id, store_id)
);

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_favorite_stores_user_id ON user_favorite_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_stores_store_id ON user_favorite_stores(store_id);

-- RLS 활성화 (개발 중에는 모든 접근 허용)
ALTER TABLE user_favorite_stores ENABLE ROW LEVEL SECURITY;

-- 개발용 정책 (모든 접근 허용)
DROP POLICY IF EXISTS "Dev Policy Favorite Stores" ON user_favorite_stores;
CREATE POLICY "Dev Policy Favorite Stores" ON user_favorite_stores 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 권한 부여
GRANT ALL ON TABLE user_favorite_stores TO anon;
GRANT ALL ON TABLE user_favorite_stores TO authenticated;


