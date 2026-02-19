/**
 * @file components/mypage/hero-environment-summary.tsx
 * @description 환경 기여 요약 컴포넌트
 * 
 * 구한 음식, 탄소 감축량, 나무 심기 환산 등
 */

import { Leaf, TreePine, Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EnvironmentSummary } from "@/types/consumer";

interface HeroEnvironmentSummaryProps {
  summary: EnvironmentSummary;
}

export function HeroEnvironmentSummary({ summary }: HeroEnvironmentSummaryProps) {
  const items = [
    {
      label: "구한 음식",
      value: `${summary.saved_meals}끼`,
      icon: Droplets,
      color: "text-accent",
      description: "음식물 쓰레기 절감",
    },
    {
      label: "줄인 탄소",
      value: `${summary.co2_reduced.toFixed(1)}kg`,
      icon: Leaf,
      color: "text-primary",
      description: "CO₂ 배출 감소",
    },
    {
      label: "나무 심기",
      value: `${summary.trees_planted_equivalent}그루`,
      icon: TreePine,
      color: "text-primary",
      description: "나무 심기 효과",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-primary" />
          환경 기여
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="text-center">
                <Icon className={`h-8 w-8 mx-auto mb-2 ${item.color}`} />
                <div className="text-lg font-bold">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {item.description}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-center">
          <p className="text-muted-foreground">
            🌍 지구를 위한 당신의 선택이 만든 변화입니다!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
