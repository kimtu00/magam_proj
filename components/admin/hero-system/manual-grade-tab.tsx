"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserSearch } from "./user-search";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface User {
  user_id: string;
  nickname: string;
  role: string;
  grade_level: number;
  grade_name: string;
  grade_emoji: string;
  total_pickup_count: number;
  total_saved_weight_kg: number;
}

interface GradeConfig {
  id: number;
  grade_level: number;
  grade_name: string;
  grade_emoji: string | null;
  is_active: boolean;
}

interface ManualLog {
  id: string;
  user_nickname: string;
  from_grade_name: string;
  from_grade_emoji: string;
  to_grade_name: string;
  to_grade_emoji: string;
  trigger_value: string | null;
  created_at: string;
}

const gradeAdjustSchema = z.object({
  grade_level: z.string().min(1, "등급을 선택하세요"),
  reason: z.string().min(5, "사유는 최소 5자 이상 입력해야 합니다"),
});

type GradeAdjustFormData = z.infer<typeof gradeAdjustSchema>;

export function ManualGradeTab() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [gradeConfigs, setGradeConfigs] = useState<GradeConfig[]>([]);
  const [manualLogs, setManualLogs] = useState<ManualLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GradeAdjustFormData>({
    resolver: zodResolver(gradeAdjustSchema),
    defaultValues: {
      grade_level: "",
      reason: "",
    },
  });

  useEffect(() => {
    fetchGradeConfigs();
    fetchManualLogs();
  }, []);

  const fetchGradeConfigs = async () => {
    try {
      const response = await fetch("/api/admin/hero/config");
      if (!response.ok) throw new Error("등급 설정 조회 실패");
      const data = await response.json();
      setGradeConfigs(
        (data.data || []).filter((c: GradeConfig) => c.is_active)
      );
    } catch (error) {
      console.error("Error fetching grade configs:", error);
      toast.error("등급 설정을 불러오는데 실패했습니다");
    }
  };

  const fetchManualLogs = async () => {
    try {
      const response = await fetch(
        "/api/admin/hero/upgrade-logs?page=1&limit=10"
      );
      if (!response.ok) throw new Error("이력 조회 실패");
      const data = await response.json();
      setManualLogs(
        (data.data || []).filter((log: any) => log.trigger_type === "manual")
      );
    } catch (error) {
      console.error("Error fetching manual logs:", error);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    form.reset({
      grade_level: "",
      reason: "",
    });
  };

  const onSubmit = async (data: GradeAdjustFormData) => {
    if (!selectedUser) {
      toast.error("사용자를 선택하세요");
      return;
    }

    const newGradeLevel = parseInt(data.grade_level);
    if (newGradeLevel === selectedUser.grade_level) {
      toast.error("현재 등급과 동일한 등급으로는 변경할 수 없습니다");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/hero/users/${selectedUser.user_id}/grade`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grade_level: newGradeLevel,
            reason: data.reason,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "등급 변경 실패");
      }

      toast.success("사용자 등급이 변경되었습니다");
      form.reset();
      setSelectedUser(null);
      fetchManualLogs();
    } catch (error) {
      console.error("Error adjusting grade:", error);
      toast.error(
        error instanceof Error ? error.message : "등급 변경 중 오류가 발생했습니다"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* User Search & Grade Adjustment */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 등급 수동 조정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Search */}
          <div>
            <label className="block text-sm font-medium mb-2">
              사용자 검색
            </label>
            <UserSearch
              onSelectUser={handleUserSelect}
              selectedUserId={selectedUser?.user_id}
            />
          </div>

          {/* Selected User Info */}
          {selectedUser && (
            <div className="p-4 bg-secondary border border-border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedUser.nickname}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    ID: {selectedUser.user_id}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{selectedUser.grade_emoji}</span>
                    <Badge variant="default" className="text-sm">
                      {selectedUser.grade_name}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    레벨 {selectedUser.grade_level}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">총 픽업:</span>{" "}
                  <span className="font-medium">
                    {selectedUser.total_pickup_count}회
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">구한 음식:</span>{" "}
                  <span className="font-medium">
                    {selectedUser.total_saved_weight_kg}kg
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Grade Adjustment Form */}
          {selectedUser && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="grade_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>변경할 등급</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="등급 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gradeConfigs.map((config) => (
                            <SelectItem
                              key={config.id}
                              value={config.grade_level.toString()}
                              disabled={
                                config.grade_level === selectedUser.grade_level
                              }
                            >
                              <span className="flex items-center gap-2">
                                <span>{config.grade_emoji}</span>
                                <span>{config.grade_name}</span>
                                <span className="text-muted-foreground">
                                  (레벨 {config.grade_level})
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        사용자의 새로운 등급을 선택하세요
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>변경 사유 (필수)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="등급 변경 사유를 상세히 입력하세요..."
                          rows={4}
                        />
                      </FormControl>
                      <FormDescription>
                        이력에 기록되므로 명확하게 작성해주세요
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-start gap-2 p-3 bg-muted border border-border rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="text-sm text-foreground">
                    <strong>주의:</strong> 수동 등급 변경은 시스템 자동 판정과
                    별개로 작동하며, 사용자가 추가 픽업을 하면 자동 판정으로
                    재조정될 수 있습니다.
                  </div>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "변경 중..." : "등급 변경"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Recent Manual Adjustments */}
      <Card>
        <CardHeader>
          <CardTitle>최근 수동 조정 이력</CardTitle>
        </CardHeader>
        <CardContent>
          {manualLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              수동 조정 이력이 없습니다
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>사용자</TableHead>
                    <TableHead>등급 변화</TableHead>
                    <TableHead>사유</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manualLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.created_at).toLocaleString("ko-KR")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.user_nickname}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>
                            {log.from_grade_emoji} {log.from_grade_name}
                          </span>
                          <span>→</span>
                          <span>
                            {log.to_grade_emoji} {log.to_grade_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={log.trigger_value || ""}>
                          {log.trigger_value || "-"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
