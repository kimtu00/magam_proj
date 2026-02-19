import { createClient } from "@/lib/supabase/server";
import type {
  MenuTemplateData,
  CreateMenuTemplateInput,
  UpdateMenuTemplateInput,
} from "./menu-template.types";
import type { ServiceResult } from "../common.types";

/**
 * 메뉴 템플릿 Service
 * 
 * 사장님이 자주 판매하는 메뉴를 관리합니다.
 */
export class MenuTemplateService {
  /**
   * 가게별 메뉴 템플릿 목록 조회
   * 
   * @param storeId - 가게 ID
   * @returns 메뉴 템플릿 목록
   */
  static async findByStoreId(storeId: string): Promise<MenuTemplateData[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("menu_templates")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching menu templates:", error);
        return [];
      }

      return data as MenuTemplateData[];
    } catch (error) {
      console.error("Error in findByStoreId:", error);
      return [];
    }
  }

  /**
   * 메뉴 템플릿 단건 조회
   * 
   * @param templateId - 템플릿 ID
   * @returns 메뉴 템플릿 정보 또는 null
   */
  static async findById(templateId: string): Promise<MenuTemplateData | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("menu_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (error) {
        console.error("Error fetching menu template:", error);
        return null;
      }

      return data as MenuTemplateData;
    } catch (error) {
      console.error("Error in findById:", error);
      return null;
    }
  }

  /**
   * 메뉴 템플릿 생성
   * 
   * @param storeId - 가게 ID
   * @param input - 메뉴 템플릿 정보
   * @returns 생성 결과
   */
  static async create(
    storeId: string,
    input: CreateMenuTemplateInput
  ): Promise<ServiceResult<MenuTemplateData>> {
    try {
      // 1. 유효성 검사
      if (!input.name || input.name.trim().length === 0) {
        return { success: false, error: "메뉴명을 입력해주세요." };
      }

      if (!input.original_price || input.original_price <= 0) {
        return { success: false, error: "정가를 입력해주세요." };
      }

      // 2. 메뉴 템플릿 생성
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("menu_templates")
        .insert({
          store_id: storeId,
          name: input.name.trim(),
          original_price: input.original_price,
          image_url: input.image_url || null,
          is_instant: input.is_instant ?? false,
          weight_value: input.weight_value || null,
          weight_unit: input.weight_unit || 'g',
          category: input.category || '기타',
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating menu template:", error);
        return { success: false, error: "메뉴 템플릿 생성에 실패했습니다." };
      }

      return { success: true, data: data as MenuTemplateData };
    } catch (error) {
      console.error("Error in create:", error);
      return { success: false, error: "시스템 오류가 발생했습니다." };
    }
  }

  /**
   * 메뉴 템플릿 수정
   * 
   * @param templateId - 템플릿 ID
   * @param storeId - 가게 ID (소유자 확인용)
   * @param input - 수정할 정보
   * @returns 수정 결과
   */
  static async update(
    templateId: string,
    storeId: string,
    input: UpdateMenuTemplateInput
  ): Promise<ServiceResult<MenuTemplateData>> {
    try {
      // 1. 소유자 확인
      const existing = await this.findById(templateId);
      
      if (!existing) {
        return { success: false, error: "메뉴 템플릿을 찾을 수 없습니다." };
      }

      if (existing.store_id !== storeId) {
        return { success: false, error: "메뉴 템플릿을 수정할 권한이 없습니다." };
      }

      // 2. 유효성 검사
      if (input.name !== undefined && input.name.trim().length === 0) {
        return { success: false, error: "메뉴명을 입력해주세요." };
      }

      if (input.original_price !== undefined && input.original_price <= 0) {
        return { success: false, error: "정가는 0보다 커야 합니다." };
      }

      // 3. 업데이트할 데이터 준비
      const updateData: any = {};
      
      if (input.name !== undefined) {
        updateData.name = input.name.trim();
      }
      
      if (input.original_price !== undefined) {
        updateData.original_price = input.original_price;
      }
      
      if (input.image_url !== undefined) {
        updateData.image_url = input.image_url || null;
      }

      if (input.is_instant !== undefined) {
        updateData.is_instant = input.is_instant;
      }

      if (input.weight_value !== undefined) {
        updateData.weight_value = input.weight_value || null;
      }

      if (input.weight_unit !== undefined) {
        updateData.weight_unit = input.weight_unit;
      }

      if (input.category !== undefined) {
        updateData.category = input.category;
      }

      // 4. DB 업데이트
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("menu_templates")
        .update(updateData)
        .eq("id", templateId)
        .eq("store_id", storeId) // 추가 보안 체크
        .select()
        .single();

      if (error) {
        console.error("Error updating menu template:", error);
        return { success: false, error: "메뉴 템플릿 수정에 실패했습니다." };
      }

      return { success: true, data: data as MenuTemplateData };
    } catch (error) {
      console.error("Error in update:", error);
      return { success: false, error: "시스템 오류가 발생했습니다." };
    }
  }

  /**
   * 메뉴 템플릿 삭제
   * 
   * @param templateId - 템플릿 ID
   * @param storeId - 가게 ID (소유자 확인용)
   * @returns 삭제 결과
   */
  static async delete(
    templateId: string,
    storeId: string
  ): Promise<ServiceResult<void>> {
    try {
      // 1. 소유자 확인
      const existing = await this.findById(templateId);
      
      if (!existing) {
        return { success: false, error: "메뉴 템플릿을 찾을 수 없습니다." };
      }

      if (existing.store_id !== storeId) {
        return { success: false, error: "메뉴 템플릿을 삭제할 권한이 없습니다." };
      }

      // 2. 삭제
      const supabase = await createClient();
      const { error } = await supabase
        .from("menu_templates")
        .delete()
        .eq("id", templateId)
        .eq("store_id", storeId); // 추가 보안 체크

      if (error) {
        console.error("Error deleting menu template:", error);
        return { success: false, error: "메뉴 템플릿 삭제에 실패했습니다." };
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error("Error in delete:", error);
      return { success: false, error: "시스템 오류가 발생했습니다." };
    }
  }
}


