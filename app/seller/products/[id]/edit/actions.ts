"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { uploadProductImage, deleteProductImage } from "@/lib/storage/upload-product-image";
import { ProductService } from "@/services/product";
import { createClient } from "@/lib/supabase/server";
import type { ProductEditFormData } from "./schema";
import { getStore } from "@/app/seller/actions";

/**
 * 상품 수정 Server Action
 *
 * 가게 정보 확인, 이미지 업로드(선택), 상품 데이터 업데이트를 처리합니다.
 */
export async function updateProduct(
  productId: string,
  formData: ProductEditFormData
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

  // 3. 기존 상품 정보 조회 (권한 확인 및 기존 이미지 URL 확인)
  const existingProduct = await ProductService.findById(productId);
  if (!existingProduct) {
    return {
      success: false,
      error: "상품을 찾을 수 없습니다.",
    };
  }

  // 4. 내 가게의 상품인지 확인
  if (existingProduct.store_id !== store.id) {
    return {
      success: false,
      error: "이 상품을 수정할 권한이 없습니다.",
    };
  }

  // 5. 이미지 처리
  let imageUrl: string | undefined = undefined;
  let shouldDeleteOldImage = false;

  if (formData.image) {
    if (formData.image instanceof File) {
      // 새 이미지 업로드
      const imageResult = await uploadProductImage(formData.image, store.id);
      if (!imageResult.success) {
        return {
          success: false,
          error:
            "error" in imageResult
              ? imageResult.error
              : "이미지 업로드에 실패했습니다.",
        };
      }
      imageUrl = imageResult.url;
      // 기존 이미지가 있으면 삭제 예정
      if (existingProduct.image_url) {
        shouldDeleteOldImage = true;
      }
    } else {
      // 기존 이미지 URL 유지
      imageUrl = formData.image;
    }
  } else if (existingProduct.image_url) {
    // 이미지가 없고 기존 이미지가 있으면 유지
    imageUrl = existingProduct.image_url;
  }

  // 6. 픽업 마감 시간 파싱
  const pickupDeadline = new Date(formData.pickup_deadline);
  if (isNaN(pickupDeadline.getTime())) {
    return {
      success: false,
      error: "유효하지 않은 픽업 마감 시간입니다.",
    };
  }

  // 6-1. 픽업 마감 시간 검증: 예약된 픽업 희망 시간보다 이전으로 변경 불가
  const supabase = await createClient();
  const { data: reservations, error: reservationError } = await supabase
    .from("orders")
    .select("preferred_pickup_time")
    .eq("product_id", productId)
    .eq("status", "RESERVED")
    .not("preferred_pickup_time", "is", null)
    .order("preferred_pickup_time", { ascending: false })
    .limit(1);

  if (reservationError) {
    console.error("Error checking reservations:", reservationError);
    return {
      success: false,
      error: "예약 정보 확인 중 오류가 발생했습니다.",
    };
  }

  // 가장 늦은 예약 픽업 시간이 있으면 검증
  if (reservations && reservations.length > 0) {
    const latestPickupTime = new Date(reservations[0].preferred_pickup_time);
    
    if (pickupDeadline < latestPickupTime) {
      const formattedTime = latestPickupTime.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      
      return {
        success: false,
        error: `마감 시간을 ${formattedTime} 이전으로 설정할 수 없습니다. 이미 예약된 픽업 시간이 있습니다.`,
      };
    }
  }

  // 7. Service 호출 (상품 데이터 업데이트)
  const updateData: {
    name: string;
    original_price: number;
    discount_price: number;
    image_url?: string | null;
    is_instant: boolean;
    pickup_deadline: string;
    quantity: number;
    weight_value?: number | null;
    weight_unit?: "g" | "kg";
  } = {
    name: formData.name,
    original_price: formData.original_price,
    discount_price: formData.discount_price,
    is_instant: formData.is_instant,
    pickup_deadline: pickupDeadline.toISOString(),
    quantity: formData.quantity,
    weight_value: formData.weight_value,
    weight_unit: formData.weight_unit,
  };

  // imageUrl이 정의된 경우에만 포함 (undefined면 기존 값 유지)
  if (imageUrl !== undefined) {
    updateData.image_url = imageUrl;
  }

  const result = await ProductService.update(productId, store.id, updateData);

  // 8. 결과 처리
  if (result.success === false) {
    return {
      success: false,
      error: result.error,
    };
  }

  // 9. 기존 이미지 삭제 (새 이미지 업로드 성공 후)
  if (shouldDeleteOldImage && existingProduct.image_url) {
    await deleteProductImage(existingProduct.image_url);
  }

  // 10. 캐시 무효화 (Next.js 특화 기능)
  revalidatePath("/seller/dashboard");
  revalidatePath(`/seller/products/${productId}/edit`);

  // 11. 결과 반환
  return { success: true };
}

