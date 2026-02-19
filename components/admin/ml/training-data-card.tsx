'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface TrainingDataInfo {
  training_data_count: number;
  model_ready: boolean;
}

export function TrainingDataCard() {
  const [info, setInfo] = useState<TrainingDataInfo | null>(null);
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
        console.error('Error fetching training data info:', error);
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
            <Database className="h-5 w-5" />
            학습 데이터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const progress = Math.min((info.training_data_count / 1000) * 100, 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          학습 데이터
        </CardTitle>
        <CardDescription>수집된 훈련 데이터</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{info.training_data_count.toLocaleString()}</span>
            <span className="text-muted-foreground">건</span>
          </div>
          <p className="text-xs text-muted-foreground">
            목표: 1,000건 이상 (효과적인 학습을 위해)
          </p>
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>수집 진행률</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
        </div>

        {info.model_ready ? (
          <div className="rounded-lg bg-secondary border border-primary/20 p-3">
            <p className="text-sm text-primary">
              ✅ 충분한 데이터가 확보되었습니다. 모델 학습이 가능합니다.
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-muted border border-border p-3">
            <p className="text-sm text-muted-foreground">
              ⏳ 데이터 수집 중입니다. 상품을 계속 등록하시면 데이터가 자동으로 수집됩니다.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
