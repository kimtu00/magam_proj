import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";

/**
 * GET /api/auth/check-admin
 * 
 * 현재 로그인한 사용자가 관리자인지 확인합니다.
 * 
 * @returns { isAdmin: boolean }
 */
export async function GET() {
  try {
    const admin = await isAdmin();
    return NextResponse.json({ isAdmin: admin });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ isAdmin: false });
  }
}
