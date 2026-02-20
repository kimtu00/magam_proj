import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * GET /api/auth/check-admin
 *
 * 현재 로그인한 사용자가 관리자인지 확인합니다.
 * (임시: 디버그 정보 포함 - 원인 파악 후 제거 예정)
 *
 * @returns { isAdmin: boolean, debug: object }
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ isAdmin: false, debug: "not logged in" });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = user.publicMetadata?.role as string | undefined;
    const userEmail = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId
    )?.emailAddress;

    const adminEmails = process.env.ADMIN_EMAILS;
    const adminList = adminEmails?.split(",").map((e) => e.trim().toLowerCase()) || [];
    const isEmailMatch = userEmail ? adminList.includes(userEmail.toLowerCase()) : false;
    const isRoleAdmin = role === "admin" || role === "super_admin";

    return NextResponse.json({
      isAdmin: isRoleAdmin || isEmailMatch,
      debug: {
        role,
        userEmail,
        adminEmailsSet: !!adminEmails,
        adminList,
        isEmailMatch,
        isRoleAdmin,
      },
    });
  } catch (error) {
    return NextResponse.json({ isAdmin: false, debug: String(error) });
  }
}
