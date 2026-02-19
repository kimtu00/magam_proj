import { NextRequest, NextResponse } from "next/server";
import { PredictionService } from "@/services/prediction";

/**
 * GET /api/cron/collect-training
 * 
 * 마감된 상품의 학습 데이터를 일괄 수집하는 크론잡
 * 
 * 실행 주기: 매일 새벽 2시 (Vercel Cron 설정)
 * 
 * 동작:
 * 1. pickup_deadline이 지난 상품들 조회
 * 2. 각 상품의 소진율과 피처 계산
 * 3. prediction_training_data 테이블에 저장
 * 
 * 보안:
 * - CRON_SECRET 환경변수로 인증
 * - Vercel Cron에서만 호출 가능
 */
export async function GET(request: NextRequest) {
  console.group("📊 학습 데이터 수집 크론잡 시작");
  console.log("실행 시각:", new Date().toISOString());

  try {
    // 1. 인증 확인 (CRON_SECRET)
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      console.error("❌ 인증 실패: Invalid CRON_SECRET");
      console.groupEnd();
      return NextResponse.json(
        { error: "인증 실패" },
        { status: 401 }
      );
    }

    console.log("✅ 인증 성공");

    // 2. 일괄 수집 실행
    const result = await PredictionService.collectBatch();

    console.log("수집 결과:", result);
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
        message: `${result.collected_count}건의 학습 데이터가 수집되었습니다.`,
        processed_at: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ 크론잡 실행 중 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        error: "학습 데이터 수집 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST 요청 거부
 */
export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
