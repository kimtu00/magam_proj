/**
 * Favorite Store Service
 * 
 * ?�용?�의 즐겨찾기 가�?관�??�비??
 */

import { supabase } from "@/lib/supabase/client";
import type { FavoriteStoreData, CreateFavoriteInput } from "./favorite.types";
import type { ServiceResult } from "../common.types";

export class FavoriteService {
  /**
   * 즐겨찾기 추�?
   */
  static async addFavorite(
    input: CreateFavoriteInput
  ): Promise<ServiceResult<FavoriteStoreData>> {
    const { data, error } = await supabase
      .from("user_favorite_stores")
      .insert(input)
      .select()
      .single();

    if (error) {
      console.error("Error adding favorite:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as FavoriteStoreData };
  }

  /**
   * 즐겨찾기 ?�거
   */
  static async removeFavorite(
    userId: string,
    storeId: string
  ): Promise<ServiceResult<void>> {
    const { error } = await supabase
      .from("user_favorite_stores")
      .delete()
      .eq("user_id", userId)
      .eq("store_id", storeId);

    if (error) {
      console.error("Error removing favorite:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: undefined };
  }

  /**
   * ?�용?�의 즐겨찾기 가�?ID 목록 조회
   */
  static async getFavoriteStoreIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("user_favorite_stores")
      .select("store_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching favorites:", error);
      return [];
    }

    return data.map((row) => row.store_id);
  }

  /**
   * ?�정 가게�? 즐겨찾기?��? ?�인
   */
  static async isFavorite(
    userId: string,
    storeId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from("user_favorite_stores")
      .select("id")
      .eq("user_id", userId)
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) {
      console.error("Error checking favorite:", error);
      return false;
    }
    
    return !!data;
  }
}



