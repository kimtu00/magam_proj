"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

/**
 * 예약 내역 날짜 필터 컴포넌트
 * 
 * 단축 버튼(3일, 일주일, 한 달)과 커스텀 날짜 범위 선택을 제공합니다.
 * URL searchParams를 사용하여 필터 상태를 관리합니다.
 */
export function OrderDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL에서 현재 날짜 범위 읽기
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  
  const [date, setDate] = useState<DateRange | undefined>(() => {
    if (fromParam && toParam) {
      return {
        from: new Date(fromParam),
        to: new Date(toParam),
      };
    }
    return undefined;
  });

  const applyDateRange = (from: Date | undefined, to: Date | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (from && to) {
      params.set("from", from.toISOString());
      params.set("to", to.toISOString());
    } else {
      params.delete("from");
      params.delete("to");
    }
    
    router.push(`/buyer/reservations?${params.toString()}`);
  };

  const handleQuickSelect = (days: number) => {
    const to = endOfDay(new Date());
    const from = startOfDay(subDays(to, days - 1));
    
    setDate({ from, to });
    applyDateRange(from, to);
  };

  const handleReset = () => {
    setDate(undefined);
    applyDateRange(undefined, undefined);
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDate(range);
    if (range?.from && range?.to) {
      applyDateRange(range.from, range.to);
    }
  };

  return (
    <div className="space-y-3 border-b bg-background px-4 py-3">
      {/* 단축 버튼 */}
      <div className="flex flex-wrap gap-2">
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
        {date && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
          >
            전체 보기
          </Button>
        )}
      </div>

      {/* 커스텀 날짜 선택 */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "PPP", { locale: ko })} -{" "}
                    {format(date.to, "PPP", { locale: ko })}
                  </>
                ) : (
                  format(date.from, "PPP", { locale: ko })
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
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateSelect}
              numberOfMonths={1}
              locale={ko}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}


