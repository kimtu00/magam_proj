"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

const STORAGE_BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "uploads";

/**
 * 파일 목록 조회
 */
export async function listFiles(userId: string) {
  const { userId: authUserId } = await auth();
  if (!authUserId || authUserId !== userId) {
    throw new Error("인증되지 않은 사용자입니다.");
  }

  const supabase = getServiceRoleClient();

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(userId, {
      limit: 100,
      offset: 0,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (error) throw error;
  return data || [];
}

/**
 * 파일 업로드
 */
export async function uploadFileToStorage(
  userId: string,
  formData: FormData
): Promise<{ path: string }> {
  const { userId: authUserId } = await auth();
  if (!authUserId || authUserId !== userId) {
    throw new Error("인증되지 않은 사용자입니다.");
  }

  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("파일이 제공되지 않았습니다.");
  }

  const supabase = getServiceRoleClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;
  return { path: filePath };
}

/**
 * 파일 다운로드
 */
export async function downloadFileFromStorage(
  userId: string,
  fileName: string
): Promise<Blob> {
  const { userId: authUserId } = await auth();
  if (!authUserId || authUserId !== userId) {
    throw new Error("인증되지 않은 사용자입니다.");
  }

  const supabase = getServiceRoleClient();
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(filePath);

  if (error) throw error;
  return data;
}

/**
 * 파일 삭제
 */
export async function deleteFileFromStorage(
  userId: string,
  fileName: string
): Promise<void> {
  const { userId: authUserId } = await auth();
  if (!authUserId || authUserId !== userId) {
    throw new Error("인증되지 않은 사용자입니다.");
  }

  const supabase = getServiceRoleClient();
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (error) throw error;
}


