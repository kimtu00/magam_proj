# ML Sell-Through Rate Prediction Pipeline

Complete machine learning pipeline for predicting product sell-through rates at deadline.

## Overview

This pipeline trains regression models to predict the sell-through rate (0.0 - 1.0) of products based on:
- Product features (price, quantity, category, timing)
- Store features (rating, reviews, sales history)
- Temporal features (day of week, time slot, deadline)

## Project Structure

```
ml/
├── config.py               # Configuration (features, hyperparameters, thresholds)
├── preprocess.py           # Data fetching and preprocessing
├── train_model.py          # Model training and comparison
├── evaluate.py             # Model evaluation and reporting
├── predict.py              # Prediction interface
├── requirements.txt        # Python dependencies
├── models/                 # (gitignored) Saved model artifacts
│   ├── sell_through_model.pkl
│   ├── preprocessor.pkl
│   └── model_metadata.json
└── reports/                # (gitignored) Generated evaluation outputs
    ├── model_comparison.csv
    ├── feature_importance.png
    ├── actual_vs_predicted.png
    ├── residual_distribution.png
    └── learning_curve.png
```

## Setup

### 1. Install Python Dependencies

```bash
cd ml/
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
```

Get the connection string from:
- Supabase Dashboard → Settings → Database → Connection string (URI)

### 3. Verify Configuration

```bash
python config.py
```

Expected output: ✓ Configuration validated successfully

## Usage

### Training a Model

Run the complete training pipeline:

```bash
python train_model.py
```

**What it does:**
1. Fetches training data from `prediction_training_data` table
2. Handles missing values and creates derived features
3. Splits data (80/20, time-based)
4. Trains 5 models (LightGBM, CatBoost, XGBoost, Random Forest, Ridge)
5. Performs 5-fold cross-validation
6. Tunes hyperparameters for top-2 models (if data >= 5000 rows)
7. Selects best model based on R² score
8. Saves model, preprocessor, and metadata

**Adaptive strategy based on data size:**
- < 1000 rows: Train Ridge + Random Forest only (simpler models)
- >= 1000 rows: Train all 5 models
- >= 5000 rows: Full Optuna hyperparameter tuning (50 trials)

### Evaluating a Model

Generate evaluation reports and visualizations:

```bash
python evaluate.py
```

**What it does:**
1. Loads saved model and test data
2. Calculates metrics (R², RMSE, MAE, MAPE)
3. Generates 5 plots:
   - Model comparison CSV
   - Feature importance bar chart
   - Actual vs predicted scatter plot
   - Residual distribution histogram
   - Learning curve
4. Prints pass/fail against performance thresholds

### Making Predictions

#### CLI Mode - Predict from Database

```bash
# Predict for a specific product by UUID
python predict.py --product-id "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Output example:
```
📊 Prediction Result:
  Product ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  Category: 빵
  Original Price: 15,000원
  Discount Price: 10,000원
  Quantity: 10
  Predicted Sell-Through Rate: 75.3%
  Expected Units Sold: 7.5
```

#### Python API - Single Prediction

```python
from predict import SellThroughPredictor

predictor = SellThroughPredictor()

features = {
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

prediction = predictor.predict(features)
print(f"Sell-through rate: {prediction:.1%}")
```

#### Python API - Batch Prediction

```python
features_list = [features1, features2, features3]
predictions = predictor.predict_batch(features_list)
```

## Performance Thresholds

Models must meet these criteria:

- **R² (coefficient of determination)**: >= 0.90
- **RMSE (root mean squared error)**: <= 0.10
- **MAE (mean absolute error)**: <= 0.08
- **CV R² (5-fold cross-validation)**: >= 0.85

## Features

### Continuous Features (10)
- `product_register_hour` - Registration hour (0-23)
- `product_register_minute` - Registration minute (0-59)
- `original_price` - Original price
- `discount_price` - Discounted price
- `discount_rate` - Discount rate (%)
- `product_quantity` - Product quantity
- `deadline_hours_remaining` - Hours until deadline
- `store_avg_rating` - Store average rating (0-5)
- `store_total_reviews` - Store total reviews
- `store_total_sales` - Store cumulative sales

### Categorical Features (4)
- `product_category` - Product category (빵, 도시락, 음료, 디저트, 과일, 채소, 정육, 수산물, 반찬, 기타)
- `register_day_of_week` - Day of week (월-일)
- `store_region` - Store region (구/시 단위)
- `time_slot` - Time slot (아침, 점심, 오후, 저녁, 심야)

### Boolean Features (2)
- `is_holiday` - Is holiday (currently always False, for future expansion)
- `is_weekend` - Is weekend (Sat/Sun)

### Derived Features (4, if data >= 1000 rows)
- `store_avg_sell_through` - Historical average per store
- `category_avg_sell_through` - Historical average per category
- `dow_avg_sell_through` - Historical average per day-of-week
- `price_ratio` - discount_price / original_price

## Models

### 5 Regression Models Trained

1. **LightGBM** (`LGBMRegressor`)
   - Native categorical feature support
   - Fast training, high accuracy
   - Recommended for production

2. **CatBoost** (`CatBoostRegressor`)
   - Native categorical feature support
   - Robust to overfitting
   - Good out-of-the-box performance

3. **XGBoost** (`XGBRegressor`)
   - Industry standard gradient boosting
   - Requires ordinal encoding for categoricals

4. **Random Forest** (`RandomForestRegressor`)
   - Ensemble of decision trees
   - Baseline tree-based model

5. **Ridge** (`Ridge`)
   - Linear regression with L2 regularization
   - Baseline linear model
   - Requires one-hot encoding + scaling

### Model Selection

Best model is automatically selected based on test set R² score.

## Hyperparameter Tuning

For datasets >= 5000 rows, Optuna performs hyperparameter tuning on the top-2 models:

- **LightGBM**: `n_estimators`, `max_depth`, `learning_rate`, `num_leaves`, `min_child_samples`, `subsample`, `colsample_bytree`, `reg_alpha`, `reg_lambda`
- **CatBoost**: `iterations`, `depth`, `learning_rate`, `l2_leaf_reg`, `bagging_temperature`, `random_strength`

50 trials with Tree-structured Parzen Estimator (TPE) sampler.

## Reports

After training, check the `reports/` directory for:

1. **model_comparison.csv** - Performance metrics for all models
2. **feature_importance.png** - Top 15 features bar chart
3. **actual_vs_predicted.png** - Scatter plot with R² annotation
4. **residual_distribution.png** - Residual histogram
5. **learning_curve.png** - Training size vs score

## Preprocessing Details

### Data Split
- **80/20 train/test split**
- **Time-based** (no shuffle) to respect temporal ordering
- Sort by `recorded_at` ascending before split

### Missing Value Handling
- Continuous features: median imputation
- Categorical features: fill with 'unknown'
- Boolean features: fill with False
- Drop `weather_temperature` and `distance_from_station` (mostly NULL)

### Encoding Strategy
- **LightGBM/CatBoost**: Pass categoricals as `category` dtype (native support)
- **XGBoost/RF**: `OrdinalEncoder` for categorical features
- **Ridge**: `OneHotEncoder` for categoricals + `StandardScaler` for continuous

### Output Clipping
All predictions are clipped to valid range [0, 1].

## Troubleshooting

### Error: DATABASE_URL not set
**Solution**: Add `DATABASE_URL` to your `.env` file with the PostgreSQL connection string from Supabase.

### Error: Insufficient data
**Solution**: Ensure at least 100 rows exist in `prediction_training_data` table. Run the data collection cron job or manual migration first.

### Error: Model file not found
**Solution**: Train a model first using `python train_model.py`.

### Low R² score (< 0.90)
**Possible causes:**
- Insufficient training data (< 1000 rows)
- Missing important features (e.g., weather, location)
- High noise in data
- Need more feature engineering

**Solutions:**
- Collect more data over time
- Add derived features (aggregated statistics)
- Check for data quality issues
- Try different model architectures

## Next Steps

### Integration with Next.js API

Create a new API route to serve predictions:

```typescript
// app/api/predict/sell-through/route.ts
import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  const { productId } = await request.json();
  
  // Call Python prediction script
  const { stdout } = await execAsync(
    `python ml/predict.py --product-id ${productId}`
  );
  
  // Parse output and return
  const prediction = parseFloat(stdout.match(/Predicted.*: ([\d.]+)/)?.[1] || "0");
  
  return NextResponse.json({ prediction });
}
```

### Alternative: Flask Microservice

For better performance, deploy ML model as a separate Flask microservice:

```python
# ml/app.py
from flask import Flask, request, jsonify
from predict import SellThroughPredictor

app = Flask(__name__)
predictor = SellThroughPredictor()

@app.route('/predict', methods=['POST'])
def predict():
    features = request.json
    prediction = predictor.predict(features)
    return jsonify({'prediction': prediction})

if __name__ == '__main__':
    app.run(port=5000)
```

### Retraining Schedule

Set up weekly retraining to incorporate new data:

1. Add cron job to Vercel (or other scheduler)
2. Call `python ml/train_model.py` weekly
3. Automatically uses latest data from `prediction_training_data`
4. Model performance improves over time as data accumulates

## Support

For issues or questions about the ML pipeline, check:
- `config.py` for feature definitions and hyperparameters
- `model_metadata.json` for current model performance
- `reports/model_comparison.csv` for detailed metrics

---

**Last Updated**: 2026-02-09
