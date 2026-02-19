import { getStore } from "@/app/seller/actions";
import { StoreSetupForm } from "@/components/product/store-setup-form";
import { ProductUploadForm } from "@/app/seller/upload/product-upload-form";
import { PageHeader } from "@/components/shared/page-header";

/**
 * @file app/store-admin/products/new/page.tsx
 * @description 상품 등록 페이지 (사장님 대시보드용)
 *
 * 구성:
 * - 가게 정보 확인
 * - 가게 정보가 없으면 가게 정보 등록 폼 표시
 * - 가게 정보가 있으면 상품 등록 폼 표시
 *
 * seller/upload와 동일한 로직을 재사용하되, store-admin 레이아웃 내에서 렌더링
 */
export default async function StoreAdminProductNewPage() {
  const store = await getStore();

  // 가게 정보가 없으면 가게 정보 등록 폼 표시
  if (!store) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="상품 등록"
          description="상품을 등록하기 전에 가게 정보를 먼저 등록해주세요."
          showBackButton={true}
          backButtonFallback="/store-admin/products"
        />
        <StoreSetupForm />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="상품 등록"
        description="새로운 상품을 등록하여 판매를 시작하세요."
        showBackButton={true}
        backButtonFallback="/store-admin/products"
      />
      <div className="text-sm text-muted-foreground">
        가게: {store.name}
      </div>

      <ProductUploadForm storeId={store.id} />
    </div>
  );
}
