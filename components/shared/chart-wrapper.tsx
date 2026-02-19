import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartWrapperProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * 차트 래퍼 컴포넌트
 *
 * 차트를 감싸는 카드 컴포넌트입니다.
 * 실제 차트 라이브러리(recharts, chart.js 등)는 추후 선택하여 구현합니다.
 *
 * @example
 * ```tsx
 * <ChartWrapper
 *   title="월별 매출"
 *   description="최근 12개월 매출 추이"
 * >
 *   <ResponsiveContainer width="100%" height={300}>
 *     <LineChart data={data}>
 *       <Line type="monotone" dataKey="value" stroke="#8884d8" />
 *     </LineChart>
 *   </ResponsiveContainer>
 * </ChartWrapper>
 * ```
 */
export function ChartWrapper({ title, description, children }: ChartWrapperProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
