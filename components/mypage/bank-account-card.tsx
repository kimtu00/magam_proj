/**
 * @file components/mypage/bank-account-card.tsx
 * @description 계좌 정보 카드 컴포넌트
 * 
 * 등록된 계좌 정보 표시 (간략 버전)
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ChevronRight } from "lucide-react";
import type { BankAccountData } from "@/types/consumer";

interface BankAccountCardProps {
  account: BankAccountData | null;
}

export function BankAccountCard({ account }: BankAccountCardProps) {
  if (!account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            페이백 수령 계좌
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              등록된 계좌가 없습니다.
            </p>
            <Link
              href="/mypage/profile#bank-account"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              계좌 등록하기
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 계좌번호 마스킹 (뒤 4자리만 표시)
  const maskedAccountNumber = 
    account.account_number.slice(-4).padStart(account.account_number.length, "*");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            페이백 수령 계좌
          </CardTitle>
          <Link
            href="/mypage/profile#bank-account"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            수정
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">은행</span>
            <span className="font-medium">{account.bank_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">계좌번호</span>
            <span className="font-mono">{maskedAccountNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">예금주</span>
            <span className="font-medium">{account.account_holder}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
