import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ModelInfoCard } from "@/components/admin/ml/model-info-card";
import { TrainingDataCard } from "@/components/admin/ml/training-data-card";
import { PredictionAccuracyCard } from "@/components/admin/ml/prediction-accuracy-card";
import { ManualRetrainButton } from "@/components/admin/ml/manual-retrain-button";
import { PageHeader } from "@/components/shared/page-header";

/**
 * Admin ML Management Page
 * 
 * Displays:
 * - Current model performance metrics
 * - Training data statistics
 * - Prediction accuracy statistics
 * - Manual retraining trigger
 * - Feature importance visualization
 */
export default async function AdminMLPage() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="ML 모델 관리"
        description="마감 소진율 예측 모델의 성능과 학습 데이터를 관리합니다."
      />

      <Separator />

      {/* Model Status Overview */}
      <Suspense fallback={<div>Loading...</div>}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ModelInfoCard />
          <TrainingDataCard />
          <PredictionAccuracyCard />
        </div>
      </Suspense>

      <Separator />

      {/* Manual Retraining Section */}
      <Card>
        <CardHeader>
          <CardTitle>모델 재학습</CardTitle>
          <CardDescription>
            최신 데이터로 모델을 재학습하여 예측 정확도를 향상시킵니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary p-4 border border-border">
              <h4 className="font-semibold text-sm text-foreground mb-2">
                재학습 안내
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>매주 월요일 새벽 3시에 자동으로 재학습됩니다</li>
                <li>학습 데이터가 1000건 이상일 때 효과적입니다</li>
                <li>재학습은 약 5-30분 소요됩니다 (데이터 양에 따라)</li>
                <li>성능이 개선되지 않으면 이전 모델이 유지됩니다</li>
              </ul>
            </div>

            <ManualRetrainButton />
          </div>
        </CardContent>
      </Card>

      {/* Feature Importance Section */}
      <Card>
        <CardHeader>
          <CardTitle>피처 중요도</CardTitle>
          <CardDescription>
            예측에 가장 큰 영향을 주는 요소들입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground text-center">
              피처 중요도 차트는 모델 학습 후 ml/reports/feature_importance.png에서 확인하실 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
