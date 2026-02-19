/**
 * @file app/mypage/coupons/page.tsx
 * @description 쿠폰함 페이지
 * 
 * 쿠폰 카드 + 탭 필터 + 프로모션 코드 입력
 */

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { CouponTabs } from "@/components/mypage/coupon-tabs";
import { CouponCard } from "@/components/mypage/coupon-card";
import { PromoCodeInput } from "@/components/mypage/promo-code-input";
import type { CouponsResponse, UserCouponStatus } from "@/types/consumer";

interface SearchParams {
  tab?: string;
}

/**
 * 쿠폰 목록 조회 (직접 DB 조회)
 */
async function getCoupons(userId: string, tab: string = "available"): Promise<CouponsResponse> {
  const supabase = await createClient();

  // 쿼리 빌더
  let query = supabase
    .from("user_coupons")
    .select("*, coupon:coupons(*)")
    .eq("user_id", userId)
    .order("acquired_at", { ascending: false });

  // 탭별 필터
  if (tab !== "all") {
    query = query.eq("status", tab as UserCouponStatus);
  }

  const { data: userCoupons, error } = await query;

  if (error) {
    console.error("Coupons query error:", error);
    return {
      coupons: [],
      total: 0,
      available_count: 0,
      used_count: 0,
      expired_count: 0,
    };
  }

  // 통계 계산
  const available_count = userCoupons?.filter(c => c.status === "available").length || 0;
  const used_count = userCoupons?.filter(c => c.status === "used").length || 0;
  const expired_count = userCoupons?.filter(c => c.status === "expired").length || 0;

  return {
    coupons: userCoupons || [],
    total: userCoupons?.length || 0,
    available_count,
    used_count,
    expired_count,
  };
}

/**
 * 쿠폰 목록 렌더링
 */
async function CouponList({ userId, tab }: { userId: string; tab: string }) {
  const data = await getCoupons(userId, tab);

  if (data.coupons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-6xl mb-4">🎫</div>
        <p className="text-muted-foreground">
          {tab === "available"
            ? "사용 가능한 쿠폰이 없습니다."
            : tab === "used"
            ? "사용한 쿠폰이 없습니다."
            : "만료된 쿠폰이 없습니다."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="text-sm text-muted-foreground px-2">
        총 {data.coupons.length}장
      </div>
      <div className="space-y-3">
        {data.coupons.map((userCoupon) => (
          <CouponCard key={userCoupon.id} userCoupon={userCoupon} />
        ))}
      </div>
    </>
  );
}

/**
 * 쿠폰함 페이지
 */
export default async function MypageCouponsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const params = await searchParams;
  const tab = params.tab || "available";

  // 통계 데이터 조회 (탭 카운트용)
  const countsData = await getCoupons(userId, "all");

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-[430px] mx-auto p-4 space-y-6">
        <PageHeader
          title="쿠폰함"
          description="보유한 쿠폰을 확인하고 사용하세요."
          showBackButton={true}
          backButtonFallback="/mypage"
        />

        {/* 프로모션 코드 입력 */}
        <PromoCodeInput />

        {/* 탭 필터 */}
        <CouponTabs
          counts={{
            available: countsData.available_count,
            used: countsData.used_count,
            expired: countsData.expired_count,
          }}
        />

        {/* 쿠폰 목록 */}
        <Suspense fallback={<CouponsSkeleton />}>
          <CouponList userId={userId} tab={tab} />
        </Suspense>
      </div>
    </div>
  );
}

/**
 * 쿠폰 목록 스켈레톤
 */
function CouponsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-lg border p-4 animate-pulse space-y-3"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
            <div className="h-6 w-16 bg-muted rounded" />
          </div>
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-3 w-full bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}
