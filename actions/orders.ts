/**
 * @file actions/orders.ts
 * @description 주문 관련 Server Actions
 * 
 * 주요 기능:
 * - 사장님 주문 완료 처리 (픽업 확정)
 * 
 * @dependencies
 * - @clerk/nextjs/server: 인증된 사용자 정보
 * - @/lib/supabase/server: Supabase 서버 클라이언트
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * 사장님이 주문을 픽업 완료 처리합니다.
 * 
 * @param orderId - 완료 처리할 주문 ID
 * @returns 성공 여부 및 메시지
 * 
 * @example
 * ```tsx
 * const result = await completeOrder(orderId);
 * if (result.success) {
 *   toast.success(result.message);
 * }
 * ```
 */
export async function completeOrder(orderId: string) {
  try {
    // 1. 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    // 2. Supabase 클라이언트 생성 (Clerk 인증)
    const supabase = await createClerkSupabaseClient();

    // 3. complete_order RPC 함수 호출
    const { data, error } = await supabase.rpc("complete_order", {
      p_order_id: orderId,
      p_seller_clerk_id: userId, // Clerk User ID 전달
    });

    if (error) {
      console.error("[completeOrder] RPC 호출 실패:", error);
      return {
        success: false,
        message: "주문 완료 처리 중 오류가 발생했습니다.",
      };
    }

    // 4. RPC 응답 확인
    if (!data.success) {
      return {
        success: false,
        message: data.message || "주문 완료 처리에 실패했습니다.",
      };
    }

    // 5. 성공 시 관련 페이지 재검증
    revalidatePath("/seller/reservations");
    revalidatePath("/seller/dashboard");
    revalidatePath("/buyer"); // 소비자 메인 페이지 (구한 음식 배너 갱신)
    revalidatePath("/buyer/me"); // 소비자 마이페이지 (히어로 등급 갱신)

    return {
      success: true,
      message: data.message || "픽업이 완료되었습니다.",
      completed_at: data.completed_at,
    };
  } catch (error) {
    console.error("[completeOrder] 예상치 못한 오류:", error);
    return {
      success: false,
      message: "시스템 오류가 발생했습니다.",
    };
  }
}
