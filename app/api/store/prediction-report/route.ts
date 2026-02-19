import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStore } from "@/app/seller/actions";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * GET /api/store/prediction-report?period=week|month
 * 
 * Get prediction accuracy report for the seller's store.
 * 
 * Response:
 * {
 *   "accuracy_percent": 87.5,
 *   "total_predictions": 24,
 *   "completed_predictions": 20,
 *   "avg_error": 0.125,
 *   "mae": 0.08,
 *   "rmse": 0.11,
 *   "predictions": [
 *     {
 *       "product_name": "크루아상",
 *       "predicted": 0.85,
 *       "actual": 0.80,
 *       "error": 0.05,
 *       "predicted_at": "2024-01-15T10:00:00Z"
 *     }
 *   ],
 *   "best_conditions": [
 *     {
 *       "condition": "빵류 + 50%할인 + 저녁",
 *       "avg_sell_through": 0.92,
 *       "count": 8
 *     }
 *   ],
 *   "insights": {
 *     "best_day": "금요일",
 *     "best_time_slot": "저녁",
 *     "best_discount_range": "40-50%"
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get seller's store
    const store = await getStore();
    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    // Get period parameter
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'week';
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate.setDate(now.getDate() - 7); // default to week
    }

    const supabase = getServiceRoleClient();

    // Get prediction accuracy summary
    const { data: summary, error: summaryError } = await supabase
      .from('prediction_accuracy_summary')
      .select('*')
      .eq('store_id', store.id)
      .single();

    if (summaryError && summaryError.code !== 'PGRST116') {
      console.error('Error fetching prediction summary:', summaryError);
    }

    // Get individual predictions with actual results
    const { data: predictions, error: predictionsError } = await supabase
      .from('prediction_logs')
      .select(`
        id,
        product_id,
        predicted_sell_through,
        actual_sell_through,
        prediction_error,
        confidence,
        confidence_score,
        features,
        predicted_at,
        actual_recorded_at,
        products (
          name,
          category,
          original_price,
          discount_price,
          quantity
        )
      `)
      .eq('store_id', store.id)
      .gte('predicted_at', startDate.toISOString())
      .order('predicted_at', { ascending: false })
      .limit(50);

    if (predictionsError) {
      console.error('Error fetching predictions:', predictionsError);
    }

    // Process predictions for response
    const processedPredictions = (predictions || []).map(pred => {
      const product = Array.isArray(pred.products) ? pred.products[0] : pred.products;
      return {
      id: pred.id,
      product_id: pred.product_id,
      product_name: product?.name || 'Unknown',
      product_category: product?.category || '',
      predicted: pred.predicted_sell_through,
      actual: pred.actual_sell_through,
      error: pred.prediction_error,
      confidence: pred.confidence,
      predicted_at: pred.predicted_at,
      actual_recorded_at: pred.actual_recorded_at,
      has_actual: pred.actual_sell_through !== null,
      };
    });

    // Analyze best conditions from completed predictions
    const completedPredictions = processedPredictions.filter(p => p.has_actual);
    
    // Group by category and calculate average sell-through
    const categoryStats = completedPredictions.reduce((acc, pred) => {
      const category = pred.product_category || '기타';
      if (!acc[category]) {
        acc[category] = { sum: 0, count: 0 };
      }
      acc[category].sum += pred.actual || 0;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { sum: number; count: number }>);

    const bestConditions = Object.entries(categoryStats)
      .map(([category, stats]) => ({
        condition: category,
        avg_sell_through: stats.sum / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => b.avg_sell_through - a.avg_sell_through)
      .slice(0, 5);

    // Extract insights from features
    const insights = extractInsights(completedPredictions);

    // Build response
    const response = {
      accuracy_percent: summary?.accuracy_percent || 0,
      total_predictions: processedPredictions.length,
      completed_predictions: completedPredictions.length,
      avg_error: summary?.avg_error || 0,
      mae: summary?.mae || 0,
      rmse: summary?.rmse || 0,
      predictions: processedPredictions,
      best_conditions: bestConditions,
      insights,
      period,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Prediction report API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction report' },
      { status: 500 }
    );
  }
}

/**
 * Extract insights from completed predictions
 */
function extractInsights(predictions: any[]): any {
  if (predictions.length === 0) {
    return {
      best_day: null,
      best_time_slot: null,
      best_discount_range: null,
    };
  }

  // Analyze by day of week (from features)
  const dowStats = predictions.reduce((acc, pred) => {
    const features = pred.features || {};
    const dow = features.register_day_of_week || 'unknown';
    if (!acc[dow]) {
      acc[dow] = { sum: 0, count: 0 };
    }
    acc[dow].sum += pred.actual || 0;
    acc[dow].count += 1;
    return acc;
  }, {} as Record<string, { sum: number; count: number }>);

  const bestDay = (Object.entries(dowStats) as [string, { sum: number; count: number }][])
    .map(([dow, stats]) => ({
      day: dow,
      avg: stats.sum / stats.count,
    }))
    .sort((a, b) => b.avg - a.avg)[0]?.day || null;

  // Analyze by time slot
  const timeSlotStats = predictions.reduce((acc, pred) => {
    const features = pred.features || {};
    const timeSlot = features.time_slot || 'unknown';
    if (!acc[timeSlot]) {
      acc[timeSlot] = { sum: 0, count: 0 };
    }
    acc[timeSlot].sum += pred.actual || 0;
    acc[timeSlot].count += 1;
    return acc;
  }, {} as Record<string, { sum: number; count: number }>);

  const bestTimeSlot = (Object.entries(timeSlotStats) as [string, { sum: number; count: number }][])
    .map(([slot, stats]) => ({
      slot,
      avg: stats.sum / stats.count,
    }))
    .sort((a, b) => b.avg - a.avg)[0]?.slot || null;

  // Analyze discount rate ranges
  const discountRangeStats = predictions.reduce((acc, pred) => {
    const features = pred.features || {};
    const discountRate = features.discount_rate || 0;
    
    let range = '0-20%';
    if (discountRate >= 50) range = '50%+';
    else if (discountRate >= 40) range = '40-50%';
    else if (discountRate >= 30) range = '30-40%';
    else if (discountRate >= 20) range = '20-30%';
    
    if (!acc[range]) {
      acc[range] = { sum: 0, count: 0 };
    }
    acc[range].sum += pred.actual || 0;
    acc[range].count += 1;
    return acc;
  }, {} as Record<string, { sum: number; count: number }>);

  const bestDiscountRange = (Object.entries(discountRangeStats) as [string, { sum: number; count: number }][])
    .map(([range, stats]) => ({
      range,
      avg: stats.sum / stats.count,
    }))
    .sort((a, b) => b.avg - a.avg)[0]?.range || null;

  return {
    best_day: bestDay,
    best_time_slot: bestTimeSlot,
    best_discount_range: bestDiscountRange,
  };
}
