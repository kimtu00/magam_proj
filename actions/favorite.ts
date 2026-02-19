/**
 * Favorite Store Actions
 * 
 * 즐겨찾기 가게 관련 Server Actions
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { FavoriteService } from "@/services/favorite/favorite.service";

/**
 * 즐겨찾기 추가
 */
export async function addFavoriteStore(storeId: string) {
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: "인증이 필요합니다." };
  }

  const result = await FavoriteService.addFavorite({
    user_id: userId,
    store_id: storeId,
  });

  // revalidatePath 제거 - 클라이언트 이벤트로 실시간 업데이트 (페이지 리프레시 없이)

  return result;
}

/**
 * 즐겨찾기 제거
 */
export async function removeFavoriteStore(storeId: string) {
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: "인증이 필요합니다." };
  }

  const result = await FavoriteService.removeFavorite(userId, storeId);

  // revalidatePath 제거 - 클라이언트 이벤트로 실시간 업데이트 (페이지 리프레시 없이)

  return result;
}

/**
 * 즐겨찾기 목록 조회
 */
export async function getFavoriteStoreIds(): Promise<string[]> {
  const { userId } = await auth();
  
  if (!userId) return [];

  return await FavoriteService.getFavoriteStoreIds(userId);
}

/**
 * 즐겨찾기 목록 조회 (서버 전용)
 * Server Component에서 사용하기 위한 함수
 */
export async function getFavoriteStoreIdsServer(): Promise<string[]> {
  return await getFavoriteStoreIds();
}

/**
 * 즐겨찾기 여부 확인
 */
export async function checkIsFavorite(storeId: string): Promise<boolean> {
  const { userId } = await auth();
  
  if (!userId) return false;

  return await FavoriteService.isFavorite(userId, storeId);
}

