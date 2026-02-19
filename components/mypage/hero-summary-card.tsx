/**
 * @file components/mypage/hero-summary-card.tsx
 * @description 히어로 요약 카드 컴포넌트
 * 
 * 기존 HeroStatusCard를 래핑하여 마이페이지에서 사용
 * 클릭 시 /mypage/hero로 이동
 */

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { HeroStatusCard } from "@/components/hero/hero-status-card";

interface HeroSummaryCardProps {
  userId: string;
}

export async function HeroSummaryCard({ userId }: HeroSummaryCardProps) {
  return (
    <div className="relative">
      <Link href="/mypage/hero" className="block group">
        <div className="relative rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
          {/* 기존 HeroStatusCard 재활용 */}
          <HeroStatusCard />
          
          {/* 더보기 버튼 오버레이 */}
          <div className="absolute top-4 right-4">
            <div className="bg-background/80 backdrop-blur-sm rounded-full p-1 group-hover:bg-background transition-colors">
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
