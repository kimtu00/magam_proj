'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Loader2 } from 'lucide-react';

interface AccuracyInfo {
  avg_accuracy: number;
  prediction_logs_count: number;
  completed_predictions_count: number;
}

export function PredictionAccuracyCard() {
  const [info, setInfo] = useState<AccuracyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await fetch('/api/admin/ml/model-info');
        if (response.ok) {
          const data = await response.json();
          setInfo(data);
        }
      } catch (error) {
        console.error('Error fetching accuracy info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInfo();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!info) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            예측 정확도
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const accuracyColor = 
    info.avg_accuracy >= 85 ? 'text-primary' :
    info.avg_accuracy >= 70 ? 'text-muted-foreground' :
    'text-destructive';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          예측 정확도
        </CardTitle>
        <CardDescription>실제 결과와의 비교</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${accuracyColor}`}>
              {info.avg_accuracy.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            평균 예측 정확도
          </p>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">전체 예측</span>
            <span className="font-mono font-semibold">
              {info.prediction_logs_count.toLocaleString()}건
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">완료된 예측</span>
            <span className="font-mono font-semibold">
              {info.completed_predictions_count.toLocaleString()}건
            </span>
          </div>
        </div>

        {info.completed_predictions_count === 0 ? (
          <div className="rounded-lg bg-muted border p-3">
            <p className="text-sm text-muted-foreground">
              아직 완료된 예측이 없습니다. 상품이 마감되면 자동으로 정확도가 계산됩니다.
            </p>
          </div>
        ) : info.avg_accuracy >= 85 ? (
          <div className="rounded-lg bg-secondary border border-primary/20 p-3">
            <p className="text-sm text-primary">
              ✅ 우수한 정확도입니다!
            </p>
          </div>
        ) : info.avg_accuracy >= 70 ? (
          <div className="rounded-lg bg-muted border border-border p-3">
            <p className="text-sm text-muted-foreground">
              ⚠️ 더 많은 데이터가 수집되면 정확도가 향상됩니다.
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-destructive/5 border border-destructive/30 p-3">
            <p className="text-sm text-destructive">
              ❌ 모델 재학습이 필요합니다.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
