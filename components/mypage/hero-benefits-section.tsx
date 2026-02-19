/**
 * @file components/mypage/hero-benefits-section.tsx
 * @description 히어로 혜택 섹션 컴포넌트
 * 
 * 현재 등급 혜택 표시
 */

import Link from "next/link";
import { Gift, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BenefitData } from "@/types/consumer";

interface HeroBenefitsSectionProps {
  benefits: BenefitData[];
  userTier: number;
}

export function HeroBenefitsSection({ benefits, userTier }: HeroBenefitsSectionProps) {
  // 활성화된 혜택만 표시
  const activeBenefits = benefits.filter(b => b.status === "active");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-600" />
            나의 혜택
          </CardTitle>
          <Link
            href="/mypage/benefits"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            전체 보기
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {activeBenefits.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>등급을 올려 더 많은 혜택을 받아보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeBenefits.slice(0, 3).map((benefit) => (
              <div
                key={benefit.id}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="text-2xl">{benefit.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{benefit.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      활성
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeBenefits.length > 3 && (
          <Link
            href="/mypage/benefits"
            className="block text-center text-sm text-primary hover:underline mt-4"
          >
            + {activeBenefits.length - 3}개 혜택 더 보기
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
