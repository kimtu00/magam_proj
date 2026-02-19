/**
 * @file app/api/store/products/route.ts
 * @description 상품 목록 조회 및 등록 API (store-admin 전용)
 *
 * @method GET  - 현재 사장님 가게의 상품 목록 조회
 * @method POST - 새 상품 등록
 * @route /api/store/products
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { StoreService } from "@/services/store";
import { ProductService } from "@/services/product";
import { uploadProductImage } from "@/lib/storage/upload-product-image";
import type { StoreProduct } from "@/types/store-admin";

/**
 * DB 상품 상태를 store-admin UI 상태로 변환
 * - AVAILABLE + 마감 전 → ACTIVE
 * - 그 외 (SOLD, SOLD_OUT, RESERVED, 마감 후) → CLOSED
 */
function mapProductStatus(
  dbStatus: string,
  pickupDeadline: string
): "ACTIVE" | "CLOSED" {
  if (dbStatus !== "AVAILABLE") return "CLOSED";
  if (new Date(pickupDeadline) < new Date()) return "CLOSED";
  return "ACTIVE";
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const store = await StoreService.findByOwnerId(userId);
    if (!store) {
      return NextResponse.json(
        { success: false, error: "가게 정보가 없습니다." },
        { status: 404 }
      );
    }

    const dbProducts = await ProductService.findAllByStoreId(store.id);

    const products: StoreProduct[] = dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category || "기타",
      originalPrice: p.original_price,
      discountPrice: p.discount_price,
      quantity: p.quantity,
      weight: p.weight_value ?? 0,
      status: mapProductStatus(p.status, p.pickup_deadline),
      deadline: p.pickup_deadline,
      reservedCount: p.reserved_quantity ?? 0,
      createdAt: p.created_at,
    }));

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // 3. FormData 파싱
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const category = (formData.get("category") as string) || "기타";
    const originalPrice = parseInt(
      formData.get("originalPrice") as string,
      10
    );
    const discountPrice = parseInt(
      formData.get("discountPrice") as string,
      10
    );
    const quantity = parseInt(formData.get("quantity") as string, 10);
    const deadline = formData.get("deadline") as string;
    const description = formData.get("description") as string | null;
    const image = formData.get("image");

    // 무게 정보 (선택)
    const weightValue = formData.get("weight")
      ? parseFloat(formData.get("weight") as string)
      : undefined;

    // 4. 유효성 검사
    if (!name || !originalPrice || !discountPrice || !quantity || !deadline) {
      return NextResponse.json(
        { success: false, error: "필수 항목을 입력해주세요." },
        { status: 400 }
      );
    }

    // 5. 이미지 업로드
    let imageUrl: string;

    if (typeof image === "string") {
      // 이미 URL 문자열인 경우
      imageUrl = image;
    } else if (image instanceof File) {
      // File 객체인 경우 업로드
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
    } else {
      return NextResponse.json(
        { success: false, error: "이미지를 선택해주세요." },
        { status: 400 }
      );
    }

    // 6. 픽업 마감 시간 파싱
    const pickupDeadline = new Date(deadline);
    if (isNaN(pickupDeadline.getTime())) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 픽업 마감 시간입니다." },
        { status: 400 }
      );
    }

    // 7. Service 호출 (상품 생성)
    const result = await ProductService.create(store.id, {
      name,
      category,
      original_price: originalPrice,
      discount_price: discountPrice,
      image_url: imageUrl,
      is_instant: false, // store-admin은 일반 상품만
      pickup_deadline: pickupDeadline.toISOString(),
      quantity,
      weight_value: weightValue,
      weight_unit: "g",
      description: description || undefined,
    });

    // 8. 결과 처리
    if (result.success === false) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: "상품이 등록되었습니다.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
