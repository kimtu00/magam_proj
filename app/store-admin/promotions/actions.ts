/**
 * @file app/store-admin/promotions/actions.ts
 * @description 프로모션 현황 Server Actions
 *
 * 주요 기능:
 * - getStorePromotions: 내 가게 프로모션 현황
 * - getCouponUsageStats: 쿠폰 사용 현황
 *
 * @dependencies
 * - Clerk: 인증
 * - StoreService: 가게 정보
 * - Supabase: DB 조회
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { StoreService } from "@/services/store";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type {
  StorePromotionData,
  CouponUsageStats,
} from "@/types/store-admin";

/**
 * 현재 사용자의 가게 정보를 조회합니다.
 */
async function getMyStore() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return await StoreService.findByOwnerId(userId);
}

/**
 * 내 가게 프로모션 현황을 조회합니다.
 *
 * @param activeOnly - 활성화된 프로모션만 조회 (기본 true)
 * @returns 프로모션 목록
 */
export async function getStorePromotions(
  activeOnly: boolean = true
): Promise<StorePromotionData[]> {
  const store = await getMyStore();

  if (!store) {
    return [];
  }

  const supabase = await createClerkSupabaseClient();

  let query = supabase
    .from("store_promotions")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch store promotions:", error);
    return [];
  }

  return (
    data?.map((row) => ({
      id: row.id,
      storeId: row.store_id,
      couponId: row.coupon_id || undefined,
      name: row.name,
      description: row.description || undefined,
      type: row.type as "platform" | "store",
      usedCount: row.used_count || 0,
      commissionAdjustment: parseFloat(row.commission_adjustment) || 0,
      adjustmentType: row.adjustment_type as "percent" | "amount" | undefined,
      isActive: row.is_active,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      createdAt: row.created_at,
    })) || []
  );
}

/**
 * 쿠폰 사용 현황을 조회합니다.
 * (내 가게 주문에서 사용된 쿠폰 통계)
 *
 * @returns 쿠폰별 사용 통계
 */
export async function getCouponUsageStats(): Promise<CouponUsageStats[]> {
  const store = await getMyStore();

  if (!store) {
    return [];
  }

  const supabase = await createClerkSupabaseClient();

  // 1. 내 가게 주문에서 쿠폰 사용 내역 조회
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      `
      id,
      coupon_id,
      quantity,
      products!inner(
        id,
        store_id,
        original_price,
        discount_price
      ),
      user_coupons!coupon_id(
        id,
        coupons!inner(
          id,
          code,
          name,
          discount_type,
          discount_value
        )
      )
    `
    )
    .eq("products.store_id", store.id)
    .eq("status", "COMPLETED")
    .not("coupon_id", "is", null);

  if (ordersError || !orders) {
    console.error("Failed to fetch coupon usage:", ordersError);
    return [];
  }

  // 2. 쿠폰별로 그룹화
  const couponStats = new Map<
    string,
    {
      code: string;
      name: string;
      usedCount: number;
      totalDiscount: number;
    }
  >();

  orders.forEach((order) => {
    const product = order.products as unknown as {
      original_price: number;
      discount_price: number;
    };
    const userCoupon = order.user_coupons as unknown as {
      coupons: {
        id: string;
        code: string;
        name: string;
        discount_type: string;
        discount_value: number;
      };
    };

    if (!userCoupon?.coupons) return;

    const coupon = userCoupon.coupons;
    const discountAmount =
      (product.original_price - product.discount_price) * order.quantity;

    if (couponStats.has(coupon.code)) {
      const stat = couponStats.get(coupon.code)!;
      stat.usedCount += 1;
      stat.totalDiscount += discountAmount;
    } else {
      couponStats.set(coupon.code, {
        code: coupon.code,
        name: coupon.name,
        usedCount: 1,
        totalDiscount: discountAmount,
      });
    }
  });

  // 3. 배열로 변환 및 수수료 영향 계산
  return Array.from(couponStats.values())
    .map((stat) => ({
      couponCode: stat.code,
      couponName: stat.name,
      usedCount: stat.usedCount,
      totalDiscount: stat.totalDiscount,
      commissionImpact: Math.round(stat.totalDiscount * 0.1), // 수수료 10% 기준
    }))
    .sort((a, b) => b.usedCount - a.usedCount); // 사용 횟수 내림차순
}
