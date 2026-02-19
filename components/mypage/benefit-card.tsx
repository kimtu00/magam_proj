/**
 * @file components/mypage/benefit-card.tsx
 * @description 혜택 카드 컴포넌트
 * 
 * 활성/잠김 상태 표시
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import type { BenefitData } from "@/types/consumer";

interface BenefitCardProps {
  benefit: BenefitData;
}

export function BenefitCard({ benefit }: BenefitCardProps) {
  const isLocked = benefit.status === "locked";

  return (
    <Card className={isLocked ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* 아이콘 */}
          <div className={`text-3xl ${isLocked && "grayscale"}`}>
            {benefit.icon}
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold">{benefit.title}</h3>
              {isLocked ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  잠김
                </Badge>
              ) : (
                <Badge className="bg-primary">활성</Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              {benefit.description}
            </p>

            {/* 잠김 조건 */}
            {isLocked && benefit.unlock_condition && (
              <p className="text-xs text-muted-foreground">
                🔒 {benefit.unlock_condition}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
