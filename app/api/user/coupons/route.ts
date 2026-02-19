/**
 * @file app/api/user/coupons/route.ts
 * @description 쿠폰 목록 조회 API
 * 
 * GET: 사용자 쿠폰 목록 조회 (탭별 필터)
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserCouponStatus, CouponsResponse } from "@/types/consumer";

/**
 * GET /api/user/coupons
 * 쿠폰 목록 조회
 * 
 * Query params:
 * - tab: 'available' | 'used' | 'expired' | 'all' (default: 'available')
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "available";

    const supabase = await createClient();

    // 쿼리 빌더
    let query = supabase
      .from("user_coupons")
      .select("*, coupon:coupons(*)")
      .eq("user_id", userId)
      .order("acquired_at", { ascending: false });

    // 탭별 필터
    if (tab !== "all") {
      query = query.eq("status", tab as UserCouponStatus);
    }

    const { data: userCoupons, error } = await query;

    if (error) {
      console.error("Coupons query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch coupons" },
        { status: 500 }
      );
    }

    // 통계 계산
    const available_count = userCoupons?.filter(c => c.status === "available").length || 0;
    const used_count = userCoupons?.filter(c => c.status === "used").length || 0;
    const expired_count = userCoupons?.filter(c => c.status === "expired").length || 0;

    const response: CouponsResponse = {
      coupons: userCoupons || [],
      total: userCoupons?.length || 0,
      available_count,
      used_count,
      expired_count,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("GET /api/user/coupons error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
