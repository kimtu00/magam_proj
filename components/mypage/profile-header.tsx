/**
 * @file components/mypage/profile-header.tsx
 * @description 마이페이지 프로필 헤더 컴포넌트
 * 
 * 사용자 이름 + 히어로 등급 표시
 */

import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ConsumerProfile } from "@/types/consumer";

interface ProfileHeaderProps {
  profile: ConsumerProfile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  // 히어로 등급별 색상
  const getTierColor = (level: string) => {
    const levelLower = level.toLowerCase();
    if (levelLower.includes("브론즈")) return "bg-muted text-foreground";
    if (levelLower.includes("실버")) return "bg-muted text-muted-foreground";
    if (levelLower.includes("골드")) return "bg-secondary text-primary";
    if (levelLower.includes("플래티넘")) return "bg-secondary text-primary";
    if (levelLower.includes("다이아")) return "bg-primary text-primary-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm border">
      <div className="flex items-center gap-4">
        {/* 프로필 이미지 */}
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.profile_image || undefined} alt={profile.name} />
          <AvatarFallback>
            <UserRound className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>

        {/* 이름 + 등급 */}
        <div className="flex-1">
          <h2 className="text-xl font-bold">{profile.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={getTierColor(profile.hero_level)}>
              {profile.hero_level}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Tier {profile.hero_tier}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
