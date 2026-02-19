"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Ticket, Coins, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 소비자(consumer)용 마이페이지 하단 네비게이션 바
 *
 * @deprecated 이 컴포넌트는 ConsumerBottomNav로 대체되었습니다.
 * @see ConsumerBottomNav
 *
 * Mobile-First 디자인으로 하단에 고정된 네비게이션 바입니다.
 * 소비자 전용 기능으로 이동할 수 있는 메뉴를 제공합니다.
 *
 * 메뉴 항목:
 * - 홈: /buyer (가게 목록 - 주문 화면)
 * - 주문: /mypage/orders (주문 내역)
 * - 쿠폰: /mypage/coupons (보유 쿠폰)
 * - 포인트: /mypage/points (포인트 관리)
 * - 내정보: /mypage (프로필, 히어로 등급, 혜택 등)
 */
export function MypageBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/buyer",
      label: "홈",
      icon: Home,
      isActive: (path: string) =>
        path === "/buyer" || path === "/buyer/" || path.startsWith("/buyer/"),
    },
    {
      href: "/mypage/orders",
      label: "주문",
      icon: ShoppingBag,
      isActive: (path: string) =>
        path === "/mypage/orders" || path.startsWith("/mypage/orders/"),
    },
    {
      href: "/mypage/coupons",
      label: "쿠폰",
      icon: Ticket,
      isActive: (path: string) =>
        path === "/mypage/coupons" || path.startsWith("/mypage/coupons/"),
    },
    {
      href: "/mypage/points",
      label: "포인트",
      icon: Coins,
      isActive: (path: string) =>
        path === "/mypage/points" || path.startsWith("/mypage/points/"),
    },
    {
      href: "/mypage",
      label: "내정보",
      icon: UserRound,
      isActive: (path: string) =>
        path === "/mypage" ||
        path === "/mypage/" ||
        path === "/mypage/profile" ||
        path.startsWith("/mypage/profile/") ||
        path === "/mypage/hero" ||
        path.startsWith("/mypage/hero/") ||
        path === "/mypage/benefits" ||
        path.startsWith("/mypage/benefits/") ||
        path === "/mypage/receipts" ||
        path.startsWith("/mypage/receipts/"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="max-w-[430px] mx-auto">
        <div className="flex items-center justify-around h-16 px-4">
          {navItems.map((item) => {
            const active = item.isActive(pathname);
            const Icon = item.icon;

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
                <Icon className={cn("w-5 h-5", active && "text-primary")} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
