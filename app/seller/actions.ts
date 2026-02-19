"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { StoreService } from "@/services/store";
import { ProductService } from "@/services/product";
import type { StoreData } from "@/services/store";
import type { ProductData as ServiceProductData } from "@/services/product";

/**
 * 상품 정보 타입 (재export)
 */
export type ProductData = ServiceProductData;

/**
 * 현재 사용자의 가게 정보를 조회합니다.
 *
 * @returns 가게 정보 또는 null (가게 정보가 없는 경우)
 */
export async function getStore(): Promise<StoreData | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Service 호출
  return await StoreService.findByOwnerId(userId);
}

/**
 * 가게 정보를 생성합니다.
 *
 * @param formData - 가게 정보를 담은 FormData
 * @returns 생성된 가게 정보 또는 에러
 */
export async function createStore(formData: FormData) {
  // 1. 인증 확인
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "인증되지 않은 사용자입니다.",
    };
  }

  // 2. FormData에서 데이터 추출
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const phone = formData.get("phone") as string | null;
  const image = formData.get("image") as File | null;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);

  // 3. 이미지 업로드 (선택사항)
  let imageUrl: string | undefined = undefined;
  if (image && image.size > 0) {
    const { uploadStoreImage } = await import("@/lib/storage/upload-store-image");
    const imageResult = await uploadStoreImage(image);
    
    if (!imageResult.success) {
      const failResult = imageResult as { success: false; error: string };
      return {
        success: false,
        error: failResult.error || "이미지 업로드에 실패했습니다.",
      };
    }
    
    imageUrl = imageResult.url;
  }

  // 4. Service 호출 (비즈니스 로직 위임)
  const result = await StoreService.create(userId, { 
    name, 
    address: address || undefined, 
    phone: phone || undefined, 
    image_url: imageUrl,
    latitude: isNaN(latitude) ? undefined : latitude, 
    longitude: isNaN(longitude) ? undefined : longitude 
  });

  // 5. 결과 처리
  if (result.success === false) {
    return {
      success: false,
      error: result.error,
    };
  }

  // 6. 캐시 무효화 (Next.js 특화 기능)
  revalidatePath("/seller");
  revalidatePath("/seller/upload");

  // 7. 결과 반환
  return {
    success: true,
    store: result.data,
  };
}

/**
 * 가게 정보를 수정합니다.
 *
 * @param formData - 가게 정보를 담은 FormData
 * @returns 수정된 가게 정보 또는 에러
 */
export async function updateStore(formData: FormData) {
  // 1. 인증 확인
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "인증되지 않은 사용자입니다.",
    };
  }

  // 2. FormData에서 데이터 추출
  const storeId = formData.get("storeId") as string;
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const phone = formData.get("phone") as string | null;
  const image = formData.get("image") as File | null;
  const deleteImage = formData.get("deleteImage") === "true";
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);

  // 3. 이미지 처리
  let imageUrl: string | undefined = undefined;
  
  // 이미지 삭제 요청인 경우
  if (deleteImage === true) {
    imageUrl = ""; // 빈 문자열로 설정하여 null로 저장
  }
  // 새 이미지 업로드인 경우
  else if (image && image.size > 0) {
    const { uploadStoreImage } = await import("@/lib/storage/upload-store-image");
    const imageResult = await uploadStoreImage(image, storeId);
    
    if (!imageResult.success) {
      const failResult = imageResult as { success: false; error: string };
      return {
        success: false,
        error: failResult.error || "이미지 업로드에 실패했습니다.",
      };
    }
    
    imageUrl = imageResult.url;
  }

  // 4. Service 호출 (비즈니스 로직 위임)
  const result = await StoreService.update(storeId, userId, {
    name: name || undefined,
    address: address || undefined,
    phone: phone || undefined,
    image_url: imageUrl,
    latitude: isNaN(latitude) ? undefined : latitude,
    longitude: isNaN(longitude) ? undefined : longitude,
  });

  // 5. 결과 처리
  if (result.success === false) {
    return {
      success: false,
      error: result.error,
    };
  }

  // 6. 캐시 무효화 (Next.js 특화 기능)
  revalidatePath("/seller");
  revalidatePath("/seller/settings");
  revalidatePath("/seller/upload");

  // 7. 결과 반환
  return {
    success: true,
    store: result.data,
  };
}

/**
 * 현재 사장님의 가게에 등록된 상품 리스트를 조회합니다.
 */
export async function getMyProducts(): Promise<ProductData[]> {
  const store = await getStore();

  if (!store) {
    return [];
  }

  // Service 호출 (판매자용 - 모든 상품 조회)
  return await ProductService.findAllByStoreId(store.id);
}

/**
 * 상품 상태를 업데이트합니다.
 *
 * 현재는 판매 완료(SOLD) 처리에만 사용합니다.
 */
export async function updateProductStatus(
  productId: string,
  newStatus: "SOLD"
) {
  // 1. 인증 확인
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "인증되지 않은 사용자입니다.",
    };
  }

  // 2. 가게 정보 조회
  const store = await getStore();

  if (!store) {
    return {
      success: false,
      error: "가게 정보가 없습니다.",
    };
  }

  // 3. Service 호출
  const result = await ProductService.updateStatus(
    productId,
    store.id,
    newStatus
  );

  // 4. 캐시 무효화 (Next.js 특화 기능)
  if (result.success) {
    revalidatePath("/seller/dashboard");
  }

  // 5. 결과 반환
  return result;
}

/**
 * 매장 판매 처리
 * 
 * 매장에서 직접 판매한 상품의 수량을 차감합니다.
 * 
 * @param productId - 판매할 상품 ID
 * @param quantity - 판매 수량
 * @returns 성공 여부 및 남은 수량
 */
export async function sellInStore(
  productId: string,
  quantity: number
): Promise<{ success: boolean; error?: string; remaining?: number }> {
  console.log('🔵 Server Action - sellInStore 호출:', { productId, quantity });
  
  // 1. 인증 확인
  const { userId } = await auth();

  if (!userId) {
    console.error('❌ 인증 실패: userId 없음');
    return {
      success: false,
      error: "인증되지 않은 사용자입니다.",
    };
  }

  console.log('✅ 인증 성공:', userId);

  // 2. 가게 정보 조회
  const store = await getStore();

  if (!store) {
    console.error('❌ 가게 정보 없음');
    return {
      success: false,
      error: "가게 정보가 없습니다.",
    };
  }

  console.log('✅ 가게 정보 확인:', store.id);

  // 3. Service 호출
  console.log('🔄 ProductService.sellInStore 호출 중...');
  const result = await ProductService.sellInStore(productId, store.id, quantity);
  console.log('🔵 ProductService.sellInStore 결과:', result);

  // 4. 캐시 무효화 (Next.js 특화 기능)
  if (result.success) {
    console.log('✅ 매장 판매 성공 - 캐시 무효화 중...');
    revalidatePath("/seller/dashboard");
  }

  // 5. 결과 반환
  if (result.success) {
    return {
      success: true,
      remaining: result.data.remaining_quantity,
    };
  }

  return {
    success: false,
    error: (result as { success: false; error: string }).error,
  };
}
