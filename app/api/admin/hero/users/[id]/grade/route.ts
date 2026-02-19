import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/hero/users/:id/grade
 * 
 * 사용자 등급 수동 조정
 * 
 * Body:
 * - grade_level: 변경할 등급 레벨
 * - reason: 변경 사유 (필수)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // 관리자 권한 확인
    await requireAdmin();

    const { id: userId } = await context.params;
    const body = await request.json();
    const { grade_level, reason } = body;

    // 필수 필드 검증
    if (grade_level === undefined) {
      return NextResponse.json(
        { error: "grade_level is required" },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "reason is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 등급 설정 존재 확인
    const { data: gradeConfig, error: gradeError } = await supabase
      .from("hero_grade_config")
      .select("*")
      .eq("grade_level", grade_level)
      .eq("is_active", true)
      .single();

    if (gradeError || !gradeConfig) {
      return NextResponse.json(
        { error: "Invalid grade_level or grade is not active" },
        { status: 400 }
      );
    }

    // 사용자 히어로 상태 조회
    const { data: currentHero, error: heroError } = await supabase
      .from("user_hero")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (heroError && heroError.code !== "PGRST116") {
      console.error("Error fetching user hero:", heroError);
      return NextResponse.json(
        { error: "Failed to fetch user hero status" },
        { status: 500 }
      );
    }

    const currentLevel = currentHero?.grade_level || 0;

    // 현재 등급과 동일하면 에러
    if (currentLevel === grade_level) {
      return NextResponse.json(
        { error: "User is already at this grade level" },
        { status: 400 }
      );
    }

    // user_hero 업데이트 또는 생성
    let updatedHero;
    if (currentHero) {
      // 기존 레코드 업데이트
      const { data, error } = await supabase
        .from("user_hero")
        .update({
          grade_level,
          upgraded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating user hero:", error);
        return NextResponse.json(
          { error: "Failed to update user grade" },
          { status: 500 }
        );
      }
      updatedHero = data;
    } else {
      // 새 레코드 생성 (픽업 이력이 없는 사용자)
      const { data, error } = await supabase
        .from("user_hero")
        .insert({
          user_id: userId,
          grade_level,
          total_pickup_count: 0,
          total_saved_weight_g: 0,
          upgraded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating user hero:", error);
        return NextResponse.json(
          { error: "Failed to create user grade" },
          { status: 500 }
        );
      }
      updatedHero = data;
    }

    // hero_upgrade_log에 기록 추가
    const { error: logError } = await supabase
      .from("hero_upgrade_log")
      .insert({
        user_id: userId,
        from_level: currentLevel,
        to_level: grade_level,
        trigger_type: "manual",
        trigger_value: reason.trim(),
      });

    if (logError) {
      console.error("Error creating upgrade log:", logError);
      // 로그 생성 실패는 치명적이지 않으므로 계속 진행
    }

    return NextResponse.json({
      data: {
        ...updatedHero,
        grade_name: gradeConfig.grade_name,
        grade_emoji: gradeConfig.grade_emoji,
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
