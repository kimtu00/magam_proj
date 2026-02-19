/**
 * Analytics 서비스
 * 
 * 매출 분석 관련 비즈니스 로직을 처리합니다.
 */

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth,
  endOfMonth,
  format,
  subDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval
} from "date-fns";
import { ko } from "date-fns/locale";
import type {
  SalesSummary,
  DailySales,
  WeeklySales,
  MonthlySales,
  ProductSalesRank,
  SalesAnalytics
} from "./analytics.types";

export class AnalyticsService {
  /**
   * 사장님의 가게 ID를 가져옵니다.
   */
  private static async getStoreId(userId: string): Promise<string | null> {
    const supabase = await createClerkSupabaseClient();
    
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", userId)
      .single();
    
    return store?.id || null;
  }

  /**
   * 매출 요약 통계를 조회합니다.
   * 
   * @param userId - 사장님 Clerk User ID
   * @param startDate - 조회 시작일
   * @param endDate - 조회 종료일
   */
  static async getSalesSummary(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SalesSummary> {
    const storeId = await this.getStoreId(userId);
    if (!storeId) {
      return {
        totalSales: 0,
        totalOrders: 0,
        averageOrder: 0,
        completionRate: 0,
      };
    }

    const supabase = await createClerkSupabaseClient();

    // 완료된 주문 조회
    const { data: completedOrders } = await supabase
      .from("orders")
      .select(`
        id,
        quantity,
        completed_at,
        product:products!inner(
          id,
          discount_price,
          store_id
        )
      `)
      .eq("status", "COMPLETED")
      .eq("product.store_id", storeId)
      .gte("completed_at", startOfDay(startDate).toISOString())
      .lte("completed_at", endOfDay(endDate).toISOString());

    // 전체 주문 조회 (완료율 계산용)
    const { data: allOrders } = await supabase
      .from("orders")
      .select(`
        id,
        product:products!inner(
          store_id
        )
      `)
      .eq("product.store_id", storeId)
      .gte("created_at", startOfDay(startDate).toISOString())
      .lte("created_at", endOfDay(endDate).toISOString());

    const totalSales = (completedOrders || []).reduce(
      (sum, order) => {
        const product = Array.isArray(order.product) ? order.product[0] : order.product;
        return sum + ((product?.discount_price ?? 0) * order.quantity);
      },
      0
    );

    const totalOrders = completedOrders?.length || 0;
    const totalAllOrders = allOrders?.length || 0;
    const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;
    const completionRate = totalAllOrders > 0 ? (totalOrders / totalAllOrders) * 100 : 0;

    return {
      totalSales,
      totalOrders,
      averageOrder,
      completionRate,
    };
  }

  /**
   * 일별 매출 데이터를 조회합니다.
   */
  static async getDailySales(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailySales[]> {
    const storeId = await this.getStoreId(userId);
    if (!storeId) return [];

    const supabase = await createClerkSupabaseClient();

    const { data: orders } = await supabase
      .from("orders")
      .select(`
        id,
        quantity,
        completed_at,
        product:products!inner(
          id,
          discount_price,
          store_id
        )
      `)
      .eq("status", "COMPLETED")
      .eq("product.store_id", storeId)
      .gte("completed_at", startOfDay(startDate).toISOString())
      .lte("completed_at", endOfDay(endDate).toISOString())
      .order("completed_at", { ascending: true });

    // 날짜별로 그룹화
    const salesByDate = new Map<string, { sales: number; orders: number }>();
    
    // 모든 날짜를 0으로 초기화
    const allDates = eachDayOfInterval({ start: startDate, end: endDate });
    allDates.forEach(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      salesByDate.set(dateStr, { sales: 0, orders: 0 });
    });

    // 실제 데이터로 업데이트
    (orders || []).forEach(order => {
      const date = format(new Date(order.completed_at!), "yyyy-MM-dd");
      const current = salesByDate.get(date) || { sales: 0, orders: 0 };
      const product = Array.isArray(order.product) ? order.product[0] : order.product;
      
      salesByDate.set(date, {
        sales: current.sales + ((product?.discount_price ?? 0) * order.quantity),
        orders: current.orders + 1,
      });
    });

    return Array.from(salesByDate.entries())
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        orders: data.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * 주별 매출 데이터를 조회합니다.
   */
  static async getWeeklySales(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WeeklySales[]> {
    const storeId = await this.getStoreId(userId);
    if (!storeId) return [];

    const supabase = await createClerkSupabaseClient();

    const { data: orders } = await supabase
      .from("orders")
      .select(`
        id,
        quantity,
        completed_at,
        product:products!inner(
          id,
          discount_price,
          store_id
        )
      `)
      .eq("status", "COMPLETED")
      .eq("product.store_id", storeId)
      .gte("completed_at", startOfDay(startDate).toISOString())
      .lte("completed_at", endOfDay(endDate).toISOString());

    // 주별로 그룹화
    const salesByWeek = new Map<string, { sales: number; orders: number; weekStart: Date; weekEnd: Date }>();
    
    // 모든 주를 0으로 초기화
    const allWeeks = eachWeekOfInterval({ start: startDate, end: endDate }, { locale: ko });
    allWeeks.forEach(weekStart => {
      const weekEnd = endOfWeek(weekStart, { locale: ko });
      const weekKey = format(weekStart, "yyyy-MM-dd");
      salesByWeek.set(weekKey, {
        sales: 0,
        orders: 0,
        weekStart,
        weekEnd,
      });
    });

    // 실제 데이터로 업데이트
    (orders || []).forEach(order => {
      const orderDate = new Date(order.completed_at!);
      const weekStart = startOfWeek(orderDate, { locale: ko });
      const weekKey = format(weekStart, "yyyy-MM-dd");
      
      const current = salesByWeek.get(weekKey);
      if (current) {
        const product = Array.isArray(order.product) ? order.product[0] : order.product;
        salesByWeek.set(weekKey, {
          ...current,
          sales: current.sales + ((product?.discount_price ?? 0) * order.quantity),
          orders: current.orders + 1,
        });
      }
    });

    return Array.from(salesByWeek.values())
      .map(data => ({
        weekStart: format(data.weekStart, "yyyy-MM-dd"),
        weekEnd: format(data.weekEnd, "yyyy-MM-dd"),
        weekLabel: `${format(data.weekStart, "M월 ", { locale: ko })}${Math.ceil(data.weekStart.getDate() / 7)}주`,
        sales: data.sales,
        orders: data.orders,
      }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  }

  /**
   * 월별 매출 데이터를 조회합니다.
   */
  static async getMonthlySales(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MonthlySales[]> {
    const storeId = await this.getStoreId(userId);
    if (!storeId) return [];

    const supabase = await createClerkSupabaseClient();

    const { data: orders } = await supabase
      .from("orders")
      .select(`
        id,
        quantity,
        completed_at,
        product:products!inner(
          id,
          discount_price,
          store_id
        )
      `)
      .eq("status", "COMPLETED")
      .eq("product.store_id", storeId)
      .gte("completed_at", startOfMonth(startDate).toISOString())
      .lte("completed_at", endOfMonth(endDate).toISOString());

    // 월별로 그룹화
    const salesByMonth = new Map<string, { sales: number; orders: number }>();
    
    // 모든 월을 0으로 초기화
    const allMonths = eachMonthOfInterval({ start: startDate, end: endDate });
    allMonths.forEach(month => {
      const monthKey = format(month, "yyyy-MM");
      salesByMonth.set(monthKey, { sales: 0, orders: 0 });
    });

    // 실제 데이터로 업데이트
    (orders || []).forEach(order => {
      const month = format(new Date(order.completed_at!), "yyyy-MM");
      const current = salesByMonth.get(month) || { sales: 0, orders: 0 };
      const product = Array.isArray(order.product) ? order.product[0] : order.product;
      
      salesByMonth.set(month, {
        sales: current.sales + ((product?.discount_price ?? 0) * order.quantity),
        orders: current.orders + 1,
      });
    });

    return Array.from(salesByMonth.entries())
      .map(([month, data]) => ({
        month,
        monthLabel: format(new Date(month + "-01"), "yyyy년 M월", { locale: ko }),
        sales: data.sales,
        orders: data.orders,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * 상품별 매출 순위를 조회합니다.
   */
  static async getTopProducts(
    userId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<ProductSalesRank[]> {
    const storeId = await this.getStoreId(userId);
    if (!storeId) return [];

    const supabase = await createClerkSupabaseClient();

    const { data: orders } = await supabase
      .from("orders")
      .select(`
        id,
        quantity,
        product:products!inner(
          id,
          name,
          image_url,
          discount_price,
          store_id
        )
      `)
      .eq("status", "COMPLETED")
      .eq("product.store_id", storeId)
      .gte("completed_at", startOfDay(startDate).toISOString())
      .lte("completed_at", endOfDay(endDate).toISOString());

    // 상품별로 그룹화
    const salesByProduct = new Map<string, {
      name: string;
      image: string | null;
      totalSales: number;
      totalOrders: number;
      totalQuantity: number;
    }>();

    (orders || []).forEach(order => {
      const product = Array.isArray(order.product) ? order.product[0] : order.product;
      const productId = product?.id;
      if (!productId) return;
      const current = salesByProduct.get(productId) || {
        name: product?.name,
        image: product?.image_url,
        totalSales: 0,
        totalOrders: 0,
        totalQuantity: 0,
      };

      salesByProduct.set(productId, {
        ...current,
        totalSales: current.totalSales + ((product?.discount_price ?? 0) * order.quantity),
        totalOrders: current.totalOrders + 1,
        totalQuantity: current.totalQuantity + order.quantity,
      });
    });

    return Array.from(salesByProduct.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        productImage: data.image,
        totalSales: data.totalSales,
        totalOrders: data.totalOrders,
        totalQuantity: data.totalQuantity,
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit);
  }

  /**
   * 전체 매출 분석 데이터를 조회합니다.
   */
  static async getFullAnalytics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SalesAnalytics> {
    const [summary, dailySales, weeklySales, monthlySales, topProducts] = await Promise.all([
      this.getSalesSummary(userId, startDate, endDate),
      this.getDailySales(userId, startDate, endDate),
      this.getWeeklySales(userId, startDate, endDate),
      this.getMonthlySales(userId, startDate, endDate),
      this.getTopProducts(userId, startDate, endDate, 10),
    ]);

    return {
      summary,
      dailySales,
      weeklySales,
      monthlySales,
      topProducts,
    };
  }
}
