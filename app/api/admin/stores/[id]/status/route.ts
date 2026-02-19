/**
 * @file app/api/admin/stores/[id]/status/route.ts
 * @description 가게 상태 변경 API
 *
 * PATCH /api/admin/stores/[id]/status
 * - 가게 상태를 approved, rejected, inactive로 변경
 * - 감사 로그 기록
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { logAdminAction, AuditActions, TargetTypes } from "@/lib/admin/audit-log";
import { currentUser } from "@clerk/nextjs/server";
import type { UpdateStoreStatusRequest } from "@/types/admin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const params = await context.params;
    const storeId = params.id;

    const body: Omit<UpdateStoreStatusRequest, "storeId"> = await request.json();
    const { status, reason } = body;

    if (!status || !reason) {
      return NextResponse.json(
        { success: false, error: "상태와 사유를 입력해주세요." },
        { status: 400 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 가게 정보 조회
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("name, status")
      .eq("id", storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { success: false, error: "가게를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const user = await currentUser();

    // 가게 상태 업데이트
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "approved") {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = user?.id;
    }

    const { error: updateError } = await supabase
      .from("stores")
      .update(updateData)
      .eq("id", storeId);

    if (updateError) {
      console.error("[Admin API] Failed to update store status:", updateError);
      return NextResponse.json(
        { success: false, error: "가게 상태 변경에 실패했습니다." },
        { status: 500 }
      );
    }

    // 감사 로그 기록
    await logAdminAction({
      action: status === "approved" ? AuditActions.STORE_APPROVE : 
              status === "rejected" ? AuditActions.STORE_REJECT : 
              AuditActions.STORE_DEACTIVATE,
      targetType: TargetTypes.STORE,
      targetId: storeId,
      targetName: store.name,
      details: {
        before: store.status,
        after: status,
      },
      reason,
    });

    return NextResponse.json({
      success: true,
      data: { storeId, status },
      message: "가게 상태가 변경되었습니다.",
    });
  } catch (error) {
    console.error("[Admin API] Failed to update store status:", error);
    return NextResponse.json(
      { success: false, error: "가게 상태 변경에 실패했습니다." },
      { status: 500 }
    );
  }
}
