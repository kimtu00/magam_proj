"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ReserveDialog } from "./reserve-dialog";

interface ReserveNowButtonProps {
  productId: string;
  productName: string;
  maxQuantity: number;
  pickupDeadline: string;
}

/**
 * 바로 예약하기 버튼
 * 
 * 클릭 시 예약 다이얼로그를 엽니다.
 */
export function ReserveNowButton({
  productId,
  productName,
  maxQuantity,
  pickupDeadline,
}: ReserveNowButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button 
        className="flex-1"
        size="lg"
        onClick={() => setIsDialogOpen(true)}
      >
        지금 예약
      </Button>

      <ReserveDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        productId={productId}
        productName={productName}
        maxQuantity={maxQuantity}
        pickupDeadline={pickupDeadline}
      />
    </>
  );
}
