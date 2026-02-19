-- Supabase 공식 문서 예시: instruments 테이블
-- https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
--
-- 이 마이그레이션은 Supabase 공식 문서의 예시를 기반으로 작성되었습니다.
-- 테스트 및 예제 목적으로 사용할 수 있습니다.

-- instruments 테이블 생성
CREATE TABLE IF NOT EXISTS public.instruments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL
);

-- 테이블 소유자 설정
ALTER TABLE public.instruments OWNER TO postgres;

-- RLS 활성화
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;

-- 샘플 데이터 삽입
INSERT INTO public.instruments (name)
VALUES
  ('violin'),
  ('viola'),
  ('cello')
ON CONFLICT DO NOTHING;

-- 공개 읽기 정책 (anon 사용자도 읽을 수 있음)
-- 주의: 프로덕션에서는 적절한 RLS 정책을 설정하세요
CREATE POLICY "public can read instruments"
ON public.instruments
FOR SELECT
TO anon
USING (true);

-- 인증된 사용자도 읽을 수 있음
CREATE POLICY "authenticated can read instruments"
ON public.instruments
FOR SELECT
TO authenticated
USING (true);

-- 권한 부여
GRANT ALL ON TABLE public.instruments TO anon;
GRANT ALL ON TABLE public.instruments TO authenticated;
GRANT ALL ON TABLE public.instruments TO service_role;

