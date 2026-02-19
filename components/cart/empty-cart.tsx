import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

/**
 * 빈 장바구니 안내 컴포넌트
 */
export function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
      </div>
      <p className="text-lg font-medium text-muted-foreground mb-2">
        장바구니가 비어 있습니다
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        마감 할인 상품을 장바구니에 담아보세요
      </p>
      <Link href="/buyer">
        <Button>상품 둘러보기</Button>
      </Link>
    </div>
  );
}
