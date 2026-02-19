"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  fallbackUrl?: string;
}

/**
 * 뒤로가기 버튼 컴포넌트
 * 
 * 브라우저 히스토리가 있으면 뒤로가기, 없으면 fallbackUrl로 이동
 */
export function BackButton({ fallbackUrl = "/" }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="gap-2 -ml-2"
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">이전</span>
    </Button>
  );
}
