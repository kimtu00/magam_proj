import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * GET /api/admin/hero/config
 * 
 * 모든 히어로 등급 설정 조회
 */
export async function GET() {
  try {
    // 관리자 권한 확인
    await requireAdmin();

    const supabase = getServiceRoleClient();

    // 등급 설정 조회 (grade_level 오름차순)
    const { data, error } = await supabase
      .from("hero_grade_config")
      .select("*")
      .order("grade_level", { ascending: true });

    if (error) {
      console.error("Error fetching grade configs:", error);
      return NextResponse.json(
        { error: "Failed to fetch grade configurations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
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

/**
 * POST /api/admin/hero/config
 * 
 * 새로운 히어로 등급 설정 추가
 */
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    await requireAdmin();

    const body = await request.json();
    const {
      grade_level,
      grade_name,
      grade_emoji,
      required_pickups,
      required_weight_kg,
      condition_type,
      benefits_json,
      tree_image_url,
    } = body;

    // 필수 필드 검증
    if (
      grade_level === undefined ||
      !grade_name ||
      required_pickups === undefined ||
      required_weight_kg === undefined ||
      !condition_type
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // condition_type 검증
    if (condition_type !== "OR" && condition_type !== "AND") {
      return NextResponse.json(
        { error: "condition_type must be either 'OR' or 'AND'" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // grade_level 중복 확인
    const { data: existing } = await supabase
      .from("hero_grade_config")
      .select("id")
      .eq("grade_level", grade_level)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Grade level already exists" },
        { status: 400 }
      );
    }

    // 새 등급 설정 추가
    const { data, error } = await supabase
      .from("hero_grade_config")
      .insert({
        grade_level,
        grade_name,
        grade_emoji: grade_emoji || null,
        required_pickups,
        required_weight_kg,
        condition_type,
        benefits_json: benefits_json || [],
        tree_image_url: tree_image_url || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating grade config:", error);
      return NextResponse.json(
        { error: "Failed to create grade configuration" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
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
