/**
 * @file app/admin/actions.ts
 * @description 관리자 대시보드용 Server Actions
 *
 * 이 파일은 관리자 대시보드의 전체 통계, 차트, 최근 데이터를 제공합니다.
 *
 * Server Actions:
 * - getAdminDashboardStats: 8칸 전체 통계
 * - getWeeklySalesChart: 7일 매출 차트 데이터
 * - getGradeDistribution: 등급 분포 (파이 차트)
 * - getRecentOrders: 최근 주문 10건
 * - getRecentSignups: 최근 가입 5명
 *
 * DB 컬럼 참고:
 * - profiles: id, clerk_id (not user_id), role, nickname (not name), created_at
 *   ※ profiles에 email, points, hero_grade 없음
 * - orders: id, buyer_id (not user_id), product_id, status (RESERVED/COMPLETED/CANCELED), created_at
 *   ※ order_items 테이블 없음, orders 테이블이 단건 주문
 * - saved_food_log: user_id, order_id, product_id, saved_weight_g, co2_saved_g, created_at
 *   ※ saved_foods 테이블 없음
 * - user_hero: user_id, grade_level (히어로 등급)
 * - hero_grade_config: grade_level, grade_name (등급 설정)
 *   ※ hero_grades 테이블 없음
 * - stores: id, owner_id, name, address, phone, created_at, image_url
 *   ※ stores에 status 없음 → 전체 가게 수 = 활성 가게 수
 */

"use server";

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import type {
  AdminDashboardStats,
  SalesChartData,
  GradeDistribution,
  RecentOrderAdmin,
  RecentSignup,
} from "@/types/admin";

// --------------------------------------------------------
// 대시보드 전체 통계 (8칸)
// --------------------------------------------------------

/**
 * 관리자 대시보드 전체 통계 조회
 *
 * @returns 8칸 통계 데이터
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats | null> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    const today = new Date().toISOString().split("T")[0];

    // 1. 오늘 매출 (orders → products 조인으로 discount_price 합산)
    const { data: todayOrdersData } = await supabase
      .from("orders")
      .select("products!inner(discount_price)")
      .gte("created_at", today)
      .eq("status", "COMPLETED");

    const todaySales = (todayOrdersData || []).reduce((sum, order: any) => {
      const product = Array.isArray(order.products) ? order.products[0] : order.products;
      return sum + (product?.discount_price || 0);
    }, 0);
    const todayOrders = (todayOrdersData || []).length;

    // 2. 오늘 신규 가입
    const { count: newSignups } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today);

    // 3. 총 탄소 절감 (saved_food_log.co2_saved_g 합산)
    const { data: savedFoodsData } = await supabase
      .from("saved_food_log")
      .select("co2_saved_g");

    const carbonReduced = (savedFoodsData || []).reduce(
      (sum, item: any) => sum + (item.co2_saved_g || 0),
      0
    );

    // 4. 활성 가게 (stores 테이블에 status 없으므로 전체 가게 수로 대체)
    const { count: activeStores } = await supabase
      .from("stores")
      .select("*", { count: "exact", head: true });

    // 5. 영수증 대기
    const { count: pendingReceipts } = await supabase
      .from("receipts")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // 6. 페이백 예정 금액 (point_transactions 잔액 합계)
    const { data: pointsData } = await supabase
      .from("point_transactions")
      .select("amount");

    const pendingPayback = Math.max(
      0,
      (pointsData || []).reduce((sum, pt: any) => sum + (pt.amount || 0), 0)
    );

    // 7. 총 회원
    const { count: totalMembers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    return {
      todaySales,
      todayOrders,
      newSignups: newSignups || 0,
      carbonReduced: Math.round(carbonReduced / 1000), // g → kg
      activeStores: activeStores || 0,
      pendingReceipts: pendingReceipts || 0,
      pendingPayback,
      totalMembers: totalMembers || 0,
    };
  } catch (error) {
    console.error("[Admin Dashboard] Failed to fetch stats:", error);
    return null;
  }
}

// --------------------------------------------------------
// 주간 매출 차트
// --------------------------------------------------------

/**
 * 7일 매출 차트 데이터 조회
 *
 * @returns 일별 매출 데이터 배열
 */
export async function getWeeklySalesChart(): Promise<SalesChartData[]> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // 최근 7일 날짜 생성
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split("T")[0]);
    }

    const chartData: SalesChartData[] = [];

    for (const date of dates) {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split("T")[0];

      // orders + products 조인으로 일별 매출 조회 (order_items 테이블 없음)
      const { data, error } = await supabase
        .from("orders")
        .select("products!inner(discount_price)")
        .gte("created_at", date)
        .lt("created_at", nextDateStr)
        .eq("status", "COMPLETED");

      if (error) {
        console.error(`[Admin Dashboard] Failed to fetch sales for ${date}:`, error);
        chartData.push({ date, sales: 0, orders: 0 });
        continue;
      }

      const sales = (data || []).reduce((sum, order: any) => {
        const product = Array.isArray(order.products) ? order.products[0] : order.products;
        return sum + (product?.discount_price || 0);
      }, 0);

      chartData.push({ date, sales, orders: (data || []).length });
    }

    return chartData;
  } catch (error) {
    console.error("[Admin Dashboard] Failed to fetch weekly sales:", error);
    return [];
  }
}

// --------------------------------------------------------
// 등급 분포 차트
// --------------------------------------------------------

/**
 * 히어로 등급 분포 조회 (파이 차트용)
 *
 * @returns 등급별 회원 수 및 비율
 */
export async function getGradeDistribution(): Promise<GradeDistribution[]> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // hero_grade_config에서 등급 정보 조회 (hero_grades 테이블 없음)
    const { data: gradesData, error: gradesError } = await supabase
      .from("hero_grade_config")
      .select("grade_level, grade_name")
      .eq("is_active", true)
      .order("grade_level", { ascending: true });

    if (gradesError) {
      console.error("[Admin Dashboard] Failed to fetch grades:", gradesError);
      // 기본 등급 데이터로 폴백
      return [
        { grade: "새싹", count: 0, percentage: 0 },
        { grade: "동네", count: 0, percentage: 0 },
        { grade: "나라", count: 0, percentage: 0 },
        { grade: "지구", count: 0, percentage: 0 },
      ];
    }

    // user_hero에서 등급별 회원 수 조회 (profiles.hero_grade 없음)
    const { data: heroData, error: heroError } = await supabase
      .from("user_hero")
      .select("grade_level");

    if (heroError) {
      console.error("[Admin Dashboard] Failed to fetch hero data:", heroError);
      return [];
    }

    const totalMembers = (heroData || []).length;

    // 등급별 카운트
    const gradeCount: Record<number, number> = {};
    (heroData || []).forEach((hero: any) => {
      const level = hero.grade_level ?? 0;
      gradeCount[level] = (gradeCount[level] || 0) + 1;
    });

    return (gradesData || []).map((grade: any) => {
      const count = gradeCount[grade.grade_level] || 0;
      const percentage = totalMembers > 0 ? (count / totalMembers) * 100 : 0;
      return {
        grade: grade.grade_name,
        count,
        percentage: Math.round(percentage * 10) / 10,
      };
    });
  } catch (error) {
    console.error("[Admin Dashboard] Failed to fetch grade distribution:", error);
    return [];
  }
}

// --------------------------------------------------------
// 최근 주문
// --------------------------------------------------------

/**
 * 최근 주문 조회 (관리자용)
 *
 * @param limit - 조회 개수 (기본 10)
 * @returns 최근 주문 배열
 */
export async function getRecentOrders(limit: number = 10): Promise<RecentOrderAdmin[]> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // orders + products + stores 조인 (order_items 테이블 없음)
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        created_at,
        buyer_id,
        products!inner(name, discount_price, stores!inner(name))
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[Admin Dashboard] Failed to fetch recent orders:", error);
      return [];
    }

    // 구매자 닉네임 조회 (profiles.clerk_id = orders.buyer_id)
    const buyerIds = [...new Set((data || []).map((item: any) => item.buyer_id).filter(Boolean))];

    const buyerNameMap = new Map<string, string>();
    if (buyerIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("clerk_id, nickname")
        .in("clerk_id", buyerIds);

      (profilesData || []).forEach((profile: any) => {
        buyerNameMap.set(profile.clerk_id, profile.nickname || "Unknown");
      });
    }

    return (data || []).map((item: any) => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      const store = product?.stores
        ? Array.isArray(product.stores) ? product.stores[0] : product.stores
        : null;
      return {
        id: item.id,
        orderNumber: item.id.slice(0, 8).toUpperCase(),
        customerName: buyerNameMap.get(item.buyer_id) || "Unknown",
        storeName: store?.name || "Unknown Store",
        productName: product?.name || "Unknown Product",
        amount: product?.discount_price || 0,
        status: item.status,
        createdAt: item.created_at,
      };
    });
  } catch (error) {
    console.error("[Admin Dashboard] Failed to fetch recent orders:", error);
    return [];
  }
}

// --------------------------------------------------------
// 최근 가입
// --------------------------------------------------------

/**
 * 최근 가입 회원 조회
 *
 * @param limit - 조회 개수 (기본 5)
 * @returns 최근 가입 회원 배열
 */
export async function getRecentSignups(limit: number = 5): Promise<RecentSignup[]> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // profiles.clerk_id, profiles.nickname, profiles.role 조회
    // (user_id/name/email/user_role 컬럼 없음)
    const { data, error } = await supabase
      .from("profiles")
      .select("clerk_id, nickname, role, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[Admin Dashboard] Failed to fetch recent signups:", error);
      return [];
    }

    return (data || []).map((profile: any) => ({
      userId: profile.clerk_id,
      name: profile.nickname || "Unknown",
      email: "",
      role: (profile.role === "producer" || profile.role === "SELLER"
        ? "producer"
        : "consumer") as "consumer" | "producer",
      createdAt: profile.created_at,
    }));
  } catch (error) {
    console.error("[Admin Dashboard] Failed to fetch recent signups:", error);
    return [];
  }
}
