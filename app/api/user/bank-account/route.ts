/**
 * @file app/api/user/bank-account/route.ts
 * @description 계좌 정보 조회 및 등록 API
 * 
 * GET: 계좌 정보 조회
 * POST: 계좌 등록/수정
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BankAccountRequest } from "@/types/consumer";

/**
 * GET /api/user/bank-account
 * 계좌 정보 조회
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: bankAccount, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("user_id", userId)
      .single();

    // 계좌가 없는 경우 (첫 등록 전)
    if (error && error.code === "PGRST116") {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    if (error) {
      console.error("Bank account query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch bank account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bankAccount,
    });
  } catch (error) {
    console.error("GET /api/user/bank-account error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/bank-account
 * 계좌 등록/수정
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: BankAccountRequest = await request.json();
    const { bank_name, account_number, account_holder } = body;

    // 필수 필드 검증
    if (!bank_name || !account_number || !account_holder) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // UPSERT (없으면 생성, 있으면 업데이트)
    const { data: bankAccount, error } = await supabase
      .from("bank_accounts")
      .upsert(
        {
          user_id: userId,
          bank_name,
          account_number,
          account_holder,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Upsert bank account error:", error);
      return NextResponse.json(
        { error: "Failed to save bank account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bankAccount,
      message: "계좌 정보가 저장되었습니다.",
    });
  } catch (error) {
    console.error("POST /api/user/bank-account error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
