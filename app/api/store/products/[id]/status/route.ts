/**
 * @file app/api/store/products/[id]/status/route.ts
 * @description 상품 상태 변경 API (store-admin 전용)
 *
 * 주요 용도: 마감처리 (ACTIVE -> CLOSED)
 *
 * @method PATCH
 * @route /api/store/products/:id/status
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { StoreService } from "@/services/store";
import { ProductService } from "@/services/product";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // 2. 가게 정보 조회
    const store = await StoreService.findByOwnerId(userId);

    if (!store) {
      return NextResponse.json(
        { success: false, error: "가게 정보가 없습니다." },
        { status: 404 }
      );
    }

    // 3. 상품 ID 추출
    const { id: productId } = await context.params;

    // 4. 상품 소유 확인
    const product = await ProductService.findById(productId);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (product.store_id !== store.id) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 5. 요청 본문 파싱
    const body = await request.json();
    const { status: newStatus } = body;

    // 6. 유효성 검사
    if (!newStatus || !["ACTIVE", "CLOSED", "SOLD"].includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: "유효하지 않은 상태입니다. (ACTIVE, CLOSED, SOLD)",
        },
        { status: 400 }
      );
    }

    // 7. 상태 업데이트
    const supabase = await createClerkSupabaseClient();

    const { error: updateError } = await supabase
      .from("products")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (updateError) {
      console.error("Failed to update product status:", updateError);
      return NextResponse.json(
        { success: false, error: "상태 변경에 실패했습니다." },
        { status: 500 }
      );
    }

    // 8. 업데이트된 상품 재조회
    const updatedProduct = await ProductService.findById(productId);

    return NextResponse.json(
      {
        success: true,
        data: updatedProduct,
        message: `상품 상태가 ${newStatus}로 변경되었습니다.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update product status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
