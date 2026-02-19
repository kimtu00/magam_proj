/**
 * @file components/store-admin/skeletons/product-table-skeleton.tsx
 * @description 상품 테이블 로딩 스켈레톤
 */

import { Skeleton } from "@/components/ui/skeleton";

export function ProductTableSkeleton() {
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
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
