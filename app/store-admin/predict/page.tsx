/**
 * @file app/store-admin/predict/page.tsx
 * @description 소진율 예측 페이지
 *
 * 기존 PredictionCard를 재활용하여 실시간 ML 예측 제공
 *
 * 구성:
 * 1. 실시간 예측 입력 폼 (카테고리, 가격, 수량, 마감시간)
 * 2. 예측 결과 카드 (PredictionCard 재활용)
 * 3. 주간/월간 예측 정확도 리포트
 * 4. 최적 조건 추천
 */

import { PageHeader } from "@/components/shared/page-header";

export default function StoreAdminPredictPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="소진율 예측"
        description="ML 기반 소진율 예측으로 최적의 가격과 수량을 설정하세요."
        showBackButton={true}
        backButtonFallback="/store-admin/dashboard"
      />

      <div className="rounded-lg border bg-card p-6">
        <p className="text-center text-muted-foreground">
          소진율 예측 기능은 상품 등록 시 자동으로 제공됩니다.
          <br />
          상품 등록 페이지로 이동하여 예측을 확인하세요.
        </p>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        예측 정확도 리포트는 추후 업데이트 예정입니다.
      </div>
    </div>
  );
}
