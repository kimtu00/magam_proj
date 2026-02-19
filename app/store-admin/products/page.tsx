/**
 * @file app/store-admin/products/page.tsx
 * @description 상품 관리 페이지
 *
 * 구성:
 * 1. 탭 필터 (판매중/마감/전체)
 * 2. 상품 테이블
 * 3. [+ 새 상품 등록] 버튼
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ProductStatusTabs } from "@/components/store-admin/product-status-tabs";
import { ProductTable } from "@/components/store-admin/product-table";
import { Plus } from "lucide-react";
import type { StoreProduct } from "@/types/store-admin";

export default function StoreAdminProductsPage() {
  const [activeStatus, setActiveStatus] = useState<
    "all" | "active" | "closed"
  >("all");
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [counts, setCounts] = useState({ all: 0, active: 0, closed: 0 });
  const [loading, setLoading] = useState(true);

  // 상품 목록 조회
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const response = await fetch("/api/store/products");
        const json = await response.json();

        if (!response.ok || !json.success) {
          console.error("Failed to fetch products:", json.error);
          return;
        }

        const data: StoreProduct[] = json.data;
        setProducts(data);
        setCounts({
          all: data.length,
          active: data.filter((p) => p.status === "ACTIVE").length,
          closed: data.filter((p) => p.status === "CLOSED").length,
        });
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // 상태별 필터링
  const filteredProducts = products.filter((product) => {
    if (activeStatus === "all") return true;
    if (activeStatus === "active") return product.status === "ACTIVE";
    if (activeStatus === "closed") return product.status === "CLOSED";
    return true;
  });

  // 상태 변경 핸들러
  const handleStatusChange = async (productId: string, status: "CLOSED") => {
    try {
      const response = await fetch(
        `/api/store/products/${productId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // 목록 새로고침
      window.location.reload();
    } catch (error) {
      console.error("Failed to update product status:", error);
      alert("상태 변경에 실패했습니다.");
    }
  };

  // 삭제 핸들러
  const handleDelete = async (productId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/store/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      // 목록 새로고침
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="상품 관리"
          showBackButton={true}
          backButtonFallback="/store-admin/dashboard"
          description="등록된 상품을 관리하고 새 상품을 등록하세요."
        />
        <Link href="/store-admin/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />새 상품 등록
          </Button>
        </Link>
      </div>

      {/* 상태별 탭 */}
      <ProductStatusTabs
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        counts={counts}
      />

      {/* 상품 테이블 */}
      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-lg border bg-card">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : (
        <ProductTable
          products={filteredProducts}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
