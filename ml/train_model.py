"""
Model Training Pipeline
========================

Train and compare 5 regression models, perform hyperparameter tuning,
and save the best model for prediction.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.model_selection import cross_val_score, KFold
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import lightgbm as lgb
import catboost as cb
import xgboost as xgb
import optuna
from optuna.samplers import TPESampler
import joblib
import json
from datetime import datetime
import warnings

from config import (
    LIGHTGBM_DEFAULT_PARAMS,
    LIGHTGBM_PARAM_GRID,
    CATBOOST_DEFAULT_PARAMS,
    CATBOOST_PARAM_GRID,
    XGBOOST_DEFAULT_PARAMS,
    XGBOOST_PARAM_GRID,
    RANDOM_FOREST_PARAMS,
    RIDGE_PARAMS,
    DATA_STRATEGY,
    CV_FOLDS,
    OPTUNA_CONFIG,
    MODEL_PATH,
    METADATA_PATH,
    PERFORMANCE_THRESHOLDS,
    MODEL_NAMES,
    RANDOM_STATE,
)
from preprocess import load_and_preprocess_data, prepare_data_for_model

warnings.filterwarnings('ignore')
optuna.logging.set_verbosity(optuna.logging.WARNING)


def clip_predictions(y_pred: np.ndarray) -> np.ndarray:
    """
    Clip predictions to valid sell-through rate range [0, 1].
    
    Args:
        y_pred: Raw predictions
        
    Returns:
        Clipped predictions
    """
    return np.clip(y_pred, 0, 1)


def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """
    Calculate evaluation metrics.
    
    Args:
        y_true: True values
        y_pred: Predicted values
        
    Returns:
        Dictionary of metrics
    """
    # Clip predictions
    y_pred_clipped = clip_predictions(y_pred)
    
    r2 = r2_score(y_true, y_pred_clipped)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred_clipped))
    mae = mean_absolute_error(y_true, y_pred_clipped)
    
    # MAPE (Mean Absolute Percentage Error)
    # Avoid division by zero
    mape = np.mean(np.abs((y_true - y_pred_clipped) / np.maximum(y_true, 1e-6))) * 100
    
    return {
        'R2': r2,
        'RMSE': rmse,
        'MAE': mae,
        'MAPE': mape,
    }


def train_lightgbm(X_train, y_train, X_test, y_test, cat_features=None):
    """Train LightGBM model."""
    print("\n[1/5] Training LightGBM...")
    
    params = LIGHTGBM_DEFAULT_PARAMS.copy()
    
    if cat_features:
        # Categorical features provided as indices
        model = lgb.LGBMRegressor(**params)
        model.fit(
            X_train, y_train,
            categorical_feature=cat_features,
            eval_set=[(X_test, y_test)],
            callbacks=[lgb.early_stopping(stopping_rounds=50, verbose=False)]
        )
    else:
        model = lgb.LGBMRegressor(**params)
        model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    metrics = calculate_metrics(y_test, y_pred)
    
    print(f"  R² = {metrics['R2']:.4f}, RMSE = {metrics['RMSE']:.4f}, MAE = {metrics['MAE']:.4f}")
    
    return model, metrics


def train_catboost(X_train, y_train, X_test, y_test, cat_features=None):
    """Train CatBoost model."""
    print("\n[2/5] Training CatBoost...")
    
    params = CATBOOST_DEFAULT_PARAMS.copy()
    
    if cat_features:
        # Categorical features provided as column names
        model = cb.CatBoostRegressor(**params)
        model.fit(
            X_train, y_train,
            cat_features=cat_features,
            eval_set=(X_test, y_test),
            early_stopping_rounds=50,
            verbose=False
        )
    else:
        model = cb.CatBoostRegressor(**params)
        model.fit(X_train, y_train, verbose=False)
    
    y_pred = model.predict(X_test)
    metrics = calculate_metrics(y_test, y_pred)
    
    print(f"  R² = {metrics['R2']:.4f}, RMSE = {metrics['RMSE']:.4f}, MAE = {metrics['MAE']:.4f}")
    
    return model, metrics


def train_xgboost(X_train, y_train, X_test, y_test):
    """Train XGBoost model."""
    print("\n[3/5] Training XGBoost...")
    
    params = XGBOOST_DEFAULT_PARAMS.copy()
    model = xgb.XGBRegressor(**params)
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        early_stopping_rounds=50,
        verbose=False
    )
    
    y_pred = model.predict(X_test)
    metrics = calculate_metrics(y_test, y_pred)
    
    print(f"  R² = {metrics['R2']:.4f}, RMSE = {metrics['RMSE']:.4f}, MAE = {metrics['MAE']:.4f}")
    
    return model, metrics


def train_random_forest(X_train, y_train, X_test, y_test):
    """Train Random Forest model."""
    print("\n[4/5] Training Random Forest...")
    
    model = RandomForestRegressor(**RANDOM_FOREST_PARAMS)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    metrics = calculate_metrics(y_test, y_pred)
    
    print(f"  R² = {metrics['R2']:.4f}, RMSE = {metrics['RMSE']:.4f}, MAE = {metrics['MAE']:.4f}")
    
    return model, metrics


def train_ridge(X_train, y_train, X_test, y_test):
    """Train Ridge Regression model."""
    print("\n[5/5] Training Ridge Regression...")
    
    model = Ridge(**RIDGE_PARAMS)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    metrics = calculate_metrics(y_test, y_pred)
    
    print(f"  R² = {metrics['R2']:.4f}, RMSE = {metrics['RMSE']:.4f}, MAE = {metrics['MAE']:.4f}")
    
    return model, metrics


def perform_cross_validation(model, X, y, cv_folds=5):
    """
    Perform k-fold cross-validation.
    
    Args:
        model: Trained model
        X: Features
        y: Target
        cv_folds: Number of folds
        
    Returns:
        Average R² score across folds
    """
    kf = KFold(n_splits=cv_folds, shuffle=False, random_state=RANDOM_STATE)
    cv_scores = cross_val_score(model, X, y, cv=kf, scoring='r2', n_jobs=-1)
    return cv_scores.mean()


def tune_lightgbm(X_train, y_train, X_test, y_test, cat_features=None):
    """Hyperparameter tuning for LightGBM using Optuna."""
    print("\n🔧 Tuning LightGBM hyperparameters with Optuna...")
    
    def objective(trial):
        params = {
            'n_estimators': trial.suggest_int('n_estimators', *LIGHTGBM_PARAM_GRID['n_estimators']),
            'max_depth': trial.suggest_int('max_depth', *LIGHTGBM_PARAM_GRID['max_depth']),
            'learning_rate': trial.suggest_float('learning_rate', *LIGHTGBM_PARAM_GRID['learning_rate'], log=True),
            'num_leaves': trial.suggest_int('num_leaves', *LIGHTGBM_PARAM_GRID['num_leaves']),
            'min_child_samples': trial.suggest_int('min_child_samples', *LIGHTGBM_PARAM_GRID['min_child_samples']),
            'subsample': trial.suggest_float('subsample', *LIGHTGBM_PARAM_GRID['subsample']),
            'colsample_bytree': trial.suggest_float('colsample_bytree', *LIGHTGBM_PARAM_GRID['colsample_bytree']),
            'reg_alpha': trial.suggest_float('reg_alpha', *LIGHTGBM_PARAM_GRID['reg_alpha']),
            'reg_lambda': trial.suggest_float('reg_lambda', *LIGHTGBM_PARAM_GRID['reg_lambda']),
            'random_state': RANDOM_STATE,
            'verbose': -1,
        }
        
        model = lgb.LGBMRegressor(**params)
        
        if cat_features:
            model.fit(X_train, y_train, categorical_feature=cat_features)
        else:
            model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        y_pred_clipped = clip_predictions(y_pred)
        r2 = r2_score(y_test, y_pred_clipped)
        
        return r2
    
    study = optuna.create_study(
        direction='maximize',
        sampler=TPESampler(seed=RANDOM_STATE)
    )
    study.optimize(
        objective,
        n_trials=OPTUNA_CONFIG['n_trials'],
        n_jobs=OPTUNA_CONFIG['n_jobs'],
        show_progress_bar=OPTUNA_CONFIG['show_progress_bar']
    )
    
    print(f"  Best R²: {study.best_value:.4f}")
    print(f"  Best params: {study.best_params}")
    
    # Train final model with best params
    best_params = study.best_params
    best_params['random_state'] = RANDOM_STATE
    best_params['verbose'] = -1
    
    model = lgb.LGBMRegressor(**best_params)
    if cat_features:
        model.fit(X_train, y_train, categorical_feature=cat_features)
    else:
        model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    metrics = calculate_metrics(y_test, y_pred)
    
    return model, metrics


def tune_catboost(X_train, y_train, X_test, y_test, cat_features=None):
    """Hyperparameter tuning for CatBoost using Optuna."""
    print("\n🔧 Tuning CatBoost hyperparameters with Optuna...")
    
    def objective(trial):
        params = {
            'iterations': trial.suggest_int('iterations', *CATBOOST_PARAM_GRID['iterations']),
            'depth': trial.suggest_int('depth', *CATBOOST_PARAM_GRID['depth']),
            'learning_rate': trial.suggest_float('learning_rate', *CATBOOST_PARAM_GRID['learning_rate'], log=True),
            'l2_leaf_reg': trial.suggest_float('l2_leaf_reg', *CATBOOST_PARAM_GRID['l2_leaf_reg']),
            'bagging_temperature': trial.suggest_float('bagging_temperature', *CATBOOST_PARAM_GRID['bagging_temperature']),
            'random_strength': trial.suggest_float('random_strength', *CATBOOST_PARAM_GRID['random_strength']),
            'random_state': RANDOM_STATE,
            'verbose': False,
        }
        
        model = cb.CatBoostRegressor(**params)
        
        if cat_features:
            model.fit(X_train, y_train, cat_features=cat_features, verbose=False)
        else:
            model.fit(X_train, y_train, verbose=False)
        
        y_pred = model.predict(X_test)
        y_pred_clipped = clip_predictions(y_pred)
        r2 = r2_score(y_test, y_pred_clipped)
        
        return r2
    
    study = optuna.create_study(
        direction='maximize',
        sampler=TPESampler(seed=RANDOM_STATE)
    )
    study.optimize(
        objective,
        n_trials=OPTUNA_CONFIG['n_trials'],
        n_jobs=OPTUNA_CONFIG['n_jobs'],
        show_progress_bar=OPTUNA_CONFIG['show_progress_bar']
    )
    
    print(f"  Best R²: {study.best_value:.4f}")
    print(f"  Best params: {study.best_params}")
    
    # Train final model with best params
    best_params = study.best_params
    best_params['random_state'] = RANDOM_STATE
    best_params['verbose'] = False
    
    model = cb.CatBoostRegressor(**best_params)
    if cat_features:
        model.fit(X_train, y_train, cat_features=cat_features, verbose=False)
    else:
        model.fit(X_train, y_train, verbose=False)
    
    y_pred = model.predict(X_test)
    metrics = calculate_metrics(y_test, y_pred)
    
    return model, metrics


def train_all_models(data: dict) -> dict:
    """
    Train all models based on data size strategy.
    
    Args:
        data: Dictionary from load_and_preprocess_data()
        
    Returns:
        Dictionary of trained models and their metrics
    """
    X_train_raw = data['X_train']
    X_test_raw = data['X_test']
    y_train = data['y_train']
    y_test = data['y_test']
    data_size = data['data_size']
    
    print("\n" + "="*60)
    print("MODEL TRAINING")
    print("="*60)
    print(f"Data size: {data_size} rows")
    
    results = {}
    
    # Determine which models to train based on data size
    if data_size < DATA_STRATEGY["SIMPLE_THRESHOLD"]:
        print(f"\nData size < {DATA_STRATEGY['SIMPLE_THRESHOLD']}: Training Ridge + Random Forest only")
        model_types = ['ridge', 'random_forest']
    else:
        print(f"\nData size >= {DATA_STRATEGY['SIMPLE_THRESHOLD']}: Training all 5 models")
        model_types = ['lightgbm', 'catboost', 'xgboost', 'random_forest', 'ridge']
    
    # Train each model
    for model_type in model_types:
        # Prepare data for specific model type
        if model_type in ['lightgbm', 'catboost']:
            X_train, X_test, _, cat_features, cat_indices = prepare_data_for_model(
                X_train_raw, X_test_raw, model_type
            )
            
            if model_type == 'lightgbm':
                model, metrics = train_lightgbm(X_train, y_train, X_test, y_test, cat_indices)
            else:
                model, metrics = train_catboost(X_train, y_train, X_test, y_test, cat_features)
        
        elif model_type == 'xgboost':
            X_train, X_test, preprocessor, _, _ = prepare_data_for_model(
                X_train_raw, X_test_raw, model_type
            )
            model, metrics = train_xgboost(X_train, y_train, X_test, y_test)
        
        elif model_type == 'random_forest':
            X_train, X_test, preprocessor, _, _ = prepare_data_for_model(
                X_train_raw, X_test_raw, model_type
            )
            model, metrics = train_random_forest(X_train, y_train, X_test, y_test)
        
        elif model_type == 'ridge':
            X_train, X_test, preprocessor, _, _ = prepare_data_for_model(
                X_train_raw, X_test_raw, model_type
            )
            model, metrics = train_ridge(X_train, y_train, X_test, y_test)
        
        # Perform cross-validation
        print(f"  Running {CV_FOLDS}-fold cross-validation...")
        cv_r2 = perform_cross_validation(model, X_train, y_train, CV_FOLDS)
        metrics['CV_R2'] = cv_r2
        print(f"  CV R² = {cv_r2:.4f}")
        
        results[model_type] = {
            'model': model,
            'metrics': metrics,
            'preprocessor': preprocessor if model_type not in ['lightgbm', 'catboost'] else None,
        }
    
    return results


def select_best_model(results: dict) -> tuple:
    """
    Select the best model based on test R².
    
    Args:
        results: Dictionary of model results
        
    Returns:
        Tuple of (best_model_name, best_model, best_metrics)
    """
    print("\n" + "="*60)
    print("MODEL COMPARISON")
    print("="*60)
    
    # Sort models by R²
    sorted_models = sorted(
        results.items(),
        key=lambda x: x[1]['metrics']['R2'],
        reverse=True
    )
    
    print("\nRanking by R²:")
    for i, (model_name, result) in enumerate(sorted_models, 1):
        metrics = result['metrics']
        status = "✓" if metrics['R2'] >= PERFORMANCE_THRESHOLDS['R2'] else "✗"
        print(f"{i}. {MODEL_NAMES[model_name]:20s} - R²: {metrics['R2']:.4f} {status}")
    
    best_model_name, best_result = sorted_models[0]
    print(f"\n🏆 Best model: {MODEL_NAMES[best_model_name]}")
    
    return best_model_name, best_result['model'], best_result['metrics'], best_result.get('preprocessor')


def tune_top_models(results: dict, data: dict) -> dict:
    """
    Perform hyperparameter tuning on top-2 models if data size permits.
    
    Args:
        results: Initial training results
        data: Preprocessed data
        
    Returns:
        Updated results with tuned models
    """
    data_size = data['data_size']
    
    if data_size < DATA_STRATEGY["TUNING_THRESHOLD"]:
        print(f"\nSkipping hyperparameter tuning (data size {data_size} < {DATA_STRATEGY['TUNING_THRESHOLD']})")
        return results
    
    print("\n" + "="*60)
    print("HYPERPARAMETER TUNING")
    print("="*60)
    print(f"Data size >= {DATA_STRATEGY['TUNING_THRESHOLD']}: Tuning top-2 models")
    
    X_train_raw = data['X_train']
    X_test_raw = data['X_test']
    y_train = data['y_train']
    y_test = data['y_test']
    
    # Get top-2 models
    sorted_models = sorted(
        results.items(),
        key=lambda x: x[1]['metrics']['R2'],
        reverse=True
    )[:2]
    
    for model_name, _ in sorted_models:
        if model_name == 'lightgbm':
            X_train, X_test, _, cat_features, cat_indices = prepare_data_for_model(
                X_train_raw, X_test_raw, model_name
            )
            model, metrics = tune_lightgbm(X_train, y_train, X_test, y_test, cat_indices)
            
            # Update results
            cv_r2 = perform_cross_validation(model, X_train, y_train, CV_FOLDS)
            metrics['CV_R2'] = cv_r2
            results[model_name] = {
                'model': model,
                'metrics': metrics,
                'preprocessor': None,
            }
        
        elif model_name == 'catboost':
            X_train, X_test, _, cat_features, cat_indices = prepare_data_for_model(
                X_train_raw, X_test_raw, model_name
            )
            model, metrics = tune_catboost(X_train, y_train, X_test, y_test, cat_features)
            
            # Update results
            cv_r2 = perform_cross_validation(model, X_train, y_train, CV_FOLDS)
            metrics['CV_R2'] = cv_r2
            results[model_name] = {
                'model': model,
                'metrics': metrics,
                'preprocessor': None,
            }
    
    return results


def save_model_and_metadata(
    model_name: str,
    model,
    metrics: dict,
    preprocessor,
    feature_names: list,
    data_size: int
):
    """
    Save the best model and metadata.
    
    Args:
        model_name: Name of the model
        model: Trained model
        metrics: Performance metrics
        preprocessor: Preprocessing pipeline (if any)
        feature_names: List of feature names
        data_size: Training data size
    """
    print("\n" + "="*60)
    print("SAVING MODEL")
    print("="*60)
    
    # Save model
    joblib.dump(model, MODEL_PATH)
    print(f"✓ Saved model to {MODEL_PATH}")
    
    # Save preprocessor if exists
    if preprocessor:
        from config import PREPROCESSOR_PATH
        joblib.dump(preprocessor, PREPROCESSOR_PATH)
        print(f"✓ Saved preprocessor to {PREPROCESSOR_PATH}")
    
    # Save metadata
    metadata = {
        'model_name': MODEL_NAMES[model_name],
        'model_type': model_name,
        'training_date': datetime.now().isoformat(),
        'data_size': data_size,
        'features': feature_names,
        'metrics': {
            'R2': float(metrics['R2']),
            'RMSE': float(metrics['RMSE']),
            'MAE': float(metrics['MAE']),
            'MAPE': float(metrics['MAPE']),
            'CV_R2': float(metrics['CV_R2']),
        },
        'performance_check': {
            'R2_threshold': PERFORMANCE_THRESHOLDS['R2'],
            'R2_pass': metrics['R2'] >= PERFORMANCE_THRESHOLDS['R2'],
            'RMSE_threshold': PERFORMANCE_THRESHOLDS['RMSE'],
            'RMSE_pass': metrics['RMSE'] <= PERFORMANCE_THRESHOLDS['RMSE'],
            'MAE_threshold': PERFORMANCE_THRESHOLDS['MAE'],
            'MAE_pass': metrics['MAE'] <= PERFORMANCE_THRESHOLDS['MAE'],
            'CV_R2_threshold': PERFORMANCE_THRESHOLDS['CV_R2'],
            'CV_R2_pass': metrics['CV_R2'] >= PERFORMANCE_THRESHOLDS['CV_R2'],
        }
    }
    
    with open(METADATA_PATH, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✓ Saved metadata to {METADATA_PATH}")
    
    # Print performance check
    print("\nPerformance Check:")
    for key, value in metadata['performance_check'].items():
        if '_pass' in key:
            status = "✓ PASS" if value else "✗ FAIL"
            metric_name = key.replace('_pass', '').upper()
            print(f"  {metric_name}: {status}")


def main():
    """Main training pipeline."""
    print("\n" + "="*60)
    print("SELL-THROUGH RATE PREDICTION MODEL TRAINING")
    print("="*60)
    
    # Step 1: Load and preprocess data
    data = load_and_preprocess_data(include_derived=True)
    
    # Step 2: Train all models
    results = train_all_models(data)
    
    # Step 3: Tune top models (if data permits)
    results = tune_top_models(results, data)
    
    # Step 4: Select best model
    best_model_name, best_model, best_metrics, best_preprocessor = select_best_model(results)
    
    # Step 5: Save model and metadata
    save_model_and_metadata(
        best_model_name,
        best_model,
        best_metrics,
        best_preprocessor,
        data['feature_names'],
        data['data_size']
    )
    
    print("\n" + "="*60)
    print("TRAINING COMPLETE")
    print("="*60)
    print(f"Best Model: {MODEL_NAMES[best_model_name]}")
    print(f"R² = {best_metrics['R2']:.4f}")
    print(f"RMSE = {best_metrics['RMSE']:.4f}")
    print(f"MAE = {best_metrics['MAE']:.4f}")
    print(f"CV R² = {best_metrics['CV_R2']:.4f}")
    print("="*60 + "\n")
    
    return results, best_model_name


if __name__ == "__main__":
    results, best_model_name = main()
