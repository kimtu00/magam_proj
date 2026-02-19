/**
 * @file app/store-admin/reviews/page.tsx
 * @description 리뷰 관리 페이지
 *
 * 구성:
 * 1. 리뷰 통계 요약 (평균 평점, 총 리뷰 수, 별점별 분포)
 * 2. 평점별 필터 탭
 * 3. 리뷰 카드 리스트 (답글 달기 기능 포함)
 */

import { PageHeader } from "@/components/shared/page-header";

export default function StoreAdminReviewsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="리뷰 관리"
        description="고객 리뷰를 확인하고 답글을 작성하세요."
        showBackButton={true}
        backButtonFallback="/store-admin/dashboard"
      />

      <div className="rounded-lg border bg-card p-6">
        <p className="text-center text-muted-foreground">
          리뷰 관리 기능은 추후 업데이트 예정입니다.
        </p>
      </div>
    </div>
  );
}
