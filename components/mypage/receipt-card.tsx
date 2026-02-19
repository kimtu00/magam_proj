/**
 * @file components/mypage/receipt-card.tsx
 * @description 영수증 제출 내역 카드 컴포넌트
 * 
 * 심사 상태: 심사중/승인/반려
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, Coins } from "lucide-react";
import type { ReceiptData } from "@/types/consumer";

interface ReceiptCardProps {
  receipt: ReceiptData;
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  // 상태별 배지
  const getStatusBadge = () => {
    switch (receipt.status) {
      case "pending":
        return (
          <Badge className="bg-secondary text-foreground">
            <Clock className="h-3 w-3 mr-1" />
            심사중
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-primary">
            <CheckCircle className="h-3 w-3 mr-1" />
            승인
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            반려
          </Badge>
        );
      default:
        return null;
    }
  };

  // 날짜 포맷팅
  const submittedDate = new Date(receipt.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* 영수증 이미지 썸네일 */}
          <div className="flex-shrink-0">
            <img
              src={receipt.image_url}
              alt="영수증"
              className="w-16 h-16 object-cover rounded border"
            />
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {getStatusBadge()}
              <span className="text-xs text-muted-foreground">
                {submittedDate}
              </span>
            </div>

            {/* 승인된 경우 페이백 금액 표시 */}
            {receipt.status === "approved" && receipt.payback_amount && (
              <div className="flex items-center gap-1 text-primary mt-2">
                <Coins className="h-4 w-4" />
                <span className="font-bold">
                  +{receipt.payback_amount.toLocaleString()}P 페이백
                </span>
              </div>
            )}

            {/* 반려된 경우 사유 표시 */}
            {receipt.status === "rejected" && receipt.reject_reason && (
              <p className="text-sm text-muted-foreground mt-2">
                반려 사유: {receipt.reject_reason}
              </p>
            )}

            {/* 심사중인 경우 */}
            {receipt.status === "pending" && (
              <p className="text-sm text-muted-foreground mt-2">
                관리자 심사 중입니다. 영업일 기준 1-3일 소요됩니다.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
