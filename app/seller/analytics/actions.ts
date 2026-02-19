/**
 * 매출 분석 Server Actions
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { AnalyticsService } from "@/services/analytics";
import { subDays, subMonths, startOfDay, endOfDay } from "date-fns";

/**
 * 매출 분석 데이터 조회
 */
export async function getSalesAnalytics(startDate: Date, endDate: Date) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("로그인이 필요합니다.");
  }

  return await AnalyticsService.getFullAnalytics(
    userId,
    startOfDay(startDate),
    endOfDay(endDate)
  );
}

/**
 * 기본 기간 (최근 30일) 매출 데이터 조회
 */
export async function getDefaultAnalytics() {
  const endDate = new Date();
  const startDate = subDays(endDate, 29); // 30일간

  return await getSalesAnalytics(startDate, endDate);
}
