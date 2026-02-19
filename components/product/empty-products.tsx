import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * 사장님 대시보드 - 상품이 없을 때 표시되는 컴포넌트
 */
export function EmptyProducts() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-muted/40 p-8 text-center">
      <div className="space-y-1">
        <p className="text-base font-semibold">등록된 상품이 없습니다</p>
        <p className="text-sm text-muted-foreground">
          첫 상품을 등록하고 자취생들에게 마감 할인 상품을 소개해 보세요.
        </p>
      </div>

      <Link href="/seller/upload">
        <Button>상품 등록하러 가기</Button>
      </Link>
    </div>
  );
}

