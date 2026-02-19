/**
 * @file components/mypage/point-history.tsx
 * @description 포인트 거래 내역 컴포넌트
 * 
 * 적립/사용 내역 리스트
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, RotateCcw, AlertCircle } from "lucide-react";
import type { PointTransaction } from "@/types/consumer";

interface PointHistoryProps {
  transactions: PointTransaction[];
}

export function PointHistory({ transactions }: PointHistoryProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "earn":
        return <TrendingUp className="h-4 w-4 text-primary" />;
      case "spend":
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case "payback":
        return <RotateCcw className="h-4 w-4 text-accent" />;
      case "expire":
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "earn":
        return "적립";
      case "spend":
        return "사용";
      case "payback":
        return "페이백";
      case "expire":
        return "만료";
      default:
        return type;
    }
  };

  const getAmountColor = (amount: number) => {
    return amount > 0 ? "text-primary" : "text-destructive";
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">포인트 내역이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>거래 내역</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-start justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(transaction.type)}</div>
                <div>
                  <div className="font-medium">
                    {transaction.description || getTypeLabel(transaction.type)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${getAmountColor(transaction.amount)}`}>
                  {transaction.amount > 0 ? "+" : ""}
                  {transaction.amount.toLocaleString()}P
                </div>
                <div className="text-xs text-muted-foreground">
                  잔액 {transaction.balance_after.toLocaleString()}P
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
