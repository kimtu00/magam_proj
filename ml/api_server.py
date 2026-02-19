"""
Flask API Server for ML Predictions
====================================

Provides REST API endpoints for real-time sell-through rate predictions.
Model is loaded once at startup and cached in memory for fast inference.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from predict import SellThroughPredictor
import psycopg2
from datetime import datetime
import os
import re
from typing import Optional, Dict, Tuple

app = Flask(__name__)
CORS(app)

# Global model instance (loaded once at startup)
predictor: Optional[SellThroughPredictor] = None

def initialize_model():
    """Initialize ML model at server startup."""
    global predictor
    try:
        print("🔄 Loading ML model...")
        predictor = SellThroughPredictor()
        print("✅ Model loaded successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        return False


def get_store_features(store_id: str) -> Optional[Dict]:
    """
    Fetch store statistics from database.
    
    Args:
        store_id: Store UUID
        
    Returns:
        Dictionary with store features or None if not found
    """
    try:
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cursor = conn.cursor()
        
        # Get store stats
        cursor.execute("""
            SELECT 
                COALESCE(AVG(r.rating), 0) as avg_rating,
                COUNT(DISTINCT r.id) as total_reviews,
                COUNT(DISTINCT o.id) as total_sales,
                s.address
            FROM stores s
            LEFT JOIN reviews r ON r.store_id = s.id
            LEFT JOIN products p ON p.store_id = s.id
            LEFT JOIN orders o ON o.product_id = p.id AND o.status = 'COMPLETED'
            WHERE s.id = %s
            GROUP BY s.id, s.address
        """, (store_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return None
        
        # Extract region from address
        address = result[3] or ''
        region_match = re.search(r'([가-힣]+(?:구|시))', address)
        store_region = region_match.group(1) if region_match else 'unknown'
        
        return {
            'store_avg_rating': float(result[0]),
            'store_total_reviews': int(result[1]),
            'store_total_sales': int(result[2]),
            'store_region': store_region
        }
    
    except Exception as e:
        print(f"Error fetching store features: {e}")
        return None


def calculate_confidence(prediction: float, category: str) -> Tuple[str, float]:
    """
    Calculate prediction confidence based on similar data availability.
    
    Args:
        prediction: Predicted sell-through rate
        category: Product category
        
    Returns:
        Tuple of (confidence_level, confidence_score)
    """
    try:
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cursor = conn.cursor()
        
        # Count similar products (same category)
        cursor.execute("""
            SELECT COUNT(*) 
            FROM prediction_training_data
            WHERE product_category = %s
        """, (category,))
        
        similar_count = cursor.fetchone()[0]
        conn.close()
        
        # Calculate confidence based on data availability
        if similar_count >= 100:
            return 'high', min(0.90 + (similar_count / 5000), 0.98)
        elif similar_count >= 30:
            return 'medium', 0.70 + (similar_count / 350)
        else:
            return 'low', 0.50 + (similar_count / 100)
    
    except Exception as e:
        print(f"Error calculating confidence: {e}")
        return 'medium', 0.75


def get_impact_factors(features: Dict, prediction: float) -> list:
    """
    Analyze key factors affecting the prediction.
    
    Args:
        features: Input features
        prediction: Predicted sell-through rate
        
    Returns:
        List of impact factors
    """
    factors = []
    
    # Discount rate impact
    discount_rate = features.get('discount_rate', 0)
    if discount_rate >= 50:
        factors.append({
            'name': '할인율',
            'impact': 'positive',
            'detail': f'{discount_rate:.0f}% 할인 → 소진율 +15%'
        })
    elif discount_rate >= 30:
        factors.append({
            'name': '할인율',
            'impact': 'positive',
            'detail': f'{discount_rate:.0f}% 할인 → 소진율 +8%'
        })
    elif discount_rate < 20:
        factors.append({
            'name': '할인율',
            'impact': 'negative',
            'detail': f'{discount_rate:.0f}% 할인 → 소진율 낮음'
        })
    
    # Time slot impact
    time_slot = features.get('time_slot', '')
    if time_slot in ['저녁', '점심']:
        factors.append({
            'name': '시간대',
            'impact': 'positive',
            'detail': f'{time_slot} 시간대 → 소진율 +8%'
        })
    elif time_slot == '심야':
        factors.append({
            'name': '시간대',
            'impact': 'negative',
            'detail': f'{time_slot} 시간대 → 소진율 낮음'
        })
    
    # Day of week impact
    dow = features.get('register_day_of_week', '')
    if dow in ['금', '토']:
        factors.append({
            'name': '요일',
            'impact': 'positive',
            'detail': f'{dow}요일 → 소진율 +5%'
        })
    elif dow in ['월', '화']:
        factors.append({
            'name': '요일',
            'impact': 'negative',
            'detail': f'{dow}요일 → 소진율 낮음'
        })
    else:
        factors.append({
            'name': '요일',
            'impact': 'neutral',
            'detail': f'{dow}요일 → 평균 수준'
        })
    
    return factors[:3]  # Return top 3 factors


def generate_suggestion(features: Dict, prediction: float) -> str:
    """
    Generate actionable suggestion based on prediction.
    
    Args:
        features: Input features
        prediction: Predicted sell-through rate
        
    Returns:
        Suggestion message
    """
    quantity = features.get('product_quantity', 0)
    discount_rate = features.get('discount_rate', 0)
    
    if prediction >= 0.9:
        new_qty = int(quantity * 1.3)
        return f"수량을 {new_qty}개로 늘려도 80% 이상 소진이 예상됩니다."
    elif prediction >= 0.7:
        return "적정 수량입니다. 현재 설정으로 진행하세요."
    elif prediction >= 0.5:
        if discount_rate < 40:
            suggested_rate = min(discount_rate + 10, 60)
            return f"할인율을 {suggested_rate:.0f}%로 높이면 소진율이 개선됩니다."
        else:
            new_qty = int(quantity * 0.8)
            return f"수량을 {new_qty}개로 조정하는 것을 권장합니다."
    else:
        if discount_rate < 50:
            return f"할인율을 {discount_rate + 15:.0f}%로 높이거나 수량을 {int(quantity * 0.6)}개로 줄이세요."
        else:
            new_qty = int(quantity * 0.5)
            return f"수량을 {new_qty}개로 크게 줄이는 것을 권장합니다."


@app.route('/predict', methods=['POST'])
def predict():
    """
    Main prediction endpoint.
    
    Request body:
    {
        "store_id": "uuid",
        "product_category": "빵",
        "original_price": 15000,
        "discount_price": 10000,
        "product_quantity": 20,
        "deadline_hours": 6
    }
    
    Response:
    {
        "predicted_sell_through": 0.82,
        "predicted_sell_through_percent": "82%",
        "predicted_sold_quantity": 16,
        "confidence": "high",
        "confidence_score": 0.91,
        "factors": [...],
        "suggestion": "..."
    }
    """
    try:
        if not predictor:
            return jsonify({'error': 'Model not loaded'}), 503
        
        data = request.json
        
        # Validate required fields
        required_fields = ['store_id', 'product_category', 'original_price', 
                          'discount_price', 'product_quantity', 'deadline_hours']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        # Extract input data
        store_id = data['store_id']
        product_category = data['product_category']
        original_price = float(data['original_price'])
        discount_price = float(data['discount_price'])
        product_quantity = int(data['product_quantity'])
        deadline_hours = float(data['deadline_hours'])
        
        # Validate values
        if original_price <= 0 or discount_price <= 0:
            return jsonify({'error': 'Invalid price values'}), 400
        if discount_price >= original_price:
            return jsonify({'error': 'Discount price must be less than original price'}), 400
        if product_quantity <= 0:
            return jsonify({'error': 'Invalid quantity'}), 400
        if deadline_hours <= 0:
            return jsonify({'error': 'Invalid deadline hours'}), 400
        
        # Get current time features
        now = datetime.now()
        
        # Day of week mapping
        dow_map = ['월', '화', '수', '목', '금', '토', '일']
        day_of_week = dow_map[now.weekday()]
        
        # Time slot classification
        hour = now.hour
        if 6 <= hour < 11:
            time_slot = '아침'
        elif 11 <= hour < 14:
            time_slot = '점심'
        elif 14 <= hour < 17:
            time_slot = '오후'
        elif 17 <= hour < 21:
            time_slot = '저녁'
        else:
            time_slot = '심야'
        
        # Weekend/holiday detection
        is_weekend = now.weekday() >= 5
        is_holiday = False  # TODO: Integrate holiday API
        
        # Get store statistics
        store_features = get_store_features(store_id)
        if not store_features:
            return jsonify({'error': 'Store not found'}), 404
        
        # Combine all features
        features = {
            'product_register_hour': now.hour,
            'product_register_minute': now.minute,
            'original_price': original_price,
            'discount_price': discount_price,
            'discount_rate': ((original_price - discount_price) / original_price) * 100,
            'product_quantity': product_quantity,
            'deadline_hours_remaining': deadline_hours,
            'product_category': product_category,
            'register_day_of_week': day_of_week,
            'time_slot': time_slot,
            'is_holiday': is_holiday,
            'is_weekend': is_weekend,
            **store_features
        }
        
        # Make prediction
        prediction = predictor.predict(features)
        
        # Calculate confidence
        confidence, confidence_score = calculate_confidence(prediction, product_category)
        
        # Get impact factors
        factors = get_impact_factors(features, prediction)
        
        # Generate suggestion
        suggestion = generate_suggestion(features, prediction)
        
        # Build response
        response = {
            'predicted_sell_through': round(prediction, 2),
            'predicted_sell_through_percent': f'{int(prediction * 100)}%',
            'predicted_sold_quantity': int(prediction * product_quantity),
            'confidence': confidence,
            'confidence_score': round(confidence_score, 2),
            'factors': factors,
            'suggestion': suggestion
        }
        
        return jsonify(response)
    
    except Exception as e:
        print(f"Prediction error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'model_loaded': predictor is not None,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/stats', methods=['GET'])
def stats():
    """Get training data statistics."""
    try:
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cursor = conn.cursor()
        
        # Get total training data count
        cursor.execute("SELECT COUNT(*) FROM prediction_training_data")
        total_count = cursor.fetchone()[0]
        
        # Get category distribution
        cursor.execute("""
            SELECT product_category, COUNT(*) 
            FROM prediction_training_data 
            GROUP BY product_category 
            ORDER BY COUNT(*) DESC
        """)
        category_dist = dict(cursor.fetchall())
        
        conn.close()
        
        return jsonify({
            'total_training_data': total_count,
            'category_distribution': category_dist,
            'model_ready': total_count >= 1000
        })
    
    except Exception as e:
        print(f"Stats error: {e}")
        return jsonify({'error': str(e)}), 500


# Initialize model at startup
if __name__ == '__main__':
    print("="*60)
    print("ML PREDICTION API SERVER")
    print("="*60)
    
    if initialize_model():
        print("\n✅ Server ready to accept requests")
        print("Endpoints:")
        print("  POST /predict - Make prediction")
        print("  GET  /health  - Health check")
        print("  GET  /stats   - Training data statistics")
        print("="*60 + "\n")
        
        app.run(host='0.0.0.0', port=5001, debug=False)
    else:
        print("\n❌ Server startup failed - model could not be loaded")
        exit(1)
