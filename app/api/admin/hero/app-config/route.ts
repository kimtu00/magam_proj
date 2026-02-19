import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * GET /api/admin/hero/app-config
 * 
 * 앱 설정값 조회
 */
export async function GET() {
  try {
    // 관리자 권한 확인
    await requireAdmin();

    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from("app_config")
      .select("*")
      .order("key", { ascending: true });

    if (error) {
      console.error("Error fetching app config:", error);
      return NextResponse.json(
        { error: "Failed to fetch app configuration" },
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
 * PUT /api/admin/hero/app-config
 * 
 * 앱 설정값 업데이트 (여러 개 동시 업데이트 가능)
 * 
 * Body: { configs: [{ key: string, value: string }] }
 */
export async function PUT(request: NextRequest) {
  try {
    // 관리자 권한 확인
    await requireAdmin();

    const body = await request.json();
    const { configs } = body;

    if (!Array.isArray(configs) || configs.length === 0) {
      return NextResponse.json(
        { error: "configs array is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 각 설정값 업데이트
    const results = await Promise.all(
      configs.map(async (config: { key: string; value: string }) => {
        const { error } = await supabase
          .from("app_config")
          .update({
            value: config.value,
            updated_at: new Date().toISOString(),
          })
          .eq("key", config.key);

        if (error) {
          console.error(`Error updating ${config.key}:`, error);
          return { key: config.key, success: false, error };
        }

        return { key: config.key, success: true };
      })
    );

    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      return NextResponse.json(
        {
          error: "Some configurations failed to update",
          failed,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
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
