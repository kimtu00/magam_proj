"use client";

import { useState } from "react";
import { CartItemCard } from "./cart-item-card";
import { Checkbox } from "@/components/ui/checkbox";
import type { CartItemWithProduct } from "@/services/cart";
import { useRouter } from "next/navigation";

interface CartItemListProps {
  items: CartItemWithProduct[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

/**
 * 장바구니 항목 리스트
 * 
 * 클라이언트 컴포넌트로 리스트를 관리하여 항목 업데이트 시 페이지 새로고침
 */
export function CartItemList({ items, selectedIds, onSelectionChange }: CartItemListProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleUpdate = () => {
    if (!isRefreshing) {
      setIsRefreshing(true);
      router.refresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleToggleSelect = (productId: string) => {
    if (selectedIds.includes(productId)) {
      onSelectionChange(selectedIds.filter(id => id !== productId));
    } else {
      onSelectionChange([...selectedIds, productId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      // 전체 선택 해제
      onSelectionChange([]);
    } else {
      // 전체 선택
      onSelectionChange(items.map(item => item.product_id));
    }
  };

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;

  return (
    <div className="space-y-3 px-4 py-4">
      {/* 전체 선택 */}
      <div className="flex items-center gap-2 pb-2 border-b">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={handleSelectAll}
        />
        <span className="text-sm font-medium">
          전체 선택 ({selectedIds.length}/{items.length})
        </span>
      </div>

      {items.map((item) => (
        <CartItemCard
          key={item.id}
          item={item}
          onUpdate={handleUpdate}
          isSelected={selectedIds.includes(item.product_id)}
          onToggleSelect={handleToggleSelect}
        />
      ))}
    </div>
  );
}
