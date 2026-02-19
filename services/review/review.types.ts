/**
 * Review 도메인 타입 정의
 */

/**
 * 리뷰 기본 타입
 */
export interface ReviewData {
  id: string;
  order_id: string;
  buyer_id: string;
  store_id: string;
  product_id: string;
  rating: number; // 1-5
  content: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 리뷰 상세 (구매자, 상품, 답글 정보 포함)
 */
export interface ReviewWithDetails extends ReviewData {
  buyer: {
    clerk_id: string;
    nickname: string | null;
  };
  product: {
    id: string;
    name: string;
    image_url: string | null;
  };
  reply: ReviewReplyData | null;
}

/**
 * 리뷰 답글 타입
 */
export interface ReviewReplyData {
  id: string;
  review_id: string;
  seller_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

/**
 * 리뷰 신고 타입
 */
export interface ReviewReportData {
  id: string;
  review_id: string;
  reporter_id: string;
  reason: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'REJECTED';
  created_at: string;
}

/**
 * 리뷰 작성 입력 타입
 */
export interface CreateReviewInput {
  order_id: string;
  buyer_id: string;
  store_id: string;
  product_id: string;
  rating: number;
  content?: string;
  image_url?: string;
}

/**
 * 리뷰 답글 작성 입력 타입
 */
export interface CreateReplyInput {
  review_id: string;
  seller_id: string;
  content: string;
}

/**
 * 리뷰 신고 입력 타입
 */
export interface CreateReportInput {
  review_id: string;
  reporter_id: string;
  reason: string;
}

/**
 * 가게 리뷰 통계
 */
export interface StoreReviewStats {
  total_count: number;
  average_rating: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
