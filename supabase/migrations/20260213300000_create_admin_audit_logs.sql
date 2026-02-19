-- --------------------------------------------------------
-- 관리자 감사 로그 테이블 생성
--
-- 이 마이그레이션은 관리자의 모든 액션을 기록하는 감사 로그 테이블을 생성합니다.
-- 관리자가 누가, 언제, 무엇을, 왜 변경했는지를 추적할 수 있습니다.
-- --------------------------------------------------------

-- --------------------------------------------------------
-- 1. admin_audit_logs (관리자 감사 로그)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 관리자 정보
  admin_id TEXT NOT NULL,                -- Clerk user ID
  admin_name TEXT,                       -- 관리자 이름 (스냅샷)
  admin_email TEXT,                      -- 관리자 이메일 (스냅샷)
  
  -- 액션 정보
  action TEXT NOT NULL,                  -- 액션 유형 (user.status_change, store.approve 등)
  target_type TEXT NOT NULL,             -- 대상 유형 (user, store, coupon, receipt 등)
  target_id TEXT NOT NULL,               -- 대상 ID
  target_name TEXT,                      -- 대상 이름 (스냅샷)
  
  -- 변경 상세
  details JSONB,                         -- 변경 상세 (before/after 등)
  reason TEXT,                           -- 변경 사유 (관리자가 입력)
  
  -- 메타데이터
  ip_address TEXT,                       -- IP 주소
  user_agent TEXT,                       -- User Agent
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- --------------------------------------------------------
-- 2. 인덱스
-- --------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id 
  ON admin_audit_logs(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action 
  ON admin_audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target 
  ON admin_audit_logs(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at 
  ON admin_audit_logs(created_at DESC);

-- 복합 인덱스: 관리자별 액션 조회
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_action 
  ON admin_audit_logs(admin_id, created_at DESC);

-- 복합 인덱스: 대상별 이력 조회
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_history 
  ON admin_audit_logs(target_type, target_id, created_at DESC);

-- --------------------------------------------------------
-- 3. 헬퍼 함수: 최근 감사 로그 조회
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION get_recent_audit_logs(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_admin_id TEXT DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_target_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  admin_id TEXT,
  admin_name TEXT,
  admin_email TEXT,
  action TEXT,
  target_type TEXT,
  target_id TEXT,
  target_name TEXT,
  details JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.admin_id,
    l.admin_name,
    l.admin_email,
    l.action,
    l.target_type,
    l.target_id,
    l.target_name,
    l.details,
    l.reason,
    l.created_at
  FROM admin_audit_logs l
  WHERE (p_admin_id IS NULL OR l.admin_id = p_admin_id)
    AND (p_action IS NULL OR l.action = p_action)
    AND (p_target_type IS NULL OR l.target_type = p_target_type)
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- --------------------------------------------------------
-- 4. 헬퍼 함수: 대상별 감사 로그 이력 조회
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION get_audit_logs_for_target(
  p_target_type TEXT,
  p_target_id TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  admin_id TEXT,
  admin_name TEXT,
  action TEXT,
  details JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.admin_id,
    l.admin_name,
    l.action,
    l.details,
    l.reason,
    l.created_at
  FROM admin_audit_logs l
  WHERE l.target_type = p_target_type
    AND l.target_id = p_target_id
  ORDER BY l.created_at DESC
  LIMIT p_limit;
END;
$$;

-- --------------------------------------------------------
-- 5. 샘플 데이터 (개발용)
-- --------------------------------------------------------

DO $$
BEGIN
  -- 샘플 감사 로그
  INSERT INTO admin_audit_logs (
    admin_id, admin_name, admin_email,
    action, target_type, target_id, target_name,
    details, reason,
    created_at
  )
  VALUES (
    'admin_user_001', '관리자1', 'admin@example.com',
    'user.status_change', 'user', 'user_123', '홍길동',
    '{"before": "active", "after": "blocked"}'::jsonb, '스팸 신고 접수',
    now() - INTERVAL '2 hours'
  ),
  (
    'admin_user_001', '관리자1', 'admin@example.com',
    'store.approve', 'store', 'store_456', '맛있는 식당',
    '{"status": "approved"}'::jsonb, '사업자등록증 확인 완료',
    now() - INTERVAL '1 day'
  ),
  (
    'admin_user_002', '관리자2', 'admin2@example.com',
    'receipt.approve', 'receipt', 'receipt_789', NULL,
    '{"payback_amount": 5000}'::jsonb, '영수증 확인 완료',
    now() - INTERVAL '3 hours'
  );
END $$;

-- --------------------------------------------------------
-- 6. RLS 정책 (개발 중에는 비활성화)
-- --------------------------------------------------------

-- 개발 편의를 위해 RLS는 비활성화
-- 프로덕션 배포 전 RLS 활성화 및 정책 추가 필요
-- (admin, super_admin만 접근 가능하도록)

-- --------------------------------------------------------
-- 7. 마이그레이션 로그
-- --------------------------------------------------------

DO $$ 
BEGIN
  RAISE NOTICE '✅ 관리자 감사 로그 테이블 생성 완료';
  RAISE NOTICE '   - admin_audit_logs (감사 로그)';
  RAISE NOTICE '   - get_recent_audit_logs() 함수';
  RAISE NOTICE '   - get_audit_logs_for_target() 함수';
END $$;
