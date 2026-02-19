"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { reserveProduct } from "@/app/buyer/actions";
import { ReservationSuccessDialog } from "./reservation-success-dialog";
import { Loader2, Plus, Minus, AlertCircle, Clock } from "lucide-react";

interface ReserveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  maxQuantity: number;
  pickupDeadline: string;
}

/**
 * 예약 다이얼로그 컴포넌트
 * 
 * 수량과 픽업 시간을 선택하여 상품을 예약할 수 있습니다.
 */
export function ReserveDialog({
  open,
  onOpenChange,
  productId,
  productName,
  maxQuantity,
  pickupDeadline,
}: ReserveDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [preferredPickupTime, setPreferredPickupTime] = useState<Date | undefined>(
    new Date(pickupDeadline)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQuantityChange = (value: number) => {
    const newQuantity = Math.max(1, Math.min(value, maxQuantity));
    setQuantity(newQuantity);
    
    if (value > maxQuantity) {
      setErrorMessage(`재고 수량(${maxQuantity}개)을 초과할 수 없습니다.`);
    } else {
      setErrorMessage(null);
    }
  };

  const handleReserve = async () => {
    if (quantity < 1 || quantity > maxQuantity) {
      setErrorMessage(`수량은 1개 이상 ${maxQuantity}개 이하여야 합니다.`);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const pickupTimeString = preferredPickupTime 
        ? preferredPickupTime.toISOString() 
        : undefined;

      const result = await reserveProduct(productId, quantity, pickupTimeString);

      if (result.success === false) {
        setErrorMessage(result.message || "예약에 실패했습니다.");
      } else {
        setOrderId(result.order_id);
        onOpenChange(false); // 다이얼로그 닫기
        setIsSuccessDialogOpen(true);
        // 상태 초기화
        setQuantity(1);
        setPreferredPickupTime(new Date(pickupDeadline));
        setErrorMessage(null);
      }
    } catch (error) {
      console.error("Error reserving product:", error);
      setErrorMessage("시스템 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const isOutOfStock = maxQuantity <= 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{productName}</DialogTitle>
            <DialogDescription>
              예약 수량과 픽업 희망 시간을 선택해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 재고 정보 */}
            {!isOutOfStock && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    현재 재고
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {maxQuantity}개
                  </span>
                </div>
              </div>
            )}

            {/* 수량 선택 */}
            {!isOutOfStock && (
              <div className="space-y-2">
                <label className="text-sm font-medium">예약 수량</label>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1 || isLoading}
                    className="h-8 w-8"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max={maxQuantity}
                    value={quantity}
                    onChange={(e) => {
                      const value = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                      if (!isNaN(value)) {
                        handleQuantityChange(value);
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (isNaN(value) || value < 1) {
                        setQuantity(1);
                      } else if (value > maxQuantity) {
                        setQuantity(maxQuantity);
                        setErrorMessage(`재고 수량(${maxQuantity}개)을 초과할 수 없습니다.`);
                      }
                    }}
                    disabled={isLoading}
                    className="w-16 text-center"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= maxQuantity || isLoading}
                    className="h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* 픽업 희망 시간 선택 */}
            {!isOutOfStock && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  픽업 희망 시간 (선택)
                </label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <DateTimePicker
                    value={preferredPickupTime}
                    onChange={setPreferredPickupTime}
                    maxDate={new Date(pickupDeadline)}
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  마감:{" "}
                  {new Date(pickupDeadline).toLocaleString("ko-KR", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}

            {/* 에러 메시지 */}
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{errorMessage}</p>
              </div>
            )}

            {/* 예약 버튼 */}
            <Button
              onClick={handleReserve}
              disabled={isLoading || isOutOfStock || quantity > maxQuantity}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  예약 중...
                </>
              ) : isOutOfStock ? (
                "품절"
              ) : (
                "예약하기"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ReservationSuccessDialog
        open={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        orderId={orderId}
      />
    </>
  );
}
