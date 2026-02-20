-- ============================================================
-- 기존 시드 데이터 탄소절감량 수정 스크립트
-- 
-- 목적: seed.sql을 이미 실행한 DB에서 탄소절감 데이터를 수동으로 추가/수정
-- 사용: Supabase SQL 에디터에서 직접 실행
--
-- 수행 작업:
--   1. 시드 상품들에 weight_value, weight_unit 업데이트
--   2. COMPLETED 주문에 대한 saved_food_log 삽입 (없는 경우)
-- ============================================================

-- ============================================================
-- 1. 시드 상품 무게 업데이트 (기존 데이터에 weight_value가 NULL인 경우)
-- ============================================================

UPDATE products SET weight_value = 500, weight_unit = 'g'
WHERE id = '22222222-0000-0000-0000-000000000001' AND (weight_value IS NULL OR weight_value = 0);

UPDATE products SET weight_value = 600, weight_unit = 'g'
WHERE id = '22222222-0000-0000-0000-000000000002' AND (weight_value IS NULL OR weight_value = 0);

UPDATE products SET weight_value = 250, weight_unit = 'g'
WHERE id = '22222222-0000-0000-0000-000000000003' AND (weight_value IS NULL OR weight_value = 0);

UPDATE products SET weight_value = 700, weight_unit = 'g'
WHERE id = '22222222-0000-0000-0000-000000000004' AND (weight_value IS NULL OR weight_value = 0);

UPDATE products SET weight_value = 450, weight_unit = 'g'
WHERE id = '22222222-0000-0000-0000-000000000005' AND (weight_value IS NULL OR weight_value = 0);

UPDATE products SET weight_value = 400, weight_unit = 'g'
WHERE id = '22222222-0000-0000-0000-000000000006' AND (weight_value IS NULL OR weight_value = 0);

-- ============================================================
-- 2. COMPLETED 주문에 대한 saved_food_log 삽입
-- ============================================================

-- 소비자1: 된장찌개 정식 (700g × 2.5 = 1750g CO2)
INSERT INTO saved_food_log (id, user_id, order_id, product_id, saved_weight_g, co2_saved_g, created_at)
VALUES (
  '55555555-0000-0000-0000-000000000001',
  'seed_consumer_001',
  '33333333-0000-0000-0000-000000000002',
  '22222222-0000-0000-0000-000000000004',
  700, 1750,
  '2026-02-01 12:00:00+09'
)
ON CONFLICT (order_id) DO UPDATE
  SET co2_saved_g = EXCLUDED.co2_saved_g,
      saved_weight_g = EXCLUDED.saved_weight_g;

-- 소비자2: 순대국밥 (600g × 2.5 = 1500g CO2)
INSERT INTO saved_food_log (id, user_id, order_id, product_id, saved_weight_g, co2_saved_g, created_at)
VALUES (
  '55555555-0000-0000-0000-000000000002',
  'seed_consumer_002',
  '33333333-0000-0000-0000-000000000005',
  '22222222-0000-0000-0000-000000000002',
  600, 1500,
  '2026-02-05 19:00:00+09'
)
ON CONFLICT (order_id) DO UPDATE
  SET co2_saved_g = EXCLUDED.co2_saved_g,
      saved_weight_g = EXCLUDED.saved_weight_g;

-- ============================================================
-- 결과 확인
-- ============================================================

SELECT 
  sfl.id,
  sfl.user_id,
  p.name AS product_name,
  sfl.saved_weight_g,
  sfl.co2_saved_g,
  sfl.created_at
FROM saved_food_log sfl
JOIN products p ON p.id = sfl.product_id
ORDER BY sfl.created_at;
