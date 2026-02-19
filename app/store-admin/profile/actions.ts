/**
 * @file app/store-admin/profile/actions.ts
 * @description 사장님 가게 정보 수정 Server Action (store-admin 경로)
 *
 * seller/actions.ts의 updateStore와 동일한 로직이지만
 * revalidatePath를 store-admin 경로로 무효화합니다.
 *
 * @dependencies
 * - Clerk: 인증
 * - StoreService: 가게 정보 업데이트
 * - uploadStoreImage: 이미지 업로드
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { StoreService } from "@/services/store";

/**
 * 가게 정보를 수정합니다. (store-admin 경로 전용)
 *
 * @param formData - 가게 정보를 담은 FormData
 * @returns 수정된 가게 정보 또는 에러
 */
export async function updateStoreProfile(formData: FormData) {
  // 1. 인증 확인
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false as const,
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

  if (deleteImage === true) {
    imageUrl = "";
  } else if (image && image.size > 0) {
    const { uploadStoreImage } = await import("@/lib/storage/upload-store-image");
    const imageResult = await uploadStoreImage(image, storeId);

    if (!imageResult.success) {
      const failResult = imageResult as { success: false; error: string };
      return {
        success: false as const,
        error: failResult.error || "이미지 업로드에 실패했습니다.",
      };
    }

    imageUrl = imageResult.url;
  }

  // 4. Service 호출
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
      success: false as const,
      error: result.error,
    };
  }

  // 6. 캐시 무효화 (store-admin 경로)
  revalidatePath("/store-admin/profile");
  revalidatePath("/store-admin/dashboard");

  // 7. 결과 반환
  return {
    success: true as const,
    store: result.data,
  };
}
