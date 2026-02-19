"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { MenuTemplateService } from "@/services/menu-template";
import { getStore } from "@/app/seller/actions";
import type {
  MenuTemplateData,
  CreateMenuTemplateInput,
  UpdateMenuTemplateInput,
} from "@/services/menu-template";

/**
 * 메뉴 템플릿 목록 조회
 */
export async function getMenuTemplates(): Promise<MenuTemplateData[]> {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const store = await getStore();
  
  if (!store) {
    return [];
  }

  return await MenuTemplateService.findByStoreId(store.id);
}

/**
 * 메뉴 템플릿 생성
 */
export async function createMenuTemplate(
  input: CreateMenuTemplateInput
): Promise<{ success: boolean; error?: string }> {
  // 1. 인증 확인
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "인증되지 않은 사용자입니다.",
    };
  }

  // 2. 가게 확인
  const store = await getStore();
  
  if (!store) {
    return {
      success: false,
      error: "가게 정보를 찾을 수 없습니다.",
    };
  }

  // 3. Service 호출
  const result = await MenuTemplateService.create(store.id, input);

  if (result.success === false) {
    return {
      success: false,
      error: result.error,
    };
  }

  // 4. 캐시 무효화
  revalidatePath("/seller/menu");
  revalidatePath("/seller/upload");

  return { success: true };
}

/**
 * 메뉴 템플릿 수정
 */
export async function updateMenuTemplate(
  templateId: string,
  input: UpdateMenuTemplateInput
): Promise<{ success: boolean; error?: string }> {
  // 1. 인증 확인
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "인증되지 않은 사용자입니다.",
    };
  }

  // 2. 가게 확인
  const store = await getStore();
  
  if (!store) {
    return {
      success: false,
      error: "가게 정보를 찾을 수 없습니다.",
    };
  }

  // 3. Service 호출
  const result = await MenuTemplateService.update(templateId, store.id, input);

  if (result.success === false) {
    return {
      success: false,
      error: result.error,
    };
  }

  // 4. 캐시 무효화
  revalidatePath("/seller/menu");
  revalidatePath("/seller/upload");

  return { success: true };
}

/**
 * 메뉴 템플릿 삭제
 */
export async function deleteMenuTemplate(
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  // 1. 인증 확인
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "인증되지 않은 사용자입니다.",
    };
  }

  // 2. 가게 확인
  const store = await getStore();
  
  if (!store) {
    return {
      success: false,
      error: "가게 정보를 찾을 수 없습니다.",
    };
  }

  // 3. Service 호출
  const result = await MenuTemplateService.delete(templateId, store.id);

  if (result.success === false) {
    return {
      success: false,
      error: result.error,
    };
  }

  // 4. 캐시 무효화
  revalidatePath("/seller/menu");
  revalidatePath("/seller/upload");

  return { success: true };
}

