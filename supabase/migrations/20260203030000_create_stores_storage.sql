-- --------------------------------------------------------
-- Stores Storage 버킷 생성 및 RLS 정책 설정
-- 
-- 가게 이미지를 저장할 공개 버킷입니다.
-- 누구나 이미지를 조회할 수 있지만, service_role만 업로드/삭제할 수 있습니다.
-- --------------------------------------------------------

-- 1. stores 버킷 생성 (이미 존재하면 무시됨)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stores',
  'stores',
  true,  -- public bucket (누구나 이미지 조회 가능)
  5242880,  -- 5MB 제한 (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp']  -- 이미지 파일만 허용
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 기존 정책 삭제 (중복 방지)
DROP POLICY IF EXISTS "Public can read stores" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload stores" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete stores" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update stores" ON storage.objects;

-- SELECT: 누구나 읽기 가능 (공개 버킷)
CREATE POLICY "Public can read stores"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'stores');

-- INSERT: service_role만 업로드 가능
CREATE POLICY "Service role can upload stores"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'stores');

-- DELETE: service_role만 삭제 가능
CREATE POLICY "Service role can delete stores"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'stores');

-- UPDATE: service_role만 업데이트 가능
CREATE POLICY "Service role can update stores"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'stores')
WITH CHECK (bucket_id = 'stores');

-- 권한 부여
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.objects TO authenticated;
GRANT INSERT ON storage.objects TO service_role;
GRANT DELETE ON storage.objects TO service_role;
GRANT UPDATE ON storage.objects TO service_role;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'Stores storage bucket이 생성되었습니다.';
  RAISE NOTICE '- Bucket: stores';
  RAISE NOTICE '- Public: true (누구나 조회 가능)';
  RAISE NOTICE '- Size limit: 5MB';
  RAISE NOTICE '- Allowed types: image/jpeg, image/png, image/webp';
  RAISE NOTICE '- INSERT/UPDATE/DELETE: service_role only';
END $$;
