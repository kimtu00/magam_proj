/**
 * @file app/api/user/orders/route.ts
 * @description 주문 내역 조회 API
 * 
 * GET: 주문 내역 목록 조회 (상태별 필터, 페이지네이션)
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatusFilter } from "@/types/consumer";

/**
 * GET /api/user/orders
 * 주문 내역 목록 조회
 * 
 * Query params:
 * - status: 'all' | 'RESERVED' | 'COMPLETED' | 'CANCELED'
 * - page: 페이지 번호 (default: 1)
 * - per_page: 페이지당 개수 (default: 10)
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") || "all") as OrderStatusFilter;
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "10");

    const supabase = await createClient();

    // 쿼리 빌더
    let query = supabase
      .from("orders")
      .select("*, products(*), stores(*)", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // 상태별 필터
    if (status === "COMPLETED") {
      query = query.eq("status", "COMPLETED");
    } else if (status === "CANCELED") {
      query = query.eq("status", "CANCELED");
    } else if (status === "RESERVED") {
      query = query.eq("status", "RESERVED");
    }

    // 페이지네이션
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error("Orders query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        orders: orders || [],
        meta: {
          page,
          per_page: perPage,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / perPage),
          has_more: (count || 0) > page * perPage,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/user/orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
