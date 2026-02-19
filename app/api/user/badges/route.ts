/**
 * @file app/api/user/badges/route.ts
 * @description 배지 목록 조회 API
 * 
 * GET: 사용자 배지 목록 (기존 BadgeService 재활용)
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { BadgeService } from "@/services/badge";

/**
 * GET /api/user/badges
 * 배지 목록 조회
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const badges = await BadgeService.getUserBadges(userId);

    return NextResponse.json({
      success: true,
      data: badges || [],
    });
  } catch (error) {
    console.error("GET /api/user/badges error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
