"use client";

import { LayoutGrid, List, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ViewType = "grid" | "list" | "map";

interface ViewToggleProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
}

/**
 * 뷰 타입 전환 버튼 컴포넌트
 *
 * 그리드 뷰와 리스트 뷰를 전환할 수 있는 버튼입니다.
 */
export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border bg-background p-1">
      <Button
        type="button"
        variant={view === "grid" ? "default" : "ghost"}
        size="sm"
        className={cn(
          "h-8 w-8 p-0",
          view === "grid" && "bg-primary text-primary-foreground"
        )}
        onClick={() => onViewChange("grid")}
        title="그리드 뷰"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={view === "list" ? "default" : "ghost"}
        size="sm"
        className={cn(
          "h-8 w-8 p-0",
          view === "list" && "bg-primary text-primary-foreground"
        )}
        onClick={() => onViewChange("list")}
        title="리스트 뷰"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={view === "map" ? "default" : "ghost"}
        size="sm"
        className={cn(
          "h-8 w-8 p-0",
          view === "map" && "bg-primary text-primary-foreground"
        )}
        onClick={() => onViewChange("map")}
        title="지도 뷰"
      >
        <Map className="h-4 w-4" />
      </Button>
    </div>
  );
}


