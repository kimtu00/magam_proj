/**
 * @file app/api/admin/users/[id]/grade/route.ts
 * @description 회원 등급 수동 조정 API
 *
 * PATCH /api/admin/users/[id]/grade
 * - 소비자의 히어로 등급을 수동으로 조정
 * - 감사 로그 기록
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { logAdminAction, AuditActions, TargetTypes } from "@/lib/admin/audit-log";
import type { AdjustGradeRequest } from "@/types/admin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const params = await context.params;
    const userId = params.id;

    const body: Omit<AdjustGradeRequest, "userId"> = await request.json();
    const { newGrade, newTier, reason } = body;

    if (!newGrade || !newTier || !reason) {
      return NextResponse.json(
        { success: false, error: "새 등급, 티어, 사유를 입력해주세요." },
        { status: 400 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name, hero_grade, hero_tier")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 등급 업데이트
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        hero_grade: newGrade,
        hero_tier: newTier,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("[Admin API] Failed to update grade:", updateError);
      return NextResponse.json(
        { success: false, error: "등급 변경에 실패했습니다." },
        { status: 500 }
      );
    }

    // 감사 로그 기록
    await logAdminAction({
      action: AuditActions.USER_GRADE_ADJUST,
      targetType: TargetTypes.USER,
      targetId: userId,
      targetName: profile.name || "Unknown",
      details: {
        before: { grade: profile.hero_grade, tier: profile.hero_tier },
        after: { grade: newGrade, tier: newTier },
      },
      reason,
    });

    return NextResponse.json({
      success: true,
      data: { userId, newGrade, newTier },
      message: "등급이 변경되었습니다.",
    });
  } catch (error) {
    console.error("[Admin API] Failed to adjust grade:", error);
    return NextResponse.json(
      { success: false, error: "등급 조정에 실패했습니다." },
      { status: 500 }
    );
  }
}
