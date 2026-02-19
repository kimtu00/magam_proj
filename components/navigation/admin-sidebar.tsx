"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Trophy,
  Menu,
  X,
  Brain,
  LayoutDashboard,
  Users,
  Store,
  Megaphone,
  DollarSign,
  FileCheck,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  className?: string;
}

interface SubMenuItem {
  title: string;
  href: string;
}

interface MenuItem {
  title: string;
  href: string;
  icon: React.ElementType;
  subItems?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: "대시보드",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "회원",
    href: "/admin/users",
    icon: Users,
    subItems: [
      { title: "소비자", href: "/admin/users?type=consumer" },
      { title: "사장님", href: "/admin/users?type=producer" },
    ],
  },
  {
    title: "가게",
    href: "/admin/stores",
    icon: Store,
    subItems: [
      { title: "가게 목록", href: "/admin/stores" },
      { title: "재고 목록", href: "/admin/stores/inventory" },
    ],
  },
  {
    title: "혜택",
    href: "/admin/promotions",
    icon: Megaphone,
    subItems: [
      { title: "쿠폰", href: "/admin/promotions?tab=coupons" },
      { title: "프로모 코드", href: "/admin/promotions?tab=promo-codes" },
      { title: "등급 혜택", href: "/admin/promotions?tab=grade-benefits" },
    ],
  },
  {
    title: "수익",
    href: "/admin/finance",
    icon: DollarSign,
    subItems: [
      { title: "현금 흐름", href: "/admin/finance?tab=cashflow" },
      { title: "재무제표", href: "/admin/finance?tab=statements" },
      { title: "수익성", href: "/admin/finance?tab=profitability" },
    ],
  },
  {
    title: "히어로 시스템 관리",
    href: "/admin/hero-system",
    icon: Trophy,
  },
  {
    title: "페이백",
    href: "/admin/payback",
    icon: FileCheck,
  },
  {
    title: "ML 모델",
    href: "/admin/ml",
    icon: Brain,
  },
  {
    title: "설정",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar({ className = "" }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (href: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(href)) {
      newExpanded.delete(href);
    } else {
      newExpanded.add(href);
    }
    setExpandedItems(newExpanded);
  };

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
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">관리자</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedItems.has(item.href);

              return (
                <div key={item.href}>
                  {/* Main Menu Item */}
                  {hasSubItems ? (
                    <button
                      onClick={() => toggleExpanded(item.href)}
                      className={`
                        w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg
                        transition-colors duration-200
                        ${
                          isActive
                            ? "bg-secondary text-primary font-medium"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    <Link
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
                  )}

                  {/* Sub Menu Items */}
                  {hasSubItems && isExpanded && (
                    <div className="mt-1 ml-4 space-y-1">
                      {item.subItems!.map((subItem) => {
                        const isSubActive = pathname.includes(subItem.href);
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`
                              block px-4 py-2 text-sm rounded-lg
                              transition-colors duration-200
                              ${
                                isSubActive
                                  ? "bg-secondary text-primary font-medium"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              }
                            `}
                          >
                            {subItem.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Admin Panel v1.0
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
