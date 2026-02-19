/**
 * @file components/mypage/menu-list.tsx
 * @description 마이페이지 메뉴 리스트 컴포넌트
 * 
 * 주문내역, 쿠폰함, 포인트, 영수증, 혜택, 프로필, 계좌, 고객센터, 설정 등
 */

import Link from "next/link";
import {
  ShoppingBag,
  Ticket,
  Coins,
  Receipt,
  Gift,
  UserRound,
  CreditCard,
  HeadphonesIcon,
  Settings,
  ChevronRight,
} from "lucide-react";

export function MenuList() {
  const menuSections = [
    {
      title: "활동",
      items: [
        {
          label: "주문 내역",
          href: "/mypage/orders",
          icon: ShoppingBag,
          description: "주문 및 예약 내역 확인",
        },
        {
          label: "쿠폰함",
          href: "/mypage/coupons",
          icon: Ticket,
          description: "보유한 쿠폰 관리",
        },
        {
          label: "포인트",
          href: "/mypage/points",
          icon: Coins,
          description: "포인트 적립 및 사용 내역",
        },
        {
          label: "영수증 제출",
          href: "/mypage/receipts",
          icon: Receipt,
          description: "영수증 제출하고 페이백 받기",
        },
      ],
    },
    {
      title: "혜택",
      items: [
        {
          label: "히어로 혜택",
          href: "/mypage/benefits",
          icon: Gift,
          description: "등급별 특별 혜택 확인",
        },
      ],
    },
    {
      title: "계정",
      items: [
        {
          label: "프로필 수정",
          href: "/mypage/profile",
          icon: UserRound,
          description: "내 정보 수정",
        },
        {
          label: "계좌 관리",
          href: "/mypage/profile#bank-account",
          icon: CreditCard,
          description: "페이백 받을 계좌 등록",
        },
      ],
    },
    {
      title: "기타",
      items: [
        {
          label: "고객센터",
          href: "/support",
          icon: HeadphonesIcon,
          description: "문의 및 FAQ",
        },
        {
          label: "설정",
          href: "/mypage/profile#settings",
          icon: Settings,
          description: "알림 및 앱 설정",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {menuSections.map((section) => (
        <div key={section.title} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground px-2">
            {section.title}
          </h3>
          <div className="bg-card rounded-lg border shadow-sm divide-y">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-4 p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex-shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {item.description}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
