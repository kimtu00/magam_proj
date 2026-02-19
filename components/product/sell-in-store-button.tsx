"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { sellInStore } from "@/app/seller/actions";

interface SellInStoreButtonProps {
  productId: string;
  maxQuantity: number;
  disabled?: boolean;
}

/**
 * 매장 판매 처리 버튼 컴포넌트
 * 
 * 사장님이 매장에서 직접 판매한 상품의 수량을 차감할 수 있습니다.
 */
export function SellInStoreButton({ productId, maxQuantity, disabled }: SellInStoreButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleSell = async () => {
    if (quantity < 1 || quantity > maxQuantity) {
      alert(`수량은 1개 이상 ${maxQuantity}개 이하여야 합니다.`);
      return;
    }

    console.log('🛒 매장 판매 시작:', { productId, quantity, maxQuantity });
    setIsLoading(true);
    const result = await sellInStore(productId, quantity);
    console.log('🛒 매장 판매 결과:', result);
    setIsLoading(false);

    if (result.success) {
      alert(`✅ 매장 판매 처리 완료!\n판매 수량: ${quantity}개\n남은 수량: ${result.remaining || 0}개`);
      setIsOpen(false);
      setQuantity(1);
      // 페이지 새로고침으로 최신 데이터 반영
      window.location.reload();
    } else {
      const failResult = result as { success: false; error: string };
      console.error('❌ 매장 판매 실패:', failResult.error);
      alert(failResult.error || "매장 판매 처리에 실패했습니다.");
    }
  };

  if (maxQuantity <= 0 || disabled) {
    return null; // 재고가 없거나 비활성화 상태면 버튼 숨김
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled) {
              console.log('🔵 매장 판매 버튼 클릭됨');
              setIsOpen(true);
            }
          }}
        >
          매장 판매
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        onClick={(e) => e.stopPropagation()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>매장 판매 처리</AlertDialogTitle>
          <AlertDialogDescription>
            매장에서 판매한 수량을 입력하세요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Input
            type="number"
            min="1"
            max={maxQuantity}
            value={quantity}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value)) {
                setQuantity(Math.min(Math.max(value, 1), maxQuantity));
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-sm text-muted-foreground mt-2">
            남은 재고: {maxQuantity}개
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={(e) => e.stopPropagation()}>취소</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.stopPropagation();
              handleSell();
            }} 
            disabled={isLoading}
          >
            {isLoading ? "처리 중..." : "판매 처리"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

