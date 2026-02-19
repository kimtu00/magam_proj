"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Minus, Plus, Trash2, Loader2, Clock } from "lucide-react";
import { updateCartQuantity, updateCartPickupTime, removeFromCart } from "@/actions/cart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CartItemWithProduct } from "@/services/cart";

interface CartItemCardProps {
  item: CartItemWithProduct;
  onUpdate: () => void;
  isSelected: boolean;
  onToggleSelect: (productId: string) => void;
}

/**
 * 장바구니 항목 카드
 * 
 * 장바구니에 담긴 상품을 표시하고 수량 조절/삭제 기능을 제공합니다.
 */
export function CartItemCard({ item, onUpdate, isSelected, onToggleSelect }: CartItemCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  
  // 초기 픽업 시간 설정: 저장된 값이 있으면 사용, 없으면 가게 마감시간으로 설정
  const getInitialPickupTime = () => {
    if (item.preferred_pickup_time) {
      return new Date(item.preferred_pickup_time);
    }
    // 가게 마감시간으로 초기 설정
    return new Date(item.product.pickup_deadline);
  };
  
  const [pickupTime, setPickupTime] = useState<Date | undefined>(getInitialPickupTime());

  const { product, quantity } = item;
  const maxQuantity = product.quantity; // 재고

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > maxQuantity) {
      toast.error("수량 오류", {
        description: `1개 이상 ${maxQuantity}개 이하로 선택해 주세요.`,
      });
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateCartQuantity(product.id, newQuantity);
      if (result.success) {
        onUpdate();
        // 장바구니 개수 업데이트를 위한 이벤트 발생
        window.dispatchEvent(new Event("cartChanged"));
      } else {
        toast.error("수량 변경 실패", {
          description: (result as { success: false; error: string }).error || "다시 시도해 주세요.",
        });
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("오류가 발생했습니다");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      const result = await removeFromCart(product.id);
      if (result.success) {
        toast.success("장바구니에서 삭제했습니다");
        onUpdate();
        // 장바구니 개수 업데이트를 위한 이벤트 발생
        window.dispatchEvent(new Event("cartChanged"));
      } else {
        toast.error("삭제 실패", {
          description: (result as { success: false; error: string }).error || "다시 시도해 주세요.",
        });
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("오류가 발생했습니다");
    } finally {
      setIsRemoving(false);
    }
  };

  const handlePickupTimeChange = async (newTime: Date | undefined) => {
    // 실제로 값이 변경되었는지 확인
    const currentTimeString = pickupTime ? pickupTime.toISOString() : null;
    const newTimeString = newTime ? newTime.toISOString() : null;
    
    // 값이 같으면 아무것도 하지 않음
    if (currentTimeString === newTimeString) {
      return;
    }
    
    setPickupTime(newTime);
    
    try {
      const result = await updateCartPickupTime(product.id, newTimeString);
      
      if (result.success) {
        toast.success("픽업 시간이 변경되었습니다");
      } else {
        toast.error("픽업 시간 변경 실패", {
          description: (result as { success: false; error: string }).error || "다시 시도해 주세요.",
        });
        // 실패 시 원래 값으로 복원
        setPickupTime(item.preferred_pickup_time ? new Date(item.preferred_pickup_time) : undefined);
      }
    } catch (error) {
      console.error("Error updating pickup time:", error);
      toast.error("오류가 발생했습니다");
      setPickupTime(item.preferred_pickup_time ? new Date(item.preferred_pickup_time) : undefined);
    }
  };

  const totalPrice = product.discount_price * quantity;
  
  const pickupDeadline = new Date(product.pickup_deadline);
  const pickupLabel = isNaN(pickupDeadline.getTime())
    ? "-"
    : pickupDeadline.toLocaleString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex gap-3">
        {/* 체크박스 */}
        <div className="flex items-start pt-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(product.id)}
            disabled={isUpdating || isRemoving}
          />
        </div>

        {/* 상품 이미지 */}
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
              이미지 없음
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm">{product.name}</h3>
            <p className="text-xs text-muted-foreground">{product.store.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-bold text-primary">
                {product.discount_price.toLocaleString("ko-KR")}원
              </span>
              <span className="text-xs text-muted-foreground line-through">
                {product.original_price.toLocaleString("ko-KR")}원
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              픽업 마감: {pickupLabel}
            </p>
            <p className={cn(
              "mt-0.5 text-xs",
              maxQuantity <= 3 
                ? "text-destructive font-medium" 
                : "text-muted-foreground"
            )}>
              남은 재고: {maxQuantity}개
              {maxQuantity <= 3 && " (품절 임박)"}
            </p>
          </div>

          {/* 수량 조절 & 삭제 */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={isUpdating || quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="inline-flex h-7 w-10 items-center justify-center text-sm font-medium">
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  quantity
                )}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={isUpdating || quantity >= maxQuantity}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {totalPrice.toLocaleString("ko-KR")}원
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive"
                onClick={handleRemove}
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 픽업 희망 시간 선택 */}
      <div className="space-y-2 border-t pt-3">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          픽업 희망 시간 (선택사항)
        </label>
        <DateTimePicker
          value={pickupTime}
          onChange={handlePickupTimeChange}
          maxDate={pickupDeadline}
          disabled={isUpdating || isRemoving}
        />
        <p className="text-xs text-muted-foreground">
          설정하지 않으면 픽업 마감 시간 내 언제든지 가능합니다
        </p>
      </div>
    </div>
  );
}
