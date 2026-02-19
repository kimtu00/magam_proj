/**
 * @file app/mypage/points/page.tsx
 * @description 포인트 페이지
 * 
 * 포인트 요약 + 거래 내역 + 계좌 정보
 */

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { PointSummary } from "@/components/mypage/point-summary";
import { PointHistory } from "@/components/mypage/point-history";
import { BankAccountCard } from "@/components/mypage/bank-account-card";
import type { PointData, PointSummary as PointSummaryType, BankAccountData } from "@/types/consumer";

/**
 * 포인트 데이터 조회 (직접 DB 조회)
 */
async function getPointData(userId: string): Promise<PointData> {
  const supabase = await createClient();

  // 1. 현재 포인트 잔액
  const { data: balance } = await supabase.rpc("get_point_balance", {
    p_user_id: userId,
  });

  const currentBalance = (balance as number) || 0;

  // 2. 평생 적립/사용 통계
  const { data: transactions } = await supabase
    .from("point_transactions")
    .select("type, amount")
    .eq("user_id", userId);

  const lifetimeEarned = transactions
    ?.filter(t => t.type === "earn" || t.type === "payback")
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  const lifetimeSpent = Math.abs(
    transactions
      ?.filter(t => t.type === "spend" || t.type === "expire")
      .reduce((sum, t) => sum + t.amount, 0) || 0
  );

  // 3. 다음 페이백 정보
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextPaybackAmount = Math.floor(currentBalance * 0.05);

  // 4. 최근 거래 내역 (최근 5건)
  const { data: recentTransactions } = await supabase
    .from("point_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const summary: PointSummaryType = {
    current_balance: currentBalance,
    next_payback: {
      amount: nextPaybackAmount,
      date: nextMonth.toISOString(),
    },
    lifetime_earned: lifetimeEarned,
    lifetime_spent: lifetimeSpent,
  };

  return {
    summary,
    recent_transactions: recentTransactions || [],
  };
}

/**
 * 계좌 정보 조회 (직접 DB 조회)
 */
async function getBankAccount(userId: string): Promise<BankAccountData | null> {
  const supabase = await createClient();

  const { data: bankAccount, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("user_id", userId)
    .single();

  // 계좌가 없는 경우 (첫 등록 전)
  if (error && error.code === "PGRST116") {
    return null;
  }

  if (error) {
    console.error("Bank account query error:", error);
    return null;
  }

  return bankAccount;
}

/**
 * 포인트 페이지
 */
export default async function MypagePointsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [pointData, bankAccount] = await Promise.all([
    getPointData(userId),
    getBankAccount(userId),
  ]);

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-[430px] mx-auto p-4 space-y-6">
        <PageHeader
          title="포인트"
          description="포인트 적립 및 사용 내역을 확인하세요."
          showBackButton={true}
          backButtonFallback="/mypage"
        />

        {/* 포인트 요약 */}
        <PointSummary summary={pointData.summary} />

        {/* 계좌 정보 */}
        <BankAccountCard account={bankAccount} />

        {/* 거래 내역 */}
        <PointHistory transactions={pointData.recent_transactions} />
      </div>
    </div>
  );
}
