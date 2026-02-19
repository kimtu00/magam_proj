-- --------------------------------------------------------
-- 레거시 users 테이블 삭제
-- 
-- 이유: profiles 테이블로 완전히 대체됨
-- - users 테이블은 초기 테스트 목적으로만 사용되었음
-- - 현재 프로덕션 코드는 모두 profiles 테이블 사용
-- - 스키마 일관성 향상 및 혼란 방지
-- --------------------------------------------------------

-- 기존 정책이 있다면 삭제
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- users 테이블 삭제 (존재하는 경우에만)
DROP TABLE IF EXISTS public.users CASCADE;

-- 테이블 삭제 확인 메시지
DO $$
BEGIN
  RAISE NOTICE 'Legacy users table has been dropped. All user data should now use the profiles table.';
END $$;


