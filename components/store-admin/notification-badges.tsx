/**
 * @file components/store-admin/notification-badges.tsx
 * @description 알림 배지 컴포넌트 (주문 + 리뷰)
 *
 * 주요 기능:
 * 1. 서버에서 받은 초기값으로 즉시 배지 렌더링
 * 2. 60초마다 /api/store/notifications 폴링
 * 3. 이전 카운트보다 증가하면 AudioContext로 비프음 재생
 *
 * @dependencies
 * - lucide-react: ShoppingBag, Star 아이콘
 */

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 60_000; // 60초

/** AudioContext로 짧은 비프음 재생 (외부 파일 불필요) */
function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800; // Hz
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.15); // 150ms
    // 재생 후 컨텍스트 정리
    osc.onended = () => ctx.close();
  } catch {
    // 브라우저 정책으로 AudioContext가 차단된 경우 무시
  }
}

interface NotificationBadgesProps {
  initialOrders: number;
  initialReviews: number;
}

/**
 * 주문(ShoppingBag) + 리뷰(Star) 알림 배지 컴포넌트
 *
 * layout.tsx(Server Component) 안에서 사용하며,
 * 서버에서 계산한 초기값을 prop으로 받아 즉시 표시합니다.
 * 이후 60초 간격으로 백그라운드 폴링하여 카운트를 갱신합니다.
 */
export function NotificationBadges({
  initialOrders,
  initialReviews,
}: NotificationBadgesProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [reviews, setReviews] = useState(initialReviews);

  // 이전 카운트 추적 (소리 알림 기준)
  const prevOrders = useRef(initialOrders);
  const prevReviews = useRef(initialReviews);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/store/notifications");
        if (!res.ok) return;

        const { newOrders, newReviews } = await res.json();

        // 주문 또는 리뷰가 증가했을 때 비프음 재생
        if (newOrders > prevOrders.current || newReviews > prevReviews.current) {
          playBeep();
        }

        prevOrders.current = newOrders;
        prevReviews.current = newReviews;
        setOrders(newOrders);
        setReviews(newReviews);
      } catch {
        // 네트워크 오류 시 현재 상태 유지
      }
    };

    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* 주문 아이콘 - 새 주문 배지, 클릭 시 주문 관리로 이동 */}
      <Link href="/store-admin/orders" className="relative">
        <Button variant="ghost" size="icon">
          <ShoppingBag className="h-5 w-5" />
        </Button>
        {orders > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {orders > 99 ? "99+" : orders}
          </span>
        )}
      </Link>

      {/* 별 아이콘 - 새 리뷰 배지, 클릭 시 리뷰 관리로 이동 */}
      <Link href="/store-admin/reviews" className="relative">
        <Button variant="ghost" size="icon">
          <Star className="h-5 w-5" />
        </Button>
        {reviews > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {reviews > 99 ? "99+" : reviews}
          </span>
        )}
      </Link>
    </div>
  );
}
