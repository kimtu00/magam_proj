/**
 * @file components/store-admin/active-product-list.tsx
 * @description 현재 판매중 상품 리스트 (대시보드용)
 *
 * Client Component
 */

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, Clock } from "lucide-react";
import type { ActiveProduct } from "@/types/store-admin";

interface ActiveProductListProps {
  products: ActiveProduct[];
}

export function ActiveProductList({ products }: ActiveProductListProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">판매중 상품</h3>
          <Link href="/store-admin/products/new">
            <Button size="sm">+ 새 상품 등록</Button>
          </Link>
        </div>
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <p>판매중인 상품이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          판매중 상품 ({products.length})
        </h3>
        <Link href="/store-admin/products/new">
          <Button size="sm">+ 새 상품 등록</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {products.map((product) => {
          const remainingQuantity = product.quantity - product.reservedCount;
          const sellThroughRate =
            product.quantity > 0
              ? (product.reservedCount / product.quantity) * 100
              : 0;
          const deadline = new Date(product.deadline);
          const now = new Date();
          const hoursLeft = Math.max(
            0,
            Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60))
          );

          return (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">{product.name}</h4>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {product.category}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    ₩{product.discountPrice.toLocaleString()} (
                    {Math.round(
                      ((product.originalPrice - product.discountPrice) /
                        product.originalPrice) *
                        100
                    )}
                    % 할인)
                  </span>
                  <span>
                    재고: {remainingQuantity}/{product.quantity}개 (소진율{" "}
                    {sellThroughRate.toFixed(0)}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {hoursLeft}시간 남음
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/store-admin/products/${product.id}/edit`}>
                  <Button variant="outline" size="sm">
                    수정
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  마감
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <Link href="/store-admin/products">
          <Button variant="outline" size="sm">
            전체 상품 보기
          </Button>
        </Link>
      </div>
    </div>
  );
}
