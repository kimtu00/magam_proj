'use client';

import { useState } from "react";
import Link from "next/link";
import type { OrderData } from "@/app/buyer/actions";
import { cn } from "@/lib/utils";
import { CancelOrderButton } from "./cancel-order-button";
import { StoreMapButton } from "@/components/map/store-map-button";
import { CreateReviewDialog } from "@/components/review/create-review-dialog";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

/**
 * 예약 내역 카드 컴포넌트
 *
 * 내 예약 내역 페이지에서 사용하는 예약 내역 카드입니다.
 * 상품 정보, 가게 정보, 예약 상태를 표시합니다.
 * RESERVED 상태일 때 취소 버튼을, COMPLETED 상태일 때 리뷰 버튼을 표시합니다.
 */
export function OrderCard({ order, hasReview }: { order: OrderData; hasReview?: boolean }) {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const {
    id,
    status,
    created_at,
    quantity,
    preferred_pickup_time,
    product,
    store,
  } = order;

  const { name, discount_price, image_url, pickup_deadline } = product;

  const statusLabelMap: Record<OrderData["status"], string> = {
    RESERVED: "예약중",
    COMPLETED: "픽업완료",
    CANCELED: "취소됨",
  };

  const statusClassMap: Record<OrderData["status"], string> = {
    RESERVED: "bg-secondary text-primary",
    COMPLETED: "bg-muted text-muted-foreground",
    CANCELED: "bg-destructive/10 text-destructive",
  };

  const orderDate = new Date(created_at);
  const orderLabel = isNaN(orderDate.getTime())
    ? "-"
    : orderDate.toLocaleString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const pickupDate = new Date(pickup_deadline);
  const pickupLabel = isNaN(pickupDate.getTime())
    ? "-"
    : pickupDate.toLocaleString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  // 픽업 희망 시간 포맷팅
  const preferredPickupDate = preferred_pickup_time ? new Date(preferred_pickup_time) : null;
  const preferredPickupLabel = preferredPickupDate && !isNaN(preferredPickupDate.getTime())
    ? preferredPickupDate.toLocaleString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <>
      <Link href={`/buyer/reservations/${id}`}>
        <div className="group flex gap-4 rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
          {/* 이미지 영역 */}
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
            {image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image_url}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                이미지 없음
              </div>
            )}
          </div>

          {/* 정보 영역 */}
          <div className="flex flex-1 flex-col justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="line-clamp-1 text-sm font-semibold">{name}</p>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                    statusClassMap[status]
                  )}
                >
                  {statusLabelMap[status]}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2 text-sm">
                  <span className="font-bold">
                    {discount_price.toLocaleString("ko-KR")}원
                  </span>
                  <span className="text-xs text-muted-foreground">
                    × {quantity}개
                  </span>
                </div>
                <p className="text-xs font-semibold text-foreground">
                  총 금액: {(discount_price * quantity).toLocaleString("ko-KR")}원
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>가게:</span>
                <span className="font-medium">{store.name}</span>
                <div onClick={(e) => e.preventDefault()}>
                  <StoreMapButton
                    storeName={store.name}
                    address={store.address}
                    phone={store.phone}
                    latitude={store.latitude}
                    longitude={store.longitude}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                예약일: <span className="font-medium">{orderLabel}</span>
              </p>

              {preferredPickupLabel && (
                <p className="text-xs text-muted-foreground">
                  픽업 희망: <span className="font-medium text-primary">{preferredPickupLabel}</span>
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                픽업 마감: <span className="font-medium">{pickupLabel}</span>
              </p>
            </div>

            {/* 액션 버튼들 */}
            <div className="mt-2 flex gap-2">
              {/* 취소 버튼: RESERVED 상태일 때만 표시 */}
              {status === "RESERVED" && (
                <CancelOrderButton
                  orderId={id}
                  productName={name}
                />
              )}

              {/* 리뷰 버튼: COMPLETED 상태일 때 표시 */}
              {status === "COMPLETED" && (
                <Button
                  variant={hasReview ? "outline" : "default"}
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsReviewDialogOpen(true);
                  }}
                  className="flex items-center gap-1"
                >
                  <Star className="h-3 w-3" />
                  {hasReview ? "리뷰 작성됨" : "리뷰 작성"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* 리뷰 작성 다이얼로그 - Link 외부로 이동 */}
      {!hasReview && (
        <CreateReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          orderId={id}
          storeId={store.id}
          productId={product.id}
          productName={name}
        />
      )}
    </>
  );
}
