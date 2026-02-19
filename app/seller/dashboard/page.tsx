import Link from "next/link";
import { getStore, getMyProducts, type ProductData } from "../actions";
import { getStoreReviewStats } from "@/actions/review";
import { EmptyProducts } from "@/components/product/empty-products";
import { ProductCard } from "@/components/product/product-card";
import { StarRating } from "@/components/review/star-rating";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";

/**
 * 사장님 대시보드 페이지
 *
 * 내 가게에 등록된 상품들을 조회하고,
 * 판매 완료 상태로 변경할 수 있는 페이지입니다.
 */
export default async function SellerDashboardPage() {
  const store = await getStore();

  // 가게 정보가 없는 경우: 가게 정보 등록 안내
  if (!store) {
    return (
      <div className="p-4 space-y-6">
        <PageHeader
          title="내 상품 관리"
          description="상품을 관리하려면 먼저 가게 정보를 등록해야 합니다."
        />

        <div className="border rounded-lg p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            아직 가게 정보가 등록되지 않았습니다. 아래 버튼을 눌러 가게
            정보와 첫 상품을 등록해 보세요.
          </p>
          <Link href="/seller/upload">
            <Button className="w-full">가게 정보 등록하러 가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const products: ProductData[] = await getMyProducts();

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="내 상품 관리"
        description={`등록한 상품을 관리하고 판매 상태를 변경할 수 있습니다. · 가게: ${store.name}`}
      />

      {/* 빠른 액션 */}
      <div className="flex justify-center">
        <Link href="/seller/upload" className="w-full max-w-md">
          <Button variant="outline" className="w-full h-20 flex-col gap-2">
            <span className="text-2xl">➕</span>
            <span className="text-sm">상품 등록</span>
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <EmptyProducts />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            총 {products.length}개의 상품이 등록되어 있습니다.
          </p>

          <div className="space-y-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

