/**
 * @file app/api/admin/users/[id]/coupons/route.ts
 * @description 회원에게 쿠폰 수동 지급 API
 *
 * POST /api/admin/users/[id]/coupons
 * - 소비자에게 쿠폰을 수동으로 지급
 * - 감사 로그 기록
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { logAdminAction, AuditActions, TargetTypes } from "@/lib/admin/audit-log";
import type { AssignCouponRequest } from "@/types/admin";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const params = await context.params;
    const userId = params.id;

    const body: Omit<AssignCouponRequest, "userId"> = await request.json();
    const { couponId, reason } = body;

    if (!couponId) {
      return NextResponse.json(
        { success: false, error: "쿠폰 ID를 입력해주세요." },
        { status: 400 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자 정보 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", userId)
      .single();

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 쿠폰 정보 조회
    const { data: coupon } = await supabase
      .from("coupons")
      .select("name")
      .eq("id", couponId)
      .single();

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: "쿠폰을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 쿠폰 지급 (user_coupons 테이블)
    const { error: insertError } = await supabase.from("user_coupons").insert({
      user_id: userId,
      coupon_id: couponId,
      is_used: false,
    });

    if (insertError) {
      console.error("[Admin API] Failed to assign coupon:", insertError);
      return NextResponse.json(
        { success: false, error: "쿠폰 지급에 실패했습니다." },
        { status: 500 }
      );
    }

    // 감사 로그 기록
    await logAdminAction({
      action: AuditActions.USER_COUPON_ASSIGN,
      targetType: TargetTypes.USER,
      targetId: userId,
      targetName: profile.name || "Unknown",
      details: {
        couponId,
        couponName: coupon.name,
      },
      reason,
    });

    return NextResponse.json({
      success: true,
      data: { userId, couponId },
      message: "쿠폰이 지급되었습니다.",
    });
  } catch (error) {
    console.error("[Admin API] Failed to assign coupon:", error);
    return NextResponse.json(
      { success: false, error: "쿠폰 지급에 실패했습니다." },
      { status: 500 }
    );
  }
}
