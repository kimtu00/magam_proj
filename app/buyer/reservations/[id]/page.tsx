import { notFound } from "next/navigation";
import { getMyOrders } from "@/app/buyer/actions";
import { CancelOrderButton } from "@/components/product/cancel-order-button";
import { StoreMapButton } from "@/components/map/store-map-button";
import { cn } from "@/lib/utils";

/**
 * 예약 상세 페이지
 *
 * 소비자가 예약한 상품의 상세 정보를 확인할 수 있는 페이지입니다.
 */
export default async function ReservationDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const orderId = params.id;

  // 예약 내역 조회
  const orders = await getMyOrders();
  const order = orders.find((o) => o.id === orderId);

  // 예약이 없으면 404 페이지 표시
  if (!order) {
    notFound();
  }

  const {
    id,
    status,
    created_at,
    quantity,
    preferred_pickup_time,
    product,
    store,
  } = order;

  const {
    name,
    original_price,
    discount_price,
    image_url,
    is_instant,
    pickup_deadline,
  } = product;

  const statusLabelMap: Record<typeof status, string> = {
    RESERVED: "예약중",
    COMPLETED: "픽업완료",
    CANCELED: "취소됨",
  };

  const statusClassMap: Record<typeof status, string> = {
    RESERVED: "bg-secondary text-primary",
    COMPLETED: "bg-muted text-muted-foreground",
    CANCELED: "bg-destructive/10 text-destructive",
  };

  const orderDate = new Date(created_at);
  const orderLabel = isNaN(orderDate.getTime())
    ? "-"
    : orderDate.toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

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

  // 픽업 희망 시간이 있는 경우 포맷팅
  const preferredPickupDate = preferred_pickup_time ? new Date(preferred_pickup_time) : null;
  const preferredPickupLabel = preferredPickupDate && !isNaN(preferredPickupDate.getTime())
    ? preferredPickupDate.toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const hasDiscount =
    original_price > 0 && discount_price > 0 && discount_price < original_price;
  const discountRate = hasDiscount
    ? Math.round(((original_price - discount_price) / original_price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
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

        {/* 상태 뱃지 */}
        <div
          className={cn(
            "absolute right-4 top-4 rounded-full px-4 py-2 text-sm font-semibold shadow-lg",
            statusClassMap[status]
          )}
        >
          {statusLabelMap[status]}
        </div>

        {/* 바로 섭취 뱃지 */}
        {is_instant && (
          <div className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground shadow-lg">
            😋 바로 섭취
          </div>
        )}
      </div>

      {/* 예약 정보 영역 */}
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

        {/* 예약 수량 및 총 금액 */}
        <div className="rounded-lg border bg-card p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                예약 수량
              </span>
              <span className="text-lg font-bold text-foreground">
                {quantity}개
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-base font-semibold text-foreground">
                총 금액
              </span>
              <span className="text-2xl font-bold text-foreground">
                {(discount_price * quantity).toLocaleString("ko-KR")}원
              </span>
            </div>
          </div>
        </div>

        {/* 예약 정보 */}
        <div className="rounded-lg border bg-card p-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                예약일시
              </p>
              <p className="text-base font-semibold">{orderLabel}</p>
            </div>
            {preferredPickupLabel && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  픽업 희망 시간
                </p>
                <p className="text-base font-semibold text-primary">{preferredPickupLabel}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                픽업 마감 시간
              </p>
              <p className="text-base font-semibold">{pickupLabel}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                예약 상태
              </p>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium mt-1",
                  statusClassMap[status]
                )}
              >
                {statusLabelMap[status]}
              </span>
            </div>
          </div>
        </div>

        {/* 가게 정보 */}
        <div className="rounded-lg border bg-card p-4">
          <div className="space-y-2">
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
          </div>
        </div>
      </div>

      {/* 취소 버튼 (하단 고정) */}
      {status === "RESERVED" && (
        <div className="fixed bottom-20 left-0 right-0 z-10 border-t bg-background px-4 py-4">
          <CancelOrderButton orderId={id} productName={name} />
        </div>
      )}
    </div>
  );
}

