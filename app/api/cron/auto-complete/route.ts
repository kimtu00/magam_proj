/**
 * @file app/api/cron/auto-complete/route.ts
 * @description Vercel Cron Job - 자동 구매확정 처리
 * 
 * 이 API는 Vercel Cron에 의해 매시간 자동 실행됩니다.
 * 픽업 마감 시간 + 12시간이 지난 예약 건들을 자동으로 완료 처리합니다.
 * 
 * 주요 기능:
 * - Supabase auto_complete_orders RPC 함수 호출
 * - CRON_SECRET 환경변수로 보안 검증
 * - 처리 결과 로깅 및 반환
 * 
 * @see /supabase/migrations/20260203000000_add_complete_order.sql
 * @see /vercel.json - Cron 스케줄 설정
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Vercel Cron Job 엔드포인트
 * 매시간 실행되어 자동 구매확정 처리
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 보안 검증: Vercel Cron Secret 확인
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[Cron] CRON_SECRET 환경변수가 설정되지 않았습니다.");
      return NextResponse.json(
        { success: false, error: "서버 설정 오류" },
        { status: 500 }
      );
    }

    // Bearer 토큰 검증
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Cron] 인증 실패: 잘못된 CRON_SECRET");
      return NextResponse.json(
        { success: false, error: "인증 실패" },
        { status: 401 }
      );
    }

    console.log("[Cron] 자동 구매확정 처리 시작:", new Date().toISOString());

    // 2. Service Role 클라이언트 생성 (RLS 우회)
    const supabase = getServiceRoleClient();

    // 3. auto_complete_orders RPC 함수 호출
    const { data, error } = await supabase.rpc("auto_complete_orders");

    if (error) {
      console.error("[Cron] RPC 호출 실패:", error);
      return NextResponse.json(
        {
          success: false,
          error: "자동 완료 처리 중 오류 발생",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // 4. 처리 결과 로깅
    console.log("[Cron] 자동 구매확정 처리 완료:", {
      completed_count: data.completed_count,
      processed_at: data.processed_at,
      message: data.message,
    });

    // 5. 성공 응답
    return NextResponse.json({
      success: true,
      completed_count: data.completed_count,
      message: data.message,
      processed_at: data.processed_at,
    });
  } catch (error) {
    console.error("[Cron] 예상치 못한 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: "서버 오류",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST 요청은 지원하지 않음
 */
export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
