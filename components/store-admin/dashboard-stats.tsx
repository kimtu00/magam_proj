/**
 * @file components/store-admin/dashboard-stats.tsx
 * @description 대시보드 오늘 현황 통계 (4칸)
 *
 * Server Component
 */

import { getDashboardStats } from "@/app/store-admin/actions";
import { StatCard } from "@/components/shared/stat-card";
import { TrendingUp, ShoppingCart, Percent, Star } from "lucide-react";

export async function DashboardStats() {
  const stats = await getDashboardStats();

  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="오늘 매출"
          value="데이터 없음"
          icon={TrendingUp}
        />
        <StatCard
          title="판매 건수"
          value="데이터 없음"
          icon={ShoppingCart}
        />
        <StatCard title="소진율" value="데이터 없음" icon={Percent} />
        <StatCard title="평균 평점" value="데이터 없음" icon={Star} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        title="오늘 매출"
        value={`₩${stats.todaySales.toLocaleString()}`}
        icon={TrendingUp}
        description="전일 대비"
      />
      <StatCard
        title="판매 건수"
        value={`${stats.todayOrders}건`}
        icon={ShoppingCart}
        description="오늘 완료된 주문"
      />
      <StatCard
        title="소진율"
        value={`${stats.sellThroughRate}%`}
        icon={Percent}
        description="오늘 상품 기준"
      />
      <StatCard
        title="평균 평점"
        value={`${stats.averageRating}점`}
        icon={Star}
        description="전체 리뷰 기준"
      />
    </div>
  );
}
