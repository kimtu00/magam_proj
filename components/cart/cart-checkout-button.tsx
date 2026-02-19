"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { checkoutFromCart } from "@/actions/cart";
import { toast } from "sonner";

interface CartCheckoutButtonProps {
  selectedProductIds: string[];
  itemCount: number;
}

/**
 * 장바구니 선택 예약 버튼
 */
export function CartCheckoutButton({ selectedProductIds, itemCount }: CartCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    if (selectedProductIds.length === 0) {
      toast.error("예약할 상품을 선택해 주세요");
      return;
    }

    setIsLoading(true);

    try {
      const result = await checkoutFromCart(selectedProductIds);

      if (result.success && result.failed.length === 0) {
        // 전체 성공
        toast.success("예약이 완료되었습니다", {
          description: `${result.succeeded.length}개 상품이 예약되었습니다`,
        });
        // 장바구니 개수 업데이트
        window.dispatchEvent(new Event("cartChanged"));
        router.push("/buyer/reservations");
      } else if (result.succeeded.length > 0) {
        // 일부 성공
        toast.warning("일부 상품만 예약되었습니다", {
          description: `${result.succeeded.length}개 성공, ${result.failed.length}개 실패`,
        });
        // 실패한 항목 안내
        result.failed.forEach((item) => {
          toast.error(`${item.productName} 예약 실패`, {
            description: item.reason,
          });
        });
        // 장바구니 개수 업데이트
        window.dispatchEvent(new Event("cartChanged"));
        router.push("/buyer/reservations");
      } else {
        // 전체 실패
        toast.error("예약에 실패했습니다", {
          description: result.failed[0]?.reason || "다시 시도해 주세요",
        });
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      toast.error("오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className="w-full"
      size="lg"
      onClick={handleCheckout}
      disabled={isLoading || itemCount === 0}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          예약 중...
        </>
      ) : (
        `선택한 상품 예약하기 (${itemCount}개)`
      )}
    </Button>
  );
}
