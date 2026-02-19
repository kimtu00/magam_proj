/**
 * Review ?�비??
 * 
 * 리뷰 관??비즈?�스 로직??처리?�니??
 */

import { createClient } from "@/lib/supabase/server";
import type { ServiceResult } from "../common.types";
import type {
  ReviewData,
  ReviewWithDetails,
  ReviewReplyData,
  ReviewReportData,
  CreateReviewInput,
  CreateReplyInput,
  CreateReportInput,
  StoreReviewStats,
} from "./review.types";

export class ReviewService {
  /**
   * 리뷰 ?�성
   */
  static async createReview(input: CreateReviewInput): Promise<ServiceResult<ReviewData>> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("reviews")
        .insert(input)
        .select()
        .single();

      if (error) {
        console.error("Error creating review:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ReviewData };
    } catch (error) {
      console.error("Error in createReview:", error);
      return { success: false, error: "리뷰 ?�성 �??�류가 발생?�습?�다." };
    }
  }

  /**
   * 리뷰 ?�정
   */
  static async updateReview(
    reviewId: string,
    updates: { rating?: number; content?: string; image_url?: string }
  ): Promise<ServiceResult<void>> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from("reviews")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", reviewId);

      if (error) {
        console.error("Error updating review:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error("Error in updateReview:", error);
      return { success: false, error: "리뷰 ?�정 �??�류가 발생?�습?�다." };
    }
  }

  /**
   * 리뷰 ??��
   */
  static async deleteReview(reviewId: string): Promise<ServiceResult<void>> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) {
        console.error("Error deleting review:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error("Error in deleteReview:", error);
      return { success: false, error: "리뷰 ??�� �??�류가 발생?�습?�다." };
    }
  }

  /**
   * 주문?�로 리뷰 조회 (?��? 리뷰�??�성?�는지 ?�인??
   */
  static async getReviewByOrderId(orderId: string): Promise<ReviewData | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("order_id", orderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // ?�음
        console.error("Error getting review by order:", error);
        return null;
      }

      return data as ReviewData;
    } catch (error) {
      console.error("Error in getReviewByOrderId:", error);
      return null;
    }
  }

  /**
   * ?�용?��? ?�성??리뷰 목록 조회
   */
  static async getMyReviews(buyerId: string): Promise<ReviewWithDetails[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles!reviews_buyer_id_fkey (
            clerk_id,
            nickname
          ),
          products (
            id,
            name,
            image_url
          ),
          review_replies (
            id,
            review_id,
            seller_id,
            content,
            created_at,
            updated_at
          )
        `)
        .eq("buyer_id", buyerId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error getting my reviews:", error);
        return [];
      }

      if (!data) return [];

      return data.map((item: any) => ({
        ...item,
        buyer: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
        product: Array.isArray(item.products) ? item.products[0] : item.products,
        reply: item.review_replies?.[0] || null,
        profiles: undefined,
        products: undefined,
        review_replies: undefined,
      })) as ReviewWithDetails[];
    } catch (error) {
      console.error("Error in getMyReviews:", error);
      return [];
    }
  }

  /**
   * 가게의 모든 리뷰 조회
   */
  static async getStoreReviews(storeId: string): Promise<ReviewWithDetails[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles!reviews_buyer_id_fkey (
            clerk_id,
            nickname
          ),
          products (
            id,
            name,
            image_url
          ),
          review_replies (
            id,
            review_id,
            seller_id,
            content,
            created_at,
            updated_at
          )
        `)
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error getting store reviews:", error);
        return [];
      }

      if (!data) return [];

      return data.map((item: any) => ({
        ...item,
        buyer: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
        product: Array.isArray(item.products) ? item.products[0] : item.products,
        reply: item.review_replies?.[0] || null,
        profiles: undefined,
        products: undefined,
        review_replies: undefined,
      })) as ReviewWithDetails[];
    } catch (error) {
      console.error("Error in getStoreReviews:", error);
      return [];
    }
  }

  /**
   * ?�품??모든 리뷰 조회
   */
  static async getProductReviews(productId: string): Promise<ReviewWithDetails[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles!reviews_buyer_id_fkey (
            clerk_id,
            nickname
          ),
          products (
            id,
            name,
            image_url
          ),
          review_replies (
            id,
            review_id,
            seller_id,
            content,
            created_at,
            updated_at
          )
        `)
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error getting product reviews:", error);
        return [];
      }

      if (!data) return [];

      return data.map((item: any) => ({
        ...item,
        buyer: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
        product: Array.isArray(item.products) ? item.products[0] : item.products,
        reply: item.review_replies?.[0] || null,
        profiles: undefined,
        products: undefined,
        review_replies: undefined,
      })) as ReviewWithDetails[];
    } catch (error) {
      console.error("Error in getProductReviews:", error);
      return [];
    }
  }

  /**
   * 가�?리뷰 ?�계
   */
  static async getStoreStats(storeId: string): Promise<StoreReviewStats> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("store_id", storeId);

      if (error || !data) {
        return {
          total_count: 0,
          average_rating: 0,
          rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        };
      }

      const total_count = data.length;
      const sum = data.reduce((acc, review) => acc + review.rating, 0);
      const average_rating = total_count > 0 ? sum / total_count : 0;

      const rating_distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      data.forEach((review) => {
        const rating = review.rating as 1 | 2 | 3 | 4 | 5;
        rating_distribution[rating]++;
      });

      return {
        total_count,
        average_rating: Math.round(average_rating * 10) / 10,
        rating_distribution,
      };
    } catch (error) {
      console.error("Error in getStoreStats:", error);
      return {
        total_count: 0,
        average_rating: 0,
        rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }
  }

  /**
   * 리뷰 ?��? ?�성
   */
  static async createReply(input: CreateReplyInput): Promise<ServiceResult<ReviewReplyData>> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("review_replies")
        .insert(input)
        .select()
        .single();

      if (error) {
        console.error("Error creating reply:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ReviewReplyData };
    } catch (error) {
      console.error("Error in createReply:", error);
      return { success: false, error: "?��? ?�성 �??�류가 발생?�습?�다." };
    }
  }

  /**
   * 리뷰 ?��? ?�정
   */
  static async updateReply(replyId: string, content: string): Promise<ServiceResult<void>> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from("review_replies")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", replyId);

      if (error) {
        console.error("Error updating reply:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error("Error in updateReply:", error);
      return { success: false, error: "?��? ?�정 �??�류가 발생?�습?�다." };
    }
  }

  /**
   * 리뷰 ?��? ??��
   */
  static async deleteReply(replyId: string): Promise<ServiceResult<void>> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from("review_replies")
        .delete()
        .eq("id", replyId);

      if (error) {
        console.error("Error deleting reply:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error("Error in deleteReply:", error);
      return { success: false, error: "?��? ??�� �??�류가 발생?�습?�다." };
    }
  }

  /**
   * 리뷰 ?�고
   */
  static async reportReview(input: CreateReportInput): Promise<ServiceResult<ReviewReportData>> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("review_reports")
        .insert(input)
        .select()
        .single();

      if (error) {
        console.error("Error reporting review:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ReviewReportData };
    } catch (error) {
      console.error("Error in reportReview:", error);
      return { success: false, error: "리뷰 ?�고 �??�류가 발생?�습?�다." };
    }
  }
}

