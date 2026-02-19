/**
 * @file app/api/user/benefits/route.ts
 * @description 혜택 목록 조회 API
 * 
 * GET: 사용자 등급에 따른 혜택 목록 (활성/잠김)
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BenefitsResponse, BenefitData } from "@/types/consumer";

/**
 * GET /api/user/benefits
 * 혜택 목록 조회
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // 1. 사용자 히어로 등급 조회
    const { data: heroData } = await supabase
      .from("hero_grades")
      .select("tier")
      .eq("user_id", userId)
      .single();

    const userTier = heroData?.tier || 1;

    // 2. 모든 혜택 목록 (하드코딩 - 향후 DB 테이블로 이동 가능)
    const allBenefits: BenefitData[] = [
      {
        id: "1",
        type: "discount",
        title: "히어로 할인",
        description: "모든 상품 5% 할인",
        icon: "🏷️",
        required_tier: 1,
        status: "active",
      },
      {
        id: "2",
        type: "free_delivery",
        title: "무료 배송",
        description: "배송비 무료 (5,000원 이상 구매 시)",
        icon: "🚚",
        required_tier: 2,
        status: userTier >= 2 ? "active" : "locked",
        unlock_condition: "실버 등급 달성 시 해제",
      },
      {
        id: "3",
        type: "priority",
        title: "우선 예약",
        description: "인기 상품 우선 예약 혜택",
        icon: "⭐",
        required_tier: 3,
        status: userTier >= 3 ? "active" : "locked",
        unlock_condition: "골드 등급 달성 시 해제",
      },
      {
        id: "4",
        type: "exclusive",
        title: "VIP 라운지",
        description: "전용 고객센터 및 특별 이벤트 참여",
        icon: "👑",
        required_tier: 4,
        status: userTier >= 4 ? "active" : "locked",
        unlock_condition: "플래티넘 등급 달성 시 해제",
      },
      {
        id: "5",
        type: "discount",
        title: "생일 쿠폰",
        description: "생일 달 10% 할인 쿠폰",
        icon: "🎉",
        required_tier: 1,
        status: "active",
      },
      {
        id: "6",
        type: "exclusive",
        title: "히어로 포인트 2배",
        description: "포인트 적립 2배 혜택",
        icon: "💎",
        required_tier: 3,
        status: userTier >= 3 ? "active" : "locked",
        unlock_condition: "골드 등급 달성 시 해제",
      },
    ];

    // 3. 통계 계산
    const activeCount = allBenefits.filter(b => b.status === "active").length;
    const lockedCount = allBenefits.filter(b => b.status === "locked").length;

    const response: BenefitsResponse = {
      benefits: allBenefits,
      user_tier: userTier,
      active_count: activeCount,
      locked_count: lockedCount,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("GET /api/user/benefits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
