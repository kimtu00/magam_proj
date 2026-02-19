"""
Prediction Module
=================

Load trained model and make predictions for new products.
Supports single prediction, batch prediction, and CLI mode.
"""

import numpy as np
import pandas as pd
import joblib
import json
import argparse
import psycopg2
from typing import Union, List, Dict
import warnings

from config import (
    MODEL_PATH,
    METADATA_PATH,
    PREPROCESSOR_PATH,
    DATABASE_URL,
    CONTINUOUS_FEATURES,
    CATEGORICAL_FEATURES,
    BOOLEAN_FEATURES,
    DERIVED_FEATURES,
)

warnings.filterwarnings('ignore')


class SellThroughPredictor:
    """
    Sell-through rate predictor.
    
    Loads trained model and provides prediction interface.
    """
    
    def __init__(self, model_path: str = None, metadata_path: str = None):
        """
        Initialize predictor.
        
        Args:
            model_path: Path to saved model (optional)
            metadata_path: Path to metadata JSON (optional)
        """
        self.model_path = model_path or MODEL_PATH
        self.metadata_path = metadata_path or METADATA_PATH
        
        self.model = None
        self.preprocessor = None
        self.metadata = None
        self.feature_names = None
        self.model_type = None
        
        self._load_model()
    
    def _load_model(self):
        """Load model, preprocessor, and metadata."""
        print(f"Loading model from {self.model_path}...")
        self.model = joblib.load(self.model_path)
        
        print(f"Loading metadata from {self.metadata_path}...")
        with open(self.metadata_path, 'r') as f:
            self.metadata = json.load(f)
        
        self.feature_names = self.metadata['features']
        self.model_type = self.metadata['model_type']
        
        # Load preprocessor if exists (for XGBoost, RF, Ridge)
        if self.model_type not in ['lightgbm', 'catboost']:
            try:
                print(f"Loading preprocessor from {PREPROCESSOR_PATH}...")
                self.preprocessor = joblib.load(PREPROCESSOR_PATH)
            except FileNotFoundError:
                print("  ⚠ Preprocessor not found (may not be needed for this model)")
        
        print(f"✓ Model loaded: {self.metadata['model_name']}")
        print(f"  - Training Date: {self.metadata['training_date']}")
        print(f"  - Training Data Size: {self.metadata['data_size']}")
        print(f"  - R² Score: {self.metadata['metrics']['R2']:.4f}")
    
    def _prepare_features(self, features: Dict) -> pd.DataFrame:
        """
        Prepare features from raw input dictionary.
        
        Args:
            features: Dictionary of feature values
            
        Returns:
            DataFrame with proper feature columns
        """
        # Create DataFrame with expected features
        df = pd.DataFrame([features])
        
        # Ensure all required features are present
        for feat in self.feature_names:
            if feat not in df.columns:
                # Set default values for missing features
                if feat in CONTINUOUS_FEATURES:
                    df[feat] = 0
                elif feat in CATEGORICAL_FEATURES:
                    df[feat] = 'unknown'
                elif feat in BOOLEAN_FEATURES:
                    df[feat] = False
                elif feat in DERIVED_FEATURES:
                    df[feat] = 0.0
        
        # Select only the features used by the model
        df = df[self.feature_names]
        
        # Convert categorical columns to 'category' dtype for LightGBM/CatBoost
        if self.model_type in ['lightgbm', 'catboost']:
            cat_features = [f for f in CATEGORICAL_FEATURES if f in df.columns]
            for col in cat_features:
                df[col] = df[col].astype('category')
        
        return df
    
    def predict(self, features: Dict) -> float:
        """
        Predict sell-through rate for a single product.
        
        Args:
            features: Dictionary of feature values
                Example:
                {
                    'product_register_hour': 14,
                    'product_register_minute': 30,
                    'original_price': 15000,
                    'discount_price': 10000,
                    'discount_rate': 33.33,
                    'product_quantity': 10,
                    'deadline_hours_remaining': 6.0,
                    'store_avg_rating': 4.5,
                    'store_total_reviews': 120,
                    'store_total_sales': 450,
                    'product_category': '빵',
                    'register_day_of_week': '월',
                    'store_region': '강남구',
                    'time_slot': '오후',
                    'is_holiday': False,
                    'is_weekend': False,
                }
        
        Returns:
            Predicted sell-through rate (0.0 - 1.0)
        """
        # Prepare features
        X = self._prepare_features(features)
        
        # Apply preprocessor if needed
        if self.preprocessor:
            X = self.preprocessor.transform(X)
        
        # Predict
        y_pred = self.model.predict(X)[0]
        
        # Clip to valid range
        y_pred_clipped = np.clip(y_pred, 0, 1)
        
        return float(y_pred_clipped)
    
    def predict_batch(self, features_list: List[Dict]) -> List[float]:
        """
        Predict sell-through rates for multiple products.
        
        Args:
            features_list: List of feature dictionaries
        
        Returns:
            List of predicted sell-through rates
        """
        predictions = []
        
        for features in features_list:
            pred = self.predict(features)
            predictions.append(pred)
        
        return predictions
    
    def predict_from_db(self, product_id: str) -> Dict:
        """
        Fetch product features from database and predict.
        
        Args:
            product_id: Product UUID
        
        Returns:
            Dictionary with features and prediction
        """
        print(f"\nFetching product {product_id} from database...")
        
        try:
            conn = psycopg2.connect(DATABASE_URL)
            cursor = conn.cursor()
            
            # Fetch product and store data
            query = """
            SELECT 
                p.id,
                EXTRACT(HOUR FROM p.created_at) as product_register_hour,
                EXTRACT(MINUTE FROM p.created_at) as product_register_minute,
                p.original_price,
                p.discount_price,
                ((p.original_price - p.discount_price)::DECIMAL / p.original_price) * 100 as discount_rate,
                p.quantity as product_quantity,
                EXTRACT(EPOCH FROM (p.pickup_deadline - p.created_at)) / 3600.0 as deadline_hours_remaining,
                COALESCE(AVG(r.rating), 0) as store_avg_rating,
                COUNT(r.id) as store_total_reviews,
                p.category::TEXT as product_category,
                CASE EXTRACT(DOW FROM p.created_at)::INT
                    WHEN 0 THEN '일'
                    WHEN 1 THEN '월'
                    WHEN 2 THEN '화'
                    WHEN 3 THEN '수'
                    WHEN 4 THEN '목'
                    WHEN 5 THEN '금'
                    WHEN 6 THEN '토'
                END as register_day_of_week,
                s.address as store_address,
                CASE 
                    WHEN EXTRACT(HOUR FROM p.created_at)::INT >= 6 AND EXTRACT(HOUR FROM p.created_at)::INT < 11 THEN '아침'
                    WHEN EXTRACT(HOUR FROM p.created_at)::INT >= 11 AND EXTRACT(HOUR FROM p.created_at)::INT < 14 THEN '점심'
                    WHEN EXTRACT(HOUR FROM p.created_at)::INT >= 14 AND EXTRACT(HOUR FROM p.created_at)::INT < 17 THEN '오후'
                    WHEN EXTRACT(HOUR FROM p.created_at)::INT >= 17 AND EXTRACT(HOUR FROM p.created_at)::INT < 21 THEN '저녁'
                    ELSE '심야'
                END as time_slot,
                EXTRACT(DOW FROM p.created_at)::INT IN (0, 6) as is_weekend
            FROM products p
            JOIN stores s ON s.id = p.store_id
            LEFT JOIN reviews r ON r.store_id = p.store_id
            WHERE p.id = %s
            GROUP BY p.id, s.id, s.address
            """
            
            cursor.execute(query, (product_id,))
            result = cursor.fetchone()
            
            if not result:
                conn.close()
                raise ValueError(f"Product {product_id} not found")
            
            # Get column names
            colnames = [desc[0] for desc in cursor.description]
            
            # Count store total sales
            cursor.execute("""
                SELECT COUNT(*) FROM orders o
                JOIN products p2 ON p2.id = o.product_id
                WHERE p2.store_id = (SELECT store_id FROM products WHERE id = %s)
                  AND o.status = 'COMPLETED'
            """, (product_id,))
            store_total_sales = cursor.fetchone()[0]
            
            conn.close()
            
            # Build features dictionary
            features = dict(zip(colnames, result))
            features['store_total_sales'] = store_total_sales
            
            # Extract region from address
            address = features.pop('store_address', '')
            import re
            region_match = re.search(r'([가-힣]+(?:구|시))', address)
            features['store_region'] = region_match.group(1) if region_match else 'unknown'
            
            # Set default for is_holiday (not implemented yet)
            features['is_holiday'] = False
            
            print(f"  ✓ Product features fetched")
            
            # Make prediction
            prediction = self.predict(features)
            
            print(f"\n📊 Prediction Result:")
            print(f"  Product ID: {product_id}")
            print(f"  Category: {features.get('product_category', 'N/A')}")
            print(f"  Original Price: {features.get('original_price', 0):,}원")
            print(f"  Discount Price: {features.get('discount_price', 0):,}원")
            print(f"  Quantity: {features.get('product_quantity', 0)}")
            print(f"  Predicted Sell-Through Rate: {prediction:.1%}")
            print(f"  Expected Units Sold: {prediction * features.get('product_quantity', 0):.1f}")
            
            return {
                'product_id': product_id,
                'features': features,
                'prediction': prediction,
                'expected_units_sold': prediction * features.get('product_quantity', 0),
            }
        
        except Exception as e:
            print(f"  ✗ Error: {e}")
            raise


def main():
    """CLI interface for predictions."""
    parser = argparse.ArgumentParser(
        description='Predict sell-through rate for products'
    )
    parser.add_argument(
        '--product-id',
        type=str,
        help='Product UUID to predict from database'
    )
    parser.add_argument(
        '--features',
        type=str,
        help='JSON string of features for prediction'
    )
    
    args = parser.parse_args()
    
    # Initialize predictor
    predictor = SellThroughPredictor()
    
    if args.product_id:
        # Predict from database
        result = predictor.predict_from_db(args.product_id)
    
    elif args.features:
        # Predict from JSON features
        import json
        features = json.loads(args.features)
        prediction = predictor.predict(features)
        
        print(f"\n📊 Prediction Result:")
        print(f"  Predicted Sell-Through Rate: {prediction:.1%}")
    
    else:
        # Demo mode with example features
        print("\nDemo mode: Predicting with example features")
        print("Use --product-id <UUID> to predict from database")
        print("Use --features '<JSON>' to predict from custom features\n")
        
        example_features = {
            'product_register_hour': 14,
            'product_register_minute': 30,
            'original_price': 15000,
            'discount_price': 10000,
            'discount_rate': 33.33,
            'product_quantity': 10,
            'deadline_hours_remaining': 6.0,
            'store_avg_rating': 4.5,
            'store_total_reviews': 120,
            'store_total_sales': 450,
            'product_category': '빵',
            'register_day_of_week': '월',
            'store_region': '강남구',
            'time_slot': '오후',
            'is_holiday': False,
            'is_weekend': False,
        }
        
        prediction = predictor.predict(example_features)
        
        print("Example Features:")
        for key, value in example_features.items():
            print(f"  {key}: {value}")
        
        print(f"\n📊 Prediction Result:")
        print(f"  Predicted Sell-Through Rate: {prediction:.1%}")
        print(f"  Expected Units Sold: {prediction * example_features['product_quantity']:.1f}")


if __name__ == "__main__":
    main()
