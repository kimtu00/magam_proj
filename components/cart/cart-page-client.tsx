"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CartItemList } from "./cart-item-list";
import { CartCheckoutButton } from "./cart-checkout-button";
import type { CartItemWithProduct } from "@/services/cart";

interface CartPageClientProps {
  cartItems: CartItemWithProduct[];
}

/**
 * 장바구니 페이지 클라이언트 컴포넌트
 * 
 * 선택 상태를 관리하고 선택된 항목만 예약합니다.
 */
export function CartPageClient({ cartItems }: CartPageClientProps) {
  // 기본적으로 모든 항목 선택
  const [selectedIds, setSelectedIds] = useState<string[]>(
    cartItems.map(item => item.product_id)
  );

  // cartItems 변경 시 selectedIds 동기화
  useEffect(() => {
    const validIds = cartItems.map(item => item.product_id);
    setSelectedIds(prev => 
      prev.filter(id => validIds.includes(id))
    );
  }, [cartItems]);

  // 선택된 항목들
  const selectedItems = cartItems.filter(item => selectedIds.includes(item.product_id));

  // 총 금액 계산 (선택된 항목만)
  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.product.discount_price * item.quantity,
    0
  );

  // 총 상품 수 (선택된 항목만)
  const totalCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="flex items-center gap-2">
          <Link
            href="/buyer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← 뒤로가기
          </Link>
          <h1 className="flex-1 text-xl font-bold">장바구니</h1>
        </div>
      </div>

      {/* 장바구니 항목 리스트 */}
      <CartItemList
        items={cartItems}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {/* 하단 고정 영역 (요약 + 예약 버튼) - 네비게이션 바 위에 표시 */}
      <div className="fixed bottom-16 left-0 right-0 z-20 border-t bg-background px-4 py-4 shadow-lg">
        <div className="mx-auto max-w-[430px]">
          {/* 요약 정보 */}
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              선택 {selectedIds.length}개 / 총 {totalCount}개 상품
            </span>
            <span className="text-lg font-bold">
              {totalAmount.toLocaleString("ko-KR")}원
            </span>
          </div>

          {/* 선택 예약 버튼 */}
          <CartCheckoutButton
            selectedProductIds={selectedIds}
            itemCount={selectedIds.length}
          />
        </div>
      </div>
    </div>
  );
}
