/**
 * @file components/mypage/quick-stats.tsx
 * @description 빠른 통계 4칸 컴포넌트
 * 
 * 쿠폰 / 포인트 / 주문 / 리뷰 수를 한눈에 보여줍니다.
 */

import Link from "next/link";
import { Ticket, Coins, ShoppingBag, Star } from "lucide-react";
import type { QuickStats as QuickStatsType } from "@/types/consumer";

interface QuickStatsProps {
  stats: QuickStatsType;
}

export function QuickStats({ stats }: QuickStatsProps) {
  const items = [
    {
      label: "쿠폰",
      value: stats.coupons,
      icon: Ticket,
      href: "/mypage/coupons",
      color: "text-accent",
    },
    {
      label: "포인트",
      value: stats.points.toLocaleString(),
      icon: Coins,
      href: "/mypage/points",
      color: "text-primary",
    },
    {
      label: "주문",
      value: stats.orders,
      icon: ShoppingBag,
      href: "/mypage/orders",
      color: "text-primary",
    },
    {
      label: "리뷰",
      value: stats.reviews,
      icon: Star,
      href: "/buyer/reviews",
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center justify-center p-4 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow"
          >
            <Icon className={`h-5 w-5 mb-2 ${item.color}`} />
            <div className="text-lg font-bold">{item.value}</div>
            <div className="text-xs text-muted-foreground">{item.label}</div>
          </Link>
        );
      })}
    </div>
  );
}
