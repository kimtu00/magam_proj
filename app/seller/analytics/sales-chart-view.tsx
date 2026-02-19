"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SalesAnalytics, PeriodType } from "@/services/analytics";
import { TrendingUp, ShoppingCart, DollarSign, CheckCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface SalesChartViewProps {
  initialData: SalesAnalytics;
}

/**
 * 매출 분석 차트 뷰 (Client Component)
 */
export function SalesChartView({ initialData }: SalesChartViewProps) {
  const [periodType, setPeriodType] = useState<PeriodType>("daily");
  
  // 기간 타입에 따라 데이터 선택
  const chartData = useMemo(() => {
    switch (periodType) {
      case "daily":
        return initialData.dailySales.map(d => ({
          label: d.date.slice(5), // MM-DD만 표시
          매출: d.sales,
          주문수: d.orders,
        }));
      case "weekly":
        return initialData.weeklySales.map(w => ({
          label: w.weekLabel,
          매출: w.sales,
          주문수: w.orders,
        }));
      case "monthly":
        return initialData.monthlySales.map(m => ({
          label: m.monthLabel,
          매출: m.sales,
          주문수: m.orders,
        }));
    }
  }, [periodType, initialData]);

  const { summary, topProducts } = initialData;

  return (
    <div className="space-y-6">
      {/* 요약 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 총 매출액 */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium">총 매출액</span>
          </div>
          <p className="text-2xl font-bold">
            {summary.totalSales.toLocaleString("ko-KR")}
            <span className="text-sm font-normal text-muted-foreground ml-1">원</span>
          </p>
        </Card>

        {/* 총 주문 건수 */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShoppingCart className="h-4 w-4" />
            <span className="text-xs font-medium">총 주문</span>
          </div>
          <p className="text-2xl font-bold">
            {summary.totalOrders}
            <span className="text-sm font-normal text-muted-foreground ml-1">건</span>
          </p>
        </Card>

        {/* 평균 주문 금액 */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">평균 주문</span>
          </div>
          <p className="text-2xl font-bold">
            {Math.round(summary.averageOrder).toLocaleString("ko-KR")}
            <span className="text-sm font-normal text-muted-foreground ml-1">원</span>
          </p>
        </Card>

        {/* 완료율 */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-medium">완료율</span>
          </div>
          <p className="text-2xl font-bold">
            {summary.completionRate.toFixed(1)}
            <span className="text-sm font-normal text-muted-foreground ml-1">%</span>
          </p>
        </Card>
      </div>

      {/* 매출 그래프 */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">매출 추이</h2>
          
          {/* 기간 선택 버튼 */}
          <div className="flex gap-1">
            <Button
              variant={periodType === "daily" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriodType("daily")}
            >
              일별
            </Button>
            <Button
              variant={periodType === "weekly" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriodType("weekly")}
            >
              주별
            </Button>
            <Button
              variant={periodType === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriodType("monthly")}
            >
              월별
            </Button>
          </div>
        </div>

        {/* 차트 */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "매출") {
                    return [`${value.toLocaleString("ko-KR")}원`, name];
                  }
                  return [`${value}건`, name];
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="매출"
                stroke="#4CAF50"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="주문수"
                stroke="#4FC3F7"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 상품별 매출 순위 */}
      <Card className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">상품별 매출 순위</h2>
        
        {topProducts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            매출 데이터가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div
                key={product.productId}
                className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                {/* 순위 */}
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {index + 1}
                </div>

                {/* 상품 이미지 */}
                <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted">
                  {product.productImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.productImage}
                      alt={product.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      이미지 없음
                    </div>
                  )}
                </div>

                {/* 상품 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.productName}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    <span>판매: {product.totalQuantity}개</span>
                    <span>주문: {product.totalOrders}건</span>
                  </div>
                </div>

                {/* 매출액 */}
                <div className="flex-shrink-0 text-right">
                  <p className="font-bold text-lg">
                    {product.totalSales.toLocaleString("ko-KR")}
                    <span className="text-xs font-normal text-muted-foreground ml-1">원</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
