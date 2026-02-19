"""
Data Preprocessing Pipeline
============================

Fetch training data from PostgreSQL, handle missing values,
encode categorical features, create derived features, and split data.
"""

import pandas as pd
import numpy as np
import psycopg2
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib
from typing import Tuple, Optional
import warnings

from config import (
    DATABASE_URL,
    CONTINUOUS_FEATURES,
    CATEGORICAL_FEATURES,
    BOOLEAN_FEATURES,
    ALL_FEATURES,
    TARGET,
    METADATA_COLS,
    FEATURES_TO_DROP,
    DERIVED_FEATURES,
    TRAIN_TEST_CONFIG,
    PREPROCESSOR_PATH,
    DATA_STRATEGY,
)

warnings.filterwarnings('ignore')


def fetch_training_data() -> pd.DataFrame:
    """
    Fetch training data from PostgreSQL prediction_training_data table.
    
    Returns:
        DataFrame with all columns from prediction_training_data
    """
    print("Fetching training data from database...")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        
        query = """
        SELECT *
        FROM prediction_training_data
        ORDER BY recorded_at ASC
        """
        
        df = pd.read_sql(query, conn)
        conn.close()
        
        print(f"✓ Fetched {len(df)} rows from database")
        return df
    
    except Exception as e:
        print(f"✗ Error fetching data: {e}")
        raise


def handle_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """
    Handle missing values in the dataset.
    
    Strategy:
    - Drop weather_temperature and distance_from_station (mostly NULL)
    - Continuous: median imputation
    - Categorical: fill with 'unknown'
    - Boolean: fill with False
    
    Args:
        df: Raw DataFrame
        
    Returns:
        DataFrame with missing values handled
    """
    print("\nHandling missing values...")
    
    # Drop optional features that are mostly NULL
    df_clean = df.drop(columns=FEATURES_TO_DROP, errors='ignore')
    
    # Report missing values
    missing_counts = df_clean[ALL_FEATURES + [TARGET]].isnull().sum()
    if missing_counts.sum() > 0:
        print(f"Missing values found:")
        for col, count in missing_counts[missing_counts > 0].items():
            pct = (count / len(df_clean)) * 100
            print(f"  - {col}: {count} ({pct:.1f}%)")
    
    # Handle continuous features: median imputation
    for col in CONTINUOUS_FEATURES:
        if col in df_clean.columns and df_clean[col].isnull().any():
            median_val = df_clean[col].median()
            df_clean[col].fillna(median_val, inplace=True)
            print(f"  ✓ Imputed {col} with median: {median_val:.2f}")
    
    # Handle categorical features: fill with 'unknown'
    for col in CATEGORICAL_FEATURES:
        if col in df_clean.columns and df_clean[col].isnull().any():
            df_clean[col].fillna('unknown', inplace=True)
            print(f"  ✓ Filled {col} with 'unknown'")
    
    # Handle boolean features: fill with False
    for col in BOOLEAN_FEATURES:
        if col in df_clean.columns and df_clean[col].isnull().any():
            df_clean[col].fillna(False, inplace=True)
            print(f"  ✓ Filled {col} with False")
    
    # Drop rows with missing target
    before_len = len(df_clean)
    df_clean = df_clean.dropna(subset=[TARGET])
    after_len = len(df_clean)
    
    if before_len != after_len:
        print(f"  ✓ Dropped {before_len - after_len} rows with missing target")
    
    print(f"✓ Data shape after handling missing values: {df_clean.shape}")
    return df_clean


def create_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create derived features if data size >= 1000 rows.
    
    Derived features:
    - store_avg_sell_through: historical average per store
    - category_avg_sell_through: historical average per category
    - dow_avg_sell_through: historical average per day-of-week
    - price_ratio: discount_price / original_price
    
    Args:
        df: DataFrame with base features
        
    Returns:
        DataFrame with derived features added
    """
    if len(df) < DATA_STRATEGY["SIMPLE_THRESHOLD"]:
        print(f"\nSkipping derived features (data size {len(df)} < {DATA_STRATEGY['SIMPLE_THRESHOLD']})")
        return df
    
    print("\nCreating derived features...")
    df_derived = df.copy()
    
    # Price ratio
    df_derived['price_ratio'] = (
        df_derived['discount_price'] / df_derived['original_price'].replace(0, 1)
    )
    print(f"  ✓ Created price_ratio")
    
    # Store average sell-through (using expanding mean to avoid data leakage)
    if 'store_id' in df_derived.columns:
        df_derived['store_avg_sell_through'] = (
            df_derived.groupby('store_id')[TARGET]
            .transform(lambda x: x.expanding().mean().shift(1))
        )
        # Fill first occurrence with global mean
        global_mean = df_derived[TARGET].mean()
        df_derived['store_avg_sell_through'].fillna(global_mean, inplace=True)
        print(f"  ✓ Created store_avg_sell_through")
    
    # Category average sell-through
    df_derived['category_avg_sell_through'] = (
        df_derived.groupby('product_category')[TARGET]
        .transform(lambda x: x.expanding().mean().shift(1))
    )
    global_mean = df_derived[TARGET].mean()
    df_derived['category_avg_sell_through'].fillna(global_mean, inplace=True)
    print(f"  ✓ Created category_avg_sell_through")
    
    # Day-of-week average sell-through
    df_derived['dow_avg_sell_through'] = (
        df_derived.groupby('register_day_of_week')[TARGET]
        .transform(lambda x: x.expanding().mean().shift(1))
    )
    df_derived['dow_avg_sell_through'].fillna(global_mean, inplace=True)
    print(f"  ✓ Created dow_avg_sell_through")
    
    print(f"✓ Data shape after derived features: {df_derived.shape}")
    return df_derived


def split_data(
    df: pd.DataFrame,
    include_derived_features: bool = False
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Split data into train and test sets (time-based, no shuffle).
    
    Args:
        df: DataFrame with all features and target
        include_derived_features: Whether to include derived features
        
    Returns:
        X_train, X_test, y_train, y_test
    """
    print("\nSplitting data into train/test sets...")
    
    # Determine feature columns
    feature_cols = ALL_FEATURES.copy()
    
    if include_derived_features:
        # Check which derived features exist
        existing_derived = [f for f in DERIVED_FEATURES if f in df.columns]
        feature_cols.extend(existing_derived)
    
    # Ensure all feature columns exist
    feature_cols = [c for c in feature_cols if c in df.columns]
    
    # Sort by recorded_at for time-based split
    df_sorted = df.sort_values('recorded_at').reset_index(drop=True)
    
    X = df_sorted[feature_cols]
    y = df_sorted[TARGET]
    
    # Time-based split (no shuffle)
    test_size = TRAIN_TEST_CONFIG['test_size']
    split_idx = int(len(X) * (1 - test_size))
    
    X_train = X.iloc[:split_idx]
    X_test = X.iloc[split_idx:]
    y_train = y.iloc[:split_idx]
    y_test = y.iloc[split_idx:]
    
    print(f"  - Train set: {len(X_train)} samples ({(1-test_size)*100:.0f}%)")
    print(f"  - Test set: {len(X_test)} samples ({test_size*100:.0f}%)")
    print(f"  - Features: {len(feature_cols)}")
    print(f"  - Train date range: {df_sorted.iloc[0]['recorded_at']} to {df_sorted.iloc[split_idx-1]['recorded_at']}")
    print(f"  - Test date range: {df_sorted.iloc[split_idx]['recorded_at']} to {df_sorted.iloc[-1]['recorded_at']}")
    
    return X_train, X_test, y_train, y_test


def create_preprocessor(
    model_type: str,
    categorical_features: list,
    continuous_features: list
) -> ColumnTransformer:
    """
    Create preprocessing pipeline based on model type.
    
    Args:
        model_type: 'lightgbm', 'catboost', 'xgboost', 'random_forest', or 'ridge'
        categorical_features: List of categorical feature names
        continuous_features: List of continuous feature names
        
    Returns:
        ColumnTransformer with appropriate preprocessing steps
    """
    if model_type in ['lightgbm', 'catboost']:
        # LightGBM and CatBoost: no encoding needed (handle categories natively)
        # Just impute and pass through
        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='unknown'))
        ])
        
        continuous_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median'))
        ])
    
    elif model_type in ['xgboost', 'random_forest']:
        # XGBoost and RF: OrdinalEncoder for categorical
        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='unknown')),
            ('encoder', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1))
        ])
        
        continuous_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median'))
        ])
    
    elif model_type == 'ridge':
        # Ridge: OneHotEncoder + StandardScaler
        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='unknown')),
            ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])
        
        continuous_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
    
    else:
        raise ValueError(f"Unknown model type: {model_type}")
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', categorical_transformer, categorical_features),
            ('num', continuous_transformer, continuous_features)
        ],
        remainder='passthrough'  # Pass through boolean features
    )
    
    return preprocessor


def prepare_data_for_model(
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    model_type: str
) -> Tuple:
    """
    Prepare data for a specific model type.
    
    Args:
        X_train: Training features
        X_test: Test features
        model_type: Model type
        
    Returns:
        X_train_processed, X_test_processed, preprocessor, feature_names
    """
    # Separate feature types
    cat_features = [f for f in CATEGORICAL_FEATURES if f in X_train.columns]
    cont_features = [f for f in CONTINUOUS_FEATURES if f in X_train.columns]
    bool_features = [f for f in BOOLEAN_FEATURES if f in X_train.columns]
    
    # Check for derived features
    derived_in_data = [f for f in DERIVED_FEATURES if f in X_train.columns]
    if derived_in_data:
        cont_features.extend(derived_in_data)
    
    if model_type in ['lightgbm', 'catboost']:
        # Native categorical support - just ensure proper dtypes
        X_train_processed = X_train.copy()
        X_test_processed = X_test.copy()
        
        # Convert categorical columns to 'category' dtype
        for col in cat_features:
            X_train_processed[col] = X_train_processed[col].astype('category')
            X_test_processed[col] = X_test_processed[col].astype('category')
        
        # Get categorical feature indices (for LightGBM)
        cat_indices = [X_train_processed.columns.get_loc(col) for col in cat_features]
        
        return X_train_processed, X_test_processed, None, cat_features, cat_indices
    
    else:
        # XGBoost, RF, Ridge: use preprocessor
        preprocessor = create_preprocessor(model_type, cat_features, cont_features)
        
        X_train_processed = preprocessor.fit_transform(X_train)
        X_test_processed = preprocessor.transform(X_test)
        
        # Get feature names after transformation
        if model_type == 'ridge':
            # OneHotEncoder creates new feature names
            try:
                cat_encoder = preprocessor.named_transformers_['cat']['encoder']
                cat_feature_names = cat_encoder.get_feature_names_out(cat_features)
            except:
                cat_feature_names = cat_features
            
            feature_names = list(cat_feature_names) + cont_features + bool_features
        else:
            feature_names = cat_features + cont_features + bool_features
        
        return X_train_processed, X_test_processed, preprocessor, feature_names, None


def load_and_preprocess_data(
    include_derived: bool = True
) -> dict:
    """
    Main function to load and preprocess data.
    
    Args:
        include_derived: Whether to create derived features
        
    Returns:
        Dictionary with train/test splits and metadata
    """
    print("="*60)
    print("DATA PREPROCESSING PIPELINE")
    print("="*60)
    
    # Step 1: Fetch data
    df = fetch_training_data()
    
    # Check minimum data size
    if len(df) < DATA_STRATEGY["MIN_DATA_SIZE"]:
        raise ValueError(
            f"Insufficient data: {len(df)} rows (minimum: {DATA_STRATEGY['MIN_DATA_SIZE']})"
        )
    
    # Step 2: Handle missing values
    df_clean = handle_missing_values(df)
    
    # Step 3: Create derived features (if data size permits)
    if include_derived and len(df_clean) >= DATA_STRATEGY["SIMPLE_THRESHOLD"]:
        df_clean = create_derived_features(df_clean)
        has_derived = True
    else:
        has_derived = False
    
    # Step 4: Split data
    X_train, X_test, y_train, y_test = split_data(df_clean, include_derived_features=has_derived)
    
    print("\n" + "="*60)
    print("DATA PREPROCESSING COMPLETE")
    print("="*60)
    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    print(f"Features: {X_train.shape[1]}")
    print(f"Target range: [{y_train.min():.4f}, {y_train.max():.4f}]")
    print("="*60 + "\n")
    
    return {
        'X_train': X_train,
        'X_test': X_test,
        'y_train': y_train,
        'y_test': y_test,
        'data_size': len(df_clean),
        'has_derived_features': has_derived,
        'feature_names': list(X_train.columns),
    }


if __name__ == "__main__":
    # Test preprocessing
    data = load_and_preprocess_data()
    print(f"\nPreprocessing test successful!")
    print(f"Feature names: {data['feature_names']}")
