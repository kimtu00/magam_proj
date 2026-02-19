/**
 * @file app/mypage/benefits/page.tsx
 * @description 혜택 페이지
 * 
 * 활성/잠긴 혜택 표시
 */

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { BenefitCard } from "@/components/mypage/benefit-card";
import { LockedBenefit } from "@/components/mypage/locked-benefit";
import type { BenefitsResponse, BenefitData } from "@/types/consumer";

/**
 * 혜택 데이터 조회 (직접 DB 조회)
 */
async function getBenefits(userId: string): Promise<BenefitsResponse> {
  const supabase = await createClient();

  // 1. 사용자 히어로 등급 조회
  const { data: heroData } = await supabase
    .from("hero_grades")
    .select("tier")
    .eq("user_id", userId)
    .single();

  const userTier = heroData?.tier || 1;

  // 2. 모든 혜택 목록 (하드코딩)
  const allBenefits: BenefitData[] = [
    {
      id: "1",
      type: "discount",
      title: "히어로 할인",
      description: "모든 상품 5% 할인",
      icon: "🏷️",
      required_tier: 1,
      status: "active",
    },
    {
      id: "2",
      type: "free_delivery",
      title: "무료 배송",
      description: "배송비 무료 (5,000원 이상 구매 시)",
      icon: "🚚",
      required_tier: 2,
      status: userTier >= 2 ? "active" : "locked",
      unlock_condition: "실버 등급 달성 시 해제",
    },
    {
      id: "3",
      type: "priority",
      title: "우선 예약",
      description: "인기 상품 우선 예약 혜택",
      icon: "⭐",
      required_tier: 3,
      status: userTier >= 3 ? "active" : "locked",
      unlock_condition: "골드 등급 달성 시 해제",
    },
    {
      id: "4",
      type: "exclusive",
      title: "VIP 라운지",
      description: "전용 고객센터 및 특별 이벤트 참여",
      icon: "👑",
      required_tier: 4,
      status: userTier >= 4 ? "active" : "locked",
      unlock_condition: "플래티넘 등급 달성 시 해제",
    },
    {
      id: "5",
      type: "discount",
      title: "생일 쿠폰",
      description: "생일 달 10% 할인 쿠폰",
      icon: "🎉",
      required_tier: 1,
      status: "active",
    },
    {
      id: "6",
      type: "exclusive",
      title: "히어로 포인트 2배",
      description: "포인트 적립 2배 혜택",
      icon: "💎",
      required_tier: 3,
      status: userTier >= 3 ? "active" : "locked",
      unlock_condition: "골드 등급 달성 시 해제",
    },
  ];

  // 3. 통계 계산
  const activeCount = allBenefits.filter(b => b.status === "active").length;
  const lockedCount = allBenefits.filter(b => b.status === "locked").length;

  return {
    benefits: allBenefits,
    user_tier: userTier,
    active_count: activeCount,
    locked_count: lockedCount,
  };
}

/**
 * 혜택 페이지
 */
export default async function MypageBenefitsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const data = await getBenefits(userId);
  const activeBenefits = data.benefits.filter(b => b.status === "active");
  const lockedBenefits = data.benefits.filter(b => b.status === "locked");

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-[430px] mx-auto p-4 space-y-6">
        <PageHeader
          title="내 혜택"
          description="히어로 등급에 따른 특별한 혜택을 확인하세요."
          showBackButton={true}
          backButtonFallback="/mypage"
        />

        {/* 등급 정보 */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90 mb-1">현재 등급</div>
          <div className="text-2xl font-bold">Tier {data.user_tier}</div>
          <p className="text-sm opacity-90 mt-2">
            {data.active_count}개의 혜택이 활성화되어 있습니다
          </p>
        </div>

        {/* 활성 혜택 */}
        {activeBenefits.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
              사용 가능한 혜택 ({data.active_count})
            </h3>
            <div className="space-y-3">
              {activeBenefits.map((benefit) => (
                <BenefitCard key={benefit.id} benefit={benefit} />
              ))}
            </div>
          </div>
        )}

        {/* 잠긴 혜택 */}
        {lockedBenefits.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
              잠긴 혜택 ({data.locked_count})
            </h3>
            <p className="text-xs text-muted-foreground mb-3 px-2">
              등급을 올려 더 많은 혜택을 받아보세요!
            </p>
            <div className="space-y-2">
              {lockedBenefits.map((benefit) => (
                <LockedBenefit key={benefit.id} benefit={benefit} />
              ))}
            </div>
          </div>
        )}

        {/* 빈 상태 */}
        {data.benefits.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎁</div>
            <p className="text-muted-foreground">
              혜택 정보를 불러올 수 없습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
