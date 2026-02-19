/**
 * @file components/mypage/coupon-card.tsx
 * @description 쿠폰 카드 컴포넌트
 * 
 * 할인값, 조건, 유효기간 표시
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DollarSign } from "lucide-react";
import type { UserCouponData } from "@/types/consumer";

interface CouponCardProps {
  userCoupon: UserCouponData;
}

export function CouponCard({ userCoupon }: CouponCardProps) {
  const { coupon, status } = userCoupon;

  if (!coupon) return null;

  // 할인값 포맷팅
  const discountDisplay =
    coupon.discount_type === "percent"
      ? `${coupon.discount_value}% 할인`
      : `${coupon.discount_value.toLocaleString()}원 할인`;

  // 유효기간 포맷팅
  const validUntil = new Date(coupon.valid_until).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 상태별 스타일
  const getStatusStyle = () => {
    if (status === "used") return "opacity-60 grayscale";
    if (status === "expired") return "opacity-40 grayscale";
    return "";
  };

  const getStatusBadge = () => {
    if (status === "used") return <Badge variant="secondary">사용완료</Badge>;
    if (status === "expired") return <Badge variant="destructive">만료</Badge>;
    return <Badge className="bg-primary">사용가능</Badge>;
  };

  return (
    <Card className={getStatusStyle()}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold">{coupon.name}</h3>
              {getStatusBadge()}
            </div>
            {coupon.description && (
              <p className="text-sm text-muted-foreground">
                {coupon.description}
              </p>
            )}
          </div>
        </div>

        {/* 할인 금액 */}
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <span className="text-2xl font-bold text-primary">
            {discountDisplay}
          </span>
        </div>

        {/* 조건 */}
        {coupon.min_order_amount > 0 && (
          <p className="text-sm text-muted-foreground mb-2">
            {coupon.min_order_amount.toLocaleString()}원 이상 구매 시
          </p>
        )}

        {/* 유효기간 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{validUntil}까지</span>
        </div>

        {/* 쿠폰 코드 */}
        {coupon.code && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs text-muted-foreground mb-1">쿠폰 코드</div>
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
              {coupon.code}
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
