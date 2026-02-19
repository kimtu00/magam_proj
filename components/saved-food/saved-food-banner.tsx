/**
 * @file components/saved-food/saved-food-banner.tsx
 * @description 소비자 메인 상단 통계 배너
 * 
 * 3가지 핵심 지표를 표시합니다:
 * - 탄소 절감 (오늘)
 * - 구한 음식 (오늘)
 * - 참여 멤버 (전체)
 * 
 * 하단에 전체 서비스 누적 통계도 표시합니다.
 */

import { Leaf, ShoppingBag, Users } from "lucide-react";
import { getSavedFood, getGlobalStats } from "@/actions/saved-food";
import { CountUpAnimation } from "./count-up-animation";

/**
 * 구한 음식 & CO2 절감 배너 (Server Component)
 * 
 * @example
 * ```tsx
 * <SavedFoodBanner />
 * ```
 */
export async function SavedFoodBanner() {
  // 사용자의 구한 음식 요약 조회
  const summary = await getSavedFood();
  
  // 전체 서비스 통계 조회
  const globalStats = await getGlobalStats();

  const todayWeight = summary.today_saved_g;
  const todayCO2 = summary.today_co2_saved_g;

  // 배경색 결정 (CO2 절감량 기준)
  let bgColor = "";
  let textColor = "";

  if (todayCO2 === 0) {
    bgColor = "bg-muted/30";
    textColor = "text-muted-foreground";
  } else if (todayCO2 < 250) {
    bgColor = "bg-green-50 dark:bg-green-950/20";
    textColor = "text-green-700 dark:text-green-300";
  } else if (todayCO2 < 1250) {
    bgColor = "bg-green-100 dark:bg-green-900/30";
    textColor = "text-green-800 dark:text-green-200";
  } else {
    bgColor = "bg-green-200 dark:bg-green-800/40";
    textColor = "text-green-900 dark:text-green-100";
  }

  return (
    <div className={`${bgColor} border-b border-border`}>
      <div className="max-w-[430px] mx-auto px-4 py-4">
        {/* 3가지 핵심 지표 */}
        <div className="grid grid-cols-3 gap-3">
          {/* 1. 탄소 절감 */}
          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/50 dark:bg-black/20">
            <Leaf className={`w-6 h-6 ${textColor} mb-1`} />
            <div className="text-center">
              <div className={`text-lg font-bold ${textColor}`}>
                <CountUpAnimation targetValue={todayCO2} duration={1500} />
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                g CO₂
              </div>
              <div className={`text-[10px] font-medium ${textColor} mt-1`}>
                탄소 절감
              </div>
            </div>
          </div>

          {/* 2. 구한 음식 */}
          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/50 dark:bg-black/20">
            <ShoppingBag className={`w-6 h-6 ${textColor} mb-1`} />
            <div className="text-center">
              <div className={`text-lg font-bold ${textColor}`}>
                <CountUpAnimation targetValue={todayWeight} duration={1500} />
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                g
              </div>
              <div className={`text-[10px] font-medium ${textColor} mt-1`}>
                구한 음식
              </div>
            </div>
          </div>

          {/* 3. 참여 멤버 */}
          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/50 dark:bg-black/20">
            <Users className={`w-6 h-6 ${textColor} mb-1`} />
            <div className="text-center">
              <div className={`text-lg font-bold ${textColor}`}>
                <CountUpAnimation 
                  targetValue={globalStats.total_members} 
                  duration={1500} 
                />
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                명
              </div>
              <div className={`text-[10px] font-medium ${textColor} mt-1`}>
                참여 멤버
              </div>
            </div>
          </div>
        </div>

        {/* 전체 서비스 누적 통계 */}
        {(globalStats.total_co2_saved_g > 0 || globalStats.total_saved_g > 0) && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-center text-muted-foreground">
              <span className="font-semibold">전체 서비스 누적</span>
              {" · "}
              CO₂{" "}
              <span className="font-semibold">
                {globalStats.total_co2_saved_g >= 1000
                  ? `${(globalStats.total_co2_saved_g / 1000).toFixed(1)}kg`
                  : `${Math.round(globalStats.total_co2_saved_g)}g`}
              </span>
              {" · "}
              음식{" "}
              <span className="font-semibold">
                {globalStats.total_saved_g >= 1000
                  ? `${(globalStats.total_saved_g / 1000).toFixed(1)}kg`
                  : `${Math.round(globalStats.total_saved_g)}g`}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
