import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * 예약 내역 빈 상태 컴포넌트
 *
 * 예약 내역이 없을 때 표시되는 컴포넌트입니다.
 */
export function EmptyOrders() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center space-y-4">
        <p className="text-lg font-semibold text-muted-foreground">
          아직 예약한 상품이 없습니다
        </p>
        <p className="text-sm text-muted-foreground">
          마감 할인 상품을 예약하고 저렴하게 식사를 해결하세요
        </p>
        <Link href="/buyer">
          <Button variant="outline">마감 할인 상품 둘러보기</Button>
        </Link>
      </div>
    </div>
  );
}
