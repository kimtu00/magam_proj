/**
 * @file app/admin/settings/actions.ts
 * @description 시스템 설정 관리용 Server Actions
 *
 * 이 파일은 시스템 설정, 관리자 계정, 공지사항, 감사 로그를 제공합니다.
 *
 * Server Actions:
 * - getSystemSettings: 시스템 설정 조회
 * - getAdminList: 관리자 계정 목록 조회
 * - getNoticeList: 공지사항 목록 조회
 * - getAuditLogsList: 감사 로그 조회 (재export)
 */

"use server";

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import { clerkClient } from "@clerk/nextjs/server";
import { getAuditLogs, type GetAuditLogsParams } from "@/lib/admin/audit-log";
import type {
  AdminSettings,
  AdminAccount,
  NoticeData,
  PaginatedResponse,
  AuditLogEntry,
} from "@/types/admin";

// --------------------------------------------------------
// 시스템 설정
// --------------------------------------------------------

/**
 * 시스템 설정 조회
 *
 * @returns 시스템 설정
 */
export async function getSystemSettings(): Promise<AdminSettings | null> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // TODO: settings 테이블에서 조회
    // 현재는 기본값 반환
    return {
      defaultCommissionRate: 10, // 10%
      emailNotifications: true,
      pushNotifications: true,
      co2PerMeal: 1500, // 1.5kg = 1500g
      serviceName: "밥 먹자",
      maintenanceMode: false,
    };
  } catch (error) {
    console.error("[Admin Settings] Failed to fetch system settings:", error);
    return null;
  }
}

// --------------------------------------------------------
// 관리자 계정 (Clerk)
// --------------------------------------------------------

/**
 * 관리자 계정 목록 조회
 *
 * @returns 관리자 계정 목록
 */
export async function getAdminList(): Promise<AdminAccount[]> {
  try {
    await requireAdmin();

    const client = await clerkClient();

    // Clerk에서 모든 사용자 조회 (publicMetadata.role이 admin 또는 super_admin인 경우)
    const { data: users } = await client.users.getUserList({
      limit: 100,
    });

    const adminUsers = users.filter((user) => {
      const role = user.publicMetadata?.role as string | undefined;
      return role === "admin" || role === "super_admin";
    });

    return adminUsers.map((user) => ({
      userId: user.id,
      name: user.fullName || user.firstName || "Unknown",
      email: user.emailAddresses[0]?.emailAddress || "",
      role: (user.publicMetadata?.role as "admin" | "super_admin") || "admin",
      createdAt: new Date(user.createdAt).toISOString(),
      lastLoginAt: user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : undefined,
    }));
  } catch (error) {
    console.error("[Admin Settings] Failed to fetch admin list:", error);
    return [];
  }
}

// --------------------------------------------------------
// 공지사항
// --------------------------------------------------------

/**
 * 공지사항 목록 조회
 *
 * @param limit - 조회 개수
 * @returns 공지사항 목록
 */
export async function getNoticeList(limit: number = 20): Promise<NoticeData[]> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // TODO: notices 테이블 생성 후 구현
    console.warn("[Admin Settings] notices 테이블이 아직 구현되지 않았습니다.");

    return [];
  } catch (error) {
    console.error("[Admin Settings] Failed to fetch notice list:", error);
    return [];
  }
}

// --------------------------------------------------------
// 감사 로그 (재export)
// --------------------------------------------------------

/**
 * 감사 로그 조회
 *
 * @param params - 조회 파라미터
 * @returns 페이지네이션된 감사 로그
 */
export async function getAuditLogsList(
  params: GetAuditLogsParams = {}
): Promise<PaginatedResponse<AuditLogEntry> | null> {
  try {
    await requireAdmin();
    return await getAuditLogs(params);
  } catch (error) {
    console.error("[Admin Settings] Failed to fetch audit logs:", error);
    return null;
  }
}
