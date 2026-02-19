-- Clerk + Supabase 통합 예시: RLS 정책이 적용된 tasks 테이블
-- 
-- 이 마이그레이션은 Clerk 문서의 예시를 기반으로 작성되었습니다.
-- https://clerk.com/docs/guides/development/integrations/databases/supabase
--
-- 주요 특징:
-- 1. user_id 컬럼이 auth.jwt()->>'sub' (Clerk User ID)로 자동 설정
-- 2. RLS 정책으로 사용자는 자신의 데이터만 접근 가능
-- 3. SELECT, INSERT 정책이 적용됨

-- tasks 테이블 생성
CREATE TABLE IF NOT EXISTS public.tasks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT (SELECT auth.jwt()->>'sub'),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 테이블 소유자 설정
ALTER TABLE public.tasks OWNER TO postgres;

-- RLS 활성화
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- SELECT 정책: 사용자는 자신의 tasks만 조회 가능
CREATE POLICY "User can view their own tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt()->>'sub') = user_id
);

-- INSERT 정책: 사용자는 자신의 tasks만 생성 가능
CREATE POLICY "Users must insert their own tasks"
ON public.tasks
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.jwt()->>'sub') = user_id
);

-- UPDATE 정책: 사용자는 자신의 tasks만 수정 가능
CREATE POLICY "Users can update their own tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt()->>'sub') = user_id
)
WITH CHECK (
  (SELECT auth.jwt()->>'sub') = user_id
);

-- DELETE 정책: 사용자는 자신의 tasks만 삭제 가능
CREATE POLICY "Users can delete their own tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING (
  (SELECT auth.jwt()->>'sub') = user_id
);

-- 권한 부여
GRANT ALL ON TABLE public.tasks TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE tasks_id_seq TO authenticated;

