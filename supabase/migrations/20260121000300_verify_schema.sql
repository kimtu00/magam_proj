-- --------------------------------------------------------
-- DB 스키마 검증 쿼리
-- 
-- 모든 테이블, 인덱스, 외래키, ENUM 타입 존재 확인
-- 스키마 무결성 검증 및 누락 사항 확인
-- --------------------------------------------------------

DO $$
DECLARE
  table_count INTEGER;
  index_count INTEGER;
  fk_count INTEGER;
  enum_count INTEGER;
  missing_items TEXT := '';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '   DB 스키마 검증 시작';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- ============================================================
  -- 1. 테이블 존재 확인
  -- ============================================================
  RAISE NOTICE '1. 테이블 검증';
  RAISE NOTICE '----------------------------------------';
  
  -- profiles 테이블
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'profiles';
  
  IF table_count = 1 THEN
    RAISE NOTICE '✓ profiles 테이블 존재';
  ELSE
    RAISE WARNING '✗ profiles 테이블 없음';
    missing_items := missing_items || 'profiles 테이블, ';
  END IF;
  
  -- stores 테이블
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'stores';
  
  IF table_count = 1 THEN
    RAISE NOTICE '✓ stores 테이블 존재';
  ELSE
    RAISE WARNING '✗ stores 테이블 없음';
    missing_items := missing_items || 'stores 테이블, ';
  END IF;
  
  -- products 테이블
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'products';
  
  IF table_count = 1 THEN
    RAISE NOTICE '✓ products 테이블 존재';
  ELSE
    RAISE WARNING '✗ products 테이블 없음';
    missing_items := missing_items || 'products 테이블, ';
  END IF;
  
  -- orders 테이블
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'orders';
  
  IF table_count = 1 THEN
    RAISE NOTICE '✓ orders 테이블 존재';
  ELSE
    RAISE WARNING '✗ orders 테이블 없음';
    missing_items := missing_items || 'orders 테이블, ';
  END IF;
  
  RAISE NOTICE '';

  -- ============================================================
  -- 2. ENUM 타입 존재 확인
  -- ============================================================
  RAISE NOTICE '2. ENUM 타입 검증';
  RAISE NOTICE '----------------------------------------';
  
  -- user_role
  SELECT COUNT(*) INTO enum_count
  FROM pg_type
  WHERE typname = 'user_role' AND typtype = 'e';
  
  IF enum_count = 1 THEN
    RAISE NOTICE '✓ user_role ENUM 존재 (BUYER, SELLER)';
  ELSE
    RAISE WARNING '✗ user_role ENUM 없음';
    missing_items := missing_items || 'user_role ENUM, ';
  END IF;
  
  -- product_status
  SELECT COUNT(*) INTO enum_count
  FROM pg_type
  WHERE typname = 'product_status' AND typtype = 'e';
  
  IF enum_count = 1 THEN
    RAISE NOTICE '✓ product_status ENUM 존재 (AVAILABLE, RESERVED, SOLD)';
  ELSE
    RAISE WARNING '✗ product_status ENUM 없음';
    missing_items := missing_items || 'product_status ENUM, ';
  END IF;
  
  -- order_status
  SELECT COUNT(*) INTO enum_count
  FROM pg_type
  WHERE typname = 'order_status' AND typtype = 'e';
  
  IF enum_count = 1 THEN
    RAISE NOTICE '✓ order_status ENUM 존재 (RESERVED, COMPLETED, CANCELED)';
  ELSE
    RAISE WARNING '✗ order_status ENUM 없음';
    missing_items := missing_items || 'order_status ENUM, ';
  END IF;
  
  RAISE NOTICE '';

  -- ============================================================
  -- 3. 인덱스 존재 확인
  -- ============================================================
  RAISE NOTICE '3. 인덱스 검증';
  RAISE NOTICE '----------------------------------------';
  
  -- profiles 인덱스
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'profiles' AND indexname = 'idx_profiles_clerk_id';
  
  IF index_count = 1 THEN
    RAISE NOTICE '✓ idx_profiles_clerk_id';
  ELSE
    RAISE WARNING '✗ idx_profiles_clerk_id 없음';
    missing_items := missing_items || 'idx_profiles_clerk_id, ';
  END IF;
  
  -- stores 인덱스
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'stores' AND indexname = 'idx_stores_owner_id';
  
  IF index_count = 1 THEN
    RAISE NOTICE '✓ idx_stores_owner_id';
  ELSE
    RAISE WARNING '✗ idx_stores_owner_id 없음';
    missing_items := missing_items || 'idx_stores_owner_id, ';
  END IF;
  
  -- products 인덱스
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'products' AND indexname = 'idx_products_store_id';
  
  IF index_count = 1 THEN
    RAISE NOTICE '✓ idx_products_store_id';
  ELSE
    RAISE WARNING '✗ idx_products_store_id 없음';
    missing_items := missing_items || 'idx_products_store_id, ';
  END IF;
  
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'products' AND indexname = 'idx_products_status';
  
  IF index_count = 1 THEN
    RAISE NOTICE '✓ idx_products_status';
  ELSE
    RAISE WARNING '✗ idx_products_status 없음';
    missing_items := missing_items || 'idx_products_status, ';
  END IF;
  
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'products' AND indexname = 'idx_products_available';
  
  IF index_count = 1 THEN
    RAISE NOTICE '✓ idx_products_available';
  ELSE
    RAISE WARNING '✗ idx_products_available 없음';
    missing_items := missing_items || 'idx_products_available, ';
  END IF;
  
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'products' AND indexname = 'idx_products_created_at';
  
  IF index_count = 1 THEN
    RAISE NOTICE '✓ idx_products_created_at (신규)';
  ELSE
    RAISE WARNING '✗ idx_products_created_at 없음';
    missing_items := missing_items || 'idx_products_created_at, ';
  END IF;
  
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'products' AND indexname = 'idx_products_pickup_deadline';
  
  IF index_count = 1 THEN
    RAISE NOTICE '✓ idx_products_pickup_deadline (신규)';
  ELSE
    RAISE WARNING '✗ idx_products_pickup_deadline 없음';
    missing_items := missing_items || 'idx_products_pickup_deadline, ';
  END IF;
  
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'products' AND indexname = 'idx_products_status_deadline';
  
  IF index_count = 1 THEN
    RAISE NOTICE '✓ idx_products_status_deadline (신규 복합)';
  ELSE
    RAISE WARNING '✗ idx_products_status_deadline 없음';
    missing_items := missing_items || 'idx_products_status_deadline, ';
  END IF;
  
  -- orders 인덱스
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'orders' AND indexname = 'idx_orders_buyer_id';
  
  IF index_count = 1 THEN
    RAISE NOTICE '✓ idx_orders_buyer_id';
  ELSE
    RAISE WARNING '✗ idx_orders_buyer_id 없음';
    missing_items := missing_items || 'idx_orders_buyer_id, ';
  END IF;
  
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'orders' AND indexname = 'idx_orders_product_id';
  
  IF index_count = 1 THEN
    RAISE NOTICE '✓ idx_orders_product_id';
  ELSE
    RAISE WARNING '✗ idx_orders_product_id 없음';
    missing_items := missing_items || 'idx_orders_product_id, ';
  END IF;
  
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'orders' AND indexname = 'idx_orders_created_at';
  
  IF index_count = 1 THEN
    RAISE NOTICE '✓ idx_orders_created_at (신규)';
  ELSE
    RAISE WARNING '✗ idx_orders_created_at 없음';
    missing_items := missing_items || 'idx_orders_created_at, ';
  END IF;
  
  RAISE NOTICE '';

  -- ============================================================
  -- 4. 외래키 제약조건 확인
  -- ============================================================
  RAISE NOTICE '4. 외래키 제약조건 검증';
  RAISE NOTICE '----------------------------------------';
  
  -- stores.owner_id -> profiles.clerk_id
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'stores'
    AND kcu.column_name = 'owner_id'
    AND ccu.table_name = 'profiles'
    AND ccu.column_name = 'clerk_id';
  
  IF fk_count = 1 THEN
    RAISE NOTICE '✓ stores.owner_id -> profiles.clerk_id';
  ELSE
    RAISE WARNING '✗ stores.owner_id 외래키 없음';
    missing_items := missing_items || 'stores.owner_id FK, ';
  END IF;
  
  -- products.store_id -> stores.id
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'products'
    AND kcu.column_name = 'store_id'
    AND ccu.table_name = 'stores'
    AND ccu.column_name = 'id';
  
  IF fk_count = 1 THEN
    RAISE NOTICE '✓ products.store_id -> stores.id';
  ELSE
    RAISE WARNING '✗ products.store_id 외래키 없음';
    missing_items := missing_items || 'products.store_id FK, ';
  END IF;
  
  -- orders.buyer_id -> profiles.clerk_id
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'orders'
    AND kcu.column_name = 'buyer_id'
    AND ccu.table_name = 'profiles'
    AND ccu.column_name = 'clerk_id';
  
  IF fk_count = 1 THEN
    RAISE NOTICE '✓ orders.buyer_id -> profiles.clerk_id';
  ELSE
    RAISE WARNING '✗ orders.buyer_id 외래키 없음';
    missing_items := missing_items || 'orders.buyer_id FK, ';
  END IF;
  
  -- orders.product_id -> products.id
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'orders'
    AND kcu.column_name = 'product_id'
    AND ccu.table_name = 'products'
    AND ccu.column_name = 'id';
  
  IF fk_count = 1 THEN
    RAISE NOTICE '✓ orders.product_id -> products.id';
  ELSE
    RAISE WARNING '✗ orders.product_id 외래키 없음';
    missing_items := missing_items || 'orders.product_id FK, ';
  END IF;
  
  RAISE NOTICE '';

  -- ============================================================
  -- 5. 함수 존재 확인
  -- ============================================================
  RAISE NOTICE '5. 함수 검증';
  RAISE NOTICE '----------------------------------------';
  
  SELECT COUNT(*) INTO table_count
  FROM pg_proc
  WHERE proname = 'reserve_product';
  
  IF table_count > 0 THEN
    RAISE NOTICE '✓ reserve_product() 함수 존재';
  ELSE
    RAISE WARNING '✗ reserve_product() 함수 없음';
    missing_items := missing_items || 'reserve_product() 함수, ';
  END IF;
  
  RAISE NOTICE '';

  -- ============================================================
  -- 6. Storage 버킷 확인
  -- ============================================================
  RAISE NOTICE '6. Storage 버킷 검증';
  RAISE NOTICE '----------------------------------------';
  
  SELECT COUNT(*) INTO table_count
  FROM storage.buckets
  WHERE id = 'uploads';
  
  IF table_count = 1 THEN
    RAISE NOTICE '✓ uploads 버킷 존재';
  ELSE
    RAISE WARNING '✗ uploads 버킷 없음';
    missing_items := missing_items || 'uploads 버킷, ';
  END IF;
  
  SELECT COUNT(*) INTO table_count
  FROM storage.buckets
  WHERE id = 'products';
  
  IF table_count = 1 THEN
    RAISE NOTICE '✓ products 버킷 존재';
  ELSE
    RAISE WARNING '✗ products 버킷 없음';
    missing_items := missing_items || 'products 버킷, ';
  END IF;
  
  RAISE NOTICE '';

  -- ============================================================
  -- 최종 결과
  -- ============================================================
  RAISE NOTICE '========================================';
  IF missing_items = '' THEN
    RAISE NOTICE '   ✓ 스키마 검증 완료: 모든 항목 정상';
  ELSE
    RAISE WARNING '   ✗ 누락된 항목: %', RTRIM(missing_items, ', ');
  END IF;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;


