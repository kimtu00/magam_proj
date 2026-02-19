"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { uploadProductImage } from "@/lib/storage/upload-product-image";
import { ProductService } from "@/services/product";
import type { ProductFormData } from "./schema";
import { getStore } from "../actions";

/**
 * 상품 등록 Server Action
 *
 * 가게 정보 확인, 이미지 업로드, 상품 데이터 저장을 처리합니다.
 */
export async function createProduct(
  formData: FormData
): Promise<{ success: true } | { success: false; error: string }> {
  // 1. 인증 확인
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "인증되지 않은 사용자입니다.",
    };
  }

  // 2. 가게 정보 확인
  const store = await getStore();
  if (!store) {
    return {
      success: false,
      error: "가게 정보를 먼저 등록해주세요.",
    };
  }

  // 3. FormData에서 데이터 추출
  const name = formData.get("name") as string;
  const original_price = parseInt(formData.get("original_price") as string, 10);
  const discount_price = parseInt(formData.get("discount_price") as string, 10);
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const is_instant = formData.get("is_instant") === "true";
  const pickup_deadline = formData.get("pickup_deadline") as string;
  const image = formData.get("image");
  
  // 무게 정보 (선택사항)
  const weight_value_raw = formData.get("weight_value") as string | null;
  const weight_value = weight_value_raw ? parseFloat(weight_value_raw) : undefined;
  const weight_unit = (formData.get("weight_unit") as "g" | "kg") || "g";
  
  // 카테고리 (선택사항)
  const category = formData.get("category") as string || "기타";
  
  // 메뉴 템플릿 ID (선택사항)
  const template_id = formData.get("template_id") as string | null;

  // 4. 이미지 처리 (업로드 또는 URL 사용)
  let imageUrl: string;
  
  // 이미 URL 문자열인 경우 (템플릿 이미지)
  if (typeof image === "string") {
    imageUrl = image;
  } else if (image instanceof File) {
    // File 객체인 경우 업로드
    const imageResult = await uploadProductImage(image, store.id);
    if (!imageResult.success) {
      const failResult = imageResult as { success: false; error: string };
      return {
        success: false,
        error: failResult.error || "이미지 업로드에 실패했습니다.",
      };
    }
    imageUrl = imageResult.url;
  } else {
    return {
      success: false,
      error: "이미지를 선택해주세요.",
    };
  }

  // 5. 픽업 마감 시간 파싱
  const pickupDeadline = new Date(pickup_deadline);
  if (isNaN(pickupDeadline.getTime())) {
    return {
      success: false,
      error: "유효하지 않은 픽업 마감 시간입니다.",
    };
  }

  // 6. Service 호출 (상품 데이터 저장)
  const result = await ProductService.create(store.id, {
    name,
    original_price,
    discount_price,
    image_url: imageUrl,
    is_instant,
    pickup_deadline: pickupDeadline.toISOString(),
    quantity,
    weight_value,
    weight_unit,
    category,
    template_id: template_id || undefined,
  });

  // 7. 결과 처리
  if (result.success === false) {
    return {
      success: false,
      error: result.error,
    };
  }

  // 8. 캐시 무효화 (Next.js 특화 기능)
  revalidatePath("/seller/dashboard");
  revalidatePath("/seller/upload");

  // 9. 결과 반환
  return { success: true };
}

