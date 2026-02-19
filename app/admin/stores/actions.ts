/**
 * @file app/admin/stores/actions.ts
 * @description 가게 및 재고 관리용 Server Actions
 *
 * 이 파일은 플랫폼 전체 가게의 목록, 상세 정보, 재고 통합 뷰를 제공합니다.
 *
 * Server Actions:
 * - getStoreList: 가게 목록 조회
 * - getStoreDetail: 가게 상세 정보 조회
 * - getStoreProducts: 가게의 상품 목록 조회
 * - getInventoryList: 전체 재고 통합 목록 조회 (모든 가게)
 *
 * DB 컬럼 참고:
 * - profiles: id, clerk_id (not user_id), role, nickname (not name), created_at, address, latitude, longitude
 * - stores: id, owner_id (→ profiles.clerk_id), name, address, phone, created_at, latitude, longitude, image_url
 *   ※ stores 테이블에는 status, region, commission_rate, description, category, opening_hours 없음 → 기본값 사용
 * - orders: id, buyer_id, product_id, status (RESERVED/COMPLETED/CANCELED), created_at
 */

"use server";

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import type {
  StoreListItem,
  StoreDetail,
  InventoryItem,
  PaginatedResponse,
  StoreStatus,
} from "@/types/admin";

// --------------------------------------------------------
// 가게 목록
// --------------------------------------------------------

/**
 * 가게 목록 조회 (페이지네이션)
 *
 * @param page - 페이지 번호 (1부터 시작)
 * @param limit - 페이지 크기
 * @param search - 검색어 (가게명)
 * @param status - 가게 상태 필터 (DB에 status 컬럼 없으므로 무시됨)
 * @returns 페이지네이션된 가게 목록
 */
export async function getStoreList(
  page: number = 1,
  limit: number = 20,
  search?: string,
  status?: StoreStatus
): Promise<PaginatedResponse<StoreListItem> | null> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    const offset = (page - 1) * limit;

    let query = supabase.from("stores").select("*", { count: "exact" });

    // 검색어 적용 (stores 테이블에 status 컬럼 없으므로 status 필터 불가)
    if (search && search.trim()) {
      query = query.ilike("name", `%${search}%`);
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data: storesData, error, count } = await query;

    if (error) {
      console.error("[Admin Stores] Failed to fetch stores:", error);
      return null;
    }

    // 각 가게의 사장님 닉네임 조회 (profiles.clerk_id = stores.owner_id)
    const ownerIds = [...new Set((storesData || []).map((s) => s.owner_id).filter(Boolean))];

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

    // 각 가게의 상품 수 조회
    const storeIds = (storesData || []).map((s) => s.id).filter(Boolean);

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

    // 각 가게의 평점 조회
    const ratingMap = new Map<string, { sum: number; count: number }>();
    if (storeIds.length > 0) {
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("store_id, rating")
        .in("store_id", storeIds);

      (reviewsData || []).forEach((review: any) => {
        const current = ratingMap.get(review.store_id) || { sum: 0, count: 0 };
        ratingMap.set(review.store_id, {
          sum: current.sum + (review.rating || 0),
          count: current.count + 1,
        });
      });
    }

    const items: StoreListItem[] = (storesData || []).map((store) => {
      const rating = ratingMap.get(store.id);
      const averageRating = rating ? rating.sum / rating.count : 0;

      return {
        id: store.id,
        name: store.name,
        ownerId: store.owner_id,
        ownerName: ownerNameMap.get(store.owner_id) || "Unknown",
        address: store.address,
        region: store.address, // stores 테이블에 region 없음 → address로 대체
        productCount: productCountMap.get(store.id) || 0,
        sellThroughRate: 0,
        averageRating: Math.round(averageRating * 10) / 10,
        status: "approved" as StoreStatus, // stores 테이블에 status 없음 → 기본값
        createdAt: store.created_at,
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
    console.error("[Admin Stores] Failed to fetch store list:", error);
    return null;
  }
}

// --------------------------------------------------------
// 가게 상세 정보
// --------------------------------------------------------

/**
 * 가게 상세 정보 조회
 *
 * @param storeId - 가게 ID
 * @returns 가게 상세 정보
 */
export async function getStoreDetail(storeId: string): Promise<StoreDetail | null> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // 가게 정보 조회
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("*")
      .eq("id", storeId)
      .single();

    if (storeError || !store) {
      console.error("[Admin Stores] Failed to fetch store detail:", storeError);
      return null;
    }

    // 사장님 닉네임 조회 (profiles.clerk_id = stores.owner_id)
    const { data: owner } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("clerk_id", store.owner_id)
      .maybeSingle();

    // 상품 통계 조회 (product_status: AVAILABLE/RESERVED/SOLD/SOLD_OUT)
    const { data: productsData } = await supabase
      .from("products")
      .select("status")
      .eq("store_id", storeId);

    const productCount = (productsData || []).length;
    const activeProductCount = (productsData || []).filter(
      (p: any) => p.status === "AVAILABLE" || p.status === "RESERVED"
    ).length;

    // 완료된 주문 기반 매출 통계 (orders → products.store_id)
    const { data: completedOrdersData } = await supabase
      .from("orders")
      .select("products!inner(store_id, discount_price)")
      .eq("products.store_id", storeId)
      .eq("status", "COMPLETED");

    const totalSales = (completedOrdersData || []).reduce((sum, order: any) => {
      const product = Array.isArray(order.products) ? order.products[0] : order.products;
      return sum + (product?.discount_price || 0);
    }, 0);
    const totalOrders = (completedOrdersData || []).length;

    // 평점 및 리뷰 통계
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("rating")
      .eq("store_id", storeId);

    const reviewCount = (reviewsData || []).length;
    const averageRating =
      reviewCount > 0
        ? (reviewsData || []).reduce((sum, r: any) => sum + (r.rating || 0), 0) / reviewCount
        : 0;

    // 수수료 (settlements 테이블에서 최신 commission_rate 조회)
    const { data: latestSettlement } = await supabase
      .from("settlements")
      .select("commission_rate")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const commissionRate = latestSettlement?.commission_rate ?? 10;
    const totalCommission = (totalSales * commissionRate) / 100;

    return {
      id: store.id,
      name: store.name,
      ownerId: store.owner_id,
      ownerName: owner?.nickname || "Unknown",
      ownerEmail: "",
      address: store.address,
      phone: store.phone,
      description: undefined,
      imageUrl: store.image_url,
      category: undefined,
      openingHours: undefined,
      productCount,
      activeProductCount,
      totalSales,
      totalOrders,
      sellThroughRate: 0,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount,
      commissionRate,
      totalCommission,
      status: "approved" as StoreStatus,
      createdAt: store.created_at,
      approvedAt: undefined,
      approvedBy: undefined,
    };
  } catch (error) {
    console.error("[Admin Stores] Failed to fetch store detail:", error);
    return null;
  }
}

// --------------------------------------------------------
// 가게 상품 목록
// --------------------------------------------------------

/**
 * 가게의 상품 목록 조회
 *
 * @param storeId - 가게 ID
 * @param limit - 조회 개수
 * @returns 상품 목록 배열
 */
export async function getStoreProducts(storeId: string, limit: number = 20) {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[Admin Stores] Failed to fetch store products:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[Admin Stores] Failed to fetch store products:", error);
    return [];
  }
}

// --------------------------------------------------------
// 전체 재고 통합 목록
// --------------------------------------------------------

/**
 * 전체 재고 통합 목록 조회 (모든 가게의 상품)
 *
 * @param page - 페이지 번호
 * @param limit - 페이지 크기
 * @param filters - 필터 옵션 (카테고리, 상태, 검색어 등)
 * @returns 페이지네이션된 재고 목록
 */
export async function getInventoryList(
  page: number = 1,
  limit: number = 50,
  filters?: {
    category?: string;
    status?: string;
    search?: string;
  }
): Promise<PaginatedResponse<InventoryItem> | null> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    const offset = (page - 1) * limit;

    let query = supabase
      .from("products")
      .select("*, stores!inner(name)", { count: "exact" });

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.search && filters.search.trim()) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("[Admin Stores] Failed to fetch inventory:", error);
      return null;
    }

    const items: InventoryItem[] = (data || []).map((product: any) => {
      const store = Array.isArray(product.stores) ? product.stores[0] : product.stores;
      return {
        productId: product.id,
        productName: product.name,
        storeId: product.store_id,
        storeName: store?.name || "Unknown Store",
        category: product.category || "",
        originalPrice: product.original_price || 0,
        discountPrice: product.discount_price || 0,
        quantity: product.quantity || 0,
        reservedCount: 0, // products 테이블에 reserved_count 없음
        weight: product.weight_value || 0,
        status: product.status || "",
        deadline: product.pickup_deadline || "",
        createdAt: product.created_at,
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
    console.error("[Admin Stores] Failed to fetch inventory list:", error);
    return null;
  }
}
