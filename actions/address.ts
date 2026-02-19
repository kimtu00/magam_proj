"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * 소비자 주소 정보 타입
 */
export interface BuyerAddress {
  address: string;
  latitude: number;
  longitude: number;
}

/**
 * 현재 소비자의 주소 정보를 조회합니다.
 *
 * @returns 주소 정보 또는 null (주소 미설정)
 */
export async function getBuyerAddress(): Promise<BuyerAddress | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("address, latitude, longitude")
      .eq("clerk_id", userId)
      .single();

    if (error || !data) {
      console.error("Error fetching buyer address:", error);
      return null;
    }

    // 주소가 설정되지 않은 경우
    if (!data.address || !data.latitude || !data.longitude) {
      return null;
    }

    return {
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    console.error("Error in getBuyerAddress:", error);
    return null;
  }
}

/**
 * 소비자의 주소 정보를 저장/수정합니다.
 *
 * @param address - 주소
 * @param latitude - 위도
 * @param longitude - 경도
 * @returns 성공 여부
 */
export async function updateBuyerAddress(
  address: string,
  latitude: number,
  longitude: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "인증되지 않은 사용자입니다.",
      };
    }

    // 2. 입력 검증
    if (!address || !address.trim()) {
      return {
        success: false,
        error: "주소를 입력해주세요.",
      };
    }

    if (!latitude || !longitude) {
      return {
        success: false,
        error: "위치 정보가 올바르지 않습니다.",
      };
    }

    // 3. DB 업데이트
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        address: address.trim(),
        latitude,
        longitude,
      })
      .eq("clerk_id", userId);

    if (error) {
      console.error("Error updating buyer address:", error);
      return {
        success: false,
        error: "주소 저장에 실패했습니다.",
      };
    }

    // 4. 캐시 무효화
    revalidatePath("/buyer");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in updateBuyerAddress:", error);
    return {
      success: false,
      error: "시스템 오류가 발생했습니다.",
    };
  }
}


