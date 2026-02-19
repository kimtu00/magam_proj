/**
 * @file components/mypage/locked-benefit.tsx
 * @description 잠긴 혜택 컴포넌트 (축약 버전)
 * 
 * 다음 등급에서 해제되는 혜택 미리보기
 */

import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import type { BenefitData } from "@/types/consumer";

interface LockedBenefitProps {
  benefit: BenefitData;
}

export function LockedBenefit({ benefit }: LockedBenefitProps) {
  return (
    <Card className="border-dashed opacity-70">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl grayscale">{benefit.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{benefit.title}</span>
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
            {benefit.unlock_condition && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {benefit.unlock_condition}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
