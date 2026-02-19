/**
 * @file app/store-admin/promotions/page.tsx
 * @description 프로모션 현황 페이지
 *
 * 구성:
 * 1. 진행중 프로모션 카드 리스트
 * 2. 쿠폰 사용 현황
 * 3. 수수료 조정 내역
 */

import { PageHeader } from "@/components/shared/page-header";
import {
  getStorePromotions,
  getCouponUsageStats,
} from "@/app/store-admin/promotions/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Megaphone, TrendingDown } from "lucide-react";

export default async function StoreAdminPromotionsPage() {
  // 데이터 병렬 로드
  const [promotions, couponUsage] = await Promise.all([
    getStorePromotions(true), // 활성화된 프로모션만
    getCouponUsageStats(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="프로모션 현황"
        description="진행중인 프로모션과 쿠폰 사용 현황을 확인하세요."
        showBackButton={true}
        backButtonFallback="/store-admin/dashboard"
      />

      {/* 1. 진행중 프로모션 */}
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">진행중 프로모션</h3>
        </div>

        {promotions.length > 0 ? (
          <div className="space-y-4">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="rounded-lg border p-4 hover:bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{promo.name}</h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          promo.type === "platform"
                            ? "bg-muted text-foreground"
                            : "bg-secondary text-primary"
                        }`}
                      >
                        {promo.type === "platform" ? "플랫폼" : "가게"}
                      </span>
                    </div>
                    {promo.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {promo.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        사용 횟수: {promo.usedCount}회
                      </span>
                      {promo.commissionAdjustment !== 0 && (
                        <span className="flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          수수료 조정:{" "}
                          {promo.commissionAdjustment > 0 ? "+" : ""}
                          {promo.commissionAdjustment}
                          {promo.adjustmentType === "percent" ? "%" : "원"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>
                      {new Date(promo.validFrom).toLocaleDateString("ko-KR")}
                    </p>
                    <p>~</p>
                    <p>
                      {new Date(promo.validUntil).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            진행중인 프로모션이 없습니다.
          </p>
        )}
      </div>

      {/* 2. 쿠폰 사용 현황 */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">쿠폰 사용 현황</h3>

        {couponUsage.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>쿠폰 코드</TableHead>
                <TableHead>쿠폰명</TableHead>
                <TableHead className="text-center">사용 횟수</TableHead>
                <TableHead className="text-right">총 할인액</TableHead>
                <TableHead className="text-right">수수료 영향</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {couponUsage.map((coupon) => (
                <TableRow key={coupon.couponCode}>
                  <TableCell className="font-mono">
                    {coupon.couponCode}
                  </TableCell>
                  <TableCell>{coupon.couponName}</TableCell>
                  <TableCell className="text-center">
                    {coupon.usedCount}회
                  </TableCell>
                  <TableCell className="text-right">
                    ₩{coupon.totalDiscount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    -₩{coupon.commissionImpact.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground">
            쿠폰 사용 내역이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
