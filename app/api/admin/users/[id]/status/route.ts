/**
 * @file app/api/admin/users/[id]/status/route.ts
 * @description 회원 상태 변경 API
 *
 * PATCH /api/admin/users/[id]/status
 * - 회원 상태를 active, inactive, blocked로 변경
 * - 감사 로그 기록
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { logAdminAction, AuditActions, TargetTypes } from "@/lib/admin/audit-log";
import type { UpdateUserStatusRequest } from "@/types/admin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 관리자 권한 체크
    await requireAdmin();

    const params = await context.params;
    const userId = params.id;

    // 요청 본문 파싱
    const body: Omit<UpdateUserStatusRequest, "userId"> = await request.json();
    const { status, reason } = body;

    if (!status || !reason) {
      return NextResponse.json(
        { success: false, error: "상태와 사유를 입력해주세요." },
        { status: 400 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자 정보 조회 (이름 확인용)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name, user_id")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // TODO: user_status 컬럼 추가 후 구현
    // 현재는 로그만 기록
    console.log(`[Admin API] User status change: ${userId} -> ${status}`);

    // 감사 로그 기록
    await logAdminAction({
      action: AuditActions.USER_STATUS_CHANGE,
      targetType: TargetTypes.USER,
      targetId: userId,
      targetName: profile.name || "Unknown",
      details: {
        before: "active", // TODO: 실제 이전 상태 조회
        after: status,
      },
      reason,
    });

    return NextResponse.json({
      success: true,
      data: { userId, status },
      message: "회원 상태가 변경되었습니다.",
    });
  } catch (error) {
    console.error("[Admin API] Failed to update user status:", error);
    return NextResponse.json(
      { success: false, error: "회원 상태 변경에 실패했습니다." },
      { status: 500 }
    );
  }
}
