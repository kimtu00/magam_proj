/**
 * @file app/api/user/receipts/route.ts
 * @description 영수증 제출 및 조회 API
 * 
 * GET: 영수증 제출 내역 조회
 * POST: 영수증 제출
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SubmitReceiptRequest, ReceiptsResponse } from "@/types/consumer";

/**
 * GET /api/user/receipts
 * 영수증 제출 내역 조회
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: receipts, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Receipts query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch receipts" },
        { status: 500 }
      );
    }

    // 통계 계산
    const pending_count = receipts?.filter(r => r.status === "pending").length || 0;
    const approved_count = receipts?.filter(r => r.status === "approved").length || 0;
    const rejected_count = receipts?.filter(r => r.status === "rejected").length || 0;

    const response: ReceiptsResponse = {
      receipts: receipts || [],
      total: receipts?.length || 0,
      pending_count,
      approved_count,
      rejected_count,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("GET /api/user/receipts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/receipts
 * 영수증 제출
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SubmitReceiptRequest = await request.json();
    const { order_id, image_url } = body;

    if (!image_url) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 영수증 제출
    const { data: receipt, error } = await supabase
      .from("receipts")
      .insert({
        user_id: userId,
        order_id: order_id || null,
        image_url,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Insert receipt error:", error);
      return NextResponse.json(
        { error: "Failed to submit receipt" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: receipt,
      message: "영수증이 제출되었습니다. 심사 후 페이백이 지급됩니다.",
    });
  } catch (error) {
    console.error("POST /api/user/receipts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
