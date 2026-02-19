/**
 * @file components/store-admin/skeletons/dashboard-skeleton.tsx
 * @description 대시보드 로딩 스켈레톤
 */

import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      {/* 매출 차트 */}
      <Skeleton className="h-96" />

      {/* 판매중 상품 + 최근 주문 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
