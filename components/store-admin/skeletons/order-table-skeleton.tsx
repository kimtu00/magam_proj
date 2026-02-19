/**
 * @file components/store-admin/skeletons/order-table-skeleton.tsx
 * @description 주문 테이블 로딩 스켈레톤
 */

import { Skeleton } from "@/components/ui/skeleton";

export function OrderTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* 헤더 + 탭 */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-96" />

      {/* 테이블 */}
      <div className="rounded-lg border bg-card p-4">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>

      {/* 자동 갱신 안내 */}
      <Skeleton className="mx-auto h-4 w-64" />
    </div>
  );
}
