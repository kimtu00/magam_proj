"use server";

/**
 * 사장님 예약 관리 Server Actions
 */

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OrderService } from "@/services/order/order.service";
import { StoreService } from "@/services/store/store.service";
import type { SellerOrderDetailData } from "@/services/order/order.types";

/**
 * 사장님의 가게에 대한 모든 예약 내역을 조회합니다.
 * 
 * @param statusFilter - 예약 상태 필터 (선택)
 * @returns 예약 내역 리스트
 */
export async function getStoreReservations(
  statusFilter?: "RESERVED" | "COMPLETED" | "CANCELED" | "ALL"
): Promise<SellerOrderDetailData[]> {
  console.group("🔍 [Server Action] getStoreReservations");
  
  try {
    // 1. 인증 확인
    const { userId } = await auth();
    console.log("User ID:", userId);

    if (!userId) {
      console.log("❌ No user ID - redirecting to sign-in");
      redirect("/sign-in");
    }

    // 2. 가게 정보 조회
    const store = await StoreService.findByOwnerId(userId);
    console.log("Store:", store ? `${store.name} (${store.id})` : "Not found");

    if (!store) {
      console.log("⚠️ No store found for user");
      return [];
    }

    // 3. 예약 내역 조회
    const reservations = await OrderService.findByStoreId(store.id, statusFilter);
    console.log(`✅ Found ${reservations.length} reservations`);

    return reservations;
  } catch (error) {
    console.error("❌ Error in getStoreReservations:", error);
    return [];
  } finally {
    console.groupEnd();
  }
}

/**
 * 예약 내역을 다시 불러옵니다 (필터 변경 시 사용)
 */
export { getStoreReservations as revalidateReservations };

