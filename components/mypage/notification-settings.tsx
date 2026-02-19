/**
 * @file components/mypage/notification-settings.tsx
 * @description 알림 설정 컴포넌트
 * 
 * Client Component (토글 스위치)
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettingsProps {
  initialSettings?: {
    order_updates: boolean;
    marketing: boolean;
    event: boolean;
    night_mode: boolean;
  };
}

export function NotificationSettings({ initialSettings }: NotificationSettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState(
    initialSettings || {
      order_updates: true,
      marketing: false,
      event: false,
      night_mode: false,
    }
  );

  const handleToggle = async (key: keyof typeof settings) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));

    // TODO: API 호출로 저장
    toast({
      title: "저장 완료",
      description: "알림 설정이 변경되었습니다.",
    });
  };

  return (
    <Card id="settings">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          알림 설정
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="order-updates" className="font-medium">
              주문 알림
            </Label>
            <p className="text-sm text-muted-foreground">
              주문 상태 변경 시 알림 받기
            </p>
          </div>
          <Switch
            id="order-updates"
            checked={settings.order_updates}
            onCheckedChange={() => handleToggle("order_updates")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="marketing" className="font-medium">
              마케팅 알림
            </Label>
            <p className="text-sm text-muted-foreground">
              이벤트 및 프로모션 정보 받기
            </p>
          </div>
          <Switch
            id="marketing"
            checked={settings.marketing}
            onCheckedChange={() => handleToggle("marketing")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="event" className="font-medium">
              이벤트 알림
            </Label>
            <p className="text-sm text-muted-foreground">
              특별 이벤트 및 할인 정보 받기
            </p>
          </div>
          <Switch
            id="event"
            checked={settings.event}
            onCheckedChange={() => handleToggle("event")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="night-mode" className="font-medium">
              야간 알림 수신 거부
            </Label>
            <p className="text-sm text-muted-foreground">
              밤 10시~아침 8시 알림 받지 않기
            </p>
          </div>
          <Switch
            id="night-mode"
            checked={settings.night_mode}
            onCheckedChange={() => handleToggle("night_mode")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
