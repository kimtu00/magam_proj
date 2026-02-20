-- ============================================================
-- 전체 플로우 테스트용 시드 데이터
--
-- 목적: 관리자/사장님/소비자 화면의 전체 플로우 테스트
-- 포함 데이터:
--   1. profiles      - 소비자 2명, 사장님 2명
--   2. stores        - 가게 2개
--   3. products      - 가게당 상품 3개 (판매중/마감임박/품절 혼합)
--   4. orders             - 소비자별 주문 내역 (RESERVED/COMPLETED/CANCELED)
--   5. saved_food_log     - COMPLETED 주문 탄소절감 기록
--   6. reviews            - 완료 주문에 대한 리뷰 + 답글
--   7. user_hero          - 소비자 히어로 등급
--   8. point_transactions - 포인트 적립/사용 내역
--   9. bank_accounts      - 소비자 계좌 정보
--  10. settlements        - 가게별 정산 내역
--  11. prediction_training_data - ML 학습 데이터 30건
--  12. prediction_logs          - 예측 로그 10건
--
-- 주의: 더미 clerk_id 사용 (실제 Clerk 계정 없음)
--       중복 실행 방지를 위해 ON CONFLICT DO NOTHING 사용
-- ============================================================

-- ============================================================
-- 1. PROFILES
-- ============================================================

INSERT INTO profiles (clerk_id, role, nickname, created_at)
VALUES
  ('seed_consumer_001', 'consumer', '테스트소비자1', '2026-01-10 09:00:00+09'),
  ('seed_consumer_002', 'consumer', '테스트소비자2', '2026-01-15 14:00:00+09'),
  ('seed_producer_001', 'producer', '오즈분식 사장',  '2026-01-05 10:00:00+09'),
  ('seed_producer_002', 'producer', '마이홈 사장',   '2026-01-07 11:00:00+09')
ON CONFLICT (clerk_id) DO NOTHING;

-- ============================================================
-- 2. STORES
-- ============================================================

INSERT INTO stores (id, owner_id, name, address, phone, created_at)
VALUES
  (
    '11111111-0000-0000-0000-000000000001',
    'seed_producer_001',
    '오즈분식',
    '서울 강남구 삼성로 123',
    '02-1234-5678',
    '2026-01-05 10:30:00+09'
  ),
  (
    '11111111-0000-0000-0000-000000000002',
    'seed_producer_002',
    '마이홈',
    '서울 강남구 삼성로 403',
    '02-9876-5432',
    '2026-01-07 11:30:00+09'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. PRODUCTS
-- ============================================================

INSERT INTO products (id, store_id, name, original_price, discount_price, quantity, status, pickup_deadline, is_instant, weight_value, weight_unit, created_at)
VALUES
  -- 오즈분식 상품
  (
    '22222222-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    '떡볶이 세트',
    8000, 4000, 5, 'AVAILABLE',
    NOW() + INTERVAL '3 hours',
    true,
    500, 'g',
    NOW() - INTERVAL '1 hour'
  ),
  (
    '22222222-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000001',
    '순대국밥',
    9000, 5000, 2, 'AVAILABLE',
    NOW() + INTERVAL '30 minutes',
    false,
    600, 'g',
    NOW() - INTERVAL '2 hours'
  ),
  (
    '22222222-0000-0000-0000-000000000003',
    '11111111-0000-0000-0000-000000000001',
    '김밥 한 줄',
    4000, 2000, 0, 'SOLD_OUT',
    NOW() - INTERVAL '1 hour',
    true,
    250, 'g',
    NOW() - INTERVAL '4 hours'
  ),
  -- 마이홈 상품
  (
    '22222222-0000-0000-0000-000000000004',
    '11111111-0000-0000-0000-000000000002',
    '된장찌개 정식',
    10000, 6000, 3, 'AVAILABLE',
    NOW() + INTERVAL '2 hours',
    false,
    700, 'g',
    NOW() - INTERVAL '30 minutes'
  ),
  (
    '22222222-0000-0000-0000-000000000005',
    '11111111-0000-0000-0000-000000000002',
    '제육볶음 도시락',
    8500, 5000, 1, 'AVAILABLE',
    NOW() + INTERVAL '45 minutes',
    true,
    450, 'g',
    NOW() - INTERVAL '1 hour 30 minutes'
  ),
  (
    '22222222-0000-0000-0000-000000000006',
    '11111111-0000-0000-0000-000000000002',
    '잡채밥',
    7500, 4500, 0, 'SOLD_OUT',
    NOW() - INTERVAL '2 hours',
    false,
    400, 'g',
    NOW() - INTERVAL '5 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. ORDERS
-- ============================================================

INSERT INTO orders (id, buyer_id, product_id, quantity, status, created_at)
VALUES
  -- 소비자1 주문 내역
  (
    '33333333-0000-0000-0000-000000000001',
    'seed_consumer_001',
    '22222222-0000-0000-0000-000000000001',
    2, 'RESERVED',
    NOW() - INTERVAL '10 minutes'
  ),
  (
    '33333333-0000-0000-0000-000000000002',
    'seed_consumer_001',
    '22222222-0000-0000-0000-000000000004',
    1, 'COMPLETED',
    '2026-02-01 12:00:00+09'
  ),
  (
    '33333333-0000-0000-0000-000000000003',
    'seed_consumer_001',
    '22222222-0000-0000-0000-000000000003',
    1, 'CANCELED',
    '2026-01-28 18:00:00+09'
  ),
  -- 소비자2 주문 내역
  (
    '33333333-0000-0000-0000-000000000004',
    'seed_consumer_002',
    '22222222-0000-0000-0000-000000000005',
    1, 'RESERVED',
    NOW() - INTERVAL '5 minutes'
  ),
  (
    '33333333-0000-0000-0000-000000000005',
    'seed_consumer_002',
    '22222222-0000-0000-0000-000000000002',
    1, 'COMPLETED',
    '2026-02-05 19:00:00+09'
  ),
  (
    '33333333-0000-0000-0000-000000000006',
    'seed_consumer_002',
    '22222222-0000-0000-0000-000000000006',
    1, 'CANCELED',
    '2026-01-30 13:00:00+09'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. SAVED_FOOD_LOG (COMPLETED 주문에 대한 탄소절감 기록)
-- ============================================================
-- 트리거는 orders.status가 COMPLETED로 업데이트될 때 자동 실행되지만,
-- 시드 데이터는 직접 INSERT하므로 트리거가 동작하지 않음.
-- 따라서 COMPLETED 주문에 대해 saved_food_log를 직접 삽입합니다.
-- co2_saved_g = saved_weight_g × 2.5 (IPCC/환경부 기준 참고 근사값)

INSERT INTO saved_food_log (id, user_id, order_id, product_id, saved_weight_g, co2_saved_g, created_at)
VALUES
  -- 소비자1: 된장찌개 정식 완료 (700g → CO2 1750g)
  (
    '55555555-0000-0000-0000-000000000001',
    'seed_consumer_001',
    '33333333-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000004',
    700, 1750,
    '2026-02-01 12:00:00+09'
  ),
  -- 소비자2: 순대국밥 완료 (600g → CO2 1500g)
  (
    '55555555-0000-0000-0000-000000000002',
    'seed_consumer_002',
    '33333333-0000-0000-0000-000000000005',
    '22222222-0000-0000-0000-000000000002',
    600, 1500,
    '2026-02-05 19:00:00+09'
  )
ON CONFLICT (order_id) DO NOTHING;

-- ============================================================
-- 6. REVIEWS + REVIEW_REPLIES
-- ============================================================

-- 완료된 주문(COMPLETED)에 대해서만 리뷰 작성
INSERT INTO reviews (id, order_id, buyer_id, store_id, product_id, rating, content, created_at)
VALUES
  (
    '44444444-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000002',
    'seed_consumer_001',
    '11111111-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000004',
    5,
    '된장찌개가 정말 맛있어요! 가격도 저렴하고 양도 많아서 만족합니다.',
    '2026-02-01 13:00:00+09'
  ),
  (
    '44444444-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000005',
    'seed_consumer_002',
    '11111111-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000002',
    4,
    '순대국밥 맛있었습니다. 국물이 진해서 좋았어요.',
    '2026-02-05 20:00:00+09'
  )
ON CONFLICT (order_id) DO NOTHING;

-- 사장님 답글
INSERT INTO review_replies (id, review_id, seller_id, content, created_at)
VALUES
  (
    '55555555-0000-0000-0000-000000000001',
    '44444444-0000-0000-0000-000000000001',
    'seed_producer_002',
    '맛있게 드셨다니 정말 기쁩니다! 다음에도 방문해 주세요 :)',
    '2026-02-01 15:00:00+09'
  )
ON CONFLICT (review_id) DO NOTHING;

-- ============================================================
-- 7. USER_HERO (소비자 히어로 등급)
-- ============================================================

INSERT INTO user_hero (user_id, grade_level, total_pickup_count, total_saved_weight_g, upgraded_at, created_at)
VALUES
  (
    'seed_consumer_001',
    1,   -- 새싹 히어로 (1회 이상)
    3,
    1500.00,
    '2026-01-20 10:00:00+09',
    '2026-01-10 09:00:00+09'
  ),
  (
    'seed_consumer_002',
    2,   -- 동네 히어로 (10회 이상)
    12,
    9800.00,
    '2026-02-01 10:00:00+09',
    '2026-01-15 14:00:00+09'
  )
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- 8. POINT_TRANSACTIONS
-- ============================================================

INSERT INTO point_transactions (id, user_id, type, amount, balance_after, description, related_order_id, created_at)
VALUES
  -- 소비자1 포인트
  (
    '66666666-0000-0000-0000-000000000001',
    'seed_consumer_001',
    'earn', 400, 400,
    '오즈분식 된장찌개 정식 구매 적립',
    '33333333-0000-0000-0000-000000000002',
    '2026-02-01 12:05:00+09'
  ),
  (
    '66666666-0000-0000-0000-000000000002',
    'seed_consumer_001',
    'earn', 200, 600,
    '회원 가입 축하 포인트',
    NULL,
    '2026-01-10 09:01:00+09'
  ),
  (
    '66666666-0000-0000-0000-000000000003',
    'seed_consumer_001',
    'spend', -300, 300,
    '포인트 사용 (떡볶이 세트 주문)',
    '33333333-0000-0000-0000-000000000001',
    NOW() - INTERVAL '9 minutes'
  ),
  -- 소비자2 포인트
  (
    '66666666-0000-0000-0000-000000000004',
    'seed_consumer_002',
    'earn', 500, 500,
    '오즈분식 순대국밥 구매 적립',
    '33333333-0000-0000-0000-000000000005',
    '2026-02-05 19:05:00+09'
  ),
  (
    '66666666-0000-0000-0000-000000000005',
    'seed_consumer_002',
    'earn', 200, 700,
    '회원 가입 축하 포인트',
    NULL,
    '2026-01-15 14:01:00+09'
  ),
  (
    '66666666-0000-0000-0000-000000000006',
    'seed_consumer_002',
    'payback', 1000, 1700,
    '1월 페이백 지급',
    NULL,
    '2026-02-03 10:00:00+09'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. BANK_ACCOUNTS
-- ============================================================

INSERT INTO bank_accounts (id, user_id, bank_name, account_number, account_holder, is_verified, is_primary, created_at)
VALUES
  (
    '77777777-0000-0000-0000-000000000001',
    'seed_consumer_001',
    '카카오뱅크',
    '3333-01-1234567',
    '테스트소비자1',
    true,
    true,
    '2026-01-12 10:00:00+09'
  )
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- 10. SETTLEMENTS
-- ============================================================

INSERT INTO settlements (id, store_id, period_start, period_end, total_sales, total_orders, commission_rate, commission_amount, settlement_amount, status, settled_at, notes, created_at)
VALUES
  -- 오즈분식 정산
  (
    '88888888-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    '2026-01-01', '2026-01-31',
    320000, 42, 10.00, 32000, 288000,
    'completed', '2026-02-05 10:00:00+09',
    '1월 정산 완료',
    '2026-02-01 09:00:00+09'
  ),
  (
    '88888888-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000001',
    '2026-02-01', '2026-02-28',
    85000, 11, 10.00, 8500, 76500,
    'pending', NULL,
    '2월 정산 진행중',
    '2026-03-01 09:00:00+09'
  ),
  -- 마이홈 정산
  (
    '88888888-0000-0000-0000-000000000003',
    '11111111-0000-0000-0000-000000000002',
    '2026-01-01', '2026-01-31',
    480000, 56, 10.00, 48000, 432000,
    'completed', '2026-02-05 11:00:00+09',
    '1월 정산 완료',
    '2026-02-01 09:00:00+09'
  ),
  (
    '88888888-0000-0000-0000-000000000004',
    '11111111-0000-0000-0000-000000000002',
    '2026-02-01', '2026-02-28',
    120000, 15, 10.00, 12000, 108000,
    'pending', NULL,
    '2월 정산 진행중',
    '2026-03-01 09:00:00+09'
  )
ON CONFLICT (store_id, period_start, period_end) DO NOTHING;

-- ============================================================
-- 11. PREDICTION_TRAINING_DATA (ML 학습 데이터 30건)
-- ============================================================

INSERT INTO prediction_training_data (
  sell_through_rate,
  product_register_hour, product_register_minute,
  original_price, discount_price, discount_rate,
  product_quantity, deadline_hours_remaining,
  store_avg_rating, store_total_reviews, store_total_sales,
  product_category, register_day_of_week, store_region, time_slot,
  is_holiday, is_weekend,
  recorded_at
) VALUES
  -- 분식 / 점심 / 평일 (소진율 높음)
  (0.95, 10, 30, 8000, 4000, 50.00, 5, 2.5, 4.5, 28, 120, '분식',   '월', '강남구', '아침',   false, false, NOW() - INTERVAL '30 days'),
  (1.00, 11, 00, 9000, 5000, 44.44, 3, 1.5, 4.5, 28, 121, '분식',   '화', '강남구', '점심',   false, false, NOW() - INTERVAL '29 days'),
  (0.80, 12, 15, 7500, 3500, 53.33, 8, 3.0, 4.5, 29, 122, '분식',   '수', '강남구', '점심',   false, false, NOW() - INTERVAL '28 days'),
  (0.90, 10, 45, 6000, 3000, 50.00, 4, 2.0, 4.5, 30, 123, '분식',   '목', '강남구', '아침',   false, false, NOW() - INTERVAL '27 days'),
  (1.00, 11, 30, 8500, 4500, 47.06, 2, 1.0, 4.5, 31, 124, '분식',   '금', '강남구', '점심',   false, false, NOW() - INTERVAL '26 days'),
  -- 한식 / 저녁 / 주말 (소진율 중간)
  (0.70, 17, 00, 10000, 6000, 40.00, 6, 3.5, 4.2, 15, 60,  '한식',   '토', '서초구', '저녁',   false, true,  NOW() - INTERVAL '25 days'),
  (0.60, 18, 30, 12000, 7000, 41.67, 5, 2.5, 4.2, 16, 61,  '한식',   '일', '서초구', '저녁',   false, true,  NOW() - INTERVAL '24 days'),
  (0.75, 16, 00, 9000,  5500, 38.89, 4, 4.0, 4.2, 17, 62,  '한식',   '토', '서초구', '오후',   false, true,  NOW() - INTERVAL '23 days'),
  (0.85, 17, 30, 11000, 6500, 40.91, 3, 2.0, 4.2, 18, 63,  '한식',   '일', '서초구', '저녁',   false, true,  NOW() - INTERVAL '22 days'),
  (0.50, 19, 00, 10500, 6000, 42.86, 7, 1.5, 4.2, 19, 64,  '한식',   '토', '서초구', '저녁',   false, true,  NOW() - INTERVAL '21 days'),
  -- 편의식품 / 심야 (소진율 낮음)
  (0.40, 22, 00, 5000,  2500, 50.00, 10, 2.0, 3.8, 8,  30,  '편의식품', '월', '송파구', '심야',   false, false, NOW() - INTERVAL '20 days'),
  (0.30, 23, 30, 4500,  2000, 55.56, 8,  1.5, 3.8, 9,  31,  '편의식품', '화', '송파구', '심야',   false, false, NOW() - INTERVAL '19 days'),
  (0.45, 21, 00, 6000,  3000, 50.00, 12, 3.0, 3.8, 10, 32,  '편의식품', '수', '송파구', '심야',   false, false, NOW() - INTERVAL '18 days'),
  (0.35, 22, 30, 5500,  2500, 54.55, 9,  1.0, 3.8, 11, 33,  '편의식품', '목', '송파구', '심야',   false, false, NOW() - INTERVAL '17 days'),
  (0.55, 20, 00, 4000,  2000, 50.00, 6,  4.0, 3.8, 12, 34,  '편의식품', '금', '송파구', '저녁',   false, false, NOW() - INTERVAL '16 days'),
  -- 베이커리 / 아침 / 평일 (소진율 높음)
  (0.95, 7,  00, 6000,  3000, 50.00, 5,  2.0, 4.7, 45, 200, '베이커리', '월', '마포구', '아침',   false, false, NOW() - INTERVAL '15 days'),
  (1.00, 8,  30, 5500,  2500, 54.55, 4,  1.5, 4.7, 46, 201, '베이커리', '화', '마포구', '아침',   false, false, NOW() - INTERVAL '14 days'),
  (0.90, 7,  30, 7000,  3500, 50.00, 6,  3.0, 4.7, 47, 202, '베이커리', '수', '마포구', '아침',   false, false, NOW() - INTERVAL '13 days'),
  (0.85, 9,  00, 6500,  3000, 53.85, 3,  2.5, 4.7, 48, 203, '베이커리', '목', '마포구', '아침',   false, false, NOW() - INTERVAL '12 days'),
  (1.00, 8,  00, 5000,  2500, 50.00, 2,  1.0, 4.7, 49, 204, '베이커리', '금', '마포구', '아침',   false, false, NOW() - INTERVAL '11 days'),
  -- 중식 / 오후 / 평일 (소진율 중간)
  (0.65, 14, 00, 9000,  5000, 44.44, 5,  3.0, 4.0, 20, 80,  '중식',   '월', '강동구', '오후',   false, false, NOW() - INTERVAL '10 days'),
  (0.70, 15, 30, 10000, 5500, 45.00, 4,  2.0, 4.0, 21, 81,  '중식',   '화', '강동구', '오후',   false, false, NOW() - INTERVAL '9 days'),
  (0.60, 13, 00, 8500,  4500, 47.06, 7,  4.0, 4.0, 22, 82,  '중식',   '수', '강동구', '점심',   false, false, NOW() - INTERVAL '8 days'),
  (0.75, 14, 30, 9500,  5000, 47.37, 3,  2.5, 4.0, 23, 83,  '중식',   '목', '강동구', '오후',   false, false, NOW() - INTERVAL '7 days'),
  (0.80, 12, 30, 8000,  4000, 50.00, 6,  3.5, 4.0, 24, 84,  '중식',   '금', '강동구', '점심',   false, false, NOW() - INTERVAL '6 days'),
  -- 공휴일 데이터
  (0.55, 11, 00, 9000,  5000, 44.44, 8,  3.0, 4.3, 25, 90,  '한식',   '월', '강남구', '점심',   true,  false, NOW() - INTERVAL '5 days'),
  (0.45, 12, 00, 8000,  4000, 50.00, 6,  2.5, 4.3, 26, 91,  '분식',   '화', '강남구', '점심',   true,  false, NOW() - INTERVAL '4 days'),
  -- 주말 야간 (소진율 매우 낮음)
  (0.30, 21, 00, 7000,  3500, 50.00, 10, 2.0, 3.5, 5,  20,  '한식',   '토', '종로구', '심야',   false, true,  NOW() - INTERVAL '3 days'),
  (0.25, 22, 30, 6500,  3000, 53.85, 8,  1.5, 3.5, 6,  21,  '분식',   '일', '종로구', '심야',   false, true,  NOW() - INTERVAL '2 days'),
  (0.35, 20, 00, 5500,  2500, 54.55, 5,  3.5, 3.5, 7,  22,  '편의식품', '토', '종로구', '저녁',   false, true,  NOW() - INTERVAL '1 day')
;

-- ============================================================
-- 12. PREDICTION_LOGS (예측 로그 10건)
-- 완료된 8건 + 진행중 2건 → 평균 정확도 약 82%
-- ============================================================

INSERT INTO prediction_logs (
  id,
  store_id,
  predicted_sell_through,
  actual_sell_through,
  features,
  confidence,
  confidence_score,
  model_version,
  predicted_at,
  actual_recorded_at,
  prediction_error
) VALUES
  -- 완료된 예측 8건 (actual_sell_through 있음)
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    0.90, 0.95,
    '{"time_slot":"점심","category":"분식","discount_rate":50.0,"deadline_hours_remaining":2.5}',
    'high', 0.88, 'v1.0.0',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days' + INTERVAL '3 hours',
    0.05
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000001',
    0.75, 0.80,
    '{"time_slot":"저녁","category":"분식","discount_rate":44.0,"deadline_hours_remaining":1.5}',
    'high', 0.85, 'v1.0.0',
    NOW() - INTERVAL '19 days',
    NOW() - INTERVAL '19 days' + INTERVAL '2 hours',
    0.05
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    '11111111-0000-0000-0000-000000000001',
    0.60, 0.40,
    '{"time_slot":"심야","category":"편의식품","discount_rate":50.0,"deadline_hours_remaining":2.0}',
    'medium', 0.65, 'v1.0.0',
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '18 days' + INTERVAL '2 hours',
    0.20
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000004',
    '11111111-0000-0000-0000-000000000002',
    0.85, 0.90,
    '{"time_slot":"아침","category":"베이커리","discount_rate":50.0,"deadline_hours_remaining":2.0}',
    'high', 0.90, 'v1.0.0',
    NOW() - INTERVAL '17 days',
    NOW() - INTERVAL '17 days' + INTERVAL '2 hours',
    0.05
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000005',
    '11111111-0000-0000-0000-000000000002',
    0.70, 0.75,
    '{"time_slot":"점심","category":"한식","discount_rate":40.0,"deadline_hours_remaining":3.5}',
    'high', 0.82, 'v1.0.0',
    NOW() - INTERVAL '16 days',
    NOW() - INTERVAL '16 days' + INTERVAL '4 hours',
    0.05
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000006',
    '11111111-0000-0000-0000-000000000002',
    0.50, 0.30,
    '{"time_slot":"심야","category":"한식","discount_rate":42.0,"deadline_hours_remaining":1.5}',
    'low', 0.55, 'v1.0.0',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days' + INTERVAL '2 hours',
    0.20
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000007',
    '11111111-0000-0000-0000-000000000001',
    0.95, 1.00,
    '{"time_slot":"아침","category":"베이커리","discount_rate":54.0,"deadline_hours_remaining":1.5}',
    'high', 0.92, 'v1.1.0',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days' + INTERVAL '2 hours',
    0.05
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000008',
    '11111111-0000-0000-0000-000000000002',
    0.80, 0.70,
    '{"time_slot":"오후","category":"중식","discount_rate":45.0,"deadline_hours_remaining":3.0}',
    'medium', 0.75, 'v1.1.0',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days' + INTERVAL '4 hours',
    0.10
  ),
  -- 진행중 예측 2건 (actual_sell_through NULL)
  (
    'aaaaaaaa-0000-0000-0000-000000000009',
    '11111111-0000-0000-0000-000000000001',
    0.85, NULL,
    '{"time_slot":"점심","category":"분식","discount_rate":50.0,"deadline_hours_remaining":3.0}',
    'high', 0.87, 'v1.1.0',
    NOW() - INTERVAL '2 hours',
    NULL,
    NULL
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000010',
    '11111111-0000-0000-0000-000000000002',
    0.70, NULL,
    '{"time_slot":"저녁","category":"한식","discount_rate":40.0,"deadline_hours_remaining":2.5}',
    'medium', 0.72, 'v1.1.0',
    NOW() - INTERVAL '1 hour',
    NULL,
    NULL
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 완료 메시지
-- ============================================================
DO $$
DECLARE
  profile_count   INTEGER;
  store_count     INTEGER;
  product_count   INTEGER;
  order_count     INTEGER;
  review_count    INTEGER;
  hero_count      INTEGER;
  point_count     INTEGER;
  bank_count      INTEGER;
  settle_count    INTEGER;
  training_count  INTEGER;
  log_count       INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count  FROM profiles  WHERE clerk_id LIKE 'seed_%';
  SELECT COUNT(*) INTO store_count    FROM stores     WHERE id::TEXT LIKE '11111111-%';
  SELECT COUNT(*) INTO product_count  FROM products   WHERE id::TEXT LIKE '22222222-%';
  SELECT COUNT(*) INTO order_count    FROM orders     WHERE id::TEXT LIKE '33333333-%';
  SELECT COUNT(*) INTO review_count   FROM reviews    WHERE id::TEXT LIKE '44444444-%';
  SELECT COUNT(*) INTO hero_count     FROM user_hero  WHERE user_id LIKE 'seed_%';
  SELECT COUNT(*) INTO point_count    FROM point_transactions WHERE id::TEXT LIKE '66666666-%';
  SELECT COUNT(*) INTO bank_count     FROM bank_accounts WHERE id::TEXT LIKE '77777777-%';
  SELECT COUNT(*) INTO settle_count   FROM settlements  WHERE id::TEXT LIKE '88888888-%';
  SELECT COUNT(*) INTO training_count FROM prediction_training_data;
  SELECT COUNT(*) INTO log_count      FROM prediction_logs WHERE id::TEXT LIKE 'aaaaaaaa-%';

  RAISE NOTICE '=== 시드 데이터 삽입 완료 ===';
  RAISE NOTICE 'profiles:                  % 건', profile_count;
  RAISE NOTICE 'stores:                    % 건', store_count;
  RAISE NOTICE 'products:                  % 건', product_count;
  RAISE NOTICE 'orders:                    % 건', order_count;
  RAISE NOTICE 'reviews:                   % 건', review_count;
  RAISE NOTICE 'user_hero:                 % 건', hero_count;
  RAISE NOTICE 'point_transactions:        % 건', point_count;
  RAISE NOTICE 'bank_accounts:             % 건', bank_count;
  RAISE NOTICE 'settlements:               % 건', settle_count;
  RAISE NOTICE 'prediction_training_data:  % 건', training_count;
  RAISE NOTICE 'prediction_logs:           % 건', log_count;
  RAISE NOTICE '================================';
END $$;
