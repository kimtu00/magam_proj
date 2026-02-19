/**
 * @file app/store-admin/settlement/actions.ts
 * @description 정산 관리 Server Actions
 *
 * 주요 기능:
 * - getSettlementSummary: 이번 달 정산 요약 (실시간 계산)
 * - getSettlementHistory: 월별 정산 이력 (settlements 테이블)
 * - getDailySettlement: 일별 매출 상세 (특정 월)
 * - getStoreBank: 정산 계좌 정보
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
  SettlementSummary,
  SettlementData,
  DailySettlement,
  SettlementBankAccount,
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
 * 이번 달 정산 요약을 조회합니다.
 * (실시간으로 orders 테이블 기반 계산)
 *
 * @returns 이번 달 총 매출, 수수료, 정산 예정 금액
 */
export async function getSettlementSummary(): Promise<SettlementSummary | null> {
  const store = await getMyStore();

  if (!store) {
    return null;
  }

  const supabase = await createClerkSupabaseClient();

  // 이번 달 시작일과 종료일
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  // RPC 함수 호출: calculate_settlement
  const { data, error } = await supabase.rpc("calculate_settlement", {
    p_store_id: store.id,
    p_period_start: periodStart,
    p_period_end: periodEnd,
  });

  if (error) {
    console.error("Failed to calculate settlement:", error);
    return null;
  }

  if (!data || data.length === 0) {
    // 데이터가 없으면 0으로 반환
    return {
      totalSales: 0,
      totalOrders: 0,
      commissionRate: 10.0,
      commissionAmount: 0,
      settlementAmount: 0,
      settlementDate: getNextSettlementDate(),
    };
  }

  const result = data[0];

  return {
    totalSales: result.total_sales || 0,
    totalOrders: result.total_orders || 0,
    commissionRate: 10.0, // 기본 수수료율
    commissionAmount: result.commission_amount || 0,
    settlementAmount: result.settlement_amount || 0,
    settlementDate: getNextSettlementDate(),
  };
}

/**
 * 다음 정산일을 계산합니다. (매월 5일)
 */
function getNextSettlementDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // 이번 달 5일이 지났으면 다음 달 5일
  const settlementDay = 5;
  const settlementDate =
    now.getDate() < settlementDay
      ? new Date(year, month, settlementDay)
      : new Date(year, month + 1, settlementDay);

  return settlementDate.toISOString().split("T")[0];
}

/**
 * 월별 정산 이력을 조회합니다.
 * (settlements 테이블 조회)
 *
 * @param limit - 조회할 개수 (기본 12개월)
 * @returns 월별 정산 이력
 */
export async function getSettlementHistory(
  limit: number = 12
): Promise<SettlementData[]> {
  const store = await getMyStore();

  if (!store) {
    return [];
  }

  const supabase = await createClerkSupabaseClient();

  const { data, error } = await supabase
    .from("settlements")
    .select("*")
    .eq("store_id", store.id)
    .order("period_start", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch settlement history:", error);
    return [];
  }

  return (
    data?.map((row) => ({
      id: row.id,
      storeId: row.store_id,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      totalSales: row.total_sales,
      totalOrders: row.total_orders,
      commissionRate: parseFloat(row.commission_rate),
      commissionAmount: row.commission_amount,
      settlementAmount: row.settlement_amount,
      status: row.status as
        | "pending"
        | "processing"
        | "completed"
        | "failed",
      settledAt: row.settled_at || undefined,
      createdAt: row.created_at,
    })) || []
  );
}

/**
 * 일별 매출 상세를 조회합니다.
 * (특정 월의 일별 매출 내역)
 *
 * @param month - 조회할 월 (YYYY-MM 형식, 기본 이번 달)
 * @returns 일별 매출 상세
 */
export async function getDailySettlement(
  month?: string
): Promise<DailySettlement[]> {
  const store = await getMyStore();

  if (!store) {
    return [];
  }

  const supabase = await createClerkSupabaseClient();

  // 월 파라미터 파싱
  const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM
  const [year, monthNum] = targetMonth.split("-").map(Number);

  const startDate = new Date(year, monthNum - 1, 1)
    .toISOString()
    .split("T")[0];
  const endDate = new Date(year, monthNum, 0).toISOString().split("T")[0];

  // RPC 함수 호출: get_daily_sales
  const { data, error } = await supabase.rpc("get_daily_sales", {
    p_store_id: store.id,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error("Failed to fetch daily settlement:", error);
    return [];
  }

  return (
    data?.map((row) => ({
      saleDate: row.sale_date,
      ordersCount: row.orders_count || 0,
      totalSales: row.total_sales || 0,
      commissionAmount: row.commission_amount || 0,
      settlementAmount: row.settlement_amount || 0,
    })) || []
  );
}

/**
 * 정산 계좌 정보를 조회합니다.
 * (bank_accounts 테이블 재활용)
 *
 * @returns 정산 계좌 정보
 */
export async function getStoreBank(): Promise<SettlementBankAccount | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const supabase = await createClerkSupabaseClient();

  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch bank account:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    bankName: data.bank_name,
    accountNumber: data.account_number,
    accountHolder: data.account_holder,
    isPrimary: data.is_primary,
  };
}
