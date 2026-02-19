import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { PredictionService } from "@/services/prediction";

/**
 * POST /api/admin/prediction/migrate
 * 
 * 과거 데이터 마이그레이션 (1회성 실행)
 * 
 * 기존 완료된 상품들의 데이터를 학습 데이터로 변환합니다.
 * - 마감 지난 모든 상품 대상
 * - 이미 수집된 상품은 스킵
 * - 최대 1000건씩 일괄 처리
 * 
 * 보안: 관리자만 실행 가능
 */
export async function POST() {
  console.group("🔄 과거 데이터 마이그레이션 시작");
  console.log("실행 시각:", new Date().toISOString());

  try {
    // 관리자 권한 확인
    await requireAdmin();
    console.log("✅ 관리자 권한 확인");

    // 일괄 수집 실행
    const result = await PredictionService.collectBatch();

    console.log("마이그레이션 결과:", result);
    console.log(`  - 수집: ${result.collected_count}건`);
    console.log(`  - 스킵: ${result.skipped_count}건`);
    console.log(`  - 에러: ${result.error_count}건`);

    console.groupEnd();

    return NextResponse.json(
      {
        success: true,
        collected_count: result.collected_count,
        skipped_count: result.skipped_count,
        error_count: result.error_count,
        message: `${result.collected_count}건의 과거 데이터가 마이그레이션되었습니다.`,
        processed_at: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ 마이그레이션 실행 중 오류:", error);
    console.groupEnd();

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "과거 데이터 마이그레이션 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
