/**
 * @file app/api/user/points/history/route.ts
 * @description 포인트 거래 내역 조회 API
 * 
 * GET: 포인트 거래 내역 (페이지네이션)
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PointHistoryResponse } from "@/types/consumer";

/**
 * GET /api/user/points/history
 * 포인트 거래 내역 조회
 * 
 * Query params:
 * - page: 페이지 번호 (default: 1)
 * - per_page: 페이지당 개수 (default: 20)
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "20");

    const supabase = await createClient();

    // 페이지네이션
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data: transactions, error, count } = await supabase
      .from("point_transactions")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Point history query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch point history" },
        { status: 500 }
      );
    }

    const response: PointHistoryResponse = {
      transactions: transactions || [],
      total: count || 0,
      page,
      per_page: perPage,
      has_more: (count || 0) > page * perPage,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("GET /api/user/points/history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
