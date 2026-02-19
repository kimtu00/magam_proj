import { getMyReviews } from "@/actions/review";
import { ReviewCard } from "@/components/review/review-card";
import { HeroStatusCard } from "@/components/hero/hero-status-card";
import { BadgeList } from "@/components/badge/badge-list";
import { MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

/**
 * 소비자용 마이페이지
 */
export default async function BuyerMyPage() {
  // 내가 작성한 리뷰 조회
  const reviews = await getMyReviews();

  return (
    <div className="p-4 space-y-6 pb-20">
      <PageHeader
        title="마이페이지"
        description="내 히어로 등급과 작성한 리뷰를 확인할 수 있습니다."
      />

      {/* 히어로 등급 카드 */}
      <HeroStatusCard />

      {/* 배지 리스트 */}
      <BadgeList />

      {/* 리뷰 섹션 */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h2 className="text-lg font-semibold">내가 작성한 리뷰</h2>
            <span className="text-sm text-muted-foreground">
              ({reviews.length}개)
            </span>
          </div>
        </div>

        <div className="p-4">
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                아직 작성한 리뷰가 없습니다
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                주문 완료 후 리뷰를 작성해보세요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

