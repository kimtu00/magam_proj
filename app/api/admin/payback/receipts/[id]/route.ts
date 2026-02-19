/**
 * @file app/api/admin/payback/receipts/[id]/route.ts
 * @description 영수증 심사 API
 *
 * PATCH /api/admin/payback/receipts/[id]
 * - 영수증을 승인/거절
 * - 승인 시 포인트 지급
 * - 감사 로그 기록
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { logAdminAction, AuditActions, TargetTypes } from "@/lib/admin/audit-log";
import { currentUser } from "@clerk/nextjs/server";
import type { ReviewReceiptRequest } from "@/types/admin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const params = await context.params;
    const receiptId = params.id;

    const body: Omit<ReviewReceiptRequest, "receiptId"> = await request.json();
    const { status, reason, paybackAmount } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "심사 결과를 선택해주세요." },
        { status: 400 }
      );
    }

    if (status === "rejected" && !reason) {
      return NextResponse.json(
        { success: false, error: "거절 사유를 입력해주세요." },
        { status: 400 }
      );
    }

    if (status === "approved" && !paybackAmount) {
      return NextResponse.json(
        { success: false, error: "페이백 금액을 입력해주세요." },
        { status: 400 }
      );
    }

    const supabase = await createClerkSupabaseClient();
    const user = await currentUser();

    // 영수증 정보 조회
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .select("*, orders!inner(user_id)")
      .eq("id", receiptId)
      .single();

    if (receiptError || !receipt) {
      return NextResponse.json(
        { success: false, error: "영수증을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const userId = (receipt as any).orders.user_id;

    // 영수증 상태 업데이트
    const { error: updateError } = await supabase
      .from("receipts")
      .update({
        status,
        reject_reason: status === "rejected" ? reason : null,
        payback_amount: status === "approved" ? paybackAmount : null,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", receiptId);

    if (updateError) {
      console.error("[Admin API] Failed to update receipt:", updateError);
      return NextResponse.json(
        { success: false, error: "영수증 심사에 실패했습니다." },
        { status: 500 }
      );
    }

    // 승인 시 포인트 지급
    if (status === "approved" && paybackAmount) {
      const { error: pointsError } = await supabase.rpc("increment_points", {
        p_user_id: userId,
        p_amount: paybackAmount,
      });

      if (pointsError) {
        console.error("[Admin API] Failed to award points:", pointsError);
        // 포인트 지급 실패 시에도 영수증은 승인 상태 유지
      }
    }

    // 감사 로그 기록
    await logAdminAction({
      action: status === "approved" ? AuditActions.RECEIPT_APPROVE : AuditActions.RECEIPT_REJECT,
      targetType: TargetTypes.RECEIPT,
      targetId: receiptId,
      details: {
        status,
        paybackAmount,
        reason,
      },
      reason: reason || "영수증 승인",
    });

    return NextResponse.json({
      success: true,
      data: { receiptId, status, paybackAmount },
      message: status === "approved" ? "영수증이 승인되었습니다." : "영수증이 거절되었습니다.",
    });
  } catch (error) {
    console.error("[Admin API] Failed to review receipt:", error);
    return NextResponse.json(
      { success: false, error: "영수증 심사에 실패했습니다." },
      { status: 500 }
    );
  }
}
