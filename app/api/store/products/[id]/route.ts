/**
 * @file app/api/store/products/[id]/route.ts
 * @description 상품 수정/삭제 API (store-admin 전용)
 *
 * @method PUT - 상품 수정
 * @method DELETE - 상품 삭제
 * @route /api/store/products/:id
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { StoreService } from "@/services/store";
import { ProductService } from "@/services/product";
import { uploadProductImage } from "@/lib/storage/upload-product-image";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * PUT: 상품 수정
 */
export async function PUT(
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

    // 5. FormData 파싱
    const formData = await request.formData();

    const name = formData.get("name") as string | null;
    const category = formData.get("category") as string | null;
    const originalPrice = formData.get("originalPrice")
      ? parseInt(formData.get("originalPrice") as string, 10)
      : undefined;
    const discountPrice = formData.get("discountPrice")
      ? parseInt(formData.get("discountPrice") as string, 10)
      : undefined;
    const quantity = formData.get("quantity")
      ? parseInt(formData.get("quantity") as string, 10)
      : undefined;
    const deadline = formData.get("deadline") as string | null;
    const description = formData.get("description") as string | null;
    const image = formData.get("image");
    const weightValue = formData.get("weight")
      ? parseFloat(formData.get("weight") as string)
      : undefined;

    // 6. 이미지 처리 (선택사항)
    let imageUrl: string | undefined = undefined;

    if (typeof image === "string") {
      imageUrl = image;
    } else if (image instanceof File) {
      const imageResult = await uploadProductImage(image, store.id);
      if (!imageResult.success) {
        const failResult = imageResult as { success: false; error: string };
        return NextResponse.json(
          {
            success: false,
            error: failResult.error || "이미지 업로드에 실패했습니다.",
          },
          { status: 500 }
        );
      }
      imageUrl = imageResult.url;
    }

    // 7. 픽업 마감 시간 파싱 (선택사항)
    let pickupDeadline: string | undefined = undefined;
    if (deadline) {
      const parsedDeadline = new Date(deadline);
      if (isNaN(parsedDeadline.getTime())) {
        return NextResponse.json(
          { success: false, error: "유효하지 않은 픽업 마감 시간입니다." },
          { status: 400 }
        );
      }
      pickupDeadline = parsedDeadline.toISOString();
    }

    // 8. 업데이트할 데이터 구성
    const updateData: Record<string, unknown> = {};

    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (originalPrice !== undefined)
      updateData.original_price = originalPrice;
    if (discountPrice !== undefined)
      updateData.discount_price = discountPrice;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (pickupDeadline) updateData.pickup_deadline = pickupDeadline;
    if (description !== null) updateData.description = description;
    if (imageUrl) updateData.image_url = imageUrl;
    if (weightValue !== undefined) updateData.weight_value = weightValue;

    // 9. 상품 업데이트
    const supabase = await createClerkSupabaseClient();

    const { error: updateError } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", productId);

    if (updateError) {
      console.error("Failed to update product:", updateError);
      return NextResponse.json(
        { success: false, error: "상품 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    // 10. 업데이트된 상품 재조회
    const updatedProduct = await ProductService.findById(productId);

    return NextResponse.json(
      {
        success: true,
        data: updatedProduct,
        message: "상품이 수정되었습니다.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 상품 삭제
 */
export async function DELETE(
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

    // 5. 상품 삭제 (소프트 삭제: 상태를 'DELETED'로 변경)
    const supabase = await createClerkSupabaseClient();

    const { error: deleteError } = await supabase
      .from("products")
      .update({ status: "CLOSED", updated_at: new Date().toISOString() })
      .eq("id", productId);

    if (deleteError) {
      console.error("Failed to delete product:", deleteError);
      return NextResponse.json(
        { success: false, error: "상품 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "상품이 삭제되었습니다.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
