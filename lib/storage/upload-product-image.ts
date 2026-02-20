"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * 상품 이미지 업로드
 *
 * Supabase Storage의 `products` 버킷에 이미지를 업로드하고 Public URL을 반환합니다.
 *
 * 참고: Storage 업로드는 Service Role Key를 사용합니다.
 * Clerk JWT 토큰의 알고리즘 호환성 문제를 피하기 위함입니다.
 *
 * @param file - 업로드할 파일 (File 객체 또는 FormData에서 추출)
 * @param storeId - 가게 ID (경로 구조에 사용)
 * @returns 업로드된 이미지의 Public URL 또는 에러
 */
export async function uploadProductImage(
  file: File,
  storeId?: string
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "인증되지 않은 사용자입니다.",
      };
    }

    // 파일 검증
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: "파일 크기는 5MB를 초과할 수 없습니다.",
      };
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "JPEG, PNG, WebP 형식의 이미지만 업로드할 수 있습니다.",
      };
    }

    // 파일명 생성
    const fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${random}.${fileExt}`;

    // 경로 구조: products/{store_id}/{filename}
    // 또는 products/{clerk_user_id}/{filename} (storeId가 없는 경우)
    const filePath = storeId
      ? `${storeId}/${fileName}`
      : `${userId}/${fileName}`;

    // Service Role Client 사용 (Storage 업로드용)
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase.storage
      .from("products")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("❌ Error uploading image:");
      console.error("  Message:", error.message);
      console.error("  Error object:", error);
      console.error("  File path:", filePath);
      console.error("  Store ID:", storeId);
      console.error("  User ID:", userId);
      console.error("  Bucket: products");
      console.error("  File size:", file.size);
      console.error("  File type:", file.type);
      
      return {
        success: false,
        error: `이미지 업로드에 실패했습니다: ${error.message || "알 수 없는 오류"}`,
      };
    }

    // Public URL 생성
    const {
      data: { publicUrl },
    } = supabase.storage.from("products").getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Error in uploadProductImage:", error);
    return {
      success: false,
      error: "시스템 오류가 발생했습니다.",
    };
  }
}

/**
 * 상품 이미지 삭제
 *
 * @param imageUrl - 삭제할 이미지의 URL
 * @returns 성공 여부
 */
export async function deleteProductImage(
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "인증되지 않은 사용자입니다.",
      };
    }

    // URL에서 경로 추출
    // 예: https://xxx.supabase.co/storage/v1/object/public/products/{path}
    const urlParts = imageUrl.split("/products/");
    if (urlParts.length !== 2) {
      return {
        success: false,
        error: "유효하지 않은 이미지 URL입니다.",
      };
    }

    const filePath = urlParts[1];

    // 경로에서 사용자 ID 확인 (보안)
    const pathParts = filePath.split("/");
    if (pathParts[0] !== userId) {
      return {
        success: false,
        error: "이미지를 삭제할 권한이 없습니다.",
      };
    }

    // Service Role Client 사용 (Storage 삭제용)
    const supabase = getServiceRoleClient();
    const { error } = await supabase.storage
      .from("products")
      .remove([filePath]);

    if (error) {
      console.error("Error deleting image:", error);
      return {
        success: false,
        error: "이미지 삭제에 실패했습니다.",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in deleteProductImage:", error);
    return {
      success: false,
      error: "시스템 오류가 발생했습니다.",
    };
  }
}

