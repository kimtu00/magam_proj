/**
 * @file components/admin/admin-dashboard-stats.tsx
 * @description 관리자 대시보드 전체 통계 (8칸)
 */

import { Suspense } from "react";
import { getAdminDashboardStats } from "@/app/admin/actions";
import {
  TrendingUp,
  ShoppingCart,
  UserPlus,
  Leaf,
  Store,
  FileText,
  Coins,
  Users,
} from "lucide-react";

async function StatsContent() {
  const stats = await getAdminDashboardStats();

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center text-muted-foreground col-span-full py-8">
          통계를 불러올 수 없습니다.
        </div>
      </div>
    );
  }

  const statsItems = [
    {
      title: "오늘 매출",
      value: `₩${stats.todaySales.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-secondary",
    },
    {
      title: "거래 건수",
      value: stats.todayOrders.toLocaleString(),
      icon: ShoppingCart,
      color: "text-primary",
      bgColor: "bg-secondary",
    },
    {
      title: "신규 가입",
      value: stats.newSignups.toLocaleString(),
      icon: UserPlus,
      color: "text-accent",
      bgColor: "bg-muted",
    },
    {
      title: "탄소 절감",
      value: `${stats.carbonReduced}kg`,
      icon: Leaf,
      color: "text-primary",
      bgColor: "bg-secondary",
    },
    {
      title: "활성 가게",
      value: stats.activeStores.toLocaleString(),
      icon: Store,
      color: "text-accent",
      bgColor: "bg-muted",
    },
    {
      title: "영수증 대기",
      value: stats.pendingReceipts.toLocaleString(),
      icon: FileText,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
    {
      title: "페이백 예정",
      value: `₩${stats.pendingPayback.toLocaleString()}`,
      icon: Coins,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
    {
      title: "총 회원",
      value: stats.totalMembers.toLocaleString(),
      icon: Users,
      color: "text-accent",
      bgColor: "bg-muted",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsItems.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{item.title}</p>
                <p className="text-2xl font-bold text-foreground mt-2">{item.value}</p>
              </div>
              <div className={`${item.bgColor} p-3 rounded-lg`}>
                <Icon className={`h-6 w-6 ${item.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-lg border border-border p-6 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-muted rounded w-3/4"></div>
            </div>
            <div className="h-12 w-12 bg-muted rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminDashboardStats() {
  return (
    <Suspense fallback={<StatsSkeleton />}>
      <StatsContent />
    </Suspense>
  );
}
