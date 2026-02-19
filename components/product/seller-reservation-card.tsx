import type { SellerOrderDetailData } from "@/services/order/order.types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CompleteOrderButton } from "./complete-order-button";

/**
 * 사장님 예약 관리 화면에서 사용하는 예약 카드
 */
export function SellerReservationCard({
  reservation,
}: {
  reservation: SellerOrderDetailData;
}) {
  const {
    product,
    buyer,
    quantity,
    preferred_pickup_time,
    status,
    created_at,
  } = reservation;

  const pickupDate = new Date(product.pickup_deadline);
  const pickupLabel = isNaN(pickupDate.getTime())
    ? "-"
    : format(pickupDate, "yy.MM.dd HH:mm", { locale: ko });

  const orderDate = new Date(created_at);
  const orderLabel = isNaN(orderDate.getTime())
    ? "-"
    : format(orderDate, "yy.MM.dd HH:mm", { locale: ko });

  // 픽업 희망 시간이 있는 경우 포맷팅
  const preferredPickupDate = preferred_pickup_time ? new Date(preferred_pickup_time) : null;
  const preferredPickupLabel =
    preferredPickupDate && !isNaN(preferredPickupDate.getTime())
      ? format(preferredPickupDate, "yy.MM.dd HH:mm", { locale: ko })
      : null;

  const statusLabelMap: Record<SellerOrderDetailData["status"], string> = {
    RESERVED: "예약됨",
    COMPLETED: "완료",
    CANCELED: "취소됨",
  };

  const statusClassMap: Record<SellerOrderDetailData["status"], string> = {
    RESERVED: "bg-muted text-foreground",
    COMPLETED: "bg-secondary text-primary",
    CANCELED: "bg-muted text-muted-foreground",
  };

  const totalPrice = product.discount_price * quantity;

  return (
    <div className="flex gap-4 rounded-lg border bg-card p-4 shadow-sm">
      {/* 상품 이미지 영역 */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            이미지 없음
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="flex flex-1 flex-col gap-3">
        {/* 상품명 & 상태 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="line-clamp-1 text-sm font-semibold">{product.name}</p>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                statusClassMap[status]
              )}
            >
              {statusLabelMap[status]}
            </span>
            {product.is_instant && (
              <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                바로 섭취
              </span>
            )}
          </div>
        </div>

        {/* 예약자 정보 */}
        <div className="space-y-1 rounded-md bg-muted/50 p-2">
          <p className="text-xs font-medium text-muted-foreground">예약자 정보</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {buyer.nickname || "이름 없음"}
            </span>
          </div>
          {buyer.address && (
            <p className="text-xs text-muted-foreground">
              주소: {buyer.address}
            </p>
          )}
        </div>

        {/* 예약 상세 정보 */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="space-y-1">
            <p className="text-muted-foreground">
              예약 수량: <span className="font-medium text-foreground">{quantity}개</span>
            </p>
            <p className="text-muted-foreground">
              총 금액: <span className="font-medium text-foreground">{totalPrice.toLocaleString("ko-KR")}원</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">
              예약 시간: <span className="font-medium text-foreground">{orderLabel}</span>
            </p>
            {preferredPickupLabel && (
              <p className="text-muted-foreground">
                희망 시간: <span className="font-medium text-primary">{preferredPickupLabel}</span>
              </p>
            )}
            <p className="text-muted-foreground">
              픽업 마감: <span className="font-medium text-foreground">{pickupLabel}</span>
            </p>
          </div>
        </div>

        {/* 픽업 완료 버튼 */}
        <CompleteOrderButton
          orderId={reservation.id}
          orderStatus={status}
          productName={product.name}
          buyerName={buyer.nickname || "이름 없음"}
          quantity={quantity}
        />
      </div>
    </div>
  );
}

