/**
 * Review Server Actions
 * 
 * 리뷰 관련 Server Actions
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ReviewService } from "@/services/review";
import type { ReviewWithDetails, StoreReviewStats } from "@/services/review";

/**
 * 리뷰 작성
 * 
 * @param orderId - 주문 ID
 * @param storeId - 가게 ID
 * @param productId - 상품 ID
 * @param rating - 별점 (1-5)
 * @param content - 리뷰 내용 (선택)
 * @param imageUrl - 리뷰 이미지 (선택)
 * @returns 성공 여부
 */
export async function createReview(
  orderId: string,
  storeId: string,
  productId: string,
  rating: number,
  content?: string,
  imageUrl?: string
) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 이미 리뷰를 작성했는지 확인
  const existingReview = await ReviewService.getReviewByOrderId(orderId);
  if (existingReview) {
    return { success: false, error: "이미 리뷰를 작성한 주문입니다." };
  }

  const result = await ReviewService.createReview({
    order_id: orderId,
    buyer_id: userId,
    store_id: storeId,
    product_id: productId,
    rating,
    content,
    image_url: imageUrl,
  });

  if (result.success) {
    revalidatePath("/buyer/reservations");
    revalidatePath("/buyer/me");
  }

  return result;
}

/**
 * 리뷰 수정
 */
export async function updateReview(
  reviewId: string,
  rating: number,
  content?: string,
  imageUrl?: string
) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const result = await ReviewService.updateReview(reviewId, {
    rating,
    content,
    image_url: imageUrl,
  });

  if (result.success) {
    revalidatePath("/buyer/reservations");
    revalidatePath("/buyer/me");
  }

  return result;
}

/**
 * 리뷰 삭제
 */
export async function deleteReview(reviewId: string) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const result = await ReviewService.deleteReview(reviewId);

  if (result.success) {
    revalidatePath("/buyer/reservations");
    revalidatePath("/buyer/me");
  }

  return result;
}

/**
 * 내가 작성한 리뷰 조회
 */
export async function getMyReviews(): Promise<ReviewWithDetails[]> {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  return await ReviewService.getMyReviews(userId);
}

/**
 * 가게 리뷰 조회 (사장님용)
 */
export async function getStoreReviews(storeId: string): Promise<ReviewWithDetails[]> {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  return await ReviewService.getStoreReviews(storeId);
}

/**
 * 상품 리뷰 조회 (소비자용)
 */
export async function getProductReviews(productId: string): Promise<ReviewWithDetails[]> {
  return await ReviewService.getProductReviews(productId);
}

/**
 * 가게 리뷰 통계
 */
export async function getStoreReviewStats(storeId: string): Promise<StoreReviewStats> {
  return await ReviewService.getStoreStats(storeId);
}

/**
 * 리뷰 답글 작성 (사장님)
 */
export async function createReviewReply(reviewId: string, content: string) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const result = await ReviewService.createReply({
    review_id: reviewId,
    seller_id: userId,
    content,
  });

  if (result.success) {
    revalidatePath("/seller/reviews");
  }

  return result;
}

/**
 * 리뷰 답글 수정
 */
export async function updateReviewReply(replyId: string, content: string) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const result = await ReviewService.updateReply(replyId, content);

  if (result.success) {
    revalidatePath("/seller/reviews");
  }

  return result;
}

/**
 * 리뷰 답글 삭제
 */
export async function deleteReviewReply(replyId: string) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const result = await ReviewService.deleteReply(replyId);

  if (result.success) {
    revalidatePath("/seller/reviews");
  }

  return result;
}

/**
 * 리뷰 신고
 */
export async function reportReview(reviewId: string, reason: string) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const result = await ReviewService.reportReview({
    review_id: reviewId,
    reporter_id: userId,
    reason,
  });

  return result;
}
