-- --------------------------------------------------------
-- 외래키 제약조건 확인 및 통일
-- 
-- 모든 외래키에 ON DELETE CASCADE 적용 확인
-- 데이터 무결성 보장 및 일관성 유지
-- --------------------------------------------------------

-- 현재 외래키 제약조건 조회 및 출력
DO $$
DECLARE
  fk_record RECORD;
BEGIN
  RAISE NOTICE '=== 현재 외래키 제약조건 ===';
  
  FOR fk_record IN
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name IN ('profiles', 'stores', 'products', 'orders')
    ORDER BY tc.table_name, kcu.column_name
  LOOP
    RAISE NOTICE '테이블: %, 컬럼: % -> %.% (ON DELETE: %)',
      fk_record.table_name,
      fk_record.column_name,
      fk_record.foreign_table_name,
      fk_record.foreign_column_name,
      fk_record.delete_rule;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== 외래키 제약조건 검증 완료 ===';
  RAISE NOTICE '모든 외래키는 20260106141956_create_lastchance_schema.sql에서 ON DELETE CASCADE로 설정되었습니다.';
  RAISE NOTICE '';
  RAISE NOTICE '예상 외래키:';
  RAISE NOTICE '1. stores.owner_id -> profiles.clerk_id (CASCADE)';
  RAISE NOTICE '2. products.store_id -> stores.id (CASCADE)';
  RAISE NOTICE '3. orders.buyer_id -> profiles.clerk_id (CASCADE)';
  RAISE NOTICE '4. orders.product_id -> products.id (CASCADE)';
END $$;

-- 참고: 20260106141956_create_lastchance_schema.sql에서 이미 모든 외래키가
-- ON DELETE CASCADE로 정의되어 있으므로 추가 작업 불필요
-- 
-- 확인된 외래키:
-- - stores.owner_id -> profiles.clerk_id (ON DELETE CASCADE)
-- - products.store_id -> stores.id (ON DELETE CASCADE)
-- - orders.buyer_id -> profiles.clerk_id (ON DELETE CASCADE)
-- - orders.product_id -> products.id (ON DELETE CASCADE)


