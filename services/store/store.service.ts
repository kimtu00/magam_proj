/**
 * Store 서비스
 * 
 * 가게 관련 비즈니스 로직을 처리합니다.
 */

import { createClient } from "@/lib/supabase/server";
import type { StoreData, CreateStoreInput, UpdateStoreInput } from "./store.types";
import type { ServiceResult } from "../common.types";

export class StoreService {
  /**
   * 가게 ID로 가게 조회
   *
   * @param storeId - 가게 ID
   * @returns 가게 정보 또는 null
   */
  static async findById(storeId: string): Promise<StoreData | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("id", storeId)
        .single();

      if (error) {
        // 존재하지 않는 가게인 경우
        if (error.code === "PGRST116") {
          return null;
        }
        console.error("❌ Error fetching store by id:", error);
        return null;
      }

      if (!data) {
        return null;
      }

      return data as StoreData;
    } catch (error) {
      console.error("❌ Error in StoreService.findById:", error);
      return null;
    }
  }

  /**
   * 소유자 ID로 가게 조회
   * 
   * @param userId - 소유자의 Clerk User ID
   * @returns 가게 정보 또는 null (가게 정보가 없는 경우)
   */
  static async findByOwnerId(userId: string): Promise<StoreData | null> {
    try {
      console.log("🔍 StoreService.findByOwnerId - 시작, userId:", userId);
      
      const supabase = await createClient();
      console.log("🔍 Supabase client 생성 완료");
      
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", userId)
        .single();

      console.log("🔍 쿼리 실행 완료, data:", data ? "있음" : "없음", "error:", error ? "있음" : "없음");

      if (error) {
        // 가게 정보가 없는 경우 (PGRST116: no rows returned)
        if (error.code === "PGRST116") {
          console.log("ℹ️ Store not found for userId:", userId);
          return null;
        }
        
        // 인증/권한 에러 (PGRST301)
        if (error.code === "PGRST301") {
          console.error("❌ 인증/권한 에러 (PGRST301):");
          console.error("  Message:", error.message);
          console.error("  Details:", error.details);
          console.error("  Hint:", error.hint);
          console.error("  UserId:", userId);
          console.error("  ⚠️ 가능한 원인:");
          console.error("    1. Clerk 토큰이 전달되지 않음");
          console.error("    2. Supabase에서 Clerk를 third-party auth provider로 설정되지 않음");
          console.error("    3. RLS 정책이 예상과 다르게 동작");
          console.error("  💡 해결 방법:");
          console.error("    - Supabase Dashboard에서 Clerk 설정 확인");
          console.error("    - RLS 정책이 개발용으로 설정되어 있는지 확인");
          console.error("    - 환경 변수 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 확인");
          return null;
        }
        
        // 기타 에러
        console.error("❌ Error fetching store:");
        console.error("  Code:", error.code);
        console.error("  Message:", error.message);
        console.error("  Details:", error.details);
        console.error("  Hint:", error.hint);
        console.error("  UserId:", userId);
        
        // 에러 객체의 모든 속성 확인
        if (error && typeof error === "object") {
          console.error("  Error keys:", Object.keys(error));
          try {
            // JSON.stringify 시도
            const errorJson = JSON.stringify(error, null, 2);
            console.error("  Error JSON:", errorJson);
          } catch (jsonError) {
            console.error("  Error (string):", String(error));
            console.error("  Error (toString):", error.toString());
          }
          
          // 모든 속성을 개별적으로 확인
          for (const key in error) {
            try {
              console.error(`  Error[${key}]:`, (error as any)[key]);
            } catch (e) {
              console.error(`  Error[${key}]: [cannot access]`);
            }
          }
        }
        
        return null;
      }

      console.log("✅ Store found:", data ? "있음" : "없음");
      return data as StoreData;
    } catch (error) {
      // 예상치 못한 에러 처리
      console.error("❌ Error in findByOwnerId:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: userId,
        errorType: error?.constructor?.name || typeof error,
      });
      return null;
    }
  }

  /**
   * 가게 생성
   * 
   * 비즈니스 규칙:
   * - 가게 이름은 필수이며 빈 문자열 불가
   * - 한 사용자당 하나의 가게만 등록 가능 (1인 1가게)
   * 
   * @param userId - 소유자의 Clerk User ID
   * @param input - 가게 생성 정보
   * @returns 생성된 가게 정보 또는 에러
   */
  static async create(
    userId: string,
    input: CreateStoreInput
  ): Promise<ServiceResult<StoreData>> {
    // 비즈니스 규칙: 이름 필수
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "가게 이름을 입력해주세요." };
    }

    // 비즈니스 규칙: 1인 1가게
    const existingStore = await this.findByOwnerId(userId);
    if (existingStore) {
      return { success: false, error: "이미 가게 정보가 등록되어 있습니다." };
    }

    // DB 작업
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("stores")
        .insert({
          owner_id: userId,
          name: input.name.trim(),
          address: input.address?.trim() || null,
          phone: input.phone?.trim() || null,
          image_url: input.image_url || null,
          latitude: input.latitude || null,
          longitude: input.longitude || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating store:", error);
        return { success: false, error: "가게 정보 등록에 실패했습니다." };
      }

      return { success: true, data: data as StoreData };
    } catch (error) {
      console.error("Error in create:", error);
      return { success: false, error: "시스템 오류가 발생했습니다." };
    }
  }

  /**
   * 가게 정보 수정
   * 
   * 비즈니스 규칙:
   * - 소유자만 수정 가능
   * - 이름이 제공되면 빈 문자열 불가
   * 
   * @param storeId - 가게 ID
   * @param userId - 소유자의 Clerk User ID
   * @param input - 수정할 가게 정보
   * @returns 수정된 가게 정보 또는 에러
   */
  static async update(
    storeId: string,
    userId: string,
    input: UpdateStoreInput
  ): Promise<ServiceResult<StoreData>> {
    try {
      // 1. 소유자 확인
      const existingStore = await this.findByOwnerId(userId);
      
      if (!existingStore) {
        return { success: false, error: "가게 정보를 찾을 수 없습니다." };
      }

      if (existingStore.id !== storeId) {
        return { success: false, error: "가게 정보를 수정할 권한이 없습니다." };
      }

      // 2. 비즈니스 규칙: 이름이 제공되면 빈 문자열 불가
      if (input.name !== undefined && input.name.trim().length === 0) {
        return { success: false, error: "가게 이름을 입력해주세요." };
      }

      // 3. 업데이트할 데이터 준비
      const updateData: any = {};
      
      if (input.name !== undefined) {
        updateData.name = input.name.trim();
      }
      
      if (input.address !== undefined) {
        updateData.address = input.address.trim() || null;
      }
      
      if (input.phone !== undefined) {
        updateData.phone = input.phone.trim() || null;
      }

      if (input.image_url !== undefined) {
        updateData.image_url = input.image_url || null;
      }

      if (input.latitude !== undefined) {
        updateData.latitude = input.latitude;
      }

      if (input.longitude !== undefined) {
        updateData.longitude = input.longitude;
      }

      // 4. DB 업데이트
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("stores")
        .update(updateData)
        .eq("id", storeId)
        .eq("owner_id", userId) // 추가 보안 체크
        .select()
        .single();

      if (error) {
        console.error("Error updating store:", error);
        return { success: false, error: "가게 정보 수정에 실패했습니다." };
      }

      return { success: true, data: data as StoreData };
    } catch (error) {
      console.error("Error in update:", error);
      return { success: false, error: "시스템 오류가 발생했습니다." };
    }
  }
}

