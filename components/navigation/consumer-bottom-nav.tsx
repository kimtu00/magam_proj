"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { CartIcon } from "@/components/cart/cart-icon";

/**
 * 소비자(consumer)용 통합 하단 네비게이션 바
 *
 * Mobile-First 디자인으로 하단에 고정된 네비게이션 바입니다.
 * /buyer/*와 /mypage/* 모든 경로에서 동일한 네비게이션을 제공합니다.
 *
 * 메뉴 항목:
 * - 홈: /buyer (가게 목록, 마감 할인 주문)
 * - 장바구니: /buyer/cart
 * - 주문내역: /buyer/orders (예약 + 주문 내역 통합)
 * - 내정보: /mypage (프로필, 쿠폰, 포인트, 히어로 등급, 혜택 등)
 */
export function ConsumerBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/buyer",
      label: "홈",
      icon: Home,
      isActive: (path: string) =>
        path === "/buyer" ||
        path === "/buyer/" ||
        path.startsWith("/buyer/store/") ||
        path.startsWith("/buyer/product/"),
    },
    {
      href: "/buyer/cart",
      label: "장바구니",
      icon: "cart", // 특별 처리
      isActive: (path: string) =>
        path === "/buyer/cart" || path.startsWith("/buyer/cart/"),
    },
    {
      href: "/buyer/orders",
      label: "주문내역",
      icon: ShoppingBag,
      isActive: (path: string) =>
        path === "/buyer/orders" ||
        path.startsWith("/buyer/orders/") ||
        path === "/buyer/reservations" ||
        path.startsWith("/buyer/reservations/"),
    },
    {
      href: "/mypage",
      label: "내정보",
      icon: UserRound,
      isActive: (path: string) => path.startsWith("/mypage"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="max-w-[430px] mx-auto">
        <div className="flex items-center justify-around h-16 px-4">
          {navItems.map((item) => {
            const active = item.isActive(pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.icon === "cart" ? (
                  <CartIcon isActive={active} />
                ) : (
                  (() => {
                    const Icon = item.icon as React.ComponentType<{ className?: string }>;
                    return <Icon className={cn("w-5 h-5", active && "text-primary")} />;
                  })()
                )}
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
