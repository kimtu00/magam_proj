/**
 * @file components/product/complete-order-button.tsx
 * @description 사장님이 예약을 픽업 완료 처리하는 버튼
 * 
 * 주요 기능:
 * - 예약 상태가 RESERVED일 때만 활성화
 * - 확인 다이얼로그 표시
 * - completeOrder Server Action 호출
 * - 성공 시 페이지 새로고침
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, Loader2 } from "lucide-react";
import { completeOrder } from "@/actions/orders";
import { useRouter } from "next/navigation";

interface CompleteOrderButtonProps {
  orderId: string;
  orderStatus: "RESERVED" | "COMPLETED" | "CANCELED";
  productName: string;
  buyerName: string;
  quantity: number;
}

/**
 * 픽업 완료 버튼 컴포넌트
 * 
 * @example
 * ```tsx
 * <CompleteOrderButton
 *   orderId={reservation.id}
 *   orderStatus={reservation.status}
 *   productName={reservation.product.name}
 *   buyerName={reservation.buyer.nickname}
 *   quantity={reservation.quantity}
 * />
 * ```
 */
export function CompleteOrderButton({
  orderId,
  orderStatus,
  productName,
  buyerName,
  quantity,
}: CompleteOrderButtonProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // RESERVED 상태가 아니면 버튼 비활성화
  const isDisabled = orderStatus !== "RESERVED";

  const handleComplete = async () => {
    setIsLoading(true);
    
    try {
      const result = await completeOrder(orderId);
      
      if (result.success) {
        // 성공 시 다이얼로그 닫기
        setIsDialogOpen(false);
        
        // 페이지 새로고침으로 최신 데이터 표시
        router.refresh();
        
        // 사용자에게 성공 알림 (선택사항)
        alert(result.message);
      } else {
        // 실패 시 에러 메시지 표시
        alert(result.message || "픽업 완료 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("[CompleteOrderButton] 오류:", error);
      alert("시스템 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        disabled={isDisabled || isLoading}
        size="sm"
        className="w-full"
        variant={isDisabled ? "secondary" : "default"}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            처리 중...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            {orderStatus === "COMPLETED" ? "픽업 완료됨" : "픽업 완료"}
          </>
        )}
      </Button>

      {/* 확인 다이얼로그 */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>픽업 완료 처리</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>다음 예약을 픽업 완료 처리하시겠습니까?</p>
                <div className="rounded-md bg-muted p-3 space-y-1">
                  <p>
                    <span className="font-medium">상품:</span> {productName}
                  </p>
                  <p>
                    <span className="font-medium">예약자:</span> {buyerName}
                  </p>
                  <p>
                    <span className="font-medium">수량:</span> {quantity}개
                  </p>
                </div>
                <p className="text-muted-foreground">
                  완료 처리 후에는 취소할 수 없습니다.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleComplete();
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                "완료 처리"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
