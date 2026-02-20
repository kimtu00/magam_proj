/**
 * @file app/api/auth/setup-admin/route.ts
 * @description 일회성 관리자 역할 설정 API (사용 후 삭제 필요)
 *
 * 현재 로그인한 사용자의 Clerk publicMetadata.role을 "admin"으로 설정합니다.
 * SETUP_SECRET 쿼리 파라미터로 무단 접근을 방지합니다.
 *
 * 사용법:
 *   GET /api/auth/setup-admin?secret=<SETUP_SECRET 환경변수 값>
 *
 * ⚠️ 주의: 관리자 설정 완료 후 이 파일을 반드시 삭제하세요.
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // secret 파라미터 확인
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 로그인 확인
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not logged in - please log in first" }, { status: 401 });
  }

  try {
    // Clerk publicMetadata.role을 admin으로 설정
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: "admin" },
    });

    console.log("✅ Admin role set for userId:", userId);

    return NextResponse.json({
      success: true,
      userId,
      role: "admin",
      message: "관리자 역할이 설정되었습니다. 로그아웃 후 재로그인하세요.",
    });
  } catch (error) {
    console.error("❌ Failed to set admin role:", error);
    return NextResponse.json(
      { error: "Failed to set admin role", details: String(error) },
      { status: 500 }
    );
  }
}
