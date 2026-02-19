"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * 필터 타입
 */
type FeedFilter = "all" | "instant" | "cook" | "budget" | "favorite";

/**
 * 필터 탭 컴포넌트
 *
 * 메인 피드의 필터 탭 UI입니다.
 * 전체, 바로섭취, 조리용, 만원이하, 즐겨찾기 필터를 제공합니다.
 */
export function FeedFilterTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = (searchParams.get("filter") || "all") as FeedFilter;

  const filters: { value: FeedFilter; label: string; emoji: string }[] = [
    { value: "all", label: "전체", emoji: "" },
    { value: "instant", label: "바로섭취", emoji: "😋" },
    { value: "cook", label: "조리용", emoji: "🍳" },
    { value: "budget", label: "만원이하", emoji: "💸" },
    { value: "favorite", label: "즐겨찾기", emoji: "❤️" },
  ];

  const handleFilterChange = (filter: FeedFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "all") {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }
    router.push(`/buyer?${params.toString()}`);
  };

  return (
    <div className="sticky top-[49px] z-10 border-b bg-background pb-2">
      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant={currentFilter === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange(filter.value)}
            className={cn(
              "shrink-0 whitespace-nowrap",
              currentFilter === filter.value &&
                "bg-primary text-primary-foreground"
            )}
          >
            {filter.emoji && <span className="mr-1">{filter.emoji}</span>}
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
