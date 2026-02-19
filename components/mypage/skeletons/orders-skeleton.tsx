/**
 * @file components/mypage/skeletons/orders-skeleton.tsx
 * @description 주문 내역 리스트 스켈레톤
 */

export function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-lg border p-4 animate-pulse space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 bg-muted rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
          </div>
          <div className="h-3 w-full bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}
