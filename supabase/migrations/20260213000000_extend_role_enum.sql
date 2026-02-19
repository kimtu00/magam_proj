-- --------------------------------------------------------
-- 역할(role) ENUM 확장 마이그레이션
--
-- 기존 user_role ENUM에 새로운 역할 추가:
-- - consumer: 소비자 (기존 BUYER와 동일)
-- - producer: 사장님 (기존 SELLER와 동일)
-- - admin: 플랫폼 관리자
-- - super_admin: 최고 관리자
--
-- 기존 BUYER, SELLER 값은 하위 호환성을 위해 유지됩니다.
-- 점진적 전환을 위해 애플리케이션 레벨에서 레거시 매핑을 제공합니다.
-- --------------------------------------------------------

-- --------------------------------------------------------
-- 1. ENUM에 새 값 추가
-- --------------------------------------------------------

-- PostgreSQL ENUM은 트랜잭션 내에서 ALTER TYPE ADD VALUE를 
-- 실행할 수 없으므로 별도로 실행됩니다.

-- consumer 값 추가 (소비자)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'consumer' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'consumer';
  END IF;
END $$;

-- producer 값 추가 (사장님)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'producer' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'producer';
  END IF;
END $$;

-- admin 값 추가 (플랫폼 관리자)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'admin' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'admin';
  END IF;
END $$;

-- super_admin 값 추가 (최고 관리자)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'super_admin' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'super_admin';
  END IF;
END $$;

-- --------------------------------------------------------
-- 2. 기존 데이터 마이그레이션
-- --------------------------------------------------------

-- BUYER -> consumer로 마이그레이션
UPDATE profiles 
SET role = 'consumer'
WHERE role = 'BUYER';

-- SELLER -> producer로 마이그레이션
UPDATE profiles 
SET role = 'producer'
WHERE role = 'SELLER';

-- --------------------------------------------------------
-- 3. 인덱스 재생성 (역할별 조회 성능 향상)
-- --------------------------------------------------------

-- 역할별 인덱스 (기존에 없었다면 추가)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- --------------------------------------------------------
-- 4. 마이그레이션 로그
-- --------------------------------------------------------

DO $$ 
DECLARE
  consumer_count INTEGER;
  producer_count INTEGER;
  admin_count INTEGER;
  super_admin_count INTEGER;
  total_count INTEGER;
BEGIN
  -- 각 역할별 사용자 수 집계
  SELECT COUNT(*) INTO consumer_count FROM profiles WHERE role = 'consumer';
  SELECT COUNT(*) INTO producer_count FROM profiles WHERE role = 'producer';
  SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'admin';
  SELECT COUNT(*) INTO super_admin_count FROM profiles WHERE role = 'super_admin';
  SELECT COUNT(*) INTO total_count FROM profiles;

  -- 로그 출력
  RAISE NOTICE '✅ 역할 ENUM 확장 완료';
  RAISE NOTICE '   - consumer: % 명', consumer_count;
  RAISE NOTICE '   - producer: % 명', producer_count;
  RAISE NOTICE '   - admin: % 명', admin_count;
  RAISE NOTICE '   - super_admin: % 명', super_admin_count;
  RAISE NOTICE '   - 전체: % 명', total_count;
END $$;
