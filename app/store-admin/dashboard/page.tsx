import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardStats } from "@/components/store-admin/dashboard-stats";
import { SalesChart } from "@/components/store-admin/sales-chart";
import { ActiveProductList } from "@/components/store-admin/active-product-list";
import { RecentOrders } from "@/components/store-admin/recent-orders";
import {
  getSalesChartData,
  getActiveProducts,
  getRecentOrders,
} from "@/app/store-admin/actions";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 사장님 대시보드
 *
 * 매출, 소진율 등 주요 지표를 확인하는 페이지입니다.
 *
 * 구성:
 * 1. 오늘 현황 4칸 (매출, 판매 건수, 소진율, 평점)
 * 2. 매출 추이 바 차트 (최근 7일)
 * 3. 현재 판매중 상품 (최대 10개)
 * 4. 최근 주문 (최대 5개)
 */
export default async function StoreAdminDashboardPage() {
  // 데이터 병렬 로드
  const [salesChartData, activeProducts, recentOrders] = await Promise.all([
    getSalesChartData(7),
    getActiveProducts(10),
    getRecentOrders(5),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="대시보드"
        description="가게의 주요 지표를 한눈에 확인하세요."
      />

      {/* 1. 오늘 현황 통계 (4칸) */}
      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        }
      >
        <DashboardStats />
      </Suspense>

      {/* 2. 매출 추이 차트 */}
      <SalesChart data={salesChartData} />

      {/* 3. 판매중 상품 + 4. 최근 주문 (그리드) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActiveProductList products={activeProducts} />
        <RecentOrders orders={recentOrders} />
      </div>
    </div>
  );
}
