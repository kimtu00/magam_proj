import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * GET /api/admin/ml/model-info
 * 
 * Get current ML model information and statistics.
 * 
 * Response:
 * {
 *   "model_metadata": {...},
 *   "training_data_count": 1523,
 *   "prediction_logs_count": 342,
 *   "avg_accuracy": 0.875,
 *   "ml_service_status": "available"
 * }
 */
export async function GET() {
  try {
    // Check admin permission
    await requireAdmin();

    const supabase = getServiceRoleClient();

    // Get training data count
    const { count: trainingCount, error: trainingError } = await supabase
      .from('prediction_training_data')
      .select('*', { count: 'exact', head: true });

    if (trainingError) {
      console.error('Error fetching training data count:', trainingError);
    }

    // Get prediction logs count
    const { count: logsCount, error: logsError } = await supabase
      .from('prediction_logs')
      .select('*', { count: 'exact', head: true });

    if (logsError) {
      console.error('Error fetching logs count:', logsError);
    }

    // Get completed predictions count
    const { count: completedCount, error: completedError } = await supabase
      .from('prediction_logs')
      .select('*', { count: 'exact', head: true })
      .not('actual_sell_through', 'is', null);

    if (completedError) {
      console.error('Error fetching completed predictions:', completedError);
    }

    // Calculate average accuracy
    const { data: accuracyData, error: accuracyError } = await supabase
      .from('prediction_logs')
      .select('prediction_error')
      .not('actual_sell_through', 'is', null);

    let avgAccuracy = 0;
    if (!accuracyError && accuracyData && accuracyData.length > 0) {
      const avgError = accuracyData.reduce((sum, row) => sum + (row.prediction_error || 0), 0) / accuracyData.length;
      avgAccuracy = (1 - avgError) * 100;
    }

    // Check ML service status
    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    let mlServiceStatus = 'unavailable';
    let modelMetadata = null;

    try {
      const healthResponse = await fetch(`${ML_SERVICE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });

      if (healthResponse.ok) {
        const health = await healthResponse.json();
        mlServiceStatus = health.model_loaded ? 'available' : 'model_not_loaded';
      }

      // Get stats from ML service
      const statsResponse = await fetch(`${ML_SERVICE_URL}/stats`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });

      if (statsResponse.ok) {
        modelMetadata = await statsResponse.json();
      }
    } catch (error) {
      console.warn('ML service check failed:', error);
    }

    return NextResponse.json({
      model_metadata: modelMetadata,
      training_data_count: trainingCount || 0,
      prediction_logs_count: logsCount || 0,
      completed_predictions_count: completedCount || 0,
      avg_accuracy: Math.round(avgAccuracy * 100) / 100,
      ml_service_status: mlServiceStatus,
      model_ready: (trainingCount || 0) >= 1000,
    });

  } catch (error) {
    console.error('Admin ML model info API error:', error);

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
