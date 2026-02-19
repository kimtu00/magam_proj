import { ReviewCard } from "@/components/review/review-card";
import { getStoreReviewStats, getStoreReviews } from "@/actions/review";
import { StarRating } from "@/components/review/star-rating";
import { getStore } from "@/app/seller/actions";
import { PageHeader } from "@/components/shared/page-header";

/**
 * 사장님 리뷰 관리 페이지
 * 
 * 내 가게에 달린 리뷰를 조회하고 답글을 달 수 있습니다.
 */
export default async function SellerReviewsPage() {
  // 가게 정보 조회 (기존 getStore 액션 사용)
  const store = await getStore();
  
  if (!store) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-muted-foreground">등록된 가게가 없습니다.</p>
      </div>
    );
  }

  // 가게 리뷰 조회
  const [reviews, stats] = await Promise.all([
    getStoreReviews(store.id),
    getStoreReviewStats(store.id),
  ]);

  return (
    <div>
      {/* 헤더 */}
      <div className="px-4 pb-4 pt-4">
        <PageHeader
          title="리뷰 관리"
          description="고객이 작성한 리뷰를 확인하고 답글을 달 수 있습니다"
        />
      </div>

      {/* 통계 영역 */}
      <div className="border-b bg-card px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <StarRating rating={Math.round(stats.average_rating)} readonly size="md" />
              <span className="text-2xl font-bold">{stats.average_rating.toFixed(1)}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              총 {stats.total_count}개의 리뷰
            </p>
          </div>

          {/* 별점 분포 */}
          <div className="space-y-1 text-xs">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2">
                <span className="w-8 text-right">{star}점</span>
                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${stats.total_count > 0 ? (stats.rating_distribution[star as 1 | 2 | 3 | 4 | 5] / stats.total_count) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-muted-foreground">
                  {stats.rating_distribution[star as 1 | 2 | 3 | 4 | 5]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 리뷰 목록 */}
      {reviews.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-muted-foreground">아직 리뷰가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3 px-4 pb-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} isSeller={true} />
          ))}
        </div>
      )}
    </div>
  );
}
