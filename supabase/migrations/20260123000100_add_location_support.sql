-- --------------------------------------------------------
-- 위치 기반 서비스 지원을 위한 마이그레이션
-- 
-- 이 마이그레이션은 다음을 추가합니다:
-- 1. profiles 테이블에 소비자 주소 및 좌표 컬럼
-- 2. stores 테이블에 좌표 컬럼
-- 3. 거리 계산 함수 (Haversine 공식)
-- 4. 위치 기반 조회를 위한 인덱스
-- --------------------------------------------------------

-- --------------------------------------------------------
-- 1. profiles 테이블에 소비자 주소 및 좌표 추가
-- --------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

COMMENT ON COLUMN profiles.address IS '소비자의 검색 기준 주소 (카카오 주소 검색 API 결과)';
COMMENT ON COLUMN profiles.latitude IS '소비자 주소의 위도';
COMMENT ON COLUMN profiles.longitude IS '소비자 주소의 경도';

-- --------------------------------------------------------
-- 2. stores 테이블에 좌표 추가 (address는 이미 존재)
-- --------------------------------------------------------
ALTER TABLE stores ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

COMMENT ON COLUMN stores.latitude IS '가게 주소의 위도';
COMMENT ON COLUMN stores.longitude IS '가게 주소의 경도';

-- --------------------------------------------------------
-- 3. 거리 계산 함수 (Haversine 공식)
-- --------------------------------------------------------
-- 두 지점 간의 직선 거리를 km 단위로 계산합니다.
-- 사용 예: SELECT calculate_distance(37.5665, 126.9780, 37.5172, 127.0473);
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R DOUBLE PRECISION := 6371; -- 지구 반지름 (km)
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  -- 위도/경도가 NULL이면 NULL 반환
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Haversine 공식
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);
  
  a := SIN(dlat/2) * SIN(dlat/2) + 
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
       SIN(dlon/2) * SIN(dlon/2);
       
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  
  RETURN R * c;
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION calculate_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO anon;
GRANT EXECUTE ON FUNCTION calculate_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;

-- --------------------------------------------------------
-- 4. 위치 기반 조회를 위한 인덱스
-- --------------------------------------------------------
-- profiles 테이블 인덱스 (소비자 위치)
CREATE INDEX IF NOT EXISTS idx_profiles_location 
ON profiles(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- stores 테이블 인덱스 (가게 위치)
CREATE INDEX IF NOT EXISTS idx_stores_location 
ON stores(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- --------------------------------------------------------
-- 5. 완료 메시지
-- --------------------------------------------------------
DO $$ 
BEGIN
  RAISE NOTICE '✅ Location support migration completed successfully!';
  RAISE NOTICE '   - Added address/latitude/longitude to profiles';
  RAISE NOTICE '   - Added latitude/longitude to stores';
  RAISE NOTICE '   - Created calculate_distance() function';
  RAISE NOTICE '   - Created location indexes';
END $$;


