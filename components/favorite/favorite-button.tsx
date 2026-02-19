/**
 * Favorite Button Component
 * 
 * 가게를 즐겨찾기하는 버튼 컴포넌트
 */

"use client";

import { useState, useTransition, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addFavoriteStore, removeFavoriteStore } from "@/actions/favorite";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  storeId: string;
  initialIsFavorite: boolean;
  variant?: "icon" | "button";
  className?: string;
}

/**
 * 즐겨찾기 버튼
 * 
 * @param storeId - 가게 ID
 * @param initialIsFavorite - 초기 즐겨찾기 상태
 * @param variant - 버튼 스타일 ("icon" | "button")
 * @param className - 추가 클래스명
 */
export function FavoriteButton({
  storeId,
  initialIsFavorite,
  variant = "icon",
  className,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isPending, startTransition] = useTransition();

  // 다른 버튼에서 발생한 이벤트 수신 (같은 storeId만)
  useEffect(() => {
    const handleFavoriteChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ storeId: string; isFavorite: boolean }>;
      const { storeId: changedStoreId, isFavorite: newFavoriteState } = customEvent.detail;
      
      // 같은 storeId일 때만 상태 업데이트
      if (changedStoreId === storeId) {
        setIsFavorite(newFavoriteState);
      }
    };

    window.addEventListener('favoriteChanged', handleFavoriteChange);
    
    return () => {
      window.removeEventListener('favoriteChanged', handleFavoriteChange);
    };
  }, [storeId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      if (isFavorite) {
        const result = await removeFavoriteStore(storeId);
        if (result.success) {
          setIsFavorite(false);
          // 이벤트 발생 (다른 같은 가게의 하트들에게 알림)
          window.dispatchEvent(
            new CustomEvent('favoriteChanged', { 
              detail: { storeId, isFavorite: false } 
            })
          );
        }
      } else {
        const result = await addFavoriteStore(storeId);
        if (result.success) {
          setIsFavorite(true);
          // 이벤트 발생 (다른 같은 가게의 하트들에게 알림)
          window.dispatchEvent(
            new CustomEvent('favoriteChanged', { 
              detail: { storeId, isFavorite: true } 
            })
          );
        }
      }
    });
  };

  if (variant === "button") {
    return (
      <Button
        variant={isFavorite ? "default" : "outline"}
        onClick={handleToggle}
        disabled={isPending}
        className={cn("gap-2", className)}
      >
        <Heart
          className={cn(
            "h-4 w-4",
            isFavorite && "fill-current"
          )}
        />
        {isFavorite ? "즐겨찾기 해제" : "가게 즐겨찾기"}
      </Button>
    );
  }

  // icon variant
  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "inline-flex items-center justify-center rounded-full p-1.5 transition-colors hover:bg-accent/50",
        isPending && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={isFavorite ? "즐겨찾기 해제" : "가게 즐겨찾기"}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-colors",
            isFavorite 
              ? "fill-destructive text-destructive" 
              : "text-muted-foreground hover:text-foreground"
        )}
      />
    </button>
  );
}

