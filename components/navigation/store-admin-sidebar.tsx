"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  TrendingUp,
  DollarSign,
  Star,
  Store,
  Menu,
  X,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface StoreAdminSidebarProps {
  className?: string;
  storeName?: string;
}

const menuItems = [
  {
    title: "대시보드",
    href: "/store-admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "상품 관리",
    href: "/store-admin/products",
    icon: Package,
  },
  {
    title: "메뉴 관리",
    href: "/store-admin/menu",
    icon: UtensilsCrossed,
  },
  {
    title: "주문 관리",
    href: "/store-admin/orders",
    icon: ClipboardList,
  },
  {
    title: "소진율 예측",
    href: "/store-admin/predict",
    icon: TrendingUp,
  },
  {
    title: "정산 내역",
    href: "/store-admin/settlement",
    icon: DollarSign,
  },
  {
    title: "리뷰 관리",
    href: "/store-admin/reviews",
    icon: Star,
  },
  {
    title: "가게 정보",
    href: "/store-admin/profile",
    icon: Store,
  },
];

export function StoreAdminSidebar({
  className = "",
  storeName = "내 가게",
}: StoreAdminSidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          ${className}
          fixed lg:sticky top-0 h-screen w-64 bg-background border-r border-border
          transition-transform duration-300 ease-in-out z-40
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-foreground truncate">
                  {storeName}
                </h1>
                <p className="text-xs text-muted-foreground">사장님 관리</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-200
                    ${
                      isActive
                        ? "bg-secondary text-primary font-medium"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Store Admin v1.0
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
