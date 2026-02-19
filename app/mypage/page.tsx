/**
 * @file app/mypage/page.tsx
 * @description 마이페이지 메인 화면
 * 
 * 와이어프레임 구현:
 * 1. 프로필 헤더 (이름 + 히어로 등급)
 * 2. 빠른 통계 4칸 (쿠폰/포인트/주문/리뷰)
 * 3. 히어로 요약 카드 (클릭 시 /mypage/hero)
 * 4. 메뉴 리스트
 */

import { Suspense } from "react";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileHeader } from "@/components/mypage/profile-header";
import { QuickStats } from "@/components/mypage/quick-stats";
import { HeroSummaryCard } from "@/components/mypage/hero-summary-card";
import { MenuList } from "@/components/mypage/menu-list";
import type { ConsumerProfile } from "@/types/consumer";

/**
 * 프로필 데이터 조회 (직접 DB 조회)
 */
async function getProfileData(userId: string): Promise<ConsumerProfile> {
  const supabase = await createClient();

  // 1. 프로필 정보 조회
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("clerk_id, nickname, created_at")
    .eq("clerk_id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error("Profile not found");
  }

  // 2. Clerk에서 이메일, 이미지 가져오기
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);

  // 3. 히어로 등급 조회
  const { data: heroData } = await supabase
    .from("hero_grades")
    .select("level, tier")
    .eq("user_id", userId)
    .single();

  // 4. 빠른 통계 조회
  const [coupons, points, orders, reviews] = await Promise.all([
    // 사용 가능한 쿠폰 수
    supabase
      .from("user_coupons")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "available"),
    
    // 포인트 잔액
    supabase.rpc("get_point_balance", { p_user_id: userId }),
    
    // 전체 주문 수 (buyer_id 사용)
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", userId),
    
    // 전체 리뷰 수 (buyer_id 사용)
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", userId),
  ]);

  const consumerProfile: ConsumerProfile = {
    user_id: userId,
    name: profile.nickname,
    email: clerkUser.emailAddresses[0]?.emailAddress || "",
    phone: clerkUser.phoneNumbers[0]?.phoneNumber || null,
    profile_image: clerkUser.imageUrl || null,
    hero_level: heroData?.level || "브론즈",
    hero_tier: heroData?.tier || 1,
    quick_stats: {
      coupons: coupons.count || 0,
      points: (points.data as number) || 0,
      orders: orders.count || 0,
      reviews: reviews.count || 0,
    },
    created_at: profile.created_at,
  };

  return consumerProfile;
}

/**
 * 프로필 헤더 + 빠른 통계
 */
async function ProfileSection({ userId }: { userId: string }) {
  const profile = await getProfileData(userId);

  return (
    <>
      <ProfileHeader profile={profile} />
      <QuickStats stats={profile.quick_stats} />
    </>
  );
}

/**
 * 로딩 스켈레톤 (간단 버전)
 */
function ProfileSkeleton() {
  return (
    <>
      <div className="bg-card rounded-lg p-6 shadow-sm border animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-muted rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-32 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg border p-4 animate-pulse">
            <div className="h-5 w-5 bg-muted rounded mb-2 mx-auto" />
            <div className="h-6 w-12 bg-muted rounded mx-auto mb-1" />
            <div className="h-3 w-16 bg-muted rounded mx-auto" />
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * 마이페이지 메인
 */
export default async function MypagePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-[430px] mx-auto p-4 space-y-6">
        {/* 1. 프로필 헤더 + 빠른 통계 */}
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileSection userId={userId} />
        </Suspense>

        {/* 2. 히어로 요약 카드 */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-2">
            나의 히어로 등급
          </h3>
          <Suspense fallback={<HeroSummarySkeleton />}>
            <HeroSummaryCard userId={userId} />
          </Suspense>
        </div>

        {/* 3. 메뉴 리스트 */}
        <MenuList />
      </div>
    </div>
  );
}

/**
 * 히어로 카드 스켈레톤
 */
function HeroSummarySkeleton() {
  return (
    <div className="bg-card rounded-lg border p-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
      </div>
    </div>
  );
}
