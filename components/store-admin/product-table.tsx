/**
 * @file components/store-admin/product-table.tsx
 * @description 상품 테이블 (DataTable 래핑)
 *
 * Client Component
 */

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, X, CheckCircle } from "lucide-react";
import type { StoreProduct } from "@/types/store-admin";

interface ProductTableProps {
  products: StoreProduct[];
  onStatusChange: (productId: string, status: "CLOSED") => void;
  onDelete: (productId: string) => void;
}

export function ProductTable({
  products,
  onStatusChange,
  onDelete,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border bg-card">
        <p className="text-muted-foreground">상품이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>상품명</TableHead>
            <TableHead>카테고리</TableHead>
            <TableHead className="text-right">원가</TableHead>
            <TableHead className="text-right">할인가</TableHead>
            <TableHead className="text-center">수량</TableHead>
            <TableHead className="text-center">무게</TableHead>
            <TableHead className="text-center">상태</TableHead>
            <TableHead className="text-right">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const remainingQuantity = product.quantity - product.reservedCount;
            const sellThroughRate =
              product.quantity > 0
                ? (product.reservedCount / product.quantity) * 100
                : 0;

            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="text-right">
                  ₩{product.originalPrice.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  ₩{product.discountPrice.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col">
                    <span>
                      {remainingQuantity}/{product.quantity}개
                    </span>
                    <span className="text-xs text-muted-foreground">
                      소진 {sellThroughRate.toFixed(0)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {product.weight}g
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      product.status === "ACTIVE"
                        ? "bg-secondary text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {product.status === "ACTIVE" ? "판매중" : "마감"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/store-admin/products/${product.id}/edit`}>
                      <Button variant="ghost" size="sm" title="상품 수정">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    {product.status === "ACTIVE" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onStatusChange(product.id, "CLOSED")}
                        className="text-muted-foreground hover:text-foreground"
                        title="판매 종료"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(product.id)}
                      className="text-destructive hover:text-destructive/80"
                      title="상품 삭제"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
