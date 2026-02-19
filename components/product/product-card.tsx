import Link from "next/link";
import { MarkAsSoldButton } from "./mark-as-sold-button";
import { SellInStoreButton } from "./sell-in-store-button";
import type { ProductData } from "@/app/seller/actions";
import { cn } from "@/lib/utils";

/**
 * 사장님 대시보드에서 사용하는 상품 카드
 */
export function ProductCard({ product }: { product: ProductData }) {
  const {
    name,
    original_price,
    discount_price,
    image_url,
    is_instant,
    pickup_deadline,
    status,
    quantity,
    reserved_quantity = 0,
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

  // 픽업 마감 시간이 지났는지 체크
  const now = new Date();
  const isExpired = status === "AVAILABLE" && pickupDate < now;

  // SOLD 또는 RESERVED 상태일 때 버튼 비활성화
  const isSoldOrReserved = status === "SOLD" || status === "RESERVED";
  const isSold = status === "SOLD";

  const statusLabelMap: Record<ProductData["status"], string> = {
    AVAILABLE: "판매중",
    RESERVED: "예약중",
    SOLD: "판매완료",
    SOLD_OUT: "품절",
  };

  const statusClassMap: Record<ProductData["status"], string> = {
    AVAILABLE: "bg-secondary text-primary",
    RESERVED: "bg-muted text-foreground",
    SOLD: "bg-muted text-muted-foreground",
    SOLD_OUT: "bg-destructive/10 text-destructive",
  };

  // 실제 표시할 상태와 스타일 결정
  const displayStatus = isExpired ? "마감" : statusLabelMap[status];
  const displayClass = isExpired 
    ? "bg-muted text-muted-foreground" 
    : statusClassMap[status];

  // SOLD 상태일 때는 Link 대신 div 사용 (수정 화면 이동 불가)
  const cardContent = (
    <>
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
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                displayClass
              )}
            >
              {displayStatus}
            </span>
            {is_instant && (
              <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                바로 섭취
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2 text-sm">
            <span className="font-bold">
              {discount_price.toLocaleString("ko-KR")}원
            </span>
            {hasDiscount && (
              <>
                <span className="text-xs text-muted-foreground line-through">
                  {original_price.toLocaleString("ko-KR")}원
                </span>
                <span className="text-xs font-semibold text-destructive">
                  -{discountRate}%
                </span>
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            픽업 마감: <span className="font-medium">{pickupLabel}</span>
          </p>
          <div className="space-y-0.5">
            {reserved_quantity > 0 && (
                <p className="text-xs text-muted-foreground">
                  예약: <span className="font-medium text-foreground">{reserved_quantity}개</span>
                </p>
            )}
            <p className="text-xs text-muted-foreground">
              판매 가능: <span className={cn("font-medium", quantity === 0 && "text-destructive")}>{quantity}개</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <SellInStoreButton 
            productId={product.id} 
            maxQuantity={quantity}
            disabled={isSold || isExpired}
          />
          <MarkAsSoldButton 
            productId={product.id} 
            disabled={isSoldOrReserved || isExpired} 
            status={status} 
          />
        </div>
      </div>
    </>
  );

  // 판매완료 또는 마감된 상품은 수정 불가
  const isNotEditable = isSold || isExpired;

  return isNotEditable ? (
    <div className="flex gap-4 rounded-lg border bg-card p-3 shadow-sm opacity-75 cursor-not-allowed">
      {cardContent}
    </div>
  ) : (
    <Link
      href={`/seller/products/${product.id}/edit`}
      className="flex gap-4 rounded-lg border bg-card p-3 shadow-sm transition-colors hover:bg-accent/50"
    >
      {cardContent}
    </Link>
  );
}

