"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateProductStatus } from "@/app/seller/actions";

type MarkAsSoldButtonProps = {
  productId: string;
  disabled?: boolean;
  status: "AVAILABLE" | "RESERVED" | "SOLD" | "SOLD_OUT";
};

/**
 * 판매 완료 처리 버튼
 *
 * Server Action을 호출하여 상품 상태를 SOLD로 변경합니다.
 * 
 * 비즈니스 규칙:
 * - AVAILABLE: "판매 완료 처리" 버튼 활성화
 * - RESERVED: "예약중" 버튼 비활성화 (소비자가 픽업해야 함)
 * - SOLD: "판매완료" 버튼 비활성화
 */
export function MarkAsSoldButton({
  productId,
  disabled,
  status,
}: MarkAsSoldButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (disabled || isPending) return;

    startTransition(async () => {
      const result = await updateProductStatus(productId, "SOLD");
      
      if (result.success) {
        setIsOpen(false);
        // 페이지 새로고침으로 최신 상태 반영
        window.location.reload();
      } else {
        const errorResult = result as { success: false; error: string };
        alert(errorResult.error);
      }
    });
  };

  // 상태에 따른 버튼 텍스트
  const buttonText = status === "RESERVED" 
    ? "예약중" 
    : status === "SOLD" 
    ? "판매완료"
    : status === "SOLD_OUT"
    ? "품절"
    : isPending 
    ? "처리 중..." 
    : "판매 완료 처리";
  
  // 상태에 따른 툴팁 메시지
  const tooltipMessage = status === "RESERVED"
    ? "예약 중인 상품은 소비자가 픽업해야 판매 완료됩니다"
    : status === "SOLD"
    ? "이미 판매 완료된 상품입니다"
    : status === "SOLD_OUT"
    ? "품절된 상품입니다"
    : "판매 완료로 표시하려면 클릭하세요";

  // SOLD 상태이거나 disabled이면 확인 다이얼로그 없이 버튼만 표시
  if (status === "SOLD" || disabled) {
    return (
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={true}
        className="h-8 px-3 text-xs"
        title={tooltipMessage}
      >
        {buttonText}
      </Button>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="default"
          disabled={disabled || isPending}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="h-8 px-3 text-xs"
          title={tooltipMessage}
        >
          {buttonText}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        onClick={(e) => e.stopPropagation()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>판매 완료 처리 확인</AlertDialogTitle>
          <AlertDialogDescription>
            정말로 이 상품을 판매 완료로 처리하시겠습니까?
            <br />
            <br />
            판매 완료 처리 후에는:
            <br />
            • 상품 수정이 불가능합니다
            <br />
            • 매장 판매 기능이 비활성화됩니다
            <br />
            • 소비자에게 더 이상 노출되지 않습니다
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          >
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.stopPropagation();
              handleConfirm();
            }}
            disabled={isPending}
          >
            {isPending ? "처리 중..." : "확인"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

