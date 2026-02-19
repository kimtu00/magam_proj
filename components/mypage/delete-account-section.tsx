/**
 * @file components/mypage/delete-account-section.tsx
 * @description 회원 탈퇴 섹션 컴포넌트
 * 
 * Client Component (확인 다이얼로그)
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DeleteAccountSection() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteAccount = async () => {
    setIsDeleting(true);

    try {
      // TODO: 실제 계정 삭제 API 호출
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "탈퇴 완료",
        description: "그동안 이용해 주셔서 감사합니다.",
      });

      // 로그아웃 및 홈으로 리다이렉트
      window.location.href = "/";
    } catch (error) {
      console.error("Delete account error:", error);
      toast({
        title: "오류",
        description: "회원 탈퇴에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          회원 탈퇴
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          회원 탈퇴 시 다음 정보가 모두 삭제됩니다:
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>프로필 정보</li>
          <li>주문 내역</li>
          <li>쿠폰 및 포인트</li>
          <li>히어로 등급 및 배지</li>
        </ul>
        <p className="text-sm text-destructive font-medium">
          이 작업은 되돌릴 수 없습니다.
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full" disabled={isDeleting}>
              회원 탈퇴하기
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정말 탈퇴하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                모든 데이터가 영구적으로 삭제되며, 이 작업은 취소할 수 없습니다.
                정말 탈퇴하시겠습니까?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                탈퇴하기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
