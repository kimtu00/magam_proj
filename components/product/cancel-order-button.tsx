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
} from "@/components/ui/alert-dialog";
import { cancelOrder } from "@/app/buyer/actions";
import { Loader2 } from "lucide-react";

interface CancelOrderButtonProps {
  orderId: string;
  productName: string;
}

/**
 * 예약 취소 버튼 컴포넌트
 * 
 * RESERVED 상태의 예약을 취소할 수 있는 버튼입니다.
 * 클릭 시 확인 다이얼로그를 표시하고, 확인 후 Server Action을 호출합니다.
 */
export function CancelOrderButton({ orderId, productName }: CancelOrderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCancel = () => {
    setError(null);
    startTransition(async () => {
      const result = await cancelOrder(orderId);
      
      if (!result.success) {
        setError((result as { success: false; error: string }).error || "예약 취소에 실패했습니다.");
      } else {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        disabled={isPending}
        className="text-destructive hover:text-destructive"
      >
        예약 취소
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>예약을 취소하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{productName}&quot; 상품의 예약이 취소됩니다.
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              돌아가기
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              취소하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


