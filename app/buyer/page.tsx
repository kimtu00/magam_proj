import type { FilterOptions } from "@/app/buyer/actions";
import { BuyerAddressHeader } from "@/components/address/buyer-address-header";
import { getBuyerAddress } from "@/actions/address";
import { getAvailableProducts } from "@/app/buyer/actions";
import { getFavoriteStoreIdsServer } from "@/actions/favorite";
import { StoreListView } from "@/components/store/store-list-view";
import { SavedFoodBanner } from "@/components/saved-food/saved-food-banner";
import { PageHeader } from "@/components/shared/page-header";

/**
 * 소비자용 메인 피드 페이지
 *
 * 주변 가게의 마감 할인 상품을 조회하고 필터링할 수 있는 화면입니다.
 */
export default async function BuyerHomePage(props: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const searchParams = await props.searchParams;
  const filterParam = searchParams.filter;

  // URL 쿼리 파라미터를 FilterOptions로 변환
  let filter: FilterOptions | undefined;
  if (filterParam === "instant") {
    filter = { is_instant: true };
  } else if (filterParam === "cook") {
    filter = { is_instant: false };
  } else if (filterParam === "budget") {
    filter = { max_price: 10000 };
  }

  // 🚀 병렬로 모든 데이터 가져오기 (성능 최적화)
  const [buyerAddress, favoriteStoreIds] = await Promise.all([
    getBuyerAddress(),
    getFavoriteStoreIdsServer(),
  ]);

  // 초기 상품 데이터 로드 (가게 목록 계산용)
  const initialProducts = await getAvailableProducts(
    filter,
    buyerAddress,
    buyerAddress ? 3 : undefined // 기본 반경 3km
  );

  return (
    <div>
      {/* 주소 표시 헤더 */}
      <BuyerAddressHeader initialAddress={buyerAddress} />

      {/* 오늘 구한 음식 배너 */}
      <SavedFoodBanner />

      <div className="px-4 pb-3 pt-4">
        <PageHeader
          title="오늘마감 참여 가게"
          description={
            buyerAddress
              ? "반경 3km 내에서 마감 할인 상품을 판매 중인 가게를 보여드립니다"
              : "주변에서 마감 할인 상품을 판매 중인 가게들을 한눈에 볼 수 있습니다"
          }
        />
      </div>

      <StoreListView
        products={initialProducts}
        favoriteStoreIds={favoriteStoreIds}
      />
    </div>
  );
}
