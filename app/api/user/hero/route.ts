/**
 * @file app/api/user/hero/route.ts
 * @description 히어로 등급 정보 조회 API
 * 
 * GET: 히어로 등급 정보 (기존 HeroService 재활용)
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { HeroService } from "@/services/hero";

/**
 * GET /api/user/hero
 * 히어로 등급 정보 조회
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const heroStatus = await HeroService.getHeroStatus(userId);

    if (!heroStatus) {
      return NextResponse.json(
        { error: "Hero status not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: heroStatus,
    });
  } catch (error) {
    console.error("GET /api/user/hero error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
