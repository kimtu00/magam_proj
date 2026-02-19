import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStore } from "@/app/seller/actions";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * POST /api/store/predict-sell-through
 * 
 * Predict sell-through rate for a product before registration.
 * 
 * Request body:
 * {
 *   "product_category": "빵",
 *   "original_price": 15000,
 *   "discount_price": 10000,
 *   "product_quantity": 20,
 *   "deadline_hours": 6
 * }
 * 
 * Response:
 * {
 *   "predicted_sell_through": 0.82,
 *   "predicted_sell_through_percent": "82%",
 *   "predicted_sold_quantity": 16,
 *   "confidence": "high",
 *   "confidence_score": 0.91,
 *   "factors": [...],
 *   "suggestion": "..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
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
        { error: "Store not found. Please register your store first." },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      product_category,
      original_price,
      discount_price,
      product_quantity,
      deadline_hours,
    } = body;

    // Validate required fields
    if (!product_category) {
      return NextResponse.json(
        { error: "product_category is required" },
        { status: 400 }
      );
    }

    if (!original_price || original_price <= 0) {
      return NextResponse.json(
        { error: "original_price must be greater than 0" },
        { status: 400 }
      );
    }

    if (!discount_price || discount_price <= 0) {
      return NextResponse.json(
        { error: "discount_price must be greater than 0" },
        { status: 400 }
      );
    }

    if (discount_price >= original_price) {
      return NextResponse.json(
        { error: "discount_price must be less than original_price" },
        { status: 400 }
      );
    }

    if (!product_quantity || product_quantity <= 0) {
      return NextResponse.json(
        { error: "product_quantity must be greater than 0" },
        { status: 400 }
      );
    }

    if (!deadline_hours || deadline_hours <= 0) {
      return NextResponse.json(
        { error: "deadline_hours must be greater than 0" },
        { status: 400 }
      );
    }

    // Call ML service
    console.log(`Calling ML service at ${ML_SERVICE_URL}/predict`);
    
    const mlResponse = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        store_id: store.id,
        product_category,
        original_price: Number(original_price),
        discount_price: Number(discount_price),
        product_quantity: Number(product_quantity),
        deadline_hours: Number(deadline_hours),
      }),
    });

    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.error(`ML service error (${mlResponse.status}):`, errorText);
      
      // Check if ML service is unavailable
      if (mlResponse.status === 503) {
        return NextResponse.json(
          { error: "ML model is not ready. Please try again later." },
          { status: 503 }
        );
      }
      
      throw new Error(`ML service returned ${mlResponse.status}`);
    }

    const prediction = await mlResponse.json();

    // Log the prediction for future analysis (fire and forget)
    // TODO: Implement prediction logging in background

    return NextResponse.json(prediction);

  } catch (error) {
    console.error("Prediction API error:", error);
    
    // Check if it's a network error (ML service down)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: "ML prediction service is currently unavailable. Please try again later." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to generate prediction. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/store/predict-sell-through
 * 
 * Get ML service status and training data statistics.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check ML service health
    const healthResponse = await fetch(`${ML_SERVICE_URL}/health`);
    const health = await healthResponse.json();

    // Get training data stats
    const statsResponse = await fetch(`${ML_SERVICE_URL}/stats`);
    const stats = await statsResponse.json();

    return NextResponse.json({
      service_status: health.status,
      model_loaded: health.model_loaded,
      training_data_count: stats.total_training_data,
      model_ready: stats.model_ready,
      category_distribution: stats.category_distribution,
    });

  } catch (error) {
    console.error("ML service status check error:", error);
    return NextResponse.json(
      {
        service_status: 'unavailable',
        model_loaded: false,
        training_data_count: 0,
        model_ready: false,
      },
      { status: 503 }
    );
  }
}
