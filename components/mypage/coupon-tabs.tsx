/**
 * @file components/mypage/coupon-tabs.tsx
 * @description 쿠폰 탭 필터 컴포넌트
 * 
 * 사용가능 / 사용완료 / 만료 탭
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CouponTabsProps {
  counts?: {
    available: number;
    used: number;
    expired: number;
  };
}

export function CouponTabs({ counts }: CouponTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "available";

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/mypage/coupons?${params.toString()}`);
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange}>
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="available">
          사용가능
          {counts && counts.available > 0 && (
            <span className="ml-1 text-xs">({counts.available})</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="used">
          사용완료
          {counts && counts.used > 0 && (
            <span className="ml-1 text-xs">({counts.used})</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="expired">
          만료
          {counts && counts.expired > 0 && (
            <span className="ml-1 text-xs">({counts.expired})</span>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
