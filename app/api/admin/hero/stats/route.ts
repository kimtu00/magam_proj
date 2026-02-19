import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * GET /api/admin/hero/stats
 * 
 * 히어로 시스템 통계 조회
 * - 등급별 사용자 분포
 * - 전체 통계 (픽업 수, 구한 음식 무게, 탄소 절감량)
 */
export async function GET() {
  try {
    // 관리자 권한 확인
    await requireAdmin();

    const supabase = getServiceRoleClient();

    // 1. 등급별 사용자 분포
    const { data: gradeDistribution, error: gradeError } = await supabase
      .from("user_hero")
      .select("grade_level");

    if (gradeError) {
      console.error("Error fetching grade distribution:", gradeError);
      return NextResponse.json(
        { error: "Failed to fetch grade distribution" },
        { status: 500 }
      );
    }

    // 등급별 카운트 계산
    const gradeCounts: Record<number, number> = {};
    (gradeDistribution || []).forEach((user) => {
      gradeCounts[user.grade_level] = (gradeCounts[user.grade_level] || 0) + 1;
    });

    // 전체 프로필 수 조회 (미등급 사용자 계산용)
    const { count: totalProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (profileError) {
      console.error("Error counting profiles:", profileError);
    }

    // 미등급 사용자 수 계산
    const ungradedCount = (totalProfiles || 0) - (gradeDistribution?.length || 0);

    // 2. 전체 통계
    const { data: totalStats, error: statsError } = await supabase
      .from("user_hero")
      .select("total_pickup_count, total_saved_weight_g");

    if (statsError) {
      console.error("Error fetching total stats:", statsError);
      return NextResponse.json(
        { error: "Failed to fetch total stats" },
        { status: 500 }
      );
    }

    // 통계 합산
    let totalPickups = 0;
    let totalWeightG = 0;

    (totalStats || []).forEach((stat) => {
      totalPickups += stat.total_pickup_count || 0;
      totalWeightG += Number(stat.total_saved_weight_g) || 0;
    });

    // kg로 변환
    const totalWeightKg = totalWeightG / 1000;

    // 3. 총 탄소 절감량 조회 (saved_food_log 테이블에서)
    const { data: co2Data, error: co2Error } = await supabase
      .from("saved_food_log")
      .select("co2_reduced_kg");

    if (co2Error) {
      console.error("Error fetching CO2 data:", co2Error);
    }

    let totalCo2Kg = 0;
    (co2Data || []).forEach((log) => {
      totalCo2Kg += Number(log.co2_reduced_kg) || 0;
    });

    // 등급 설정 조회 (등급명 매핑용)
    const { data: gradeConfigs } = await supabase
      .from("hero_grade_config")
      .select("grade_level, grade_name, grade_emoji")
      .eq("is_active", true)
      .order("grade_level", { ascending: true });

    const gradeConfigMap: Record<number, { name: string; emoji: string }> = {};
    (gradeConfigs || []).forEach((config) => {
      gradeConfigMap[config.grade_level] = {
        name: config.grade_name,
        emoji: config.grade_emoji || "",
      };
    });

    // 등급별 분포 데이터 구성
    const distribution = [
      {
        grade_level: 0,
        grade_name: "미등급",
        grade_emoji: "⏳",
        count: ungradedCount,
      },
      ...Object.entries(gradeCounts).map(([level, count]) => ({
        grade_level: Number(level),
        grade_name: gradeConfigMap[Number(level)]?.name || `레벨 ${level}`,
        grade_emoji: gradeConfigMap[Number(level)]?.emoji || "",
        count,
      })),
    ].sort((a, b) => a.grade_level - b.grade_level);

    return NextResponse.json({
      data: {
        distribution,
        totals: {
          total_pickups: totalPickups,
          total_weight_kg: Math.round(totalWeightKg * 10) / 10,
          total_co2_kg: Math.round(totalCo2Kg * 10) / 10,
        },
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
