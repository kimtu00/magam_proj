/**
 * Product List Skeleton Component
 * 
 * 상품 리스트 로딩 중 표시되는 스켈레톤 UI
 */

import { Skeleton } from "@/components/ui/skeleton";

interface ProductListSkeletonProps {
  view?: "grid" | "list" | "map";
  count?: number;
}

/**
 * 그리드 뷰 스켈레톤
 */
function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 px-4 py-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-3">
          {/* 이미지 */}
          <Skeleton className="aspect-square w-full rounded-lg" />
          {/* 제품명 */}
          <Skeleton className="h-4 w-3/4" />
          {/* 가격 */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-2/3" />
          </div>
          {/* 가게명 */}
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/**
 * 리스트 뷰 스켈레톤
 */
function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 px-4 py-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex gap-3">
          {/* 이미지 */}
          <Skeleton className="h-24 w-24 shrink-0 rounded-lg" />
          {/* 정보 */}
          <div className="flex flex-1 flex-col justify-between py-1">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 상품 리스트 스켈레톤
 */
export function ProductListSkeleton({ view = "grid", count }: ProductListSkeletonProps) {
  return (
    <>
      {/* 정렬 및 뷰 토글 스켈레톤 */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-20" />
      </div>
      
      {/* 필터 탭 스켈레톤 */}
      <div className="sticky top-[49px] z-10 border-b bg-background pb-2">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-20 shrink-0" />
          ))}
        </div>
      </div>
      
      {/* 상품 리스트 스켈레톤 */}
      {view === "grid" || view === "map" ? (
        // 지도 뷰 로딩 시에도 그리드 형태 스켈레톤 재사용
        <GridSkeleton count={count} />
      ) : (
        <ListSkeleton count={count} />
      )}
    </>
  );
}


