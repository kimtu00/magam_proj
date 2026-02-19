import { redirect } from "next/navigation";
import { getStore, getMyProducts } from "@/app/seller/actions";
import { ProductEditForm } from "./product-edit-form";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";

/**
 * 상품 수정 페이지
 *
 * 사장님이 상품을 수정하는 페이지입니다.
 * - 가게 정보 확인
 * - 상품 정보 조회 및 권한 확인
 * - 상품 수정 폼 표시
 */
export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = await getStore();

  // 가게 정보가 없으면 대시보드로 리다이렉트
  if (!store) {
    redirect("/seller/dashboard");
  }

  // 내 상품 목록에서 해당 상품 찾기
  const products = await getMyProducts();
  const product = products.find((p) => p.id === id);

  // 상품을 찾을 수 없거나 권한이 없으면 404
  if (!product) {
    notFound();
  }

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="상품 수정"
        description={`상품 정보를 수정할 수 있습니다. · 가게: ${store.name}`}
        showBackButton
        backButtonFallback="/seller/dashboard"
      />

      <ProductEditForm product={product} />
    </div>
  );
}


