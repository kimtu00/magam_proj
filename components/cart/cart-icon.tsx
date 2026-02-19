"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { getCartCount } from "@/actions/cart";
import { cn } from "@/lib/utils";

interface CartIconProps {
  isActive: boolean;
}

/**
 * 장바구니 아이콘 (개수 뱃지 포함)
 * 
 * 네비게이션 바에서 사용되는 장바구니 아이콘입니다.
 */
export function CartIcon({ isActive }: CartIconProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const cartCount = await getCartCount();
      setCount(cartCount);
    };

    fetchCount();

    // 장바구니 변경 시 개수 업데이트
    const handleCartChange = () => {
      fetchCount();
    };

    window.addEventListener("cartChanged", handleCartChange);

    return () => {
      window.removeEventListener("cartChanged", handleCartChange);
    };
  }, []);

  return (
    <div className="relative">
      <ShoppingCart className={cn("w-5 h-5", isActive && "text-primary")} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </div>
  );
}
