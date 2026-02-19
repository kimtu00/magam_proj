/**
 * @file app/admin/payback/actions.ts
 * @description 페이백 관리용 Server Actions
 *
 * 이 파일은 영수증 심사, 포인트 관리, 월간 페이백 처리, 설정을 제공합니다.
 *
 * Server Actions:
 * - getPendingReceipts: 영수증 심사 대기 목록
 * - getPaybackHistory: 페이백 처리 이력
 * - getPointStats: 포인트 통계
 * - getPaybackSettings: 페이백 설정 조회
 * - getMonthlyPaybackBatch: 월간 페이백 대상 조회
 *
 * DB 컬럼 참고:
 * - receipts: id, user_id (→ profiles.clerk_id), order_id, image_url, status, reject_reason, payback_amount, reviewed_by, reviewed_at, created_at
 * - orders: id, buyer_id (not user_id), product_id, status, created_at (order_number 없음)
 * - profiles: id, clerk_id (not user_id), nickname (not name), role, created_at
 *   ※ profiles에 points 없음 → point_transactions 테이블에서 합산
 * - bank_accounts: id, user_id (→ profiles.clerk_id), bank_name, account_number, account_holder
 * - point_transactions: id, user_id, type, amount, balance_after, description, created_at
 */

"use server";

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import type {
  PaybackReceiptItem,
  PointManagementItem,
  PaybackBatchItem,
  PaybackSettings,
} from "@/types/admin";

// --------------------------------------------------------
// 영수증 심사
// --------------------------------------------------------

/**
 * 영수증 심사 대기 목록 조회
 *
 * @param status - 영수증 상태 (선택)
 * @param limit - 조회 개수
 * @returns 영수증 심사 목록
 */
export async function getPendingReceipts(
  status?: "pending" | "approved" | "rejected",
  limit: number = 50
): Promise<PaybackReceiptItem[]> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // receipts 자체에 user_id 있음 (→ profiles.clerk_id)
    let query = supabase
      .from("receipts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Admin Payback] Failed to fetch receipts:", error);
      return [];
    }

    // 사용자 닉네임 조회 (profiles.clerk_id = receipts.user_id)
    const userIds = [...new Set((data || []).map((r: any) => r.user_id).filter(Boolean))];

    const userMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("clerk_id, nickname")
        .in("clerk_id", userIds);

      (profilesData || []).forEach((p: any) => {
        userMap.set(p.clerk_id, p.nickname || "Unknown");
      });
    }

    return (data || []).map((receipt: any) => ({
      id: receipt.id,
      userId: receipt.user_id || "",
      userName: userMap.get(receipt.user_id) || "Unknown",
      orderId: receipt.order_id || "",
      orderNumber: receipt.order_id ? receipt.order_id.slice(0, 8).toUpperCase() : "",
      imageUrl: receipt.image_url || "",
      status: receipt.status,
      rejectReason: receipt.reject_reason,
      paybackAmount: receipt.payback_amount,
      reviewedBy: receipt.reviewed_by,
      reviewedAt: receipt.reviewed_at,
      createdAt: receipt.created_at,
    }));
  } catch (error) {
    console.error("[Admin Payback] Failed to fetch pending receipts:", error);
    return [];
  }
}

/**
 * 페이백 처리 이력 조회
 *
 * @param limit - 조회 개수
 * @returns 처리 이력 배열
 */
export async function getPaybackHistory(limit: number = 50) {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // receipts.user_id 로 직접 조회 (orders join 불필요)
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .in("status", ["approved", "rejected"])
      .order("reviewed_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[Admin Payback] Failed to fetch payback history:", error);
      return [];
    }

    // 사용자 닉네임 조회
    const userIds = [...new Set((data || []).map((r: any) => r.user_id).filter(Boolean))];

    const userMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("clerk_id, nickname")
        .in("clerk_id", userIds);

      (profilesData || []).forEach((p: any) => {
        userMap.set(p.clerk_id, p.nickname || "Unknown");
      });
    }

    return (data || []).map((receipt: any) => ({
      id: receipt.id,
      userId: receipt.user_id || "",
      userName: userMap.get(receipt.user_id) || "Unknown",
      orderId: receipt.order_id || "",
      status: receipt.status,
      paybackAmount: receipt.payback_amount,
      reviewedBy: receipt.reviewed_by,
      reviewedAt: receipt.reviewed_at,
    }));
  } catch (error) {
    console.error("[Admin Payback] Failed to fetch payback history:", error);
    return [];
  }
}

// --------------------------------------------------------
// 포인트 관리
// --------------------------------------------------------

/**
 * 포인트 관리 목록 조회
 * (point_transactions 테이블에서 user별 잔액 계산)
 *
 * @param limit - 조회 개수
 * @returns 포인트 관리 목록
 */
export async function getPointStats(
  limit: number = 50
): Promise<PointManagementItem[]> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // point_transactions에서 user_id별 합계 계산
    const { data: txData, error: txError } = await supabase
      .from("point_transactions")
      .select("user_id, amount, type, created_at");

    if (txError) {
      console.error("[Admin Payback] Failed to fetch point transactions:", txError);
      return [];
    }

    // user_id별 잔액 및 통계 집계
    const userStats = new Map<string, {
      balance: number;
      lifetimeEarned: number;
      lifetimeSpent: number;
      lastTransaction?: string;
    }>();

    (txData || []).forEach((tx: any) => {
      const uid = tx.user_id;
      if (!uid) return;
      const current = userStats.get(uid) || {
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        lastTransaction: undefined,
      };
      current.balance += tx.amount || 0;
      if ((tx.amount || 0) > 0) current.lifetimeEarned += tx.amount;
      if ((tx.amount || 0) < 0) current.lifetimeSpent += Math.abs(tx.amount);
      if (!current.lastTransaction || tx.created_at > current.lastTransaction) {
        current.lastTransaction = tx.created_at;
      }
      userStats.set(uid, current);
    });

    // 잔액 > 0 인 사용자만, 잔액 내림차순으로 정렬 후 limit 적용
    const topUsers = Array.from(userStats.entries())
      .filter(([, stats]) => stats.balance > 0)
      .sort(([, a], [, b]) => b.balance - a.balance)
      .slice(0, limit);

    if (topUsers.length === 0) return [];

    // 닉네임 조회
    const userIds = topUsers.map(([uid]) => uid);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("clerk_id, nickname")
      .in("clerk_id", userIds);

    const nameMap = new Map(
      (profilesData || []).map((p: any) => [p.clerk_id, p.nickname || "Unknown"])
    );

    return topUsers.map(([uid, stats]) => ({
      userId: uid,
      userName: nameMap.get(uid) || "Unknown",
      currentPoints: stats.balance,
      lifetimeEarned: stats.lifetimeEarned,
      lifetimeSpent: stats.lifetimeSpent,
      lastTransaction: stats.lastTransaction,
    }));
  } catch (error) {
    console.error("[Admin Payback] Failed to fetch point stats:", error);
    return [];
  }
}

// --------------------------------------------------------
// 월간 페이백 처리
// --------------------------------------------------------

/**
 * 월간 페이백 대상 조회
 * (최소 금액 이상 포인트 보유 사용자 + 계좌 정보 조합)
 *
 * @param minAmount - 최소 페이백 금액 (기본 10,000)
 * @returns 페이백 대상 배열
 */
export async function getMonthlyPaybackBatch(
  minAmount: number = 10000
): Promise<PaybackBatchItem[]> {
  try {
    await requireAdmin();
    const supabase = await createClerkSupabaseClient();

    // point_transactions에서 user별 잔액 계산
    const { data: txData, error: txError } = await supabase
      .from("point_transactions")
      .select("user_id, amount");

    if (txError) {
      console.error("[Admin Payback] Failed to fetch transactions for payback:", txError);
      return [];
    }

    // user별 잔액
    const balanceMap = new Map<string, number>();
    (txData || []).forEach((tx: any) => {
      if (!tx.user_id) return;
      balanceMap.set(tx.user_id, (balanceMap.get(tx.user_id) || 0) + (tx.amount || 0));
    });

    // 최소 금액 이상인 사용자 필터링
    const eligibleUserIds = Array.from(balanceMap.entries())
      .filter(([, balance]) => balance >= minAmount)
      .map(([uid]) => uid);

    if (eligibleUserIds.length === 0) return [];

    // 사용자 닉네임 조회
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("clerk_id, nickname")
      .in("clerk_id", eligibleUserIds);

    const nameMap = new Map(
      (profilesData || []).map((p: any) => [p.clerk_id, p.nickname || "Unknown"])
    );

    // 계좌 정보 조회 (bank_accounts.user_id = profiles.clerk_id)
    const { data: accountsData } = await supabase
      .from("bank_accounts")
      .select("user_id, bank_name, account_number, account_holder")
      .in("user_id", eligibleUserIds);

    const accountMap = new Map(
      (accountsData || []).map((a: any) => [a.user_id, a])
    );

    return eligibleUserIds.map((uid) => {
      const account = accountMap.get(uid);
      return {
        userId: uid,
        userName: nameMap.get(uid) || "Unknown",
        bankName: account?.bank_name || "계좌 미등록",
        accountNumber: account?.account_number || "—",
        accountHolder: account?.account_holder || nameMap.get(uid) || "Unknown",
        paybackAmount: balanceMap.get(uid) || 0,
        status: "pending" as const,
        processedAt: undefined,
      };
    });
  } catch (error) {
    console.error("[Admin Payback] Failed to fetch monthly payback batch:", error);
    return [];
  }
}

// --------------------------------------------------------
// 페이백 설정
// --------------------------------------------------------

/**
 * 페이백 설정 조회 (기본값 반환)
 *
 * @returns 페이백 설정
 */
export async function getPaybackSettings(): Promise<PaybackSettings | null> {
  try {
    await requireAdmin();
    return {
      pointsPerPurchase: 5,
      minPaybackAmount: 10000,
      paybackDay: 1,
      receiptValidDays: 30,
    };
  } catch (error) {
    console.error("[Admin Payback] Failed to fetch payback settings:", error);
    return null;
  }
}
