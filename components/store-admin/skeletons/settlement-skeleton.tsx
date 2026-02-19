/**
 * @file components/store-admin/skeletons/settlement-skeleton.tsx
 * @description 정산 페이지 로딩 스켈레톤
 */

import { Skeleton } from "@/components/ui/skeleton";

export function SettlementSkeleton() {
  return (
    <div className="space-y-6">
      {/* 정산 요약 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      {/* 월별 정산 이력 */}
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>

      {/* 일별 매출 상세 */}
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="mb-4 h-6 w-64" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>

      {/* 정산 계좌 */}
      <Skeleton className="h-32" />
    </div>
  );
}
