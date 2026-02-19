import { useState, useEffect, useRef } from 'react';
import type { PredictionResult } from '@/components/seller/prediction-card';

interface PredictionInput {
  product_category: string;
  original_price: number;
  discount_price: number;
  product_quantity: number;
  deadline_hours: number;
}

interface PredictionState {
  prediction: PredictionResult | null;
  isLoading: boolean;
  error: string | null;
  dataCount: number;
}

/**
 * Hook for real-time sell-through rate prediction
 * 
 * Debounces input changes and calls prediction API
 * 
 * @param input - Product details
 * @returns Prediction state
 */
export function useSellThroughPrediction(
  input: Partial<PredictionInput>
): PredictionState {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataCount, setDataCount] = useState<number>(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Fetch ML service status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/store/predict-sell-through');
        if (response.ok) {
          const data = await response.json();
          setDataCount(data.training_data_count || 0);
        }
      } catch (err) {
        console.error('Failed to fetch ML service status:', err);
        setDataCount(0);
      }
    };

    fetchStatus();
  }, []);

  // Fetch prediction when input changes (with debounce)
  useEffect(() => {
    // Skip if data is insufficient - do nothing
    if (dataCount < 1000) {
      return;
    }
    const {
      product_category,
      original_price,
      discount_price,
      product_quantity,
      deadline_hours,
    } = input;

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Check if all required fields are present and valid
    const isValidInput = 
      product_category &&
      typeof original_price === 'number' &&
      original_price > 0 &&
      typeof discount_price === 'number' &&
      discount_price > 0 &&
      discount_price < original_price &&
      typeof product_quantity === 'number' &&
      product_quantity > 0 &&
      typeof deadline_hours === 'number' &&
      deadline_hours > 0;

    if (!isValidInput) {
      // Don't make API call if inputs are invalid
      // Don't call setState to prevent infinite loops
      return;
    }

    // Debounce: wait 500ms before making API call
    debounceTimerRef.current = setTimeout(() => {
      const fetchPrediction = async () => {
        setIsLoading(true);
        setError(null);

        try {
          const response = await fetch('/api/store/predict-sell-through', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_category,
              original_price,
              discount_price,
              product_quantity,
              deadline_hours,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Prediction failed');
          }

          const data = await response.json();
          setPrediction(data);
        } catch (err) {
          console.error('Prediction error:', err);
          setError(err instanceof Error ? err.message : 'Failed to get prediction');
          setPrediction(null);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPrediction();
    }, 500);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    input.product_category,
    input.original_price,
    input.discount_price,
    input.product_quantity,
    input.deadline_hours,
    dataCount  // Keep this to re-run when data becomes available
  ]);

  return {
    prediction,
    isLoading,
    error,
    dataCount,
  };
}
