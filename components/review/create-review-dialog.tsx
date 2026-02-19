"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./star-rating";
import { Loader2 } from "lucide-react";
import { createReview } from "@/actions/review";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CreateReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  storeId: string;
  productId: string;
  productName: string;
}

/**
 * 리뷰 작성 다이얼로그
 */
export function CreateReviewDialog({
  open,
  onOpenChange,
  orderId,
  storeId,
  productId,
  productName,
}: CreateReviewDialogProps) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      toast.error("별점을 선택해 주세요");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createReview(
        orderId,
        storeId,
        productId,
        rating,
        content.trim() || undefined
      );

      if (result.success) {
        toast.success("리뷰가 작성되었습니다");
        onOpenChange(false);
        setRating(5);
        setContent("");
        router.refresh();
      } else {
        toast.error("리뷰 작성 실패", {
          description: (result as { success: false; error: string }).error || "다시 시도해 주세요.",
        });
      }
    } catch (error) {
      console.error("Error creating review:", error);
      toast.error("오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>리뷰 작성</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 별점 선택 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">별점</label>
            <div className="flex justify-center">
              <StarRating rating={rating} onRatingChange={setRating} size="lg" />
            </div>
          </div>

          {/* 리뷰 내용 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">리뷰 (선택사항)</label>
            <Textarea
              placeholder="상품은 어떠셨나요? 다른 고객들에게 도움이 되는 리뷰를 남겨주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/500
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || rating < 1}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  작성 중...
                </>
              ) : (
                "리뷰 등록"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
