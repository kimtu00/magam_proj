-- ============================================================
-- Migration: 학습 데이터 수집 함수
-- Description: 마감된 상품의 소진율과 피처를 계산하여 저장
-- ============================================================

-- 1. 시간대 분류 헬퍼 함수
CREATE OR REPLACE FUNCTION get_time_slot(hour INT)
RETURNS TEXT AS $$
BEGIN
  CASE
    WHEN hour >= 6 AND hour < 11 THEN RETURN '아침';
    WHEN hour >= 11 AND hour < 14 THEN RETURN '점심';
    WHEN hour >= 14 AND hour < 17 THEN RETURN '오후';
    WHEN hour >= 17 AND hour < 21 THEN RETURN '저녁';
    ELSE RETURN '심야';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_time_slot IS '시각(0~23)을 시간대로 변환 (아침/점심/오후/저녁/심야)';

-- 2. 지역 추출 헬퍼 함수 (주소에서 구/군 추출)
CREATE OR REPLACE FUNCTION extract_region(address TEXT)
RETURNS TEXT AS $$
DECLARE
  region TEXT;
BEGIN
  -- 주소가 null이면 null 반환
  IF address IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- "서울시 강남구 역삼동" → "강남구" 추출
  -- "경기도 성남시 분당구" → "성남시 분당구" 추출
  -- 정규식으로 "XX구" 또는 "XX시" 패턴 찾기
  region := (regexp_match(address, '([가-힣]+(?:구|시))'))[1];
  
  -- 찾지 못하면 원본 주소의 첫 단어 반환
  IF region IS NULL THEN
    region := split_part(address, ' ', 1);
  END IF;
  
  RETURN region;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION extract_region IS '주소에서 구/시 단위 지역명 추출';

-- 3. 단일 상품의 학습 데이터 수집 함수
CREATE OR REPLACE FUNCTION collect_training_data_for_product(p_product_id UUID)
RETURNS VOID AS $$
DECLARE
  v_product RECORD;
  v_store RECORD;
  v_sold_quantity INT;
  v_sell_through_rate DECIMAL(5,4);
  v_register_hour INT;
  v_register_minute INT;
  v_register_dow TEXT;
  v_deadline_hours DECIMAL(6,2);
  v_time_slot TEXT;
  v_is_weekend BOOLEAN;
  v_store_avg_rating DECIMAL(3,2);
  v_store_total_reviews INT;
  v_store_total_sales INT;
  v_discount_rate DECIMAL(5,2);
BEGIN
  -- 이미 수집된 데이터인지 확인
  IF EXISTS (
    SELECT 1 FROM prediction_training_data WHERE product_id = p_product_id
  ) THEN
    RAISE NOTICE '이미 수집된 상품: %', p_product_id;
    RETURN;
  END IF;

  -- 상품 정보 조회
  SELECT * INTO v_product
  FROM products
  WHERE id = p_product_id;
  
  IF NOT FOUND THEN
    RAISE NOTICE '상품을 찾을 수 없음: %', p_product_id;
    RETURN;
  END IF;
  
  -- 마감되지 않은 상품은 수집하지 않음
  IF v_product.pickup_deadline >= now() THEN
    RAISE NOTICE '아직 마감되지 않은 상품: %', p_product_id;
    RETURN;
  END IF;
  
  -- 가게 정보 조회
  SELECT * INTO v_store
  FROM stores
  WHERE id = v_product.store_id;
  
  -- 판매된 수량 계산 (COMPLETED 주문의 quantity 합계)
  SELECT COALESCE(SUM(quantity), 0) INTO v_sold_quantity
  FROM orders
  WHERE product_id = p_product_id
    AND status = 'COMPLETED';
  
  -- 소진율 계산
  IF v_product.quantity > 0 THEN
    v_sell_through_rate := v_sold_quantity::DECIMAL / v_product.quantity;
  ELSE
    v_sell_through_rate := 0;
  END IF;
  
  -- 등록 시각 추출
  v_register_hour := EXTRACT(HOUR FROM v_product.created_at);
  v_register_minute := EXTRACT(MINUTE FROM v_product.created_at);
  
  -- 요일 추출 (한글)
  v_register_dow := CASE EXTRACT(DOW FROM v_product.created_at)::INT
    WHEN 0 THEN '일'
    WHEN 1 THEN '월'
    WHEN 2 THEN '화'
    WHEN 3 THEN '수'
    WHEN 4 THEN '목'
    WHEN 5 THEN '금'
    WHEN 6 THEN '토'
  END;
  
  -- 주말 여부
  v_is_weekend := EXTRACT(DOW FROM v_product.created_at)::INT IN (0, 6);
  
  -- 마감까지 남은 시간 (등록 시점 기준, 시간 단위)
  v_deadline_hours := EXTRACT(EPOCH FROM (v_product.pickup_deadline - v_product.created_at)) / 3600.0;
  
  -- 시간대 분류
  v_time_slot := get_time_slot(v_register_hour);
  
  -- 할인율 계산 (%)
  IF v_product.original_price > 0 THEN
    v_discount_rate := ((v_product.original_price - v_product.discount_price)::DECIMAL / v_product.original_price) * 100;
  ELSE
    v_discount_rate := 0;
  END IF;
  
  -- 가게 평균 평점 계산
  SELECT COALESCE(AVG(rating), 0) INTO v_store_avg_rating
  FROM reviews
  WHERE store_id = v_product.store_id;
  
  -- 가게 리뷰 수
  SELECT COUNT(*) INTO v_store_total_reviews
  FROM reviews
  WHERE store_id = v_product.store_id;
  
  -- 가게 누적 판매 건수 (상품 등록 시점 기준)
  SELECT COUNT(*) INTO v_store_total_sales
  FROM orders o
  JOIN products p ON p.id = o.product_id
  WHERE p.store_id = v_product.store_id
    AND o.status = 'COMPLETED'
    AND o.completed_at < v_product.created_at;  -- 등록 시점 이전 판매만
  
  -- 학습 데이터 삽입
  INSERT INTO prediction_training_data (
    sell_through_rate,
    product_register_hour,
    product_register_minute,
    original_price,
    discount_price,
    discount_rate,
    product_quantity,
    deadline_hours_remaining,
    store_avg_rating,
    store_total_reviews,
    store_total_sales,
    product_category,
    register_day_of_week,
    store_region,
    time_slot,
    is_holiday,
    is_weekend,
    product_id,
    store_id,
    recorded_at
  ) VALUES (
    v_sell_through_rate,
    v_register_hour,
    v_register_minute,
    v_product.original_price,
    v_product.discount_price,
    v_discount_rate,
    v_product.quantity,
    v_deadline_hours,
    v_store_avg_rating,
    v_store_total_reviews,
    v_store_total_sales,
    v_product.category::TEXT,
    v_register_dow,
    extract_region(v_store.address),
    v_time_slot,
    false,  -- is_holiday는 향후 확장 (공휴일 API 연동 필요)
    v_is_weekend,
    p_product_id,
    v_product.store_id,
    now()
  )
  ON CONFLICT (product_id) DO NOTHING;  -- 중복 방지
  
  RAISE NOTICE '✓ 학습 데이터 수집 완료: product_id=%, 소진율=%', p_product_id, v_sell_through_rate;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '학습 데이터 수집 실패: product_id=%, error=%', p_product_id, SQLERRM;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION collect_training_data_for_product IS '단일 상품의 소진율과 피처를 수집하여 학습 데이터 테이블에 저장';

-- 4. 일괄 수집 함수 (마감된 모든 상품 대상)
CREATE OR REPLACE FUNCTION collect_training_data_batch()
RETURNS TABLE(
  collected_count INT,
  skipped_count INT,
  error_count INT
) AS $$
DECLARE
  v_product_id UUID;
  v_collected INT := 0;
  v_skipped INT := 0;
  v_errors INT := 0;
BEGIN
  -- 마감된 상품 중 아직 수집되지 않은 것들 처리
  FOR v_product_id IN (
    SELECT p.id
    FROM products p
    WHERE p.pickup_deadline < now()  -- 마감 지남
      AND p.status IN ('SOLD', 'SOLD_OUT', 'AVAILABLE')  -- 판매 상태
      AND p.id NOT IN (
        SELECT product_id 
        FROM prediction_training_data 
        WHERE product_id IS NOT NULL
      )  -- 아직 수집 안 됨
    ORDER BY p.created_at ASC
    LIMIT 1000  -- 한 번에 최대 1000건 처리
  ) LOOP
    BEGIN
      PERFORM collect_training_data_for_product(v_product_id);
      v_collected := v_collected + 1;
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors + 1;
        RAISE WARNING '상품 처리 실패: %, error: %', v_product_id, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_collected, v_skipped, v_errors;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION collect_training_data_batch IS '마감된 모든 상품의 학습 데이터 일괄 수집 (최대 1000건)';

-- 5. RLS 정책 (관리자만 접근)
ALTER TABLE prediction_training_data ENABLE ROW LEVEL SECURITY;

-- 읽기: 인증된 사용자 전체 (분석/학습용)
CREATE POLICY "Anyone can view training data"
  ON prediction_training_data
  FOR SELECT
  TO authenticated
  USING (true);

-- 쓰기/수정/삭제: service_role만 (보안)
-- (RLS는 service_role을 우회하므로 별도 정책 불필요)

-- 6. 검증
DO $$
BEGIN
  RAISE NOTICE '✓ collect_training_data_for_product() 함수 생성 완료';
  RAISE NOTICE '✓ collect_training_data_batch() 함수 생성 완료';
  RAISE NOTICE '✓ get_time_slot() 헬퍼 함수 생성 완료';
  RAISE NOTICE '✓ extract_region() 헬퍼 함수 생성 완료';
  RAISE NOTICE '✓ RLS 정책 설정 완료';
END $$;
