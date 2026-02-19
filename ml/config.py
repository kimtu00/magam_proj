"""
ML Pipeline Configuration
=========================

Feature definitions, hyperparameter grids, database configuration,
and performance thresholds for the sell-through rate prediction model.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ============================================================
# Directory Configuration
# ============================================================

ML_DIR = Path(__file__).parent
MODELS_DIR = ML_DIR / "models"
REPORTS_DIR = ML_DIR / "reports"

# Create directories if they don't exist
MODELS_DIR.mkdir(exist_ok=True)
REPORTS_DIR.mkdir(exist_ok=True)

# ============================================================
# Database Configuration
# ============================================================

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable is required. "
        "Example: postgresql://postgres:[password]@[host]:5432/postgres"
    )

# ============================================================
# Feature Definitions
# ============================================================

# Continuous features (10 usable - excluding weather_temperature and distance_from_station)
CONTINUOUS_FEATURES = [
    "product_register_hour",      # 0-23
    "product_register_minute",    # 0-59
    "original_price",             # INT
    "discount_price",             # INT
    "discount_rate",              # DECIMAL (%)
    "product_quantity",           # INT
    "deadline_hours_remaining",   # DECIMAL (hours)
    "store_avg_rating",           # DECIMAL (0-5)
    "store_total_reviews",        # INT
    "store_total_sales",          # INT
]

# Categorical features (6)
CATEGORICAL_FEATURES = [
    "product_category",           # 빵, 도시락, 음료, 디저트, 과일, 채소, 정육, 수산물, 반찬, 기타
    "register_day_of_week",       # 월, 화, 수, 목, 금, 토, 일
    "store_region",               # 구/시 단위
    "time_slot",                  # 아침, 점심, 오후, 저녁, 심야
]

# Boolean features (2)
BOOLEAN_FEATURES = [
    "is_holiday",                 # BOOLEAN
    "is_weekend",                 # BOOLEAN
]

# Features to drop (mostly NULL)
FEATURES_TO_DROP = [
    "weather_temperature",
    "distance_from_station",
]

# All input features
ALL_FEATURES = CONTINUOUS_FEATURES + CATEGORICAL_FEATURES + BOOLEAN_FEATURES

# Target variable
TARGET = "sell_through_rate"

# Metadata columns (not used for training)
METADATA_COLS = ["id", "product_id", "store_id", "recorded_at"]

# ============================================================
# Derived Features (computed if data >= 1000 rows)
# ============================================================

DERIVED_FEATURES = [
    "store_avg_sell_through",     # Historical average per store
    "category_avg_sell_through",  # Historical average per category
    "dow_avg_sell_through",       # Historical average per day-of-week
    "price_ratio",                # discount_price / original_price
]

# ============================================================
# Performance Thresholds
# ============================================================

PERFORMANCE_THRESHOLDS = {
    "R2": 0.90,          # R² (coefficient of determination) >= 0.90
    "RMSE": 0.10,        # Root Mean Squared Error <= 0.10
    "MAE": 0.08,         # Mean Absolute Error <= 0.08
    "CV_R2": 0.85,       # 5-fold cross-validation average R² >= 0.85
}

# ============================================================
# Data Strategy Based on Size
# ============================================================

DATA_STRATEGY = {
    "MIN_DATA_SIZE": 100,          # Minimum data needed for any training
    "SIMPLE_THRESHOLD": 1000,      # Below this: Ridge + RF only
    "FULL_TRAINING_THRESHOLD": 1000,  # Above this: all 5 models
    "TUNING_THRESHOLD": 5000,      # Above this: full Optuna tuning
}

# ============================================================
# Train/Test Split Configuration
# ============================================================

TRAIN_TEST_CONFIG = {
    "test_size": 0.2,
    "shuffle": False,  # Time-based split (no shuffle)
}

# Cross-validation
CV_FOLDS = 5

# ============================================================
# Model Hyperparameter Grids
# ============================================================

# LightGBM Hyperparameters (for Optuna tuning)
LIGHTGBM_PARAM_GRID = {
    "n_estimators": (100, 1000),
    "max_depth": (3, 12),
    "learning_rate": (0.01, 0.3),
    "num_leaves": (15, 255),
    "min_child_samples": (5, 50),
    "subsample": (0.6, 1.0),
    "colsample_bytree": (0.6, 1.0),
    "reg_alpha": (0.0, 1.0),
    "reg_lambda": (0.0, 1.0),
}

# Default LightGBM parameters (for initial comparison)
LIGHTGBM_DEFAULT_PARAMS = {
    "n_estimators": 300,
    "max_depth": 7,
    "learning_rate": 0.05,
    "num_leaves": 63,
    "min_child_samples": 20,
    "random_state": 42,
    "verbose": -1,
}

# CatBoost Hyperparameters (for Optuna tuning)
CATBOOST_PARAM_GRID = {
    "iterations": (100, 1000),
    "depth": (4, 10),
    "learning_rate": (0.01, 0.3),
    "l2_leaf_reg": (1, 10),
    "bagging_temperature": (0.0, 1.0),
    "random_strength": (0.0, 10.0),
}

# Default CatBoost parameters (for initial comparison)
CATBOOST_DEFAULT_PARAMS = {
    "iterations": 300,
    "depth": 6,
    "learning_rate": 0.05,
    "random_state": 42,
    "verbose": False,
}

# XGBoost Hyperparameters (for Optuna tuning)
XGBOOST_PARAM_GRID = {
    "n_estimators": (100, 1000),
    "max_depth": (3, 12),
    "learning_rate": (0.01, 0.3),
    "subsample": (0.6, 1.0),
    "colsample_bytree": (0.6, 1.0),
    "gamma": (0.0, 5.0),
    "reg_alpha": (0.0, 1.0),
    "reg_lambda": (0.0, 1.0),
}

# Default XGBoost parameters (for initial comparison)
XGBOOST_DEFAULT_PARAMS = {
    "n_estimators": 300,
    "max_depth": 7,
    "learning_rate": 0.05,
    "random_state": 42,
    "verbosity": 0,
}

# Random Forest parameters
RANDOM_FOREST_PARAMS = {
    "n_estimators": 200,
    "max_depth": 15,
    "min_samples_split": 10,
    "min_samples_leaf": 5,
    "random_state": 42,
}

# Ridge regression parameters
RIDGE_PARAMS = {
    "alpha": 1.0,
    "random_state": 42,
}

# ============================================================
# Optuna Configuration
# ============================================================

OPTUNA_CONFIG = {
    "n_trials": 50,
    "timeout": None,  # No timeout
    "n_jobs": -1,     # Use all CPU cores
    "show_progress_bar": True,
}

# ============================================================
# Model Save Paths
# ============================================================

MODEL_PATH = MODELS_DIR / "sell_through_model.pkl"
PREPROCESSOR_PATH = MODELS_DIR / "preprocessor.pkl"
METADATA_PATH = MODELS_DIR / "model_metadata.json"

# ============================================================
# Report Paths
# ============================================================

COMPARISON_CSV_PATH = REPORTS_DIR / "model_comparison.csv"
FEATURE_IMPORTANCE_PATH = REPORTS_DIR / "feature_importance.png"
ACTUAL_VS_PREDICTED_PATH = REPORTS_DIR / "actual_vs_predicted.png"
RESIDUAL_DISTRIBUTION_PATH = REPORTS_DIR / "residual_distribution.png"
LEARNING_CURVE_PATH = REPORTS_DIR / "learning_curve.png"

# ============================================================
# Plotting Configuration
# ============================================================

PLOT_CONFIG = {
    "figsize": (10, 6),
    "dpi": 100,
    "style": "seaborn-v0_8-darkgrid",
}

# ============================================================
# Model Names Mapping
# ============================================================

MODEL_NAMES = {
    "lightgbm": "LightGBM",
    "catboost": "CatBoost",
    "xgboost": "XGBoost",
    "random_forest": "Random Forest",
    "ridge": "Ridge Regression",
}

# ============================================================
# Random Seed for Reproducibility
# ============================================================

RANDOM_STATE = 42

# ============================================================
# Validation
# ============================================================

def validate_config():
    """Validate configuration settings."""
    errors = []
    
    if not DATABASE_URL:
        errors.append("DATABASE_URL is not set")
    
    if not CONTINUOUS_FEATURES:
        errors.append("No continuous features defined")
    
    if not CATEGORICAL_FEATURES:
        errors.append("No categorical features defined")
    
    if not TARGET:
        errors.append("Target variable is not defined")
    
    if errors:
        raise ValueError(f"Configuration errors:\n" + "\n".join(f"  - {e}" for e in errors))
    
    print("✓ Configuration validated successfully")

if __name__ == "__main__":
    validate_config()
    print(f"\nML Configuration:")
    print(f"  - Continuous features: {len(CONTINUOUS_FEATURES)}")
    print(f"  - Categorical features: {len(CATEGORICAL_FEATURES)}")
    print(f"  - Boolean features: {len(BOOLEAN_FEATURES)}")
    print(f"  - Total features: {len(ALL_FEATURES)}")
    print(f"  - Target: {TARGET}")
    print(f"  - Models directory: {MODELS_DIR}")
    print(f"  - Reports directory: {REPORTS_DIR}")
    print(f"  - Performance thresholds: R²>={PERFORMANCE_THRESHOLDS['R2']}, "
          f"RMSE<={PERFORMANCE_THRESHOLDS['RMSE']}, "
          f"MAE<={PERFORMANCE_THRESHOLDS['MAE']}")
