import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getStore, getMyProducts } from "@/app/seller/actions";
import { ProductEditForm } from "@/app/seller/products/[id]/edit/product-edit-form";
import { PageHeader } from "@/components/shared/page-header";

/**
 * @file app/store-admin/products/[id]/edit/page.tsx
 * @description 상품 수정 페이지 (사장님 대시보드용)
 *
 * seller의 ProductEditForm을 재사용하며,
 * 수정 완료 후 /store-admin/products 로 이동합니다.
 */
export default async function StoreAdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = await getStore();

  if (!store) {
    redirect("/store-admin/dashboard");
  }

  const products = await getMyProducts();
  const product = products.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="상품 수정"
        description={`상품 정보를 수정할 수 있습니다. · 가게: ${store.name}`}
        showBackButton
        backButtonFallback="/store-admin/products"
      />

      <ProductEditForm
        product={product}
        redirectPath="/store-admin/products"
      />
    </div>
  );
}
