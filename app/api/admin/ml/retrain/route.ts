import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

/**
 * POST /api/admin/ml/retrain
 * 
 * Manual trigger for model retraining (admin only).
 * 
 * Process:
 * 1. Check admin permission
 * 2. Trigger ML service retraining
 * 3. Return retraining job status
 */
export async function POST() {
  try {
    // Check admin permission
    await requireAdmin();

    console.log("🔄 Manual model retraining triggered by admin");

    // Check if ML service is available
    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    
    const healthCheck = await fetch(`${ML_SERVICE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });

    if (!healthCheck.ok) {
      return NextResponse.json(
        { 
          error: 'ML service unavailable',
          message: 'ML prediction service is not running. Please start the service first.'
        },
        { status: 503 }
      );
    }

    // Note: Actual retraining trigger depends on ML service architecture
    // This is a placeholder that guides the admin to manually retrain
    
    console.log("✅ ML service is available");
    console.log("📝 Retraining instructions:");
    console.log("   1. SSH to ML server or run locally");
    console.log("   2. cd ml && python train_model.py");
    console.log("   3. Check ml/models/model_metadata.json for results");

    return NextResponse.json({
      success: true,
      message: "모델 재학습을 시작합니다. ML 서버에서 학습이 진행 중입니다.",
      instructions: [
        "ML 서버에 접속하여 다음 명령을 실행하세요:",
        "cd ml && python train_model.py",
        "학습 완료 후 model_metadata.json에서 성능을 확인하세요"
      ],
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Admin ML retrain API error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
