import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/hero/config/:id
 * 
 * 히어로 등급 설정 수정
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // 관리자 권한 확인
    await requireAdmin();

    const { id } = await context.params;
    const body = await request.json();
    const {
      grade_name,
      grade_emoji,
      required_pickups,
      required_weight_kg,
      condition_type,
      benefits_json,
      tree_image_url,
    } = body;

    // condition_type 검증 (제공된 경우)
    if (condition_type && condition_type !== "OR" && condition_type !== "AND") {
      return NextResponse.json(
        { error: "condition_type must be either 'OR' or 'AND'" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 업데이트할 필드만 포함
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (grade_name !== undefined) updateData.grade_name = grade_name;
    if (grade_emoji !== undefined) updateData.grade_emoji = grade_emoji;
    if (required_pickups !== undefined) updateData.required_pickups = required_pickups;
    if (required_weight_kg !== undefined) updateData.required_weight_kg = required_weight_kg;
    if (condition_type !== undefined) updateData.condition_type = condition_type;
    if (benefits_json !== undefined) updateData.benefits_json = benefits_json;
    if (tree_image_url !== undefined) updateData.tree_image_url = tree_image_url;

    // 등급 설정 업데이트
    const { data, error } = await supabase
      .from("hero_grade_config")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating grade config:", error);
      
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Grade configuration not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: "Failed to update grade configuration" },
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
 * DELETE /api/admin/hero/config/:id
 * 
 * 히어로 등급 설정 삭제 (소프트 삭제 - is_active = false)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // 관리자 권한 확인
    await requireAdmin();

    const { id } = await context.params;
    const supabase = getServiceRoleClient();

    // 소프트 삭제 (is_active = false)
    const { data, error } = await supabase
      .from("hero_grade_config")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error deleting grade config:", error);
      
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Grade configuration not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: "Failed to delete grade configuration" },
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
