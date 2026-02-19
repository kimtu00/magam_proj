import { notFound } from "next/navigation";
import { getProductById } from "@/app/buyer/actions";
import { checkIsFavorite } from "@/actions/favorite";
import { getProductReviews } from "@/actions/review";
import { FavoriteButton } from "@/components/favorite/favorite-button";
import { StoreMapButton } from "@/components/map/store-map-button";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ReserveNowButton } from "@/components/product/reserve-now-button";
import { ReviewCard } from "@/components/review/review-card";
import { StarRating } from "@/components/review/star-rating";
import { cn } from "@/lib/utils";

/**
 * 상품 상세 페이지
 *
 * 소비자가 상품을 클릭하여 상세 정보를 확인하고 예약할 수 있는 페이지입니다.
 */
export default async function ProductDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const productId = params.id;

  // 상품 정보 조회
  const product = await getProductById(productId);

  // 상품이 없으면 404 페이지 표시
  if (!product) {
    notFound();
  }

  const {
    name,
    original_price,
    discount_price,
    image_url,
    is_instant,
    pickup_deadline,
    status,
    quantity,
    store,
    store_id,
  } = product;

  // 병렬로 즐겨찾기 여부와 리뷰 조회
  const [isFavorite, reviews] = await Promise.all([
    checkIsFavorite(store_id),
    getProductReviews(productId),
  ]);

  // 리뷰 통계 계산
  const averageRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  const hasDiscount =
    original_price > 0 && discount_price > 0 && discount_price < original_price;

  const discountRate = hasDiscount
    ? Math.round(((original_price - discount_price) / original_price) * 100)
    : 0;

  const pickupDate = new Date(pickup_deadline);
  const pickupLabel = isNaN(pickupDate.getTime())
    ? "-"
    : pickupDate.toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const isAvailable = status === "AVAILABLE";

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* 이미지 영역 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image_url}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            이미지 없음
          </div>
        )}

        {/* 할인율 배지 */}
        {hasDiscount && discountRate > 0 && (
          <div className="absolute right-4 top-4 rounded-full bg-destructive px-4 py-2 text-lg font-bold text-destructive-foreground shadow-lg">
            -{discountRate}%
          </div>
        )}

        {/* 바로 섭취 뱃지 */}
        {is_instant && (
          <div className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground shadow-lg">
            😋 바로 섭취
          </div>
        )}

        {/* 상태 뱃지 */}
        {!isAvailable && (
          <div
            className={cn(
              "absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg",
              status === "RESERVED" && "bg-muted text-foreground",
              status === "SOLD" && "bg-muted text-muted-foreground"
            )}
          >
            {status === "RESERVED" ? "예약됨" : "판매완료"}
          </div>
        )}
      </div>

      {/* 상품 정보 영역 */}
      <div className="space-y-4 px-4 py-6">
        {/* 상품명 */}
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
        </div>

        {/* 가격 정보 */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground">
              {discount_price.toLocaleString("ko-KR")}원
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {original_price.toLocaleString("ko-KR")}원
                </span>
              </>
            )}
          </div>
          
          {/* 할인금액과 할인율 표시 */}
          {hasDiscount && discountRate > 0 && (
            <p className="text-base font-semibold text-destructive">
              {(original_price - discount_price).toLocaleString("ko-KR")}원 할인 ({discountRate}%)
            </p>
          )}
        </div>

        {/* 픽업 마감 시간 */}
        <div className="rounded-lg border bg-card p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              픽업 마감 시간
            </p>
            <p className="text-base font-semibold">{pickupLabel}</p>
          </div>
        </div>

        {/* 가게 정보 */}
        <div className="rounded-lg border bg-card p-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">가게 정보</p>
            <div className="space-y-1">
              {/* 가게명 + 지도 버튼 */}
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-semibold">{store.name}</p>
                <StoreMapButton
                  storeName={store.name}
                  address={store.address}
                  phone={store.phone}
                  latitude={store.latitude}
                  longitude={store.longitude}
                />
              </div>
              {store.address && (
                <p className="text-sm text-muted-foreground">{store.address}</p>
              )}
              {store.phone && (
                <p className="text-sm text-muted-foreground">전화: {store.phone}</p>
              )}
            </div>
            {/* 즐겨찾기 버튼 */}
            <div className="pt-2 border-t">
              <FavoriteButton 
                storeId={store_id}
                initialIsFavorite={isFavorite}
                variant="button"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* 리뷰 섹션 */}
        <div className="rounded-lg border bg-card p-4">
          <div className="space-y-4">
            {/* 리뷰 헤더 */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">상품 리뷰</p>
              <div className="flex items-center gap-2">
                {reviews.length > 0 && (
                  <>
                    <StarRating rating={Math.round(averageRating)} readonly size="sm" />
                    <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
                  </>
                )}
                <span className="text-sm text-muted-foreground">({reviews.length}개)</span>
              </div>
            </div>

            {/* 리뷰 목록 */}
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map(review => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                아직 리뷰가 없습니다
              </p>
            )}
          </div>
        </div>

        {/* 하단 버튼과 겹치지 않도록 여백 추가 */}
        {isAvailable && (
          <div className="h-24" />
        )}
      </div>

      {/* 장바구니 담기 + 지금 예약 버튼 (하단 고정) */}
      {isAvailable && (
        <div className="fixed bottom-20 left-0 right-0 z-10 border-t bg-background px-4 py-4">
          <div className="flex gap-2">
            <AddToCartButton
              productId={productId}
              productName={name}
              quantity={1}
              variant="outline"
              className="flex-1"
            />
            <ReserveNowButton
              productId={productId}
              productName={name}
              maxQuantity={quantity}
              pickupDeadline={pickup_deadline}
            />
          </div>
        </div>
      )}

      {!isAvailable && (
        <div className="px-4 pb-6">
          <div className="rounded-lg border bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {status === "RESERVED"
                ? "이미 예약된 상품입니다"
                : "판매가 완료된 상품입니다"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
