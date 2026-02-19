"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import { addToCart } from "@/actions/cart";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  quantity?: number;
  preferredPickupTime?: string;
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

/**
 * 장바구니 담기 버튼 컴포넌트
 * 
 * 상품을 장바구니에 추가하는 버튼입니다.
 */
export function AddToCartButton({
  productId,
  productName,
  quantity = 1,
  preferredPickupTime,
  variant = "outline",
  className,
}: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAddToCart = async () => {
    setIsLoading(true);

    try {
      const result = await addToCart(productId, quantity, preferredPickupTime);

      if (result.success) {
        toast.success("장바구니에 담았습니다", {
          description: `${productName} ${quantity}개`,
          action: {
            label: "장바구니 보기",
            onClick: () => router.push("/buyer/cart"),
          },
        });
        // 장바구니 개수 업데이트를 위한 이벤트 발생
        window.dispatchEvent(new Event("cartChanged"));
      } else {
        toast.error("장바구니 담기 실패", {
          description: (result as { success: false; error: string }).error || "다시 시도해 주세요.",
        });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleAddToCart}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ShoppingCart className="h-4 w-4" />
      )}
      <span className="ml-2">장바구니 담기</span>
    </Button>
  );
}
