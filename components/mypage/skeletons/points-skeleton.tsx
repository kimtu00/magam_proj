/**
 * @file components/mypage/skeletons/points-skeleton.tsx
 * @description 포인트 페이지 스켈레톤
 */

export function PointsSkeleton() {
  return (
    <div className="space-y-6">
      {/* 포인트 요약 */}
      <div className="bg-card rounded-lg border p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-12 w-full bg-muted rounded" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </div>
      </div>

      {/* 거래 내역 */}
      <div className="bg-card rounded-lg border p-4 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-muted rounded" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
              <div className="h-5 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
