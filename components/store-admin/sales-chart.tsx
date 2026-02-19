/**
 * @file components/store-admin/sales-chart.tsx
 * @description 매출 추이 바 차트 (Recharts)
 *
 * Client Component
 */

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { SalesChartData } from "@/types/store-admin";

interface SalesChartProps {
  data: SalesChartData[];
}

export function SalesChart({ data }: SalesChartProps) {
  // 날짜 포맷팅 (MM/DD 형식)
  const formattedData = data.map((item) => ({
    ...item,
    dateLabel: new Date(item.date).toLocaleDateString("ko-KR", {
      month: "numeric",
      day: "numeric",
    }),
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg border bg-card p-6">
        <p className="text-muted-foreground">매출 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">매출 추이 (최근 7일)</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number) => `₩${value.toLocaleString()}`}
            labelFormatter={(label) => `날짜: ${label}`}
          />
          <Legend />
          <Bar dataKey="sales" fill="#4CAF50" name="매출" radius={[4, 4, 0, 0]} />
          <Bar
            dataKey="orders"
            fill="#4FC3F7"
            name="주문 건수"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
