"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { reserveProduct } from "@/app/buyer/actions";
import { ReservationSuccessDialog } from "./reservation-success-dialog";
import { Loader2, Plus, Minus, AlertCircle, Clock } from "lucide-react";

/**
 * 예약 버튼 컴포넌트
 *
 * 상품 상세 페이지에서 사용하는 예약 버튼입니다.
 * 클릭 시 예약 Server Action을 호출하고, 성공 시 팝업을 표시합니다.
 * 수량 선택 및 픽업 희망 시간 선택 기능이 포함되어 있습니다.
 */
export function ReserveButton({
  productId,
  maxQuantity,
  pickupDeadline,
  disabled,
}: {
  productId: string;
  maxQuantity: number;
  pickupDeadline: string;
  disabled?: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [preferredPickupTime, setPreferredPickupTime] = useState<Date | undefined>(
    new Date(pickupDeadline)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQuantityChange = (value: number) => {
    // 재고 수량을 초과하지 않도록 제한
    const newQuantity = Math.max(1, Math.min(value, maxQuantity));
    setQuantity(newQuantity);
    
    // 재고를 초과하는 값이 입력된 경우 에러 메시지 표시
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
      // 픽업 희망 시간을 ISO string으로 변환 (선택 사항)
      const pickupTimeString = preferredPickupTime 
        ? preferredPickupTime.toISOString() 
        : undefined;

      const result = await reserveProduct(productId, quantity, pickupTimeString);

      if (result.success === false) {
        setErrorMessage(result.message || "예약에 실패했습니다.");
      } else {
        setOrderId(result.order_id);
        setIsSuccessDialogOpen(true);
        setQuantity(1); // 예약 성공 후 수량 초기화
        setPreferredPickupTime(undefined); // 픽업 시간 초기화
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
      <div className="space-y-4">
        {/* 재고 정보 (상단에 강조 표시) */}
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
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">구매 수량</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1 || disabled || isLoading}
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
                  } else if (e.target.value === "") {
                    // 빈 값일 때는 1로 설정
                    setQuantity(1);
                  }
                }}
                onBlur={(e) => {
                  // 포커스가 벗어날 때 유효하지 않은 값이면 재고 수량으로 제한
                  const value = parseInt(e.target.value, 10);
                  if (isNaN(value) || value < 1) {
                    setQuantity(1);
                  } else if (value > maxQuantity) {
                    setQuantity(maxQuantity);
                    setErrorMessage(`재고 수량(${maxQuantity}개)을 초과할 수 없습니다.`);
                  }
                }}
                disabled={disabled || isLoading}
                className="w-16 text-center"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= maxQuantity || disabled || isLoading}
                className="h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {quantity > maxQuantity && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                <span>재고 수량({maxQuantity}개)을 초과할 수 없습니다.</span>
              </div>
            )}
          </div>
        )}

        {/* 픽업 희망 시간 선택 */}
        {!isOutOfStock && (
          <div className="space-y-2">
            {/* 라벨 (1줄째) */}
            <span className="text-sm font-medium">
              픽업 희망 시간 (선택)
            </span>

            {/* 날짜 + 시간 선택 (2줄째) */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <DateTimePicker
                value={preferredPickupTime}
                onChange={setPreferredPickupTime}
                maxDate={new Date(pickupDeadline)}
                disabled={disabled || isLoading}
              />
            </div>

            {/* 안내 문구 */}
            <p className="text-xs text-muted-foreground">
              마감:{" "}
              {new Date(pickupDeadline).toLocaleString("ko-KR", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              픽업 희망 시간을 선택하지 않으면 마감 시간 내 언제든 픽업 가능합니다.
            </p>
          </div>
        )}

        {/* 예약 버튼 */}
        <Button
          onClick={handleReserve}
          disabled={disabled || isLoading || isOutOfStock || quantity > maxQuantity}
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

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        )}
      </div>

      <ReservationSuccessDialog
        open={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        orderId={orderId}
      />
    </>
  );
}
