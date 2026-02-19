/**
 * @file app/api/admin/users/[id]/points/route.ts
 * @description 회원 포인트 수동 조정 API
 *
 * PATCH /api/admin/users/[id]/points
 * - 소비자의 포인트를 수동으로 적립/차감
 * - 감사 로그 기록
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { logAdminAction, AuditActions, TargetTypes } from "@/lib/admin/audit-log";
import type { AdjustPointsRequest } from "@/types/admin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const params = await context.params;
    const userId = params.id;

    const body: Omit<AdjustPointsRequest, "userId"> = await request.json();
    const { amount, description } = body;

    if (amount === undefined || !description) {
      return NextResponse.json(
        { success: false, error: "금액과 설명을 입력해주세요." },
        { status: 400 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name, points")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const currentPoints = profile.points || 0;
    const newPoints = currentPoints + amount;

    // 포인트가 음수가 되는 것 방지
    if (newPoints < 0) {
      return NextResponse.json(
        { success: false, error: "포인트가 부족합니다." },
        { status: 400 }
      );
    }

    // 포인트 업데이트
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        points: newPoints,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("[Admin API] Failed to update points:", updateError);
      return NextResponse.json(
        { success: false, error: "포인트 변경에 실패했습니다." },
        { status: 500 }
      );
    }

    // 감사 로그 기록
    await logAdminAction({
      action: AuditActions.USER_POINTS_ADJUST,
      targetType: TargetTypes.USER,
      targetId: userId,
      targetName: profile.name || "Unknown",
      details: {
        before: currentPoints,
        after: newPoints,
        amount,
        description,
      },
      reason: description,
    });

    return NextResponse.json({
      success: true,
      data: { userId, amount, newPoints },
      message: amount > 0 ? "포인트가 적립되었습니다." : "포인트가 차감되었습니다.",
    });
  } catch (error) {
    console.error("[Admin API] Failed to adjust points:", error);
    return NextResponse.json(
      { success: false, error: "포인트 조정에 실패했습니다." },
      { status: 500 }
    );
  }
}
