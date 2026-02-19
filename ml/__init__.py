"""
ML Sell-Through Rate Prediction Package
========================================

A complete machine learning pipeline for predicting product sell-through rates.

Modules:
- config: Configuration, feature definitions, hyperparameters
- preprocess: Data fetching and preprocessing
- train_model: Model training and comparison
- evaluate: Model evaluation and reporting
- predict: Prediction interface

Usage:
    # Train a model
    python -m ml.train_model
    
    # Evaluate model
    python -m ml.evaluate
    
    # Make predictions
    python -m ml.predict --product-id <UUID>
    
    # Or import in Python
    from ml.predict import SellThroughPredictor
    predictor = SellThroughPredictor()
    prediction = predictor.predict(features)
"""

__version__ = "1.0.0"
__author__ = "ML Pipeline"
