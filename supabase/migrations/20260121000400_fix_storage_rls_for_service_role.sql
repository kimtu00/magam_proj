-- --------------------------------------------------------
-- Storage RLS 정책 수정: service_role 추가
-- 
-- Service Role Client가 Storage에 접근할 수 있도록 RLS 정책 수정
-- 이미지 업로드 시 Service Role Key를 사용하므로 필요함
-- --------------------------------------------------------

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Authenticated users can upload products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own products" ON storage.objects;

-- INSERT: 인증된 사용자 및 service_role만 업로드 가능
CREATE POLICY "Authenticated users can upload products"
ON storage.objects FOR INSERT
TO authenticated, service_role
WITH CHECK (bucket_id = 'products');

-- DELETE: 인증된 사용자 및 service_role만 삭제 가능 (자신이 업로드한 파일만)
-- 경로 구조: products/{clerk_user_id}/{filename} 또는 products/{store_id}/{filename}
CREATE POLICY "Authenticated users can delete own products"
ON storage.objects FOR DELETE
TO authenticated, service_role
USING (
  bucket_id = 'products' AND
  (
    -- authenticated: 자신의 파일만 삭제 가능
    (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub'))
    OR
    -- service_role: 모든 파일 삭제 가능 (관리자 권한)
    auth.role() = 'service_role'
  )
);

-- UPDATE: 인증된 사용자 및 service_role만 업데이트 가능 (자신이 업로드한 파일만)
CREATE POLICY "Authenticated users can update own products"
ON storage.objects FOR UPDATE
TO authenticated, service_role
USING (
  bucket_id = 'products' AND
  (
    -- authenticated: 자신의 파일만 업데이트 가능
    (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub'))
    OR
    -- service_role: 모든 파일 업데이트 가능 (관리자 권한)
    auth.role() = 'service_role'
  )
)
WITH CHECK (
  bucket_id = 'products' AND
  (
    -- authenticated: 자신의 파일만 업데이트 가능
    (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub'))
    OR
    -- service_role: 모든 파일 업데이트 가능 (관리자 권한)
    auth.role() = 'service_role'
  )
);

-- service_role에 권한 부여
GRANT INSERT ON storage.objects TO service_role;
GRANT DELETE ON storage.objects TO service_role;
GRANT UPDATE ON storage.objects TO service_role;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'Storage RLS 정책이 service_role을 포함하도록 수정되었습니다.';
  RAISE NOTICE '- INSERT: authenticated, service_role';
  RAISE NOTICE '- DELETE: authenticated (own files), service_role (all files)';
  RAISE NOTICE '- UPDATE: authenticated (own files), service_role (all files)';
END $$;

