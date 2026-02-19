/**
 * @file app/mypage/receipts/page.tsx
 * @description 영수증 제출 페이지
 * 
 * 업로드 폼 + 제출 이력
 */

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ReceiptUploadForm } from "@/components/mypage/receipt-upload-form";
import { ReceiptCard } from "@/components/mypage/receipt-card";
import type { ReceiptsResponse } from "@/types/consumer";

/**
 * 영수증 내역 조회 (직접 DB 조회)
 */
async function getReceipts(userId: string): Promise<ReceiptsResponse> {
  const supabase = await createClient();

  const { data: receipts, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Receipts query error:", error);
    return {
      receipts: [],
      total: 0,
      pending_count: 0,
      approved_count: 0,
      rejected_count: 0,
    };
  }

  // 통계 계산
  const pending_count = receipts?.filter(r => r.status === "pending").length || 0;
  const approved_count = receipts?.filter(r => r.status === "approved").length || 0;
  const rejected_count = receipts?.filter(r => r.status === "rejected").length || 0;

  return {
    receipts: receipts || [],
    total: receipts?.length || 0,
    pending_count,
    approved_count,
    rejected_count,
  };
}

/**
 * 영수증 목록 렌더링
 */
async function ReceiptList({ userId }: { userId: string }) {
  const data = await getReceipts(userId);

  if (data.receipts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        제출한 영수증이 없습니다.
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          총 {data.total}건
        </div>
        <div className="flex gap-3 text-xs">
          <span className="text-muted-foreground">심사중 {data.pending_count}</span>
          <span className="text-primary">승인 {data.approved_count}</span>
          <span className="text-destructive">반려 {data.rejected_count}</span>
        </div>
      </div>
      <div className="space-y-3">
        {data.receipts.map((receipt) => (
          <ReceiptCard key={receipt.id} receipt={receipt} />
        ))}
      </div>
    </>
  );
}

/**
 * 영수증 제출 페이지
 */
export default async function MypageReceiptsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-[430px] mx-auto p-4 space-y-6">
        <PageHeader
          title="영수증 제출"
          description="영수증을 제출하고 페이백을 받으세요."
          showBackButton={true}
          backButtonFallback="/mypage"
        />

        {/* 업로드 폼 */}
        <ReceiptUploadForm />

        {/* 제출 이력 */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
            제출 내역
          </h3>
          <Suspense fallback={<ReceiptsSkeleton />}>
            <ReceiptList userId={userId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

/**
 * 영수증 목록 스켈레톤
 */
function ReceiptsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-lg border p-4 animate-pulse flex items-start gap-3"
        >
          <div className="h-16 w-16 bg-muted rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-3 w-full bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
