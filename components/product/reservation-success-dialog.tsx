"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * 예약 성공 팝업 컴포넌트
 *
 * 예약이 성공적으로 완료되었을 때 표시되는 다이얼로그입니다.
 */
export function ReservationSuccessDialog({
  open,
  onOpenChange,
  orderId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string;
}) {
  const router = useRouter();

  const handleConfirm = () => {
    onOpenChange(false);
    router.push("/buyer/reservations");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">예약 완료!</DialogTitle>
          <DialogDescription className="pt-2">
            상품 예약이 성공적으로 완료되었습니다.
            {orderId && (
              <span className="mt-2 block text-xs text-muted-foreground">
                주문 번호: {orderId}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleConfirm} className="w-full">
            내 예약 확인하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
