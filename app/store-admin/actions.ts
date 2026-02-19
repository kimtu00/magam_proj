/**
 * @file app/store-admin/actions.ts
 * @description 사장님 대시보드 메인 Server Actions
 *
 * 주요 기능:
 * - getDashboardStats: 오늘 현황 통계 (매출, 판매 건수, 소진율, 평점)
 * - getSalesChartData: 매출 추이 차트 데이터
 * - getActiveProducts: 현재 판매중 상품 목록
 * - getRecentOrders: 최근 주문 목록 (대시보드용)
 * - getNotificationCounts: 헤더 벨 배지용 알림 카운트 (새 주문 + 최근 리뷰)
 *
 * @dependencies
 * - Clerk: 인증
 * - StoreService: 가게 정보
 * - ProductService: 상품 정보
 * - OrderService: 주문 정보
 * - ReviewService: 리뷰 정보
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { StoreService } from "@/services/store";
import { ProductService } from "@/services/product";
import { OrderService } from "@/services/order";
import { ReviewService } from "@/services/review";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type {
  DashboardStats,
  SalesChartData,
  ActiveProduct,
  RecentOrder,
} from "@/types/store-admin";

/**
 * 현재 사용자의 가게 정보를 조회합니다.
 * (기존 seller/actions.ts의 getStore 재활용)
 */
async function getMyStore() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return await StoreService.findByOwnerId(userId);
}

/**
 * 대시보드 오늘 현황 통계를 조회합니다.
 *
 * @returns 오늘 매출, 판매 건수, 소진율, 평균 평점
 */
export async function getDashboardStats(): Promise<DashboardStats | null> {
  const store = await getMyStore();

  if (!store) {
    return null;
  }

  const supabase = await createClerkSupabaseClient();

  // 오늘 날짜 (한국 시간 기준)
  const today = new Date().toISOString().split("T")[0];

  // 1. 오늘 완료된 주문 집계
  const { data: todayOrders, error: ordersError } = await supabase
    .from("orders")
    .select(
      `
      id,
      quantity,
      products!inner(
        id,
        store_id,
        discount_price
      )
    `
    )
    .eq("products.store_id", store.id)
    .eq("status", "COMPLETED")
    .gte("completed_at", `${today}T00:00:00`)
    .lt("completed_at", `${today}T23:59:59`);

  if (ordersError) {
    console.error("Failed to fetch today orders:", ordersError);
    return null;
  }

  const todaySales =
    todayOrders?.reduce((sum, order) => {
      const product = order.products as unknown as {
        discount_price: number;
      };
      return sum + product.discount_price * order.quantity;
    }, 0) || 0;

  const todayOrdersCount = todayOrders?.length || 0;

  // 2. 소진율 계산 (오늘 판매 시작한 상품 기준)
  const { data: todayProducts } = await supabase
    .from("products")
    .select("quantity, sold_count")
    .eq("store_id", store.id)
    .gte("created_at", `${today}T00:00:00`)
    .eq("status", "ACTIVE");

  let sellThroughRate = 0;
  if (todayProducts && todayProducts.length > 0) {
    const totalQuantity = todayProducts.reduce(
      (sum, p) => sum + p.quantity,
      0
    );
    const totalSold = todayProducts.reduce((sum, p) => sum + p.sold_count, 0);
    sellThroughRate =
      totalQuantity > 0 ? (totalSold / totalQuantity) * 100 : 0;
  }

  // 3. 평균 평점 (ReviewService 활용)
  const storeReviews = await ReviewService.getStoreReviews(store.id);
  const averageRating =
    storeReviews.length > 0
      ? storeReviews.reduce((sum, r) => sum + r.rating, 0) /
        storeReviews.length
      : 0;

  return {
    todaySales,
    todayOrders: todayOrdersCount,
    sellThroughRate: Math.round(sellThroughRate * 10) / 10, // 소수점 1자리
    averageRating: Math.round(averageRating * 10) / 10, // 소수점 1자리
  };
}

/**
 * 매출 추이 차트 데이터를 조회합니다.
 *
 * @param days - 조회 기간 (일 수, 기본 7일)
 * @returns 일별 매출 및 주문 건수
 */
export async function getSalesChartData(
  days: number = 7
): Promise<SalesChartData[]> {
  const store = await getMyStore();

  if (!store) {
    return [];
  }

  const supabase = await createClerkSupabaseClient();

  // 시작 날짜 계산
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split("T")[0];

  // 일별 매출 집계
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      completed_at,
      quantity,
      products!inner(
        store_id,
        discount_price
      )
    `
    )
    .eq("products.store_id", store.id)
    .eq("status", "COMPLETED")
    .gte("completed_at", `${startDateStr}T00:00:00`)
    .order("completed_at", { ascending: true });

  if (error || !data) {
    console.error("Failed to fetch sales data:", error);
    return [];
  }

  // 날짜별로 그룹화
  const salesByDate = new Map<string, { sales: number; orders: number }>();

  data.forEach((order) => {
    const date = order.completed_at?.split("T")[0];
    if (!date) return;

    const product = order.products as unknown as { discount_price: number };
    const sales = product.discount_price * order.quantity;

    if (salesByDate.has(date)) {
      const existing = salesByDate.get(date)!;
      existing.sales += sales;
      existing.orders += 1;
    } else {
      salesByDate.set(date, { sales, orders: 1 });
    }
  });

  // 배열로 변환
  return Array.from(salesByDate.entries())
    .map(([date, data]) => ({
      date,
      sales: data.sales,
      orders: data.orders,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 현재 판매중인 상품 목록을 조회합니다.
 *
 * @param limit - 조회할 상품 수 (기본 10개)
 * @returns 판매중 상품 목록
 */
export async function getActiveProducts(
  limit: number = 10
): Promise<ActiveProduct[]> {
  const store = await getMyStore();

  if (!store) {
    return [];
  }

  // ProductService의 findAllByStoreId 활용
  const products = await ProductService.findAllByStoreId(store.id);

  return products
    .filter((p) => p.status === "AVAILABLE" || p.status === "RESERVED")
    .slice(0, limit)
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category ?? "",
      originalPrice: p.original_price,
      discountPrice: p.discount_price,
      quantity: p.quantity,
      reservedCount: 0,
      deadline: p.pickup_deadline,
      status: "ACTIVE" as const,
    }));
}

/**
 * 최근 주문 목록을 조회합니다. (대시보드용)
 *
 * @param limit - 조회할 주문 수 (기본 5개)
 * @returns 최근 주문 목록
 */
export async function getRecentOrders(
  limit: number = 5
): Promise<RecentOrder[]> {
  const store = await getMyStore();

  if (!store) {
    return [];
  }

  const supabase = await createClerkSupabaseClient();

  // 1단계: orders와 products 조회
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      buyer_id,
      quantity,
      status,
      created_at,
      products!inner(
        id,
        store_id,
        name,
        discount_price
      )
    `
    )
    .eq("products.store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("Failed to fetch recent orders:", error);
    return [];
  }

  // 2단계: buyer_id로 profiles 조회
  const buyerIds = [...new Set(data.map((o) => o.buyer_id))];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("clerk_id, name")
    .in("clerk_id", buyerIds);

  const profileMap = new Map(
    (profiles || []).map((p) => [p.clerk_id, p.name])
  );

  return data.map((order) => {
    const product = order.products as unknown as {
      id: string;
      name: string;
      discount_price: number;
    };

    return {
      id: order.id,
      orderNumber: order.id.substring(0, 8), // ID의 앞 8자리를 주문번호로 사용
      customerName: profileMap.get(order.buyer_id) || "익명",
      productName: product.name,
      quantity: order.quantity,
      totalAmount: product.discount_price * order.quantity,
      status: order.status as "RESERVED" | "COMPLETED" | "CANCELED",
      createdAt: order.created_at,
    };
  });
}

/**
 * 헤더 벨 아이콘 배지용 알림 카운트를 조회합니다.
 *
 * - 오늘 들어온 새 주문 (RESERVED 상태)
 * - 최근 7일 이내 작성된 리뷰
 *
 * @returns 새 주문 수, 새 리뷰 수, 합계
 */
export async function getNotificationCounts(): Promise<{
  newOrders: number;
  newReviews: number;
  total: number;
}> {
  const store = await getMyStore();

  if (!store) {
    return { newOrders: 0, newReviews: 0, total: 0 };
  }

  const supabase = await createClerkSupabaseClient();

  // 1. 이 가게의 상품 ID 목록 조회
  const { data: products } = await supabase
    .from("products")
    .select("id")
    .eq("store_id", store.id);

  const productIds = (products ?? []).map((p: { id: string }) => p.id);

  // 오늘 자정 기준 시각 (주문/리뷰 공통 사용)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 2. 오늘 들어온 새 주문 (RESERVED 상태)
  let newOrders = 0;
  if (productIds.length > 0) {
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("product_id", productIds)
      .eq("status", "RESERVED")
      .gte("created_at", today.toISOString());

    newOrders = count ?? 0;
  }

  // 3. 오늘(자정 이후) 등록된 리뷰
  const { count: reviewCount } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("store_id", store.id)
    .gte("created_at", today.toISOString());

  const newReviews = reviewCount ?? 0;

  return { newOrders, newReviews, total: newOrders + newReviews };
}
