/**
 * @file components/mypage/promo-code-input.tsx
 * @description 프로모션 코드 입력 컴포넌트
 * 
 * Client Component (폼 제출 처리)
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PromoCodeInput() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast({
        title: "오류",
        description: "프로모션 코드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/promo-codes/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.toUpperCase() }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "성공!",
          description: result.message || "쿠폰이 등록되었습니다.",
        });
        setCode("");
        router.refresh();
      } else {
        toast({
          title: "등록 실패",
          description: result.message || "유효하지 않은 코드입니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Promo code redeem error:", error);
      toast({
        title: "오류",
        description: "프로모션 코드 등록 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          프로모션 코드 등록
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            placeholder="프로모션 코드를 입력하세요"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={isLoading}
            maxLength={20}
          />
          <Button type="submit" disabled={isLoading || !code.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                등록 중
              </>
            ) : (
              "등록"
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          프로모션 코드를 입력하면 쿠폰이 자동으로 등록됩니다.
        </p>
      </CardContent>
    </Card>
  );
}
