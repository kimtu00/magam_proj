"use client";

import { useState, useMemo } from "react";
import type { SellerOrderDetailData } from "@/services/order/order.types";
import { SellerReservationCard } from "@/components/product/seller-reservation-card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

type FilterStatus = "ALL" | "RESERVED" | "COMPLETED" | "CANCELED";

interface ReservationListViewProps {
  initialReservations: SellerOrderDetailData[];
}

/**
 * 예약 목록을 표시하고 필터링하는 클라이언트 컴포넌트
 */
export function ReservationListView({
  initialReservations,
}: ReservationListViewProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  
  // 기본값: 오늘 날짜 범위
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return {
      from: startOfDay(today),
      to: endOfDay(today),
    };
  });

  // 필터링된 예약 목록 (상태 + 날짜)
  const filteredReservations = useMemo(() => {
    let filtered = filterStatus === "ALL" 
      ? initialReservations 
      : initialReservations.filter((r) => r.status === filterStatus);
    
    // 날짜 필터 적용
    if (dateRange?.from) {
      filtered = filtered.filter((r) => new Date(r.created_at) >= dateRange.from!);
    }
    if (dateRange?.to) {
      filtered = filtered.filter((r) => new Date(r.created_at) <= dateRange.to!);
    }
    
    return filtered;
  }, [initialReservations, filterStatus, dateRange]);

  // 상태별 개수 계산
  const statusCounts = useMemo(() => {
    return {
      ALL: initialReservations.length,
      RESERVED: initialReservations.filter((r) => r.status === "RESERVED").length,
      COMPLETED: initialReservations.filter((r) => r.status === "COMPLETED").length,
      CANCELED: initialReservations.filter((r) => r.status === "CANCELED").length,
    };
  }, [initialReservations]);

  const filterButtons: Array<{ value: FilterStatus; label: string }> = [
    { value: "ALL", label: "전체" },
    { value: "RESERVED", label: "예약됨" },
    { value: "COMPLETED", label: "완료" },
    { value: "CANCELED", label: "취소됨" },
  ];

  // 퀵 필터 버튼 핸들러
  const handleQuickSelect = (days: number | 'today') => {
    if (days === 'today') {
      const today = new Date();
      setDateRange({
        from: startOfDay(today),
        to: endOfDay(today),
      });
    } else {
      const to = endOfDay(new Date());
      const from = startOfDay(subDays(to, days - 1));
      setDateRange({ from, to });
    }
  };

  const handleReset = () => {
    setDateRange(undefined);
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  return (
    <div className="space-y-4 overflow-x-hidden">
      {/* 날짜 필터 섹션 (소비자 화면과 동일한 스타일) */}
      <div className="space-y-3 border-b bg-background px-4 py-3">
        {/* 퀵 필터 버튼 */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect('today')}
          >
            오늘
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect(3)}
          >
            최근 3일
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect(7)}
          >
            최근 일주일
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect(30)}
          >
            최근 한 달
          </Button>
          {dateRange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
            >
              전체 보기
            </Button>
          )}
        </div>

        {/* 커스텀 날짜 범위 선택 */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal truncate",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "yy.MM.dd", { locale: ko })} -{" "}
                      {format(dateRange.to, "yy.MM.dd", { locale: ko })}
                    </>
                  ) : (
                    format(dateRange.from, "yy.MM.dd", { locale: ko })
                  )
                ) : (
                  <span>날짜 선택</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateSelect}
                numberOfMonths={1}
                locale={ko}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 상태 필터 버튼 */}
      <div className="px-4">
        <div className="flex flex-wrap items-center gap-1 pb-2">
          {filterButtons.map((filter) => (
            <Button
              key={filter.value}
              variant={filterStatus === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(filter.value)}
              className={cn(
                "px-2.5 py-1 text-xs h-7 min-w-0",
                filterStatus === filter.value && "shadow-sm"
              )}
            >
              {filter.label}
              <span
                className={cn(
                  "ml-1 rounded-full px-1.5 py-0 text-[11px]",
                  filterStatus === filter.value
                    ? "bg-primary-foreground/20"
                    : "bg-muted"
                )}
              >
                {statusCounts[filter.value]}
              </span>
            </Button>
          ))}
        </div>

        {/* 예약 목록 */}
        {filteredReservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">
              {filterStatus === "ALL"
                ? "아직 예약 내역이 없습니다."
                : `${filterButtons.find((f) => f.value === filterStatus)?.label} 예약이 없습니다.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReservations.map((reservation) => (
              <SellerReservationCard
                key={reservation.id}
                reservation={reservation}
              />
            ))}
          </div>
        )}

        {/* 하단 여백 (네비게이션 고려) */}
        <div className="h-8" />
      </div>
    </div>
  );
}


