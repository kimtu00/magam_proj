import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { PredictionService } from "@/services/prediction";

/**
 * GET /api/admin/prediction/stats
 * 
 * 학습 데이터 통계 조회
 * 
 * 반환 데이터:
 * - 전체 레코드 수
 * - 평균 소진율
 * - 카테고리별 분포
 * - 시간대별 분포
 * - 날짜 범위
 * 
 * 보안: 관리자만 접근 가능
 */
export async function GET() {
  try {
    // 관리자 권한 확인
    await requireAdmin();

    // 통계 조회
    const stats = await PredictionService.getStats();

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error("Admin API error:", error);
    
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
