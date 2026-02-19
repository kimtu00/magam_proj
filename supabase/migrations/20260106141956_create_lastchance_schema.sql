-- --------------------------------------------------------
-- LastChance 프로젝트 메인 스키마 마이그레이션
-- 
-- 이 마이그레이션은 PRD.md와 DB.sql을 기반으로 작성되었습니다.
-- 자취생 식비 구조대 플랫폼의 핵심 데이터베이스 스키마를 생성합니다.
-- 
-- 주요 테이블:
-- - profiles: 사용자 정보 (Clerk와 연동)
-- - stores: 사장님 가게 정보
-- - products: 상품(떨이) 정보
-- - orders: 예약 내역
-- --------------------------------------------------------

-- --------------------------------------------------------
-- 1. ENUM 타입 정의 (오타 방지 및 상태 관리)
-- --------------------------------------------------------

-- 사용자 역할: 구매자(학생) vs 판매자(사장님)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('BUYER', 'SELLER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 상품 상태: 판매중, 예약중, 판매완료
DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 주문 상태: 예약됨, 픽업완료, 취소됨
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('RESERVED', 'COMPLETED', 'CANCELED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- --------------------------------------------------------
-- 2. 테이블 생성 (PRD 스키마 반영)
-- --------------------------------------------------------

-- (1) PROFILES: 유저 정보 (Clerk와 연동)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL, -- Clerk에서 주는 유저 ID (예: user_2xyz...)
  role user_role NOT NULL DEFAULT 'BUYER', -- 기본값은 구매자
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- clerk_id에 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id ON profiles(clerk_id);

-- (2) STORES: 사장님 가게 정보
CREATE TABLE IF NOT EXISTS stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES profiles(clerk_id) ON DELETE CASCADE, -- 사장님의 Clerk ID와 연결
  name TEXT NOT NULL, -- 가게 이름
  address TEXT, -- 가게 주소
  phone TEXT, -- 가게 전화번호
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- owner_id에 인덱스 생성 (사장님별 가게 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);

-- (3) PRODUCTS: 상품(떨이) 정보
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE, -- 가게 사라지면 상품도 삭제
  name TEXT NOT NULL, -- 메뉴명
  original_price INTEGER NOT NULL, -- 정가
  discount_price INTEGER NOT NULL, -- 할인가
  image_url TEXT, -- 상품 이미지 URL (Supabase Storage)
  is_instant BOOLEAN DEFAULT FALSE, -- PRD: 바로 섭취 여부 태그
  pickup_deadline TIMESTAMPTZ NOT NULL, -- 픽업 마감 시간
  status product_status NOT NULL DEFAULT 'AVAILABLE', -- 기본값: 판매중
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- store_id와 status에 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(status, created_at) WHERE status = 'AVAILABLE';

-- (4) ORDERS: 예약 내역
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES profiles(clerk_id) ON DELETE CASCADE, -- 구매자 ID
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, -- 상품 ID
  status order_status NOT NULL DEFAULT 'RESERVED', -- 기본값: 예약됨
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- buyer_id와 product_id에 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);

-- --------------------------------------------------------
-- 3. 핵심 기능: 안전한 예약 처리 함수 (Transaction)
-- --------------------------------------------------------
-- 설명: 동시에 예약 버튼을 눌렀을 때, 먼저 누른 사람만 성공시키고 재고를 차감하는 함수입니다.
-- Cursor AI에게 "이 함수(reserve_product)를 RPC로 호출해줘"라고 하면 됩니다.

CREATE OR REPLACE FUNCTION reserve_product(
  p_product_id UUID, 
  p_buyer_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_product_status product_status;
  v_order_id UUID;
BEGIN
  -- 1. 현재 상품 상태 확인 (잠금 걸기)
  SELECT status INTO v_product_status
  FROM products
  WHERE id = p_product_id
  FOR UPDATE; -- 동시에 다른 사람이 수정 못하게 막음

  -- 2. 상품이 없거나 이미 팔렸으면 실패 리턴
  IF v_product_status IS NULL THEN
    RETURN json_build_object('success', false, 'message', '상품이 존재하지 않습니다.');
  END IF;

  IF v_product_status != 'AVAILABLE' THEN
    RETURN json_build_object('success', false, 'message', '이미 예약되었거나 판매된 상품입니다.');
  END IF;

  -- 3. 예약 처리 진행 (상품 상태 변경 + 주문서 생성)
  
  -- 상품 상태를 'RESERVED'로 변경
  UPDATE products 
  SET status = 'RESERVED' 
  WHERE id = p_product_id;

  -- 주문 테이블에 추가
  INSERT INTO orders (buyer_id, product_id, status)
  VALUES (p_buyer_id, p_product_id, 'RESERVED')
  RETURNING id INTO v_order_id;

  -- 4. 성공 리턴
  RETURN json_build_object('success', true, 'order_id', v_order_id);

EXCEPTION WHEN OTHERS THEN
  -- 에러 발생 시 롤백
  RETURN json_build_object('success', false, 'message', '시스템 오류가 발생했습니다.');
END;
$$;

-- --------------------------------------------------------
-- 4. 보안 설정 (RLS - Row Level Security)
-- --------------------------------------------------------
-- 개발 초기(Phase 1)에는 권한 문제로 막히지 않도록 '모든 접근 허용'으로 설정합니다.
-- 나중에 앱이 완성되면 이 정책을 삭제하고 엄격하게 바꿔야 합니다.

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (중복 방지)
DROP POLICY IF EXISTS "Dev Policy Profiles" ON profiles;
DROP POLICY IF EXISTS "Dev Policy Stores" ON stores;
DROP POLICY IF EXISTS "Dev Policy Products" ON products;
DROP POLICY IF EXISTS "Dev Policy Orders" ON orders;

-- (개발용) 누구나 읽고 쓰기 가능 정책
CREATE POLICY "Dev Policy Profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Dev Policy Stores" ON stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Dev Policy Products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Dev Policy Orders" ON orders FOR ALL USING (true) WITH CHECK (true);

-- 권한 부여
GRANT ALL ON TABLE profiles TO anon;
GRANT ALL ON TABLE profiles TO authenticated;
GRANT ALL ON TABLE stores TO anon;
GRANT ALL ON TABLE stores TO authenticated;
GRANT ALL ON TABLE products TO anon;
GRANT ALL ON TABLE products TO authenticated;
GRANT ALL ON TABLE orders TO anon;
GRANT ALL ON TABLE orders TO authenticated;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION reserve_product(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION reserve_product(UUID, TEXT) TO authenticated;

