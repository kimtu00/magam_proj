/**
 * @file app/api/user/promo-codes/redeem/route.ts
 * @description 프로모션 코드 등록 API
 * 
 * POST: 프로모션 코드로 쿠폰 등록
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { RedeemPromoCodeRequest, RedeemPromoCodeResponse } from "@/types/consumer";

/**
 * POST /api/user/promo-codes/redeem
 * 프로모션 코드로 쿠폰 등록
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: RedeemPromoCodeRequest = await request.json();
    const { code } = body;

    if (!code || code.trim().length === 0) {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. 쿠폰 코드 검증
    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (couponError || !coupon) {
      return NextResponse.json({
        success: false,
        message: "유효하지 않은 프로모션 코드입니다.",
      });
    }

    // 2. 유효기간 확인
    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = new Date(coupon.valid_until);

    if (now < validFrom || now > validUntil) {
      return NextResponse.json({
        success: false,
        message: "사용 기간이 만료된 프로모션 코드입니다.",
      });
    }

    // 3. 수량 제한 확인
    if (coupon.total_quantity && coupon.issued_count >= coupon.total_quantity) {
      return NextResponse.json({
        success: false,
        message: "프로모션 코드가 모두 소진되었습니다.",
      });
    }

    // 4. 이미 등록했는지 확인
    const { data: existing } = await supabase
      .from("user_coupons")
      .select("id")
      .eq("user_id", userId)
      .eq("coupon_id", coupon.id)
      .single();

    if (existing) {
      return NextResponse.json({
        success: false,
        message: "이미 등록한 프로모션 코드입니다.",
      });
    }

    // 5. 쿠폰 등록
    const { data: userCoupon, error: insertError } = await supabase
      .from("user_coupons")
      .insert({
        user_id: userId,
        coupon_id: coupon.id,
        status: "available",
      })
      .select("*, coupon:coupons(*)")
      .single();

    if (insertError) {
      console.error("Insert user_coupon error:", insertError);
      return NextResponse.json({
        success: false,
        message: "쿠폰 등록에 실패했습니다.",
      });
    }

    // 6. 발급 수 증가
    await supabase
      .from("coupons")
      .update({ issued_count: coupon.issued_count + 1 })
      .eq("id", coupon.id);

    const response: RedeemPromoCodeResponse = {
      success: true,
      coupon: userCoupon,
      message: "쿠폰이 성공적으로 등록되었습니다!",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("POST /api/user/promo-codes/redeem error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
