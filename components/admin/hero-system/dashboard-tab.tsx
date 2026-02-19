"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Package, Weight, Leaf, ChevronLeft, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { toast } from "sonner";

interface GradeDistribution {
  grade_level: number;
  grade_name: string;
  grade_emoji: string;
  count: number;
}

interface Stats {
  distribution: GradeDistribution[];
  totals: {
    total_pickups: number;
    total_weight_kg: number;
    total_co2_kg: number;
  };
}

interface UpgradeLog {
  id: string;
  user_id: string;
  user_nickname: string;
  from_level: number;
  from_grade_name: string;
  from_grade_emoji: string;
  to_level: number;
  to_grade_name: string;
  to_grade_emoji: string;
  trigger_type: string;
  trigger_value: string | null;
  created_at: string;
}

const COLORS = ["#9E9E9E", "#4CAF50", "#4FC3F7", "#8b5cf6", "#FFC107"];

export function DashboardTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<UpgradeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        fetch("/api/admin/hero/stats"),
        fetch(`/api/admin/hero/upgrade-logs?page=${page}&limit=${limit}`),
      ]);

      if (!statsRes.ok || !logsRes.ok) {
        throw new Error("데이터를 불러오는데 실패했습니다");
      }

      const [statsData, logsData] = await Promise.all([
        statsRes.json(),
        logsRes.json(),
      ]);

      setStats(statsData.data);
      setLogs(logsData.data || []);
      setTotalPages(logsData.pagination?.total_pages || 1);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("데이터를 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  if (isLoading || !stats) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  const chartData = stats.distribution.map((item) => ({
    name: `${item.grade_emoji} ${item.grade_name}`,
    value: item.count,
  }));

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 픽업 수</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totals.total_pickups.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              전체 사용자의 픽업 횟수 합계
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 구한 음식</CardTitle>
            <Weight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totals.total_weight_kg.toLocaleString()} kg
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              전체 사용자가 구한 음식 무게 합계
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 탄소 절감</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totals.total_co2_kg.toLocaleString()} kg CO₂
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              전체 사용자의 탄소 절감량 합계
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>등급별 사용자 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(1)}%`
                }
                outerRadius={120}
                fill="#4CAF50"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.distribution.map((item, index) => (
              <div
                key={item.grade_level}
                className="flex items-center gap-2 p-3 rounded-lg border"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {item.grade_emoji} {item.grade_name}
                  </div>
                  <div className="text-xl font-bold">{item.count}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Upgrade Logs */}
      <Card>
        <CardHeader>
          <CardTitle>최근 등급 상승 이력</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              등급 상승 이력이 없습니다
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>사용자</TableHead>
                      <TableHead>등급 변화</TableHead>
                      <TableHead>트리거</TableHead>
                      <TableHead>사유</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
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
                        <TableCell>
                          <Badge
                            variant={
                              log.trigger_type === "manual"
                                ? "destructive"
                                : "default"
                            }
                          >
                            {log.trigger_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.trigger_value || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  페이지 {page} / {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
