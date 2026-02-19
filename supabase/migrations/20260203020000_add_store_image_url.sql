-- --------------------------------------------------------
-- Add image_url column to stores table
-- 가게 대표 이미지 URL을 저장하기 위한 컬럼 추가
-- --------------------------------------------------------

-- stores 테이블에 image_url 컬럼 추가
ALTER TABLE stores ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 컬럼 설명 추가
COMMENT ON COLUMN stores.image_url IS '가게 대표 이미지 URL (Supabase Storage)';
