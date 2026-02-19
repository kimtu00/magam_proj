"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Plus, Settings, UtensilsCrossed, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 사장님용 하단 네비게이션 바
 *
 * Mobile-First 디자인으로 하단에 고정된 네비게이션 바입니다.
 * 사장님 전용 기능으로 이동할 수 있는 메뉴를 제공합니다.
 *
 * 메뉴 항목:
 * - 내 상품 관리: /seller/dashboard
 * - 예약 관리: /seller/reservations
 * - 등록하기: /seller/upload
 * - 메뉴 관리: /seller/menu
 * - 설정: /seller/settings
 */
export function SellerBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/seller/dashboard",
      label: "상품",
      icon: Package,
    },
    {
      href: "/seller/reservations",
      label: "예약",
      icon: ClipboardList,
    },
    {
      href: "/seller/upload",
      label: "등록",
      icon: Plus,
    },
    {
      href: "/seller/menu",
      label: "메뉴",
      icon: UtensilsCrossed,
    },
    {
      href: "/seller/settings",
      label: "설정",
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="max-w-[430px] mx-auto bg-background">
        <div className="flex items-center justify-around h-16 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    isActive && "text-primary"
                  )}
                />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

