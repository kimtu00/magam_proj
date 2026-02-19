/**
 * @file app/admin/finance/actions.ts
 * @description 재무/수익 관리용 Server Actions (Super Admin 전용)
 *
 * 이 파일은 플랫폼의 현금 흐름, 재무제표, 수익성 분석을 제공합니다.
 *
 * Server Actions:
 * - getCashFlow: 기간별 현금 흐름 조회
 * - getDailyCashFlow: 일별 현금 흐름 테이블
 * - getFinancialStatement: 재무제표 (손익계산서, 대차대조표)
 * - getProfitability: 수익성 분석
 * - getStoreProfitability: 가게별 수익 기여도
 */

"use server";

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import type {
  CashFlowData,
  DailyCashFlow,
  IncomeStatement,
  BalanceSheet,
  ProfitabilityData,
  StoreContribution,
  UnitEconomics,
} from "@/types/admin";

// --------------------------------------------------------
// 현금 흐름
// --------------------------------------------------------

/**
 * 기간별 현금 흐름 조회
 *
 * @param period - 기간 (YYYY-MM 형식)
 * @returns 현금 흐름 데이터
 */
export async function getCashFlow(period: string): Promise<CashFlowData | null> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    const startDate = `${period}-01`;
    const endDate = new Date(
      new Date(startDate).getFullYear(),
      new Date(startDate).getMonth() + 1,
      0
    )
      .toISOString()
      .split("T")[0];

    // 유입 (매출)
    const { data: salesData, error: salesError } = await supabase
      .from("order_items")
      .select("discount_price")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .eq("status", "PICKUP_COMPLETE");

    if (salesError) {
      console.error("[Admin Finance] Failed to fetch sales:", salesError);
    }

    const inflow = (salesData || []).reduce(
      (sum, item: any) => sum + (item.discount_price || 0),
      0
    );

    // 유출 (정산 + 운영비)
    const { data: settlementsData, error: settlementsError } = await supabase
      .from("settlements")
      .select("settlement_amount")
      .gte("period_start", startDate)
      .lte("period_end", endDate)
      .eq("status", "completed");

    if (settlementsError) {
      console.error("[Admin Finance] Failed to fetch settlements:", settlementsError);
    }

    const settlements = (settlementsData || []).reduce(
      (sum, s: any) => sum + (s.settlement_amount || 0),
      0
    );

    // 운영비 (임시: 매출의 10%로 가정)
    const operations = inflow * 0.1;

    const outflow = settlements + operations;
    const netFlow = inflow - outflow;

    return {
      period,
      inflow,
      outflow,
      netFlow,
    };
  } catch (error) {
    console.error("[Admin Finance] Failed to fetch cash flow:", error);
    return null;
  }
}

/**
 * 일별 현금 흐름 조회
 *
 * @param period - 기간 (YYYY-MM 형식)
 * @returns 일별 현금 흐름 배열
 */
export async function getDailyCashFlow(period: string): Promise<DailyCashFlow[]> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    const startDate = `${period}-01`;
    const year = new Date(startDate).getFullYear();
    const month = new Date(startDate).getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dailyData: DailyCashFlow[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${period}-${String(day).padStart(2, "0")}`;
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split("T")[0];

      // 일별 매출
      const { data: salesData } = await supabase
        .from("order_items")
        .select("discount_price")
        .gte("created_at", date)
        .lt("created_at", nextDateStr)
        .eq("status", "PICKUP_COMPLETE");

      const sales = (salesData || []).reduce(
        (sum, item: any) => sum + (item.discount_price || 0),
        0
      );

      // 일별 정산
      const { data: settlementsData } = await supabase
        .from("settlements")
        .select("settlement_amount")
        .eq("settled_at::date", date)
        .eq("status", "completed");

      const settlements = (settlementsData || []).reduce(
        (sum, s: any) => sum + (s.settlement_amount || 0),
        0
      );

      const operations = sales * 0.1; // 운영비 (임시)
      const net = sales - settlements - operations;

      dailyData.push({
        date,
        sales,
        settlements,
        operations,
        net,
      });
    }

    return dailyData;
  } catch (error) {
    console.error("[Admin Finance] Failed to fetch daily cash flow:", error);
    return [];
  }
}

// --------------------------------------------------------
// 재무제표
// --------------------------------------------------------

/**
 * 손익계산서 조회
 *
 * @param period - 기간 (YYYY-MM 형식)
 * @returns 손익계산서
 */
export async function getIncomeStatement(period: string): Promise<IncomeStatement | null> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    const startDate = `${period}-01`;
    const endDate = new Date(
      new Date(startDate).getFullYear(),
      new Date(startDate).getMonth() + 1,
      0
    )
      .toISOString()
      .split("T")[0];

    // 매출액
    const { data: salesData } = await supabase
      .from("order_items")
      .select("discount_price")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .eq("status", "PICKUP_COMPLETE");

    const revenue = (salesData || []).reduce(
      (sum, item: any) => sum + (item.discount_price || 0),
      0
    );

    // 수수료 수익 (매출의 10%로 가정)
    const commissionRevenue = revenue * 0.1;

    // 운영비 (매출의 5%로 가정)
    const operatingExpenses = revenue * 0.05;

    const grossProfit = commissionRevenue;
    const operatingProfit = commissionRevenue - operatingExpenses;
    const netProfit = operatingProfit;

    return {
      period,
      revenue,
      commissionRevenue,
      operatingExpenses,
      grossProfit,
      operatingProfit,
      netProfit,
    };
  } catch (error) {
    console.error("[Admin Finance] Failed to fetch income statement:", error);
    return null;
  }
}

/**
 * 대차대조표 조회
 *
 * @param asOf - 기준일 (YYYY-MM-DD 형식)
 * @returns 대차대조표
 */
export async function getBalanceSheet(asOf: string): Promise<BalanceSheet | null> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // 현금 (총 누적 순이익으로 가정)
    const cash = 10000000; // 임시 값

    // 미수금 (승인 대기 중인 페이백)
    const { data: pendingPaybackData } = await supabase
      .from("profiles")
      .select("points");

    const receivables = (pendingPaybackData || []).reduce(
      (sum, p: any) => sum + (p.points || 0),
      0
    );

    // 미지급금 (정산 대기 중인 금액)
    const { data: pendingSettlementsData } = await supabase
      .from("settlements")
      .select("settlement_amount")
      .eq("status", "pending");

    const payables = (pendingSettlementsData || []).reduce(
      (sum, s: any) => sum + (s.settlement_amount || 0),
      0
    );

    const assets = {
      cash,
      receivables,
      total: cash + receivables,
    };

    const liabilities = {
      payables,
      total: payables,
    };

    const equity = {
      capital: 10000000, // 자본금 (임시)
      retainedEarnings: assets.total - liabilities.total - 10000000,
      total: assets.total - liabilities.total,
    };

    return {
      asOf,
      assets,
      liabilities,
      equity,
    };
  } catch (error) {
    console.error("[Admin Finance] Failed to fetch balance sheet:", error);
    return null;
  }
}

// --------------------------------------------------------
// 수익성 분석
// --------------------------------------------------------

/**
 * 수익성 분석 조회
 *
 * @param period - 기간 (YYYY-MM 형식)
 * @returns 수익성 데이터
 */
export async function getProfitability(period: string): Promise<ProfitabilityData | null> {
  try {
    await requireAdmin();

    // 손익계산서 기반 계산
    const statement = await getIncomeStatement(period);
    if (!statement) return null;

    const revenueGrowth = 5.0; // 임시: 전월 대비 5% 성장
    const profitMargin =
      statement.revenue > 0 ? (statement.netProfit / statement.revenue) * 100 : 0;
    const roi = 15.0; // 임시
    const ltv = 150000; // 고객 생애 가치 (임시)
    const cac = 30000; // 고객 획득 비용 (임시)

    return {
      period,
      revenueGrowth,
      profitMargin: Math.round(profitMargin * 10) / 10,
      roi,
      ltv,
      cac,
    };
  } catch (error) {
    console.error("[Admin Finance] Failed to fetch profitability:", error);
    return null;
  }
}

/**
 * 가게별 수익 기여도 조회
 *
 * @param period - 기간 (YYYY-MM 형식, 선택)
 * @returns 가게별 기여도 배열
 */
export async function getStoreProfitability(
  period?: string
): Promise<StoreContribution[]> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    let query = supabase.from("order_items").select(
      `
      discount_price,
      products!inner(store_id, stores!inner(name))
    `
    );

    if (period) {
      const startDate = `${period}-01`;
      const endDate = new Date(
        new Date(startDate).getFullYear(),
        new Date(startDate).getMonth() + 1,
        0
      )
        .toISOString()
        .split("T")[0];

      query = query.gte("created_at", startDate).lte("created_at", endDate);
    }

    query = query.eq("status", "PICKUP_COMPLETE");

    const { data, error } = await query;

    if (error) {
      console.error("[Admin Finance] Failed to fetch store profitability:", error);
      return [];
    }

    // 가게별 매출 집계
    const storeStats = new Map<
      string,
      { name: string; sales: number; orders: number }
    >();

    (data || []).forEach((item: any) => {
      const storeId = item.products?.store_id;
      const storeName = item.products?.stores?.name || "Unknown";

      if (!storeId) return;

      const current = storeStats.get(storeId) || {
        name: storeName,
        sales: 0,
        orders: 0,
      };
      storeStats.set(storeId, {
        name: current.name,
        sales: current.sales + (item.discount_price || 0),
        orders: current.orders + 1,
      });
    });

    const totalSales = Array.from(storeStats.values()).reduce(
      (sum, s) => sum + s.sales,
      0
    );

    // 기여도 계산
    const contributions: StoreContribution[] = [];

    storeStats.forEach((stats, storeId) => {
      const commission = stats.sales * 0.1; // 10% 수수료
      const contribution = totalSales > 0 ? (stats.sales / totalSales) * 100 : 0;

      contributions.push({
        storeId,
        storeName: stats.name,
        totalSales: stats.sales,
        commission,
        contribution: Math.round(contribution * 10) / 10,
        orderCount: stats.orders,
      });
    });

    // 기여도 순으로 정렬
    contributions.sort((a, b) => b.contribution - a.contribution);

    return contributions;
  } catch (error) {
    console.error("[Admin Finance] Failed to fetch store profitability:", error);
    return [];
  }
}

/**
 * 단위 경제학 조회
 *
 * @returns 단위 경제학 데이터
 */
export async function getUnitEconomics(): Promise<UnitEconomics | null> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // 평균 주문 금액
    const { data: orderItemsData } = await supabase
      .from("order_items")
      .select("discount_price")
      .eq("status", "PICKUP_COMPLETE");

    const totalSales = (orderItemsData || []).reduce(
      (sum, item: any) => sum + (item.discount_price || 0),
      0
    );
    const orderCount = (orderItemsData || []).length;

    const averageOrderValue = orderCount > 0 ? totalSales / orderCount : 0;
    const averageCommission = averageOrderValue * 0.1; // 10% 수수료
    const averageCost = averageOrderValue * 0.05; // 5% 비용
    const averageProfit = averageCommission - averageCost;

    const breakEvenOrders = averageCost > 0 ? 100 / averageCost : 0; // 임시

    return {
      averageOrderValue: Math.round(averageOrderValue),
      averageCommission: Math.round(averageCommission),
      averageCost: Math.round(averageCost),
      averageProfit: Math.round(averageProfit),
      breakEvenOrders: Math.round(breakEvenOrders),
    };
  } catch (error) {
    console.error("[Admin Finance] Failed to fetch unit economics:", error);
    return null;
  }
}
