/**
 * @file app/admin/users/actions.ts
 * @description 회원 관리용 Server Actions
 *
 * 이 파일은 소비자 및 사장님 회원의 목록, 상세 정보, 통계를 제공합니다.
 *
 * Server Actions:
 * - getConsumerList: 소비자 목록 조회
 * - getProducerList: 사장님 목록 조회
 * - getConsumerDetail: 소비자 상세 정보 조회
 * - getProducerDetail: 사장님 상세 정보 조회
 * - getUserOrders: 회원의 주문 이력 조회
 * - getUserBenefits: 회원의 혜택 현황 조회
 *
 * DB 컬럼 참고:
 * - profiles: id, clerk_id (not user_id), role, nickname (not name), created_at, address, latitude, longitude
 * - orders: id, buyer_id (not user_id), product_id, status (RESERVED/COMPLETED/CANCELED), created_at
 * - user_hero: user_id (→ profiles.clerk_id), grade_level, total_pickup_count, total_saved_weight_g
 * - saved_food_log: user_id, order_id, product_id, saved_weight_g, co2_saved_g, created_at
 */

"use server";

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import type {
  ConsumerListItem,
  ProducerListItem,
  ConsumerDetail,
  ProducerDetail,
  PaginatedResponse,
} from "@/types/admin";

/** 등급 레벨 → 등급명 매핑 (hero_grade_config 기준) */
const GRADE_NAMES: Record<number, string> = {
  0: "새싹",
  1: "새싹",
  2: "동네",
  3: "나라",
  4: "지구",
};

// --------------------------------------------------------
// 소비자 목록
// --------------------------------------------------------

/**
 * 소비자 목록 조회 (페이지네이션)
 *
 * @param page - 페이지 번호 (1부터 시작)
 * @param limit - 페이지 크기
 * @param search - 검색어 (닉네임)
 * @returns 페이지네이션된 소비자 목록
 */
export async function getConsumerList(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<PaginatedResponse<ConsumerListItem> | null> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    const offset = (page - 1) * limit;

    let query = supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .not("role", "in", '("admin","super_admin")');

    if (search && search.trim()) {
      query = query.ilike("nickname", `%${search}%`);
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("[Admin Users] Failed to fetch consumers:", error);
      return null;
    }

    // profiles.clerk_id 목록 (user_id가 아님)
    const userIds = (data || []).map((p) => p.clerk_id).filter(Boolean);

    if (userIds.length === 0) {
      return {
        items: [],
        meta: {
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };
    }

    // 구매 통계 조회 (orders.buyer_id = profiles.clerk_id)
    const { data: ordersData } = await supabase
      .from("orders")
      .select("buyer_id")
      .in("buyer_id", userIds);

    const orderCountMap = new Map<string, number>();
    (ordersData || []).forEach((order: any) => {
      orderCountMap.set(order.buyer_id, (orderCountMap.get(order.buyer_id) || 0) + 1);
    });

    // 히어로 등급 조회 (user_hero.user_id = profiles.clerk_id)
    const { data: heroData } = await supabase
      .from("user_hero")
      .select("user_id, grade_level")
      .in("user_id", userIds);

    const heroMap = new Map(
      (heroData || []).map((h: any) => [h.user_id, h.grade_level ?? 0])
    );

    // 포인트 잔액 조회 (point_transactions.user_id = profiles.clerk_id)
    const { data: pointsData } = await supabase
      .from("point_transactions")
      .select("user_id, amount")
      .in("user_id", userIds);

    const pointsMap = new Map<string, number>();
    (pointsData || []).forEach((pt: any) => {
      pointsMap.set(pt.user_id, (pointsMap.get(pt.user_id) || 0) + (pt.amount || 0));
    });

    const items: ConsumerListItem[] = (data || []).map((profile) => {
      const gradeLevel = heroMap.get(profile.clerk_id) ?? 0;
      return {
        userId: profile.clerk_id,
        name: profile.nickname || "Unknown",
        age: undefined,
        gender: undefined,
        heroGrade: GRADE_NAMES[gradeLevel] ?? "새싹",
        heroTier: gradeLevel,
        purchaseCount: orderCountMap.get(profile.clerk_id) || 0,
        points: Math.max(0, pointsMap.get(profile.clerk_id) || 0),
        status: "active",
        createdAt: profile.created_at,
      };
    });

    return {
      items,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (error) {
    console.error("[Admin Users] Failed to fetch consumer list:", error);
    return null;
  }
}

// --------------------------------------------------------
// 사장님 목록
// --------------------------------------------------------

/**
 * 사장님 목록 조회 (페이지네이션)
 *
 * profiles.role 값과 무관하게 stores 테이블에 등록된 가게를 기준으로 조회합니다.
 * 가게가 있으면 사장님으로 간주하여 표시합니다.
 *
 * @param page - 페이지 번호 (1부터 시작)
 * @param limit - 페이지 크기
 * @param search - 검색어 (가게명)
 * @returns 페이지네이션된 사장님(가게) 목록
 */
export async function getProducerList(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<PaginatedResponse<ProducerListItem> | null> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    const offset = (page - 1) * limit;

    // stores 테이블 직접 조회 (role 값과 무관하게 등록된 가게 전부 표시)
    let storeQuery = supabase
      .from("stores")
      .select("*", { count: "exact" });

    if (search && search.trim()) {
      storeQuery = storeQuery.ilike("name", `%${search}%`);
    }

    storeQuery = storeQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: storesData, error, count } = await storeQuery;

    if (error) {
      console.error("[Admin Users] Failed to fetch stores:", error);
      return null;
    }

    if (!storesData || storesData.length === 0) {
      return {
        items: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }

    const storeIds = storesData.map((s: any) => s.id).filter(Boolean);
    const ownerIds = storesData.map((s: any) => s.owner_id).filter(Boolean);

    // 사장님 닉네임 조회 (profiles.clerk_id = stores.owner_id)
    const ownerNameMap = new Map<string, string>();
    if (ownerIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("clerk_id, nickname")
        .in("clerk_id", ownerIds);

      (profilesData || []).forEach((p: any) => {
        ownerNameMap.set(p.clerk_id, p.nickname || "Unknown");
      });
    }

    // 상품 수 조회
    const productCountMap = new Map<string, number>();
    if (storeIds.length > 0) {
      const { data: productsData } = await supabase
        .from("products")
        .select("store_id")
        .in("store_id", storeIds);

      (productsData || []).forEach((product: any) => {
        productCountMap.set(
          product.store_id,
          (productCountMap.get(product.store_id) || 0) + 1
        );
      });
    }

    // 완료된 주문 기반 매출 통계
    const salesMap = new Map<string, number>();
    if (storeIds.length > 0) {
      const { data: ordersData } = await supabase
        .from("orders")
        .select("products!inner(store_id, discount_price)")
        .in("products.store_id", storeIds)
        .eq("status", "COMPLETED");

      (ordersData || []).forEach((order: any) => {
        const product = Array.isArray(order.products) ? order.products[0] : order.products;
        if (!product) return;
        salesMap.set(
          product.store_id,
          (salesMap.get(product.store_id) || 0) + (product.discount_price || 0)
        );
      });
    }

    const items: ProducerListItem[] = storesData.map((store: any) => ({
      userId: store.owner_id,
      name: ownerNameMap.get(store.owner_id) || "Unknown",
      storeName: store.name,
      storeId: store.id,
      region: store.address,
      productCount: productCountMap.get(store.id) || 0,
      totalSales: salesMap.get(store.id) || 0,
      sellThroughRate: 0,
      status: "active",
      createdAt: store.created_at,
    }));

    return {
      items,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (error) {
    console.error("[Admin Users] Failed to fetch producer list:", error);
    return null;
  }
}

// --------------------------------------------------------
// 회원 상세 정보
// --------------------------------------------------------

/**
 * 소비자 상세 정보 조회
 *
 * @param userId - 사용자 ID (Clerk user ID = profiles.clerk_id)
 * @returns 소비자 상세 정보
 */
export async function getConsumerDetail(userId: string): Promise<ConsumerDetail | null> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // 프로필 정보 조회 (clerk_id 기준)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      console.error("[Admin Users] Failed to fetch consumer detail:", profileError);
      return null;
    }

    // 구매 건수 조회 (orders.buyer_id = clerk_id)
    const { data: ordersData } = await supabase
      .from("orders")
      .select("id")
      .eq("buyer_id", userId);

    const purchaseCount = (ordersData || []).length;

    // 총 지출 금액 (완료된 주문 × 상품 할인가)
    const { data: completedOrders } = await supabase
      .from("orders")
      .select("products!inner(discount_price)")
      .eq("buyer_id", userId)
      .eq("status", "COMPLETED");

    const totalSpent = (completedOrders || []).reduce((sum, order: any) => {
      const product = Array.isArray(order.products) ? order.products[0] : order.products;
      return sum + (product?.discount_price || 0);
    }, 0);

    // 구한 음식 & CO2 절감 (saved_food_log, not saved_foods)
    const { data: savedFoodsData } = await supabase
      .from("saved_food_log")
      .select("co2_saved_g")
      .eq("user_id", userId);

    const savedMeals = (savedFoodsData || []).length;
    const carbonReduced = (savedFoodsData || []).reduce(
      (sum, item: any) => sum + (item.co2_saved_g || 0),
      0
    );

    // 쿠폰 현황 (user_coupons.status: 'available'|'used'|'expired')
    const { data: couponsData } = await supabase
      .from("user_coupons")
      .select("status")
      .eq("user_id", userId);

    const activeCoupons = (couponsData || []).filter((c: any) => c.status === "available").length;
    const usedCoupons = (couponsData || []).filter((c: any) => c.status === "used").length;

    // 히어로 등급 (user_hero.user_id = clerk_id)
    const { data: heroData } = await supabase
      .from("user_hero")
      .select("grade_level, total_pickup_count, total_saved_weight_g")
      .eq("user_id", userId)
      .maybeSingle();

    const gradeLevel = heroData?.grade_level ?? 0;

    // 포인트 잔액 (point_transactions.amount 합산)
    const { data: pointsData } = await supabase
      .from("point_transactions")
      .select("amount")
      .eq("user_id", userId);

    const totalPoints = Math.max(
      0,
      (pointsData || []).reduce((sum, pt: any) => sum + (pt.amount || 0), 0)
    );

    return {
      userId: profile.clerk_id,
      name: profile.nickname || "Unknown",
      email: "",
      phone: undefined,
      age: undefined,
      gender: undefined,
      profileImage: undefined,
      heroGrade: GRADE_NAMES[gradeLevel] ?? "새싹",
      heroTier: gradeLevel,
      heroProgress: 0,
      purchaseCount,
      totalSpent,
      points: totalPoints,
      savedMeals,
      carbonReduced: Math.round(carbonReduced / 1000),
      activeCoupons,
      usedCoupons,
      status: "active",
      createdAt: profile.created_at,
      lastLoginAt: undefined,
    };
  } catch (error) {
    console.error("[Admin Users] Failed to fetch consumer detail:", error);
    return null;
  }
}

/**
 * 사장님 상세 정보 조회
 *
 * @param userId - 사용자 ID (Clerk user ID = profiles.clerk_id)
 * @returns 사장님 상세 정보
 */
export async function getProducerDetail(userId: string): Promise<ProducerDetail | null> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // 프로필 정보 조회 (clerk_id 기준)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      console.error("[Admin Users] Failed to fetch producer detail:", profileError);
      return null;
    }

    // 가게 정보 조회 (stores.owner_id = clerk_id)
    const { data: store } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();

    if (!store) {
      return {
        userId: profile.clerk_id,
        name: profile.nickname || "Unknown",
        email: "",
        phone: undefined,
        profileImage: undefined,
        productCount: 0,
        totalSales: 0,
        totalOrders: 0,
        averageRating: 0,
        sellThroughRate: 0,
        commissionRate: 10,
        status: "active",
        createdAt: profile.created_at,
        lastLoginAt: undefined,
      };
    }

    // 상품 수 조회
    const { count: productCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id);

    // 완료된 주문 기반 매출 통계 (orders → products.store_id)
    const { data: completedOrdersData } = await supabase
      .from("orders")
      .select("products!inner(store_id, discount_price)")
      .eq("products.store_id", store.id)
      .eq("status", "COMPLETED");

    const totalSales = (completedOrdersData || []).reduce((sum, order: any) => {
      const product = Array.isArray(order.products) ? order.products[0] : order.products;
      return sum + (product?.discount_price || 0);
    }, 0);
    const totalOrders = (completedOrdersData || []).length;

    // 평점 조회 (reviews.store_id)
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("rating")
      .eq("store_id", store.id);

    const averageRating =
      reviewsData && reviewsData.length > 0
        ? reviewsData.reduce((sum, r: any) => sum + (r.rating || 0), 0) / reviewsData.length
        : 0;

    // 최근 정산 정보 (settlements.store_id)
    const { data: latestSettlement } = await supabase
      .from("settlements")
      .select("settled_at, commission_rate")
      .eq("store_id", store.id)
      .order("settled_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      userId: profile.clerk_id,
      name: profile.nickname || "Unknown",
      email: "",
      phone: undefined,
      profileImage: undefined,
      storeId: store.id,
      storeName: store.name,
      storeAddress: store.address,
      storePhone: store.phone,
      storeImage: store.image_url,
      productCount: productCount || 0,
      totalSales,
      totalOrders,
      averageRating: Math.round(averageRating * 10) / 10,
      sellThroughRate: 0,
      commissionRate: latestSettlement?.commission_rate ?? 10,
      lastSettlement: latestSettlement?.settled_at,
      status: "active",
      createdAt: profile.created_at,
      lastLoginAt: undefined,
    };
  } catch (error) {
    console.error("[Admin Users] Failed to fetch producer detail:", error);
    return null;
  }
}

// --------------------------------------------------------
// 회원 주문 이력
// --------------------------------------------------------

/**
 * 회원의 주문 이력 조회 (소비자용)
 *
 * @param userId - 사용자 ID (profiles.clerk_id)
 * @param limit - 조회 개수
 * @returns 주문 이력 배열
 */
export async function getUserOrders(userId: string, limit: number = 20) {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // orders.buyer_id = profiles.clerk_id (user_id가 아님)
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        created_at,
        products!inner(name, discount_price, stores!inner(name))
      `
      )
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[Admin Users] Failed to fetch user orders:", error);
      return [];
    }

    return (data || []).map((item: any) => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      const store = product?.stores
        ? Array.isArray(product.stores) ? product.stores[0] : product.stores
        : null;
      return {
        id: item.id,
        orderNumber: item.id.slice(0, 8).toUpperCase(),
        productName: product?.name || "Unknown",
        storeName: store?.name || "Unknown Store",
        amount: product?.discount_price || 0,
        status: item.status,
        createdAt: item.created_at,
      };
    });
  } catch (error) {
    console.error("[Admin Users] Failed to fetch user orders:", error);
    return [];
  }
}

// --------------------------------------------------------
// 회원 혜택 현황
// --------------------------------------------------------

/**
 * 회원의 혜택 현황 조회 (쿠폰, 포인트 등)
 *
 * @param userId - 사용자 ID (profiles.clerk_id)
 * @returns 혜택 현황
 */
export async function getUserBenefits(userId: string) {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // 쿠폰 조회 (user_coupons.user_id = profiles.clerk_id)
    const { data: couponsData } = await supabase
      .from("user_coupons")
      .select("*, coupons!inner(*)")
      .eq("user_id", userId)
      .order("acquired_at", { ascending: false });

    // 포인트 잔액 (point_transactions.amount 합산)
    const { data: pointsData } = await supabase
      .from("point_transactions")
      .select("amount")
      .eq("user_id", userId);

    const currentPoints = Math.max(
      0,
      (pointsData || []).reduce((sum, pt: any) => sum + (pt.amount || 0), 0)
    );

    return {
      coupons: couponsData || [],
      currentPoints,
      pointHistory: [],
    };
  } catch (error) {
    console.error("[Admin Users] Failed to fetch user benefits:", error);
    return {
      coupons: [],
      currentPoints: 0,
      pointHistory: [],
    };
  }
}
