/**
 * @file app/api/user/points/route.ts
 * @description 포인트 정보 조회 API
 * 
 * GET: 포인트 잔액 + 다음 페이백 정보 + 최근 거래 내역
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PointData, PointSummary } from "@/types/consumer";

/**
 * GET /api/user/points
 * 포인트 요약 정보 조회
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // 1. 현재 포인트 잔액
    const { data: balance } = await supabase.rpc("get_point_balance", {
      p_user_id: userId,
    });

    const currentBalance = (balance as number) || 0;

    // 2. 평생 적립/사용 통계
    const { data: transactions } = await supabase
      .from("point_transactions")
      .select("type, amount")
      .eq("user_id", userId);

    const lifetimeEarned = transactions
      ?.filter(t => t.type === "earn" || t.type === "payback")
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    const lifetimeSpent = Math.abs(
      transactions
        ?.filter(t => t.type === "spend" || t.type === "expire")
        .reduce((sum, t) => sum + t.amount, 0) || 0
    );

    // 3. 다음 페이백 정보 (예시: 매월 1일에 페이백)
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextPaybackAmount = Math.floor(currentBalance * 0.05); // 5% 페이백 (예시)

    // 4. 최근 거래 내역 (최근 5건)
    const { data: recentTransactions } = await supabase
      .from("point_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    const summary: PointSummary = {
      current_balance: currentBalance,
      next_payback: {
        amount: nextPaybackAmount,
        date: nextMonth.toISOString(),
      },
      lifetime_earned: lifetimeEarned,
      lifetime_spent: lifetimeSpent,
    };

    const pointData: PointData = {
      summary,
      recent_transactions: recentTransactions || [],
    };

    return NextResponse.json({
      success: true,
      data: pointData,
    });
  } catch (error) {
    console.error("GET /api/user/points error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
