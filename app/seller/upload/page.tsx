import { getStore } from "../actions";
import { StoreSetupForm } from "@/components/product/store-setup-form";
import { ProductUploadForm } from "./product-upload-form";
import { PageHeader } from "@/components/shared/page-header";

/**
 * 상품 등록 페이지
 *
 * 사장님이 상품을 등록하는 페이지입니다.
 * - 가게 정보 확인
 * - 가게 정보가 없으면 가게 정보 등록 폼 표시
 * - 가게 정보가 있으면 상품 등록 폼 표시
 */
export default async function SellerUploadPage() {
  const store = await getStore();

  // 가게 정보가 없으면 가게 정보 등록 폼 표시
  if (!store) {
    return (
      <div className="p-4 space-y-6">
        <PageHeader
          title="상품 등록"
          description="상품을 등록하기 전에 가게 정보를 먼저 등록해주세요."
        />
        <StoreSetupForm />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="상품 등록"
        description={`새로운 상품을 등록하여 판매를 시작하세요. · 가게: ${store.name}`}
      />

      <ProductUploadForm storeId={store.id} />
    </div>
  );
}
