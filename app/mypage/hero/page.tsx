/**
 * @file app/mypage/hero/page.tsx
 * @description 히어로 등급 상세 페이지
 * 
 * 기존 HeroStatusCard + BadgeList 재활용
 * + 환경 기여 요약 + 혜택 섹션 추가
 */

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HeroStatusCard } from "@/components/hero/hero-status-card";
import { BadgeList } from "@/components/badge/badge-list";
import { HeroEnvironmentSummary } from "@/components/mypage/hero-environment-summary";
import { HeroBenefitsSection } from "@/components/mypage/hero-benefits-section";
import { PageHeader } from "@/components/shared/page-header";
import { SavedFoodService } from "@/services/saved-food";
import type { EnvironmentSummary, BenefitData } from "@/types/consumer";

/**
 * 환경 기여 데이터 조회
 */
async function getEnvironmentData(userId: string): Promise<EnvironmentSummary> {
  // 1. 구한 음식 요약 데이터 (실제 CO2 값 사용)
  const summary = await SavedFoodService.getSummary(userId);

  // 2. 구한 끼니 수 조회 (saved_food_log 엔트리 수)
  const supabase = await createClient();
  const { count } = await supabase
    .from("saved_food_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const totalMeals = count || 0;
  const co2ReducedKg = summary.total_co2_saved_g / 1000; // g -> kg 변환
  const treesEquivalent = Math.floor(co2ReducedKg / 10);

  return {
    saved_meals: totalMeals,
    co2_reduced: Math.round(co2ReducedKg * 100) / 100,
    trees_planted_equivalent: treesEquivalent,
  };
}

/**
 * 혜택 데이터 조회 (직접 DB 조회)
 */
async function getBenefitsData(userId: string): Promise<{ benefits: BenefitData[], userTier: number }> {
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

  return {
    benefits: allBenefits,
    userTier,
  };
}

/**
 * 히어로 상세 페이지
 */
export default async function MypageHeroPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // 데이터 병렬 로딩
  const [envData, benefitsData] = await Promise.all([
    getEnvironmentData(userId),
    getBenefitsData(userId),
  ]);

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-[430px] mx-auto p-4 space-y-6">
        <PageHeader
          title="히어로 등급"
          description="지구를 지키는 당신의 등급과 혜택을 확인하세요."
          showBackButton={true}
          backButtonFallback="/mypage"
        />

        {/* 1. 히어로 상태 카드 (기존 컴포넌트 재활용) */}
        <Suspense fallback={<HeroStatusSkeleton />}>
          <HeroStatusCard />
        </Suspense>

        {/* 2. 환경 기여 요약 */}
        <HeroEnvironmentSummary summary={envData} />

        {/* 3. 배지 목록 (기존 컴포넌트 재활용) */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-2">
            나의 배지
          </h3>
          <Suspense fallback={<BadgeListSkeleton />}>
            <BadgeList />
          </Suspense>
        </div>

        {/* 4. 혜택 섹션 */}
        <HeroBenefitsSection
          benefits={benefitsData.benefits}
          userTier={benefitsData.userTier}
        />
      </div>
    </div>
  );
}

/**
 * 히어로 상태 스켈레톤
 */
function HeroStatusSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
      </div>
    </div>
  );
}

/**
 * 배지 리스트 스켈레톤
 */
function BadgeListSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-card rounded-lg border p-4 animate-pulse">
          <div className="h-12 w-12 bg-muted rounded-full mx-auto mb-2" />
          <div className="h-3 w-full bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}
