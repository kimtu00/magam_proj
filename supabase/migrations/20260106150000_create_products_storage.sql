-- --------------------------------------------------------
-- Products Storage 버킷 생성 및 RLS 정책 설정
-- 
-- 상품 이미지를 저장할 공개 버킷입니다.
-- 누구나 이미지를 조회할 수 있지만, 인증된 사용자만 업로드할 수 있습니다.
-- --------------------------------------------------------

-- 1. products 버킷 생성 (이미 존재하면 무시됨)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,  -- public bucket (누구나 이미지 조회 가능)
  5242880,  -- 5MB 제한 (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp']  -- 이미지 파일만 허용
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 기존 정책 삭제 (중복 방지)
DROP POLICY IF EXISTS "Public can read products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own products" ON storage.objects;

-- SELECT: 누구나 읽기 가능 (공개 버킷)
CREATE POLICY "Public can read products"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- INSERT: 인증된 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload products"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- DELETE: 인증된 사용자만 삭제 가능 (자신이 업로드한 파일만)
-- 경로 구조: products/{clerk_user_id}/{filename}
CREATE POLICY "Authenticated users can delete own products"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- UPDATE: 인증된 사용자만 업데이트 가능 (자신이 업로드한 파일만)
CREATE POLICY "Authenticated users can update own products"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
)
WITH CHECK (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- 권한 부여
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.objects TO authenticated;
GRANT INSERT ON storage.objects TO authenticated;
GRANT DELETE ON storage.objects TO authenticated;
GRANT UPDATE ON storage.objects TO authenticated;

