import { getDefaultAnalytics } from "./actions";
import { SalesChartView } from "./sales-chart-view";
import { PageHeader } from "@/components/shared/page-header";

/**
 * 매출 분석 페이지
 * 
 * 기간별 매출 현황, 주문 건수, 상품별 매출 순위를 확인할 수 있습니다.
 */
export default async function SellerAnalyticsPage() {
  const analyticsData = await getDefaultAnalytics();

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title="매출 분석"
        description="기간별 매출 현황과 상품별 판매 실적을 확인할 수 있습니다."
      />

      {/* 차트 및 통계 (Client Component) */}
      <SalesChartView initialData={analyticsData} />
    </div>
  );
}
