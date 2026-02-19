import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Clerk 사용자를 Supabase profiles 테이블에 동기화하는 API
 *
 * 클라이언트에서 로그인 후 이 API를 호출하여 사용자 정보를 Supabase에 저장합니다.
 * 이미 존재하는 경우 업데이트하고, 없으면 새로 생성합니다.
 * 
 * PRD 스키마에 따라 profiles 테이블을 사용하며, role은 기본값 'BUYER'로 설정됩니다.
 * 나중에 onboarding 페이지에서 role을 'SELLER'로 업데이트할 수 있습니다.
 */
export async function POST() {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clerk에서 사용자 정보 가져오기
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Supabase에 사용자 정보 동기화 (profiles 테이블 사용)
    const supabase = getServiceRoleClient();

    // Clerk의 publicMetadata에서 role 확인 (있으면 사용, 없으면 기본값 'consumer')
    const rawRole = (clerkUser.publicMetadata?.role as string) || "consumer";

    // 레거시 SELLER/BUYER 및 신규 producer/consumer 모두 처리
    let normalizedRole: string;
    if (rawRole === "producer" || rawRole === "SELLER") {
      normalizedRole = "producer";
    } else if (rawRole === "admin" || rawRole === "super_admin") {
      normalizedRole = rawRole;
    } else {
      normalizedRole = "consumer";
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          clerk_id: clerkUser.id,
          role: normalizedRole,
          nickname:
            clerkUser.fullName ||
            clerkUser.username ||
            clerkUser.emailAddresses[0]?.emailAddress ||
            "Unknown",
        },
        {
          onConflict: "clerk_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Supabase sync error:", error);
      return NextResponse.json(
        { error: "Failed to sync user", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error) {
    console.error("Sync user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
