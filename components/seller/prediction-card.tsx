'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Minus, Lightbulb, AlertTriangle, Info } from 'lucide-react';

export interface PredictionFactor {
  name: string;
  impact: 'positive' | 'neutral' | 'negative';
  detail: string;
}

export interface PredictionResult {
  predicted_sell_through: number;
  predicted_sell_through_percent: string;
  predicted_sold_quantity: number;
  confidence: 'high' | 'medium' | 'low';
  confidence_score: number;
  factors: PredictionFactor[];
  suggestion: string;
}

interface PredictionCardProps {
  prediction: PredictionResult | null;
  isLoading: boolean;
  error?: string | null;
  dataCount?: number;
}

export function PredictionCard({ prediction, isLoading, error, dataCount }: PredictionCardProps) {
  // Show data collection status if insufficient data
  if (dataCount !== undefined && dataCount < 1000) {
    return (
      <Card className="border-border bg-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-5 w-5" />
            AI 예측 데이터 수집 중
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            더 정확한 예측을 위해 데이터를 수집하고 있습니다.
          </p>
          <div className="space-y-2">
            <Progress 
              value={(dataCount / 1000) * 100} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground flex items-center justify-between">
              <span>수집 진행률</span>
              <span className="font-mono">{dataCount} / 1,000건</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 상품을 계속 등록하시면 곧 AI 예측 기능을 사용하실 수 있습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">예측 분석 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            예측 오류
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive/80">
            {error}
          </p>
          <p className="text-xs text-destructive/60 mt-2">
            잠시 후 다시 시도해주세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show empty state (no prediction yet)
  if (!prediction) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Info className="h-5 w-5" />
            AI 마감 소진율 예측
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            상품 정보를 입력하시면 AI가 마감 시 판매 예상량을 분석해드립니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show prediction result
  const sellThrough = prediction.predicted_sell_through;
  
  // Determine color based on sell-through rate
  const progressColor = 
    sellThrough >= 0.8 ? 'bg-primary' : 
    sellThrough >= 0.5 ? 'bg-muted-foreground' : 
    'bg-destructive';
  
  const borderColor =
    sellThrough >= 0.8 ? 'border-primary/30' :
    sellThrough >= 0.5 ? 'border-border' :
    'border-destructive/30';
  
  const bgColor =
    sellThrough >= 0.8 ? 'bg-secondary' :
    sellThrough >= 0.5 ? 'bg-card' :
    'bg-destructive/5';

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-destructive flex-shrink-0" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
    }
  };

  const confidenceStars = Math.round(prediction.confidence_score * 5);

  return (
    <Card className={`${borderColor} ${bgColor}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            📊 AI 마감 소진율 예측
          </span>
          <Badge variant={
            prediction.confidence === 'high' ? 'default' :
            prediction.confidence === 'medium' ? 'secondary' : 'outline'
          }>
            {prediction.confidence === 'high' ? '신뢰도 높음' : 
             prediction.confidence === 'medium' ? '신뢰도 보통' : '신뢰도 낮음'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar and percentage */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">
              {prediction.predicted_sell_through_percent}
            </span>
            <span className="text-sm text-muted-foreground">소진 예상</span>
          </div>
          <Progress 
            value={sellThrough * 100} 
            className={`h-3 ${progressColor}`}
          />
          <p className="text-sm text-muted-foreground">
            약 <strong className="text-foreground">{prediction.predicted_sold_quantity}개</strong> 판매 예상
          </p>
        </div>

        {/* Impact factors */}
        {prediction.factors && prediction.factors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">📈 주요 영향 요인</h4>
            <div className="space-y-1.5">
              {prediction.factors.map((factor, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  {getImpactIcon(factor.impact)}
                  <span className="text-muted-foreground leading-tight">
                    {factor.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestion */}
        {prediction.suggestion && (
          <div className="bg-card rounded-lg p-3 border border-border">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">💡 추천 사항</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {prediction.suggestion}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Confidence score */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>신뢰도</span>
          <span className="flex items-center gap-1">
            <span className="text-primary">
              {'★'.repeat(confidenceStars)}
            </span>
            <span className="text-muted-foreground/30">
              {'☆'.repeat(5 - confidenceStars)}
            </span>
            <span className="ml-1">({(prediction.confidence_score * 100).toFixed(0)}%)</span>
          </span>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center pt-2 border-t">
          ※ AI 예측은 참고용이며 실제 판매를 보장하지 않습니다.
        </p>
      </CardContent>
    </Card>
  );
}
