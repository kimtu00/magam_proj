/**
 * @file app/api/user/profile/route.ts
 * @description 소비자 프로필 조회 및 수정 API
 * 
 * GET: 프로필 정보 + 빠른 통계 조회
 * PUT: 프로필 정보 수정 (이름, 전화번호, 프로필 이미지)
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ConsumerProfile, UpdateProfileRequest } from "@/types/consumer";

/**
 * GET /api/user/profile
 * 사용자 프로필 + 빠른 통계 조회
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // 1. 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("clerk_id, nickname, created_at")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
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
      
      // 전체 주문 수
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("buyer_id", userId),
      
      // 전체 리뷰 수
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

    return NextResponse.json({
      success: true,
      data: consumerProfile,
    });
  } catch (error) {
    console.error("GET /api/user/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 * 프로필 정보 수정
 */
export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: UpdateProfileRequest = await request.json();
    const { name, phone, profile_image } = body;

    // 1. Supabase profiles 업데이트 (닉네임)
    if (name) {
      const supabase = await createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ nickname: name })
        .eq("clerk_id", userId);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 }
        );
      }
    }

    // 2. Clerk 메타데이터 업데이트 (전화번호, 이미지는 Clerk에서 직접 관리)
    const client = await clerkClient();
    if (phone || profile_image) {
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...(phone && { phone }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/user/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
