/**
 * @file lib/admin/audit-log.ts
 * @description 관리자 액션 감사 로깅 유틸리티
 *
 * 이 모듈은 모든 관리자 액션을 admin_audit_logs 테이블에 기록합니다.
 *
 * 주요 기능:
 * - logAdminAction: 관리자 액션 기록
 * - getAuditLogs: 감사 로그 조회
 * - getTargetHistory: 특정 대상의 이력 조회
 *
 * 사용 예시:
 * ```typescript
 * await logAdminAction({
 *   action: 'user.status_change',
 *   targetType: 'user',
 *   targetId: userId,
 *   targetName: userName,
 *   details: { before: 'active', after: 'blocked' },
 *   reason: '스팸 신고 접수'
 * });
 * ```
 */

import { currentUser } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import type { AuditLogEntry, AuditLogFilter, PaginatedResponse } from "@/types/admin";

// --------------------------------------------------------
// 타입 정의
// --------------------------------------------------------

/**
 * 감사 로그 작성 파라미터
 */
export interface LogAdminActionParams {
  action: string;                           // 액션 유형 (예: 'user.status_change')
  targetType: string;                       // 대상 유형 (예: 'user', 'store')
  targetId: string;                         // 대상 ID
  targetName?: string;                      // 대상 이름 (스냅샷)
  details?: Record<string, unknown>;        // 상세 정보 (before/after 등)
  reason?: string;                          // 변경 사유
}

/**
 * 감사 로그 조회 파라미터
 */
export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  filter?: AuditLogFilter;
}

// --------------------------------------------------------
// 헬퍼 함수
// --------------------------------------------------------

/**
 * 현재 요청의 IP 주소 가져오기
 */
async function getClientIp(): Promise<string | undefined> {
  try {
    const headersList = await headers();
    return (
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      undefined
    );
  } catch (error) {
    console.error("[Audit Log] Failed to get client IP:", error);
    return undefined;
  }
}

/**
 * User Agent 가져오기
 */
async function getUserAgent(): Promise<string | undefined> {
  try {
    const headersList = await headers();
    return headersList.get("user-agent") || undefined;
  } catch (error) {
    console.error("[Audit Log] Failed to get user agent:", error);
    return undefined;
  }
}

// --------------------------------------------------------
// 메인 함수
// --------------------------------------------------------

/**
 * 관리자 액션을 감사 로그에 기록
 *
 * @param params - 로그 작성 파라미터
 * @returns 성공 여부
 *
 * @example
 * ```typescript
 * await logAdminAction({
 *   action: 'user.status_change',
 *   targetType: 'user',
 *   targetId: 'user_123',
 *   targetName: '홍길동',
 *   details: { before: 'active', after: 'blocked' },
 *   reason: '스팸 신고 접수'
 * });
 * ```
 */
export async function logAdminAction(params: LogAdminActionParams): Promise<boolean> {
  try {
    // 1. 현재 관리자 정보 가져오기
    const user = await currentUser();
    if (!user) {
      console.error("[Audit Log] No authenticated user found");
      return false;
    }

    // 2. Supabase 클라이언트 생성
    const supabase = await createClerkSupabaseClient();

    // 3. 메타데이터 수집
    const ipAddress = await getClientIp();
    const userAgent = await getUserAgent();

    // 4. 로그 레코드 작성
    const { error } = await supabase.from("admin_audit_logs").insert({
      admin_id: user.id,
      admin_name: user.fullName || user.firstName || "Unknown Admin",
      admin_email: user.primaryEmailAddress?.emailAddress,
      action: params.action,
      target_type: params.targetType,
      target_id: params.targetId,
      target_name: params.targetName,
      details: params.details ? JSON.parse(JSON.stringify(params.details)) : null,
      reason: params.reason,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (error) {
      console.error("[Audit Log] Failed to insert log:", error);
      return false;
    }

    console.log(
      `[Audit Log] ✅ ${params.action} on ${params.targetType}:${params.targetId} by ${user.id}`
    );
    return true;
  } catch (error) {
    console.error("[Audit Log] Unexpected error:", error);
    return false;
  }
}

/**
 * 감사 로그 조회 (페이지네이션)
 *
 * @param params - 조회 파라미터
 * @returns 페이지네이션된 감사 로그
 *
 * @example
 * ```typescript
 * const logs = await getAuditLogs({
 *   page: 1,
 *   limit: 20,
 *   filter: { action: 'user.status_change' }
 * });
 * ```
 */
export async function getAuditLogs(
  params: GetAuditLogsParams = {}
): Promise<PaginatedResponse<AuditLogEntry> | null> {
  try {
    const { page = 1, limit = 50, filter = {} } = params;
    const offset = (page - 1) * limit;

    const supabase = await createClerkSupabaseClient();

    // 기본 쿼리 구성
    let query = supabase
      .from("admin_audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // 필터 적용
    if (filter.adminId) {
      query = query.eq("admin_id", filter.adminId);
    }
    if (filter.action) {
      query = query.eq("action", filter.action);
    }
    if (filter.targetType) {
      query = query.eq("target_type", filter.targetType);
    }
    if (filter.startDate) {
      query = query.gte("created_at", filter.startDate);
    }
    if (filter.endDate) {
      query = query.lte("created_at", filter.endDate);
    }

    // 페이지네이션 적용
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("[Audit Log] Failed to fetch logs:", error);
      return null;
    }

    const items: AuditLogEntry[] = (data || []).map((log) => ({
      id: log.id,
      adminId: log.admin_id,
      adminName: log.admin_name,
      adminEmail: log.admin_email,
      action: log.action,
      targetType: log.target_type,
      targetId: log.target_id,
      targetName: log.target_name,
      details: log.details,
      reason: log.reason,
      ipAddress: log.ip_address,
      createdAt: log.created_at,
    }));

    return {
      items,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (error) {
    console.error("[Audit Log] Unexpected error:", error);
    return null;
  }
}

/**
 * 특정 대상의 감사 로그 이력 조회
 *
 * @param targetType - 대상 유형
 * @param targetId - 대상 ID
 * @param limit - 조회 개수 (기본 20)
 * @returns 감사 로그 배열
 *
 * @example
 * ```typescript
 * const history = await getTargetHistory('user', 'user_123', 10);
 * ```
 */
export async function getTargetHistory(
  targetType: string,
  targetId: string,
  limit: number = 20
): Promise<AuditLogEntry[]> {
  try {
    const supabase = await createClerkSupabaseClient();

    const { data, error } = await supabase.rpc("get_audit_logs_for_target", {
      p_target_type: targetType,
      p_target_id: targetId,
      p_limit: limit,
    });

    if (error) {
      console.error("[Audit Log] Failed to fetch target history:", error);
      return [];
    }

    return (data || []).map((log: any) => ({
      id: log.id,
      adminId: log.admin_id,
      adminName: log.admin_name,
      adminEmail: undefined,
      action: log.action,
      targetType: targetType,
      targetId: targetId,
      targetName: undefined,
      details: log.details,
      reason: log.reason,
      ipAddress: undefined,
      createdAt: log.created_at,
    }));
  } catch (error) {
    console.error("[Audit Log] Unexpected error:", error);
    return [];
  }
}

/**
 * 관리자별 액션 통계 조회
 *
 * @param adminId - 관리자 ID (선택)
 * @param startDate - 시작 날짜 (선택)
 * @param endDate - 종료 날짜 (선택)
 * @returns 액션 통계
 *
 * @example
 * ```typescript
 * const stats = await getAdminActionStats('admin_123', '2024-01-01', '2024-01-31');
 * ```
 */
export async function getAdminActionStats(
  adminId?: string,
  startDate?: string,
  endDate?: string
): Promise<Record<string, number>> {
  try {
    const supabase = await createClerkSupabaseClient();

    let query = supabase
      .from("admin_audit_logs")
      .select("action", { count: "exact" });

    if (adminId) {
      query = query.eq("admin_id", adminId);
    }
    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Audit Log] Failed to fetch action stats:", error);
      return {};
    }

    // 액션별 카운트
    const stats: Record<string, number> = {};
    (data || []).forEach((log: any) => {
      stats[log.action] = (stats[log.action] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error("[Audit Log] Unexpected error:", error);
    return {};
  }
}

// --------------------------------------------------------
// 액션 타입 상수 (자동완성 지원)
// --------------------------------------------------------

/**
 * 감사 로그 액션 타입
 */
export const AuditActions = {
  // 회원 관리
  USER_STATUS_CHANGE: "user.status_change",
  USER_GRADE_ADJUST: "user.grade_adjust",
  USER_POINTS_ADJUST: "user.points_adjust",
  USER_COUPON_ASSIGN: "user.coupon_assign",

  // 가게 관리
  STORE_APPROVE: "store.approve",
  STORE_REJECT: "store.reject",
  STORE_DEACTIVATE: "store.deactivate",
  STORE_COMMISSION_ADJUST: "store.commission_adjust",

  // 혜택/프로모션
  COUPON_CREATE: "coupon.create",
  COUPON_UPDATE: "coupon.update",
  COUPON_DELETE: "coupon.delete",
  PROMO_CODE_CREATE: "promo_code.create",
  PROMO_CODE_UPDATE: "promo_code.update",
  PROMO_CODE_DELETE: "promo_code.delete",
  GRADE_BENEFIT_UPDATE: "grade_benefit.update",

  // 페이백
  RECEIPT_APPROVE: "receipt.approve",
  RECEIPT_REJECT: "receipt.reject",
  POINTS_MANUAL_ADJUST: "points.manual_adjust",
  PAYBACK_SETTINGS_UPDATE: "payback_settings.update",

  // 설정
  SETTINGS_UPDATE: "settings.update",
  ADMIN_ACCOUNT_CREATE: "admin_account.create",
  ADMIN_ACCOUNT_DELETE: "admin_account.delete",
  NOTICE_CREATE: "notice.create",
  NOTICE_UPDATE: "notice.update",
  NOTICE_DELETE: "notice.delete",

  // ML 모델
  ML_MODEL_RETRAIN: "ml_model.retrain",

  // 기타
  DATA_EXPORT: "data.export",
} as const;

/**
 * 대상 타입 상수
 */
export const TargetTypes = {
  USER: "user",
  STORE: "store",
  PRODUCT: "product",
  ORDER: "order",
  COUPON: "coupon",
  PROMO_CODE: "promo_code",
  RECEIPT: "receipt",
  NOTICE: "notice",
  SETTINGS: "settings",
  ML_MODEL: "ml_model",
} as const;
