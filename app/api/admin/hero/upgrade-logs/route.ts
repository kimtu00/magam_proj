import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * GET /api/admin/hero/upgrade-logs
 * 
 * 히어로 등급 상승 이력 조회 (페이지네이션)
 * 
 * Query params:
 * - page: 페이지 번호 (기본값: 1)
 * - limit: 페이지당 항목 수 (기본값: 10)
 * - user_id: 특정 사용자 필터링 (선택)
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const userId = searchParams.get("user_id");

    const offset = (page - 1) * limit;

    const supabase = getServiceRoleClient();

    // 등급 설정 조회 (등급명 매핑용)
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

    // 로그 조회 쿼리 구성
    let query = supabase
      .from("hero_upgrade_log")
      .select(
        `
        *,
        profiles!hero_upgrade_log_user_id_fkey (
          clerk_id,
          nickname
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // 사용자 필터링
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching upgrade logs:", error);
      return NextResponse.json(
        { error: "Failed to fetch upgrade logs" },
        { status: 500 }
      );
    }

    // 데이터 변환 (등급명 추가)
    const logs = (data || []).map((log) => ({
      id: log.id,
      user_id: log.user_id,
      user_nickname: log.profiles?.nickname || "알 수 없음",
      from_level: log.from_level,
      from_grade_name:
        gradeConfigMap[log.from_level]?.name || `레벨 ${log.from_level}`,
      from_grade_emoji: gradeConfigMap[log.from_level]?.emoji || "",
      to_level: log.to_level,
      to_grade_name:
        gradeConfigMap[log.to_level]?.name || `레벨 ${log.to_level}`,
      to_grade_emoji: gradeConfigMap[log.to_level]?.emoji || "",
      trigger_type: log.trigger_type,
      trigger_value: log.trigger_value,
      created_at: log.created_at,
    }));

    return NextResponse.json({
      data: logs,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });
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
