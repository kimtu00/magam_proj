import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * GET /api/admin/hero/users
 * 
 * 사용자 검색 (이름, 이메일, ID로 검색)
 * 
 * Query params:
 * - q: 검색어
 * - limit: 결과 수 제한 (기본값: 10)
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 프로필 검색 (nickname 또는 clerk_id로 검색)
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("clerk_id, nickname, role, created_at")
      .or(`nickname.ilike.%${query}%,clerk_id.ilike.%${query}%`)
      .limit(limit);

    if (profileError) {
      console.error("Error searching profiles:", profileError);
      return NextResponse.json(
        { error: "Failed to search users" },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 각 사용자의 히어로 상태 조회
    const userIds = profiles.map((p) => p.clerk_id);
    const { data: heroStatuses } = await supabase
      .from("user_hero")
      .select("user_id, grade_level, total_pickup_count, total_saved_weight_g")
      .in("user_id", userIds);

    // 등급 설정 조회
    const { data: gradeConfigs } = await supabase
      .from("hero_grade_config")
      .select("grade_level, grade_name, grade_emoji")
      .order("grade_level", { ascending: true });

    const gradeConfigMap: Record<number, { name: string; emoji: string }> = {};
    (gradeConfigs || []).forEach((config) => {
      gradeConfigMap[config.grade_level] = {
        name: config.grade_name,
        emoji: config.grade_emoji || "",
      };
    });

    const heroMap = new Map(
      (heroStatuses || []).map((h) => [h.user_id, h])
    );

    // 사용자 정보와 히어로 상태 결합
    const users = profiles.map((profile) => {
      const hero = heroMap.get(profile.clerk_id);
      const gradeLevel = hero?.grade_level || 0;

      return {
        user_id: profile.clerk_id,
        nickname: profile.nickname || "닉네임 없음",
        role: profile.role,
        grade_level: gradeLevel,
        grade_name:
          gradeLevel === 0
            ? "미등급"
            : gradeConfigMap[gradeLevel]?.name || `레벨 ${gradeLevel}`,
        grade_emoji:
          gradeLevel === 0 ? "⏳" : gradeConfigMap[gradeLevel]?.emoji || "",
        total_pickup_count: hero?.total_pickup_count || 0,
        total_saved_weight_kg: hero
          ? Math.round((Number(hero.total_saved_weight_g) / 1000) * 10) / 10
          : 0,
        created_at: profile.created_at,
      };
    });

    return NextResponse.json({ data: users });
  } catch (error) {
    console.error("Admin API error:", error);
    
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
