/**
 * @file app/api/user/orders/[id]/route.ts
 * @description 주문 상세 정보 조회 API
 * 
 * GET: 특정 주문의 상세 정보 조회
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/user/orders/[id]
 * 주문 상세 정보 조회
 */
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const supabase = await createClient();

    const { data: order, error } = await supabase
      .from("orders")
      .select("*, products(*), stores(*)")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("GET /api/user/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
