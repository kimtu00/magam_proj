/**
 * @file app/api/store/notifications/route.ts
 * @description 알림 카운트 폴링용 API 엔드포인트
 *
 * 클라이언트(NotificationBadges 컴포넌트)에서 주기적으로 호출하여
 * 새 주문/리뷰 카운트를 가져옵니다.
 *
 * @method GET
 * @returns { newOrders: number, newReviews: number, total: number }
 */

import { NextResponse } from "next/server";
import { getNotificationCounts } from "@/app/store-admin/actions";

export async function GET() {
  try {
    const counts = await getNotificationCounts();
    return NextResponse.json(counts);
  } catch (error) {
    console.error("Failed to fetch notification counts:", error);
    return NextResponse.json(
      { newOrders: 0, newReviews: 0, total: 0 },
      { status: 500 }
    );
  }
}
