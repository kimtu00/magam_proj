'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, Loader2 } from 'lucide-react';

interface ModelInfo {
  model_metadata: any;
  training_data_count: number;
  ml_service_status: string;
  model_ready: boolean;
}

export function ModelInfoCard() {
  const [info, setInfo] = useState<ModelInfo | null>(null);
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
        console.error('Error fetching model info:', error);
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
            <Brain className="h-5 w-5" />
            모델 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const statusColor = info.ml_service_status === 'available' ? 'bg-primary' : 'bg-destructive';
  const statusText = info.ml_service_status === 'available' ? '정상 작동' : '오프라인';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          모델 상태
        </CardTitle>
        <CardDescription>현재 ML 모델 정보</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">서비스 상태</span>
          <Badge variant={info.ml_service_status === 'available' ? 'default' : 'destructive'}>
            <span className={`inline-block w-2 h-2 rounded-full ${statusColor} mr-2`} />
            {statusText}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">학습 데이터</span>
          <span className="font-mono font-semibold">{info.training_data_count.toLocaleString()}건</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">모델 준비</span>
          <Badge variant={info.model_ready ? 'default' : 'secondary'}>
            {info.model_ready ? '사용 가능' : '데이터 수집 중'}
          </Badge>
        </div>

        {info.model_metadata && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">카테고리별 데이터</h4>
              <div className="space-y-1">
                {Object.entries(info.model_metadata.category_distribution || {})
                  .sort((a: any, b: any) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([category, count]: [string, any]) => (
                    <div key={category} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{category}</span>
                      <span className="font-mono">{count}건</span>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
