/**
 * @file app/admin/promotions/actions.ts
 * @description 혜택/프로모션 관리용 Server Actions
 *
 * 이 파일은 쿠폰, 프로모션 코드, 등급 혜택, 성과 통계를 제공합니다.
 *
 * Server Actions:
 * - getCouponList: 쿠폰 목록 조회
 * - getPromoCodeList: 프로모션 코드 목록 조회
 * - getGradeBenefits: 등급별 혜택 설정 조회
 * - getPromotionStats: 프로모션 성과 통계 조회
 */

"use server";

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import type {
  AdminCouponData,
  AdminPromoCodeData,
  GradeBenefitData,
  PromotionStats,
} from "@/types/admin";

// --------------------------------------------------------
// 쿠폰 목록
// --------------------------------------------------------

/**
 * 쿠폰 목록 조회
 *
 * @returns 쿠폰 목록 배열
 */
export async function getCouponList(): Promise<AdminCouponData[]> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Admin Promotions] Failed to fetch coupons:", error);
      return [];
    }

    // 각 쿠폰의 발급 및 사용 통계 조회
    const couponIds = (data || []).map((c) => c.id);

    const { data: userCouponsData } = await supabase
      .from("user_coupons")
      .select("coupon_id, is_used")
      .in("coupon_id", couponIds);

    const statsMap = new Map<
      string,
      { issuedCount: number; usedCount: number }
    >();

    (userCouponsData || []).forEach((uc: any) => {
      const current = statsMap.get(uc.coupon_id) || {
        issuedCount: 0,
        usedCount: 0,
      };
      statsMap.set(uc.coupon_id, {
        issuedCount: current.issuedCount + 1,
        usedCount: current.usedCount + (uc.is_used ? 1 : 0),
      });
    });

    return (data || []).map((coupon) => {
      const stats = statsMap.get(coupon.id) || {
        issuedCount: 0,
        usedCount: 0,
      };

      return {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discount_type as "percent" | "amount",
        discountValue: coupon.discount_value || 0,
        minOrderAmount: coupon.min_order_amount || 0,
        maxDiscount: coupon.max_discount,
        validFrom: coupon.valid_from,
        validUntil: coupon.valid_until,
        totalQuantity: coupon.total_quantity,
        issuedCount: stats.issuedCount,
        usedCount: stats.usedCount,
        isActive: coupon.is_active !== false,
        createdAt: coupon.created_at,
      };
    });
  } catch (error) {
    console.error("[Admin Promotions] Failed to fetch coupon list:", error);
    return [];
  }
}

// --------------------------------------------------------
// 프로모션 코드 목록
// --------------------------------------------------------

/**
 * 프로모션 코드 목록 조회
 *
 * @returns 프로모션 코드 목록 배열
 */
export async function getPromoCodeList(): Promise<AdminPromoCodeData[]> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // promo_codes 테이블이 없으면 빈 배열 반환
    // TODO: 프로모션 코드 테이블 생성 후 구현
    console.warn("[Admin Promotions] promo_codes 테이블이 아직 구현되지 않았습니다.");

    return [];
  } catch (error) {
    console.error("[Admin Promotions] Failed to fetch promo code list:", error);
    return [];
  }
}

// --------------------------------------------------------
// 등급 혜택 설정
// --------------------------------------------------------

/**
 * 등급별 혜택 설정 조회
 *
 * @returns 등급별 혜택 배열
 */
export async function getGradeBenefits(): Promise<GradeBenefitData[]> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    const { data, error } = await supabase
      .from("hero_grades")
      .select("*")
      .order("tier", { ascending: true });

    if (error) {
      console.error("[Admin Promotions] Failed to fetch grade benefits:", error);
      return [];
    }

    return (data || []).map((grade) => ({
      grade: grade.grade,
      tier: grade.tier,
      benefits: {
        discountRate: grade.discount_rate || 0,
        pointsRate: grade.points_rate || 0,
        freeShipping: grade.free_shipping || false,
        prioritySupport: grade.priority_support || false,
        exclusiveCoupons: grade.exclusive_coupons || false,
      },
    }));
  } catch (error) {
    console.error("[Admin Promotions] Failed to fetch grade benefits:", error);
    return [];
  }
}

// --------------------------------------------------------
// 프로모션 성과 통계
// --------------------------------------------------------

/**
 * 프로모션 성과 통계 조회
 *
 * @returns 프로모션 성과 통계
 */
export async function getPromotionStats(): Promise<PromotionStats | null> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // 쿠폰 발급 및 사용 통계
    const { data: userCouponsData, error: userCouponsError } = await supabase
      .from("user_coupons")
      .select("is_used");

    if (userCouponsError) {
      console.error("[Admin Promotions] Failed to fetch user coupons:", userCouponsError);
      return null;
    }

    const totalCouponsIssued = (userCouponsData || []).length;
    const totalCouponsUsed = (userCouponsData || []).filter((uc: any) => uc.is_used).length;
    const usageRate =
      totalCouponsIssued > 0 ? (totalCouponsUsed / totalCouponsIssued) * 100 : 0;

    // 쿠폰 사용으로 인한 총 할인액 (order_items에서 coupon_id가 있는 경우)
    // TODO: order_items에 coupon_id 컬럼 추가 시 구현
    const totalDiscount = 0;

    // 평균 주문액 (쿠폰 사용 주문)
    const averageOrderValue = 0;

    // 전환율 (쿠폰 발급 -> 주문 완료)
    const conversionRate = 0;

    return {
      totalCouponsIssued,
      totalCouponsUsed,
      usageRate: Math.round(usageRate * 10) / 10,
      totalDiscount,
      averageOrderValue,
      conversionRate,
    };
  } catch (error) {
    console.error("[Admin Promotions] Failed to fetch promotion stats:", error);
    return null;
  }
}
