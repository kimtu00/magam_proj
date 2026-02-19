/**
 * @file hero-status-card.tsx
 * @description 마감 히어로 등급 및 진행도 표시 컴포넌트
 * 
 * 주요 기능:
 * 1. 현재 히어로 등급 표시 (이모지, 이름, 레벨)
 * 2. 총 픽업 횟수 및 구한 음식 무게 표시
 * 3. 다음 등급까지 진행도 (픽업 횟수, 무게)
 * 4. 등급 혜택 목록
 * 
 * 핵심 구현:
 * - Server Component에서 데이터 fetch
 * - Progress Bar로 진행도 시각화
 * - 다음 등급이 없으면 "최고 등급 달성" 표시
 * 
 * @dependencies
 * - @/actions/hero: getHeroStatus Server Action
 * - @/components/ui/card: shadcn Card 컴포넌트
 * - @/components/ui/progress: shadcn Progress 컴포넌트
 * - lucide-react: 아이콘
 */

import { getHeroStatus } from "@/actions/hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award, TrendingUp, Scale, Gift } from "lucide-react";

export async function HeroStatusCard() {
  const result = await getHeroStatus();

  if (!result.success) {
    const failResult = result as { success: false; error: string };
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{failResult.error}</p>
        </CardContent>
      </Card>
    );
  }

  const { data: heroStatus } = result;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          마감 히어로
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 현재 등급 */}
        <div className="flex items-center gap-4">
          <div className="text-6xl">{heroStatus.grade_emoji}</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold">{heroStatus.grade_name}</h3>
            <p className="text-sm text-muted-foreground">
              Lv.{heroStatus.grade_level}
            </p>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              픽업 횟수
            </div>
            <p className="text-2xl font-bold">
              {heroStatus.total_pickup_count}
              <span className="text-sm font-normal text-muted-foreground">
                회
              </span>
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Scale className="h-4 w-4" />
              구한 음식
            </div>
            <p className="text-2xl font-bold">
              {heroStatus.total_saved_weight_kg}
              <span className="text-sm font-normal text-muted-foreground">
                kg
              </span>
            </p>
          </div>
        </div>

        {/* 다음 등급 진행도 */}
        {heroStatus.next_grade ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">다음 등급</h4>
              <span className="text-sm text-muted-foreground">
                {heroStatus.next_grade.emoji} {heroStatus.next_grade.name}
              </span>
            </div>

            {/* 픽업 횟수 진행도 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">픽업 횟수</span>
                <span className="font-medium">
                  {heroStatus.total_pickup_count} /{" "}
                  {heroStatus.next_grade.required_pickups}회
                </span>
              </div>
              <Progress
                value={heroStatus.next_grade.progress_pickups_percent}
              />
              {heroStatus.next_grade.remaining_pickups > 0 && (
                <p className="text-xs text-muted-foreground">
                  {heroStatus.next_grade.remaining_pickups}회 남음
                </p>
              )}
            </div>

            {/* 무게 진행도 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">구한 음식</span>
                <span className="font-medium">
                  {heroStatus.total_saved_weight_kg} /{" "}
                  {heroStatus.next_grade.required_weight_kg}kg
                </span>
              </div>
              <Progress
                value={heroStatus.next_grade.progress_weight_percent}
              />
              {heroStatus.next_grade.remaining_weight_kg > 0 && (
                <p className="text-xs text-muted-foreground">
                  {heroStatus.next_grade.remaining_weight_kg}kg 남음
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <p className="text-sm font-semibold text-primary">
              🎉 최고 등급 달성!
            </p>
          </div>
        )}

        {/* 등급 혜택 */}
        {heroStatus.benefits.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm font-semibold">
              <Gift className="h-4 w-4" />
              등급 혜택
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {heroStatus.benefits.map((benefit, index) => {
                // 혜택 코드를 한글 라벨로 매핑
                const benefitLabel = (() => {
                  switch (benefit) {
                    case "welcome_badge":
                      return "환영 배지";
                    case "early_access_popular":
                      return "인기 상품 선공개";
                    case "nation_perks":
                      return "나라 히어로 특전";
                    case "priority_alarm":
                      return "마감 알림 우선권 (준비 중)";
                    default:
                      return benefit;
                  }
                })();

                return (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    {benefitLabel}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
