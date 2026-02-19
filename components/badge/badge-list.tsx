/**
 * @file badge-list.tsx
 * @description 사용자가 보유한 배지 목록 표시 컴포넌트
 * 
 * 주요 기능:
 * - 보유 배지 아이콘 리스트 (가로 스크롤)
 * - 배지 이모지 + 이름 + 획득 일시
 * 
 * @dependencies
 * - @/actions/badge: getUserBadges Server Action
 * - @/components/ui/card: shadcn Card 컴포넌트
 */

import { getUserBadges } from "@/actions/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export async function BadgeList() {
  const result = await getUserBadges();

  if (!result.success) {
    return null; // 에러 시 표시 안 함
  }

  const badges = result.data;

  if (badges.length === 0) {
    return null; // 배지가 없으면 표시 안 함
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          내 배지
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="flex min-w-[120px] flex-col items-center gap-2 rounded-lg border p-3"
            >
              {/* 배지 이모지 */}
              <div className="text-4xl">{badge.badge_emoji || "🏆"}</div>
              
              {/* 배지 이름 */}
              <p className="text-center text-sm font-semibold">
                {badge.badge_name}
              </p>
              
              {/* 획득 일시 */}
              <p className="text-center text-xs text-muted-foreground">
                {format(new Date(badge.earned_at), "yyyy.MM.dd", { locale: ko })}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
