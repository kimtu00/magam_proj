"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./star-rating";
import { MessageSquare, Flag, Loader2 } from "lucide-react";
import { createReviewReply, reportReview } from "@/actions/review";
import { toast } from "sonner";
import type { ReviewWithDetails } from "@/services/review";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ReviewCardProps {
  review: ReviewWithDetails;
  isSeller?: boolean;
  onUpdate?: () => void;
}

/**
 * 리뷰 카드 컴포넌트
 */
export function ReviewCard({ review, isSeller = false, onUpdate }: ReviewCardProps) {
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyContent, setReplyContent] = useState(review.reply?.content || "");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const reviewDate = new Date(review.created_at);
  const dateLabel = reviewDate.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      toast.error("답글 내용을 입력해 주세요");
      return;
    }

    setIsSubmittingReply(true);

    try {
      const result = await createReviewReply(review.id, replyContent.trim());

      if (result.success) {
        toast.success("답글이 등록되었습니다");
        setIsReplyOpen(false);
        onUpdate?.();
      } else {
        toast.error("답글 등록 실패", {
          description: (result as { success: false; error: string }).error || "다시 시도해 주세요.",
        });
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast.error("오류가 발생했습니다");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error("신고 사유를 입력해 주세요");
      return;
    }

    setIsReporting(true);

    try {
      const result = await reportReview(review.id, reportReason.trim());

      if (result.success) {
        toast.success("신고가 접수되었습니다");
        setIsReportDialogOpen(false);
        setReportReason("");
      } else {
        toast.error("신고 실패", {
          description: (result as { success: false; error: string }).error || "이미 신고한 리뷰입니다.",
        });
      }
    } catch (error) {
      console.error("Error reporting review:", error);
      toast.error("오류가 발생했습니다");
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* 리뷰 헤더 */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <StarRating rating={review.rating} readonly size="sm" />
            <span className="text-sm font-medium">
              {review.buyer.nickname || "익명"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{dateLabel}</p>
        </div>

        {/* 신고 버튼 - 부적절한 리뷰 신고 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsReportDialogOpen(true)}
          className="h-8 w-8 p-0"
        >
          <Flag className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* 상품 정보 */}
      <div className="flex items-center gap-2 text-sm">
        {review.product.image_url && (
          <div className="relative h-10 w-10 rounded overflow-hidden">
            <Image
              src={review.product.image_url}
              alt={review.product.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <span className="text-muted-foreground">{review.product.name}</span>
      </div>

      {/* 리뷰 내용 */}
      {review.content && (
        <p className="text-sm whitespace-pre-wrap">{review.content}</p>
      )}

      {/* 사장님 답글 */}
      {review.reply && (
        <div className="mt-3 rounded-md bg-muted/50 p-3 space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            <span className="font-medium">사장님 답글</span>
          </div>
          <p className="text-sm">{review.reply.content}</p>
        </div>
      )}

      {/* 답글 작성 영역 (사장님만, 답글이 없을 때) */}
      {isSeller && !review.reply && (
        <div className="mt-3 space-y-2">
          {isReplyOpen ? (
            <>
              <Textarea
                placeholder="답글을 입력해 주세요"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                disabled={isSubmittingReply}
                rows={3}
                maxLength={300}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReplyOpen(false)}
                  disabled={isSubmittingReply}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitReply}
                  disabled={isSubmittingReply || !replyContent.trim()}
                >
                  {isSubmittingReply ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      등록 중...
                    </>
                  ) : (
                    "답글 등록"
                  )}
                </Button>
              </div>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReplyOpen(true)}
              className="w-full"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              답글 작성
            </Button>
          )}
        </div>
      )}

      {/* 신고 다이얼로그 */}
      <AlertDialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>리뷰 신고</AlertDialogTitle>
            <AlertDialogDescription>
              부적절한 리뷰를 신고해 주세요. 관리자가 검토 후 조치합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Textarea
            placeholder="신고 사유를 입력해 주세요"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            disabled={isReporting}
            rows={4}
            maxLength={200}
          />

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReporting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleReport();
              }}
              disabled={isReporting || !reportReason.trim()}
            >
              {isReporting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  신고 중...
                </>
              ) : (
                "신고하기"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
