/**
 * @file components/mypage/point-summary.tsx
 * @description 포인트 요약 컴포넌트
 * 
 * 보유 포인트, 다음 페이백, 누적 적립/사용
 */

import { Coins, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PointSummary } from "@/types/consumer";

interface PointSummaryProps {
  summary: PointSummary;
}

export function PointSummary({ summary }: PointSummaryProps) {
  const nextPaybackDate = summary.next_payback.date
    ? new Date(summary.next_payback.date).toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
      })
    : "예정 없음";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          포인트 현황
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 현재 포인트 */}
        <div className="text-center py-4 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">보유 포인트</div>
          <div className="text-3xl font-bold text-primary">
            {summary.current_balance.toLocaleString()}P
          </div>
        </div>

        {/* 다음 페이백 */}
        {summary.next_payback.amount > 0 && (
          <div className="p-4 bg-secondary rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">다음 페이백</span>
              </div>
              <span className="text-lg font-bold text-primary">
                +{summary.next_payback.amount.toLocaleString()}P
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {nextPaybackDate} 예정
            </p>
          </div>
        )}

        {/* 누적 통계 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">총 적립</span>
            </div>
            <div className="text-lg font-bold">
              {summary.lifetime_earned.toLocaleString()}P
            </div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">총 사용</span>
            </div>
            <div className="text-lg font-bold">
              {summary.lifetime_spent.toLocaleString()}P
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
