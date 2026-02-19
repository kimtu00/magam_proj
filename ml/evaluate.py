"""
Model Evaluation and Reporting
===============================

Generate comprehensive evaluation reports including metrics,
visualizations, and comparisons.
"""

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
from sklearn.model_selection import learning_curve
import joblib
import json

from config import (
    MODEL_PATH,
    METADATA_PATH,
    COMPARISON_CSV_PATH,
    FEATURE_IMPORTANCE_PATH,
    ACTUAL_VS_PREDICTED_PATH,
    RESIDUAL_DISTRIBUTION_PATH,
    LEARNING_CURVE_PATH,
    PERFORMANCE_THRESHOLDS,
    MODEL_NAMES,
    PLOT_CONFIG,
)
from preprocess import load_and_preprocess_data

# Set plotting style
sns.set_style('darkgrid')
plt.rcParams['figure.figsize'] = PLOT_CONFIG['figsize']
plt.rcParams['figure.dpi'] = PLOT_CONFIG['dpi']


def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """
    Calculate evaluation metrics.
    
    Args:
        y_true: True values
        y_pred: Predicted values (already clipped)
        
    Returns:
        Dictionary of metrics
    """
    r2 = r2_score(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)
    
    # MAPE (Mean Absolute Percentage Error)
    mape = np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1e-6))) * 100
    
    return {
        'R2': r2,
        'RMSE': rmse,
        'MAE': mae,
        'MAPE': mape,
    }


def plot_feature_importance(model, feature_names: list, model_type: str, top_n: int = 15):
    """
    Plot feature importance for tree-based models.
    
    Args:
        model: Trained model
        feature_names: List of feature names
        model_type: Type of model
        top_n: Number of top features to display
    """
    print("\nGenerating feature importance plot...")
    
    # Get feature importance
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
    elif hasattr(model, 'get_feature_importance'):
        # CatBoost
        importances = model.get_feature_importance()
    else:
        print("  ✗ Model does not support feature importance")
        return
    
    # Create DataFrame
    if len(importances) != len(feature_names):
        # For Ridge with OneHotEncoding, feature names might be different
        print(f"  ⚠ Feature count mismatch: {len(importances)} vs {len(feature_names)}")
        feature_names = [f"feature_{i}" for i in range(len(importances))]
    
    feature_df = pd.DataFrame({
        'feature': feature_names,
        'importance': importances
    })
    
    # Sort and get top N
    feature_df = feature_df.sort_values('importance', ascending=False).head(top_n)
    
    # Plot
    plt.figure(figsize=(10, 8))
    plt.barh(range(len(feature_df)), feature_df['importance'])
    plt.yticks(range(len(feature_df)), feature_df['feature'])
    plt.xlabel('Importance')
    plt.ylabel('Feature')
    plt.title(f'Top {top_n} Feature Importances - {MODEL_NAMES.get(model_type, model_type)}')
    plt.tight_layout()
    plt.savefig(FEATURE_IMPORTANCE_PATH)
    plt.close()
    
    print(f"  ✓ Saved feature importance plot to {FEATURE_IMPORTANCE_PATH}")
    
    # Print top features
    print(f"\nTop 10 Most Important Features:")
    for i, row in feature_df.head(10).iterrows():
        print(f"  {row['feature']:30s} - {row['importance']:.4f}")


def plot_actual_vs_predicted(y_true: np.ndarray, y_pred: np.ndarray, model_name: str):
    """
    Plot actual vs predicted values scatter plot.
    
    Args:
        y_true: True values
        y_pred: Predicted values
        model_name: Name of the model
    """
    print("\nGenerating actual vs predicted plot...")
    
    # Calculate R²
    r2 = r2_score(y_true, y_pred)
    
    # Plot
    plt.figure(figsize=(10, 10))
    plt.scatter(y_true, y_pred, alpha=0.5, s=20, edgecolors='k', linewidths=0.5)
    
    # Diagonal line (perfect prediction)
    min_val = min(y_true.min(), y_pred.min())
    max_val = max(y_true.max(), y_pred.max())
    plt.plot([min_val, max_val], [min_val, max_val], 'r--', lw=2, label='Perfect Prediction')
    
    plt.xlabel('Actual Sell-Through Rate', fontsize=12)
    plt.ylabel('Predicted Sell-Through Rate', fontsize=12)
    plt.title(f'Actual vs Predicted - {model_name}\nR² = {r2:.4f}', fontsize=14)
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(ACTUAL_VS_PREDICTED_PATH)
    plt.close()
    
    print(f"  ✓ Saved actual vs predicted plot to {ACTUAL_VS_PREDICTED_PATH}")


def plot_residual_distribution(y_true: np.ndarray, y_pred: np.ndarray, model_name: str):
    """
    Plot residual distribution histogram.
    
    Args:
        y_true: True values
        y_pred: Predicted values
        model_name: Name of the model
    """
    print("\nGenerating residual distribution plot...")
    
    residuals = y_true - y_pred
    
    # Plot
    plt.figure(figsize=(10, 6))
    plt.hist(residuals, bins=50, edgecolor='black', alpha=0.7)
    plt.axvline(x=0, color='r', linestyle='--', linewidth=2, label='Zero Residual')
    plt.xlabel('Residual (Actual - Predicted)', fontsize=12)
    plt.ylabel('Frequency', fontsize=12)
    plt.title(f'Residual Distribution - {model_name}\nMean = {residuals.mean():.4f}, Std = {residuals.std():.4f}', fontsize=14)
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(RESIDUAL_DISTRIBUTION_PATH)
    plt.close()
    
    print(f"  ✓ Saved residual distribution plot to {RESIDUAL_DISTRIBUTION_PATH}")


def plot_learning_curve_analysis(model, X_train, y_train, model_name: str):
    """
    Plot learning curve to show model performance vs training size.
    
    Args:
        model: Trained model
        X_train: Training features
        y_train: Training target
        model_name: Name of the model
    """
    print("\nGenerating learning curve plot...")
    
    try:
        # Calculate learning curve
        train_sizes, train_scores, val_scores = learning_curve(
            model, X_train, y_train,
            train_sizes=np.linspace(0.1, 1.0, 10),
            cv=5,
            scoring='r2',
            n_jobs=-1,
            random_state=42
        )
        
        # Calculate mean and std
        train_mean = train_scores.mean(axis=1)
        train_std = train_scores.std(axis=1)
        val_mean = val_scores.mean(axis=1)
        val_std = val_scores.std(axis=1)
        
        # Plot
        plt.figure(figsize=(10, 6))
        plt.plot(train_sizes, train_mean, 'o-', label='Training Score', linewidth=2)
        plt.fill_between(train_sizes, train_mean - train_std, train_mean + train_std, alpha=0.2)
        plt.plot(train_sizes, val_mean, 'o-', label='Cross-Validation Score', linewidth=2)
        plt.fill_between(train_sizes, val_mean - val_std, val_mean + val_std, alpha=0.2)
        
        plt.xlabel('Training Size', fontsize=12)
        plt.ylabel('R² Score', fontsize=12)
        plt.title(f'Learning Curve - {model_name}', fontsize=14)
        plt.legend(loc='best')
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(LEARNING_CURVE_PATH)
        plt.close()
        
        print(f"  ✓ Saved learning curve plot to {LEARNING_CURVE_PATH}")
    
    except Exception as e:
        print(f"  ✗ Error generating learning curve: {e}")


def generate_comparison_report(results: dict, output_path: str = None):
    """
    Generate model comparison CSV report.
    
    Args:
        results: Dictionary of model results from train_model.py
        output_path: Path to save CSV (optional)
    """
    print("\nGenerating model comparison report...")
    
    if output_path is None:
        output_path = COMPARISON_CSV_PATH
    
    # Create DataFrame
    comparison_data = []
    for model_name, result in results.items():
        metrics = result['metrics']
        row = {
            'Model': MODEL_NAMES[model_name],
            'R²': metrics['R2'],
            'RMSE': metrics['RMSE'],
            'MAE': metrics['MAE'],
            'MAPE': metrics['MAPE'],
            'CV_R²': metrics['CV_R2'],
            'R²_Pass': metrics['R2'] >= PERFORMANCE_THRESHOLDS['R2'],
            'RMSE_Pass': metrics['RMSE'] <= PERFORMANCE_THRESHOLDS['RMSE'],
            'MAE_Pass': metrics['MAE'] <= PERFORMANCE_THRESHOLDS['MAE'],
            'CV_R²_Pass': metrics['CV_R2'] >= PERFORMANCE_THRESHOLDS['CV_R2'],
        }
        comparison_data.append(row)
    
    df = pd.DataFrame(comparison_data)
    df = df.sort_values('R²', ascending=False)
    
    # Save to CSV
    df.to_csv(output_path, index=False)
    print(f"  ✓ Saved comparison report to {output_path}")
    
    return df


def print_evaluation_summary(metrics: dict, model_name: str):
    """
    Print evaluation summary with pass/fail indicators.
    
    Args:
        metrics: Dictionary of metrics
        model_name: Name of the model
    """
    print("\n" + "="*60)
    print(f"EVALUATION SUMMARY - {model_name}")
    print("="*60)
    
    print("\nPerformance Metrics:")
    print(f"  R²    = {metrics['R2']:.4f}  (threshold: >= {PERFORMANCE_THRESHOLDS['R2']})  " +
          ("✓ PASS" if metrics['R2'] >= PERFORMANCE_THRESHOLDS['R2'] else "✗ FAIL"))
    print(f"  RMSE  = {metrics['RMSE']:.4f}  (threshold: <= {PERFORMANCE_THRESHOLDS['RMSE']})  " +
          ("✓ PASS" if metrics['RMSE'] <= PERFORMANCE_THRESHOLDS['RMSE'] else "✗ FAIL"))
    print(f"  MAE   = {metrics['MAE']:.4f}  (threshold: <= {PERFORMANCE_THRESHOLDS['MAE']})  " +
          ("✓ PASS" if metrics['MAE'] <= PERFORMANCE_THRESHOLDS['MAE'] else "✗ FAIL"))
    print(f"  MAPE  = {metrics['MAPE']:.2f}%")
    print(f"  CV_R² = {metrics['CV_R2']:.4f}  (threshold: >= {PERFORMANCE_THRESHOLDS['CV_R2']})  " +
          ("✓ PASS" if metrics['CV_R2'] >= PERFORMANCE_THRESHOLDS['CV_R2'] else "✗ FAIL"))
    
    # Overall pass/fail
    all_pass = (
        metrics['R2'] >= PERFORMANCE_THRESHOLDS['R2'] and
        metrics['RMSE'] <= PERFORMANCE_THRESHOLDS['RMSE'] and
        metrics['MAE'] <= PERFORMANCE_THRESHOLDS['MAE'] and
        metrics['CV_R2'] >= PERFORMANCE_THRESHOLDS['CV_R2']
    )
    
    print("\nOverall Status: " + ("✓ ALL THRESHOLDS PASSED" if all_pass else "✗ SOME THRESHOLDS FAILED"))
    print("="*60)


def evaluate_model(X_test, y_test, model_path: str = None, metadata_path: str = None):
    """
    Load and evaluate a saved model.
    
    Args:
        X_test: Test features
        y_test: Test target
        model_path: Path to saved model (optional)
        metadata_path: Path to metadata JSON (optional)
    """
    if model_path is None:
        model_path = MODEL_PATH
    if metadata_path is None:
        metadata_path = METADATA_PATH
    
    print("\n" + "="*60)
    print("MODEL EVALUATION")
    print("="*60)
    
    # Load model
    print(f"\nLoading model from {model_path}...")
    model = joblib.load(model_path)
    
    # Load metadata
    print(f"Loading metadata from {metadata_path}...")
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    model_name = metadata['model_name']
    model_type = metadata['model_type']
    
    print(f"  Model: {model_name}")
    print(f"  Training Date: {metadata['training_date']}")
    print(f"  Training Data Size: {metadata['data_size']}")
    
    # Make predictions
    print("\nMaking predictions on test set...")
    y_pred = model.predict(X_test)
    y_pred_clipped = np.clip(y_pred, 0, 1)
    
    # Calculate metrics
    metrics = calculate_metrics(y_test, y_pred_clipped)
    
    # Print summary
    print_evaluation_summary(metrics, model_name)
    
    # Generate plots
    print("\n" + "="*60)
    print("GENERATING EVALUATION PLOTS")
    print("="*60)
    
    plot_actual_vs_predicted(y_test, y_pred_clipped, model_name)
    plot_residual_distribution(y_test, y_pred_clipped, model_name)
    
    # Feature importance (if supported)
    if model_type in ['lightgbm', 'catboost', 'xgboost', 'random_forest']:
        plot_feature_importance(model, metadata['features'], model_type)
    
    print("\n" + "="*60)
    print("EVALUATION COMPLETE")
    print("="*60)
    
    return metrics


def main():
    """Main evaluation pipeline."""
    print("\n" + "="*60)
    print("SELL-THROUGH RATE MODEL EVALUATION")
    print("="*60)
    
    # Load data
    data = load_and_preprocess_data(include_derived=True)
    X_test = data['X_test']
    y_test = data['y_test']
    
    # Evaluate model
    metrics = evaluate_model(X_test, y_test)
    
    return metrics


if __name__ == "__main__":
    metrics = main()
