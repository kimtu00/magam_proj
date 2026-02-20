"use client";

/**
 * @file components/admin/payback-receipt-list.tsx
 * @description 관리자 페이백 심사 - 영수증 목록 및 심사 UI 컴포넌트
 *
 * 주요 기능:
 * 1. 대기중 / 처리완료 탭 전환
 * 2. 각 영수증 카드: 사용자명, 제출일, 이미지 미리보기, 상태 뱃지
 * 3. 승인 (금액 입력) / 거절 (사유 입력) 심사 다이얼로그
 * 4. PATCH /api/admin/payback/receipts/[id] 호출 후 목록 갱신
 *
 * @dependencies
 * - @/types/admin: PaybackReceiptItem
 * - shadcn/ui: Tabs, Dialog, Badge, Button, Input, Textarea
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Calendar,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { PaybackReceiptItem } from "@/types/admin";

interface PaybackReceiptListProps {
  pending: PaybackReceiptItem[];
  history: PaybackReceiptItem[];
}

type ReviewAction = "approve" | "reject" | null;

interface ReviewState {
  receiptId: string;
  action: ReviewAction;
  paybackAmount: string;
  reason: string;
  loading: boolean;
  error: string | null;
}

/** 상태 뱃지 */
function StatusBadge({ status }: { status: PaybackReceiptItem["status"] }) {
  if (status === "pending") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        대기중
      </Badge>
    );
  }
  if (status === "approved") {
    return (
      <Badge className="gap-1 bg-green-600 hover:bg-green-700 text-white">
        <CheckCircle className="h-3 w-3" />
        승인
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" />
      거절
    </Badge>
  );
}

/** 날짜 포맷 */
function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), "yyyy.MM.dd HH:mm", { locale: ko });
  } catch {
    return dateStr;
  }
}

/** 영수증 카드 */
function ReceiptCard({
  receipt,
  onReview,
}: {
  receipt: PaybackReceiptItem;
  onReview?: (id: string, action: ReviewAction) => void;
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-5 space-y-4">
      {/* 헤더: 사용자 + 상태 */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4 text-muted-foreground" />
            {receipt.userName}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(receipt.createdAt)}
          </div>
          {receipt.orderId && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              주문 #{receipt.orderNumber || receipt.orderId.slice(0, 8).toUpperCase()}
            </div>
          )}
        </div>
        <StatusBadge status={receipt.status} />
      </div>

      {/* 영수증 이미지 */}
      <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden">
        {receipt.imageUrl ? (
          <>
            <Image
              src={receipt.imageUrl}
              alt="영수증 이미지"
              fill
              className="object-contain"
              unoptimized
            />
            <a
              href={receipt.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 bg-black/60 text-white rounded p-1 hover:bg-black/80 transition-colors"
              title="원본 보기"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            이미지 없음
          </div>
        )}
      </div>

      {/* 처리 결과 */}
      {receipt.status === "approved" && receipt.paybackAmount != null && (
        <div className="rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-4 py-2 text-sm text-green-800 dark:text-green-300">
          페이백 승인: <span className="font-bold">₩{receipt.paybackAmount.toLocaleString()}</span>
        </div>
      )}
      {receipt.status === "rejected" && receipt.rejectReason && (
        <div className="rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-800 dark:text-red-300">
          거절 사유: {receipt.rejectReason}
        </div>
      )}

      {/* 심사 버튼 (대기중만) */}
      {receipt.status === "pending" && onReview && (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onReview(receipt.id, "approve")}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            승인
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={() => onReview(receipt.id, "reject")}
          >
            <XCircle className="h-4 w-4 mr-1" />
            거절
          </Button>
        </div>
      )}
    </div>
  );
}

/** 빈 상태 */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-muted-foreground gap-3">
      <FileText className="h-10 w-10 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function PaybackReceiptList({ pending, history }: PaybackReceiptListProps) {
  const router = useRouter();

  const [reviewState, setReviewState] = useState<ReviewState>({
    receiptId: "",
    action: null,
    paybackAmount: "",
    reason: "",
    loading: false,
    error: null,
  });

  const isDialogOpen = reviewState.action !== null;

  /** 심사 다이얼로그 열기 */
  function openReview(receiptId: string, action: ReviewAction) {
    setReviewState({
      receiptId,
      action,
      paybackAmount: "",
      reason: "",
      loading: false,
      error: null,
    });
  }

  /** 다이얼로그 닫기 */
  function closeDialog() {
    setReviewState((s) => ({ ...s, action: null, error: null }));
  }

  /** 심사 제출 */
  async function submitReview() {
    const { receiptId, action, paybackAmount, reason } = reviewState;

    if (action === "approve" && !paybackAmount) {
      setReviewState((s) => ({ ...s, error: "페이백 금액을 입력해주세요." }));
      return;
    }
    if (action === "reject" && !reason.trim()) {
      setReviewState((s) => ({ ...s, error: "거절 사유를 입력해주세요." }));
      return;
    }

    setReviewState((s) => ({ ...s, loading: true, error: null }));

    try {
      const res = await fetch(`/api/admin/payback/receipts/${receiptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action === "approve" ? "approved" : "rejected",
          paybackAmount: action === "approve" ? Number(paybackAmount) : undefined,
          reason: action === "reject" ? reason.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setReviewState((s) => ({
          ...s,
          loading: false,
          error: data.error || "심사 처리에 실패했습니다.",
        }));
        return;
      }

      // 성공: 다이얼로그 닫고 페이지 새로고침
      closeDialog();
      router.refresh();
    } catch {
      setReviewState((s) => ({
        ...s,
        loading: false,
        error: "네트워크 오류가 발생했습니다.",
      }));
    }
  }

  return (
    <>
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            대기중
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs px-1">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            처리완료
            {history.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs px-1">
                {history.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 대기중 탭 */}
        <TabsContent value="pending">
          {pending.length === 0 ? (
            <EmptyState message="심사 대기 중인 영수증이 없습니다." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pending.map((receipt) => (
                <ReceiptCard
                  key={receipt.id}
                  receipt={receipt}
                  onReview={openReview}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* 처리완료 탭 */}
        <TabsContent value="history">
          {history.length === 0 ? (
            <EmptyState message="처리된 영수증이 없습니다." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {history.map((receipt) => (
                <ReceiptCard key={receipt.id} receipt={receipt} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 심사 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewState.action === "approve" ? "영수증 승인" : "영수증 거절"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {reviewState.action === "approve" ? (
              <div className="space-y-2">
                <Label htmlFor="payback-amount">페이백 금액 (원)</Label>
                <Input
                  id="payback-amount"
                  type="number"
                  min={0}
                  placeholder="예: 5000"
                  value={reviewState.paybackAmount}
                  onChange={(e) =>
                    setReviewState((s) => ({ ...s, paybackAmount: e.target.value }))
                  }
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="reject-reason">거절 사유</Label>
                <Textarea
                  id="reject-reason"
                  rows={3}
                  placeholder="거절 사유를 입력해주세요."
                  value={reviewState.reason}
                  onChange={(e) =>
                    setReviewState((s) => ({ ...s, reason: e.target.value }))
                  }
                />
              </div>
            )}

            {reviewState.error && (
              <p className="text-sm text-destructive">{reviewState.error}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog} disabled={reviewState.loading}>
              취소
            </Button>
            <Button
              onClick={submitReview}
              disabled={reviewState.loading}
              className={
                reviewState.action === "approve"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              }
            >
              {reviewState.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {reviewState.action === "approve" ? "승인 확정" : "거절 확정"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
