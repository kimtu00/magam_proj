-- --------------------------------------------------------
-- 메뉴 템플릿 테이블 생성
-- 
-- 사장님이 자주 판매하는 메뉴를 미리 등록해두고
-- 할인 상품 등록 시 빠르게 선택할 수 있도록 합니다.
-- --------------------------------------------------------

-- menu_templates 테이블 생성
CREATE TABLE IF NOT EXISTS menu_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 메뉴명 (예: "떡볶이 세트")
  original_price INTEGER NOT NULL, -- 정가
  image_url TEXT, -- 메뉴 이미지 URL (Supabase Storage)
  is_instant BOOLEAN DEFAULT FALSE, -- 바로 섭취 가능 여부
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- store_id에 인덱스 생성 (가게별 메뉴 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_menu_templates_store_id ON menu_templates(store_id);

-- products 테이블에 template_id 컬럼 추가 (선택적, NULL 허용)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES menu_templates(id) ON DELETE SET NULL;

-- template_id에 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_products_template_id ON products(template_id);

-- RLS 활성화
ALTER TABLE menu_templates ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (중복 방지)
DROP POLICY IF EXISTS "Dev Policy Menu Templates" ON menu_templates;

-- (개발용) 누구나 읽고 쓰기 가능 정책
CREATE POLICY "Dev Policy Menu Templates" ON menu_templates FOR ALL USING (true) WITH CHECK (true);

-- 권한 부여
GRANT ALL ON TABLE menu_templates TO anon;
GRANT ALL ON TABLE menu_templates TO authenticated;

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_menu_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS menu_templates_updated_at_trigger ON menu_templates;

CREATE TRIGGER menu_templates_updated_at_trigger
BEFORE UPDATE ON menu_templates
FOR EACH ROW
EXECUTE FUNCTION update_menu_templates_updated_at();


