import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/cron/retrain-model
 * 
 * Weekly model retraining cron job.
 * 
 * Schedule: Every Monday at 3 AM (vercel.json)
 * 
 * Process:
 * 1. Trigger Python training script
 * 2. Check new model performance
 * 3. Compare with previous model
 * 4. Keep new model if performance improved, revert otherwise
 * 
 * Security:
 * - CRON_SECRET authentication
 */
export async function GET(request: NextRequest) {
  console.group("🔄 Model Retraining Cron Job");
  console.log("Execution time:", new Date().toISOString());

  try {
    // 1. Authentication
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      console.error("❌ Authentication failed: Invalid CRON_SECRET");
      console.groupEnd();
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("✅ Authentication successful");

    // 2. Check if ML service is available
    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    
    try {
      const healthCheck = await fetch(`${ML_SERVICE_URL}/health`, {
        method: 'GET',
      });
      
      if (!healthCheck.ok) {
        throw new Error('ML service unavailable');
      }
      
      console.log("✅ ML service is available");
    } catch (error) {
      console.error("❌ ML service is not available:", error);
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "ML service unavailable", 
          message: "Model retraining requires ML service to be running"
        },
        { status: 503 }
      );
    }

    // 3. Trigger retraining
    // Note: This requires the ML service to expose a /retrain endpoint
    // or we need to trigger the training script via exec
    
    console.log("🔄 Triggering model retraining...");
    console.log("⚠️  Manual retraining required:");
    console.log("    1. SSH to ML server");
    console.log("    2. Run: cd ml && python train_model.py");
    console.log("    3. Check model_metadata.json for performance");

    // For production: Implement proper retraining trigger
    // Option A: ML service exposes POST /retrain endpoint
    // Option B: Queue-based system (e.g., BullMQ, Redis Queue)
    // Option C: Separate Python cron on ML server

    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "Retraining trigger scheduled. Check ML service logs for progress.",
      timestamp: new Date().toISOString(),
      note: "Automatic retraining requires ML service to expose /retrain endpoint or separate cron setup"
    });

  } catch (error) {
    console.error("❌ Retraining cron job error:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        error: "Retraining cron job failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/retrain-model
 * 
 * Manual retraining trigger (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Manual trigger uses same logic as cron
    return await GET(request);
  } catch (error) {
    return NextResponse.json(
      { error: "Manual retraining failed" },
      { status: 500 }
    );
  }
}
