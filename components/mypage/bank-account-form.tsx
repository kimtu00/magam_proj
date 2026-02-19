/**
 * @file components/mypage/bank-account-form.tsx
 * @description 계좌 등록/수정 폼 컴포넌트
 * 
 * Client Component (react-hook-form + zod)
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BankAccountData } from "@/types/consumer";

const bankAccountSchema = z.object({
  bank_name: z.string().min(1, "은행명을 입력해주세요"),
  account_number: z.string().min(1, "계좌번호를 입력해주세요"),
  account_holder: z.string().min(1, "예금주를 입력해주세요"),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

interface BankAccountFormProps {
  initialData?: BankAccountData | null;
}

export function BankAccountForm({ initialData }: BankAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      bank_name: initialData?.bank_name || "",
      account_number: initialData?.account_number || "",
      account_holder: initialData?.account_holder || "",
    },
  });

  const onSubmit = async (data: BankAccountFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/bank-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "저장 완료",
          description: "계좌 정보가 등록되었습니다.",
        });
        router.refresh();
      } else {
        throw new Error("Failed to save bank account");
      }
    } catch (error) {
      console.error("Bank account save error:", error);
      toast({
        title: "오류",
        description: "계좌 정보 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card id="bank-account">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          페이백 수령 계좌
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>은행명</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 국민은행" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>계좌번호</FormLabel>
                  <FormControl>
                    <Input placeholder="'-' 없이 입력" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account_holder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>예금주</FormLabel>
                  <FormControl>
                    <Input placeholder="예금주 이름" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                initialData ? "수정" : "등록"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
