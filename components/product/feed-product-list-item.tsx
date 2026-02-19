import Link from "next/link";
import type { ProductData } from "@/app/buyer/actions";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "@/components/favorite/favorite-button";
import { StoreMapButton } from "@/components/map/store-map-button";
import { Store } from "lucide-react";

interface FeedProductListItemProps {
  product: ProductData;
  isFavorite?: boolean;
}

/**
 * 피드용 상품 리스트 아이템 컴포넌트
 *
 * 소비자용 메인 피드에서 리스트 뷰로 사용하는 상품 카드입니다.
 * 가로형 레이아웃으로 이미지와 정보를 나란히 표시합니다.
 */
export function FeedProductListItem({ product, isFavorite = false }: FeedProductListItemProps) {
  const {
    id,
    name,
    original_price,
    discount_price,
    image_url,
    is_instant,
    pickup_deadline,
    quantity,
    store,
    store_id,
  } = product;

  const hasDiscount =
    original_price > 0 && discount_price > 0 && discount_price < original_price;

  const discountRate = hasDiscount
    ? Math.round(((original_price - discount_price) / original_price) * 100)
    : 0;

  const pickupDate = new Date(pickup_deadline);
  const pickupLabel = isNaN(pickupDate.getTime())
    ? "-"
    : pickupDate.toLocaleString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <Link href={`/buyer/product/${id}`}>
      <div className="group flex gap-4 rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
        {/* 이미지 영역 */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
          {image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image_url}
              alt={name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              이미지 없음
            </div>
          )}

          {/* 할인율 배지 (우상단) */}
          {hasDiscount && discountRate > 0 && (
            <div className="absolute right-1 top-1 rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-white shadow-lg">
              -{discountRate}%
            </div>
          )}

          {/* 바로 섭취 뱃지 (좌상단) */}
          {is_instant && (
            <div className="absolute left-1 top-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-white shadow-lg">
              😋
            </div>
          )}
        </div>

        {/* 정보 영역 */}
        <div className="flex flex-1 flex-col justify-between gap-2">
          <div className="space-y-1">
            <h3 className="line-clamp-2 text-base font-semibold leading-tight">
              {name}
            </h3>

            {/* 가격 정보 */}
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">
                  {discount_price.toLocaleString("ko-KR")}원
                </span>
                {hasDiscount && (
                  <span className="text-xs text-muted-foreground line-through">
                    {original_price.toLocaleString("ko-KR")}원
                  </span>
                )}
              </div>
              
              {/* 할인금액과 할인율 표시 */}
              {hasDiscount && discountRate > 0 && (
                <p className="text-xs font-semibold text-destructive">
                  {(original_price - discount_price).toLocaleString("ko-KR")}원 할인 ({discountRate}%)
                </p>
              )}
            </div>
          </div>

          {/* 픽업 마감 시간 및 재고 수량 */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              픽업 마감: <span className="font-medium">{pickupLabel}</span>
            </p>
            <p className={cn(
              "text-xs font-medium",
              quantity === 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              재고: {quantity}개
            </p>
          </div>

          {/* 가게 정보 및 즐겨찾기 */}
          {store && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Store className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {store.name}
                </span>
                {/* 지도 버튼 추가 */}
                <div className="flex-shrink-0" onClick={(e) => e.preventDefault()}>
                  <StoreMapButton
                    storeName={store.name}
                    address={store.address}
                    phone={store.phone}
                    latitude={store.latitude}
                    longitude={store.longitude}
                  />
                </div>
              </div>
              <FavoriteButton 
                storeId={store_id} 
                initialIsFavorite={isFavorite}
                variant="icon"
                className="flex-shrink-0"
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

