/**
 * @file components/navigation/store-admin-bottom-nav.tsx
 * @description 사장님 대시보드 모바일 하단 탭바
 *
 * 모바일 전용 (lg:hidden) 하단 탭바:
 * - 대시보드 (`/store-admin/dashboard`)
 * - 상품 (`/store-admin/products`)
 * - 주문 (`/store-admin/orders`)
 * - 정산 (`/store-admin/settlement`)
 * - 더보기 (메뉴 팝업 → 소진율 예측, 리뷰, 프로모션, 가게 정보)
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  MoreHorizontal,
  UtensilsCrossed,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const mainNavItems: NavItem[] = [
  {
    href: "/store-admin/dashboard",
    icon: LayoutDashboard,
    label: "대시보드",
  },
  {
    href: "/store-admin/products",
    icon: Package,
    label: "상품",
  },
  {
    href: "/store-admin/orders",
    icon: ShoppingCart,
    label: "주문",
  },
  {
    href: "/store-admin/settlement",
    icon: Wallet,
    label: "정산",
  },
];

const moreNavItems: NavItem[] = [
  {
    href: "/store-admin/menu",
    icon: UtensilsCrossed,
    label: "메뉴 관리",
  },
  {
    href: "/store-admin/predict",
    icon: LayoutDashboard,
    label: "소진율 예측",
  },
  {
    href: "/store-admin/reviews",
    icon: LayoutDashboard,
    label: "리뷰 관리",
  },
  {
    href: "/store-admin/profile",
    icon: LayoutDashboard,
    label: "가게 정보",
  },
];

export function StoreAdminBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/store-admin/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const isMoreActive = moreNavItems.some((item) => isActive(item.href));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden">
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {/* 메인 탭 (4개) */}
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-md px-3 py-2 text-xs transition-colors ${
                active
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* 더보기 탭 (Sheet) */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className={`flex flex-col items-center justify-center gap-1 rounded-md px-3 py-2 text-xs transition-colors ${
                isMoreActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span>더보기</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[50vh]">
            <SheetHeader>
              <SheetTitle>더보기 메뉴</SheetTitle>
            </SheetHeader>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={active ? "default" : "outline"}
                      className="h-20 w-full flex-col gap-2"
                    >
                      <Icon className="h-6 w-6" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
