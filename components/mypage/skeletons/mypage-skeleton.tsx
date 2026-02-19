/**
 * @file components/mypage/skeletons/mypage-skeleton.tsx
 * @description 마이페이지 메인 화면 스켈레톤
 */

export function MypageSkeleton() {
  return (
    <div className="space-y-6">
      {/* 프로필 헤더 */}
      <div className="bg-card rounded-lg p-6 shadow-sm border animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-muted rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-32 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
        </div>
      </div>

      {/* 빠른 통계 */}
      <div className="grid grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg border p-4 animate-pulse">
            <div className="h-5 w-5 bg-muted rounded mb-2 mx-auto" />
            <div className="h-6 w-12 bg-muted rounded mx-auto mb-1" />
            <div className="h-3 w-16 bg-muted rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* 히어로 카드 */}
      <div>
        <div className="h-4 w-32 bg-muted rounded mb-2" />
        <div className="bg-card rounded-lg border p-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-6 w-32 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
