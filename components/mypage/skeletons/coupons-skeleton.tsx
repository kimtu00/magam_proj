/**
 * @file components/mypage/skeletons/coupons-skeleton.tsx
 * @description 쿠폰 목록 스켈레톤
 */

export function CouponsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-lg border p-4 animate-pulse space-y-3"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
            <div className="h-6 w-16 bg-muted rounded" />
          </div>
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-3 w-full bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}
