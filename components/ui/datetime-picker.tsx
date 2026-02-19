"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  showTime?: boolean; // 시간 선택 UI 표시 여부 (기본값: true)
}

export function DateTimePicker({
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  showTime = true,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value);
  const [selectedHour, setSelectedHour] = React.useState<string>(
    value ? String(value.getHours()).padStart(2, "0") : "09"
  );
  const [selectedMinute, setSelectedMinute] = React.useState<string>(
    value ? String(Math.floor(value.getMinutes() / 15) * 15).padStart(2, "0") : "00"
  );

  // 15분 단위 시간 옵션 생성
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  // 날짜나 시간이 변경되면 부모 컴포넌트에 알림
  React.useEffect(() => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      if (showTime) {
        newDate.setHours(parseInt(selectedHour));
        newDate.setMinutes(parseInt(selectedMinute));
      } else {
        // 시간 표시 안할 때는 00:00:00으로 설정
        newDate.setHours(0, 0, 0, 0);
      }
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      onChange(newDate);
    } else {
      onChange(undefined);
    }
  }, [selectedDate, selectedHour, selectedMinute, onChange, showTime]);

  return (
    <div className="flex items-center gap-2 w-full">
      {/* 날짜 선택 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, "PPP", { locale: ko })
            ) : (
              <span>날짜를 선택하세요</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 z-50" 
          align="start" 
          side="bottom"
          sideOffset={4}
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => {
              // 최소 날짜보다 이전 날짜 비활성화
              if (minDate && date < minDate) {
                return true;
              }
              // 최대 날짜보다 이후 날짜 비활성화
              if (maxDate) {
                const maxDateOnly = new Date(maxDate);
                maxDateOnly.setHours(23, 59, 59, 999);
                if (date > maxDateOnly) {
                  return true;
                }
              }
              return false;
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* 시간 선택 (showTime이 true일 때만 표시) */}
      {showTime && (
        <div className="flex gap-2">
          <Select value={selectedHour} onValueChange={setSelectedHour} disabled={disabled}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="시" />
            </SelectTrigger>
            <SelectContent>
              {hours
                .filter((hour) => {
                  // maxDate가 있고 선택된 날짜가 maxDate와 같은 날인 경우
                  if (maxDate && selectedDate) {
                    const isSameDay = 
                      selectedDate.getFullYear() === maxDate.getFullYear() &&
                      selectedDate.getMonth() === maxDate.getMonth() &&
                      selectedDate.getDate() === maxDate.getDate();
                    
                    if (isSameDay) {
                      return parseInt(hour) <= maxDate.getHours();
                    }
                  }
                  return true;
                })
                .map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {hour}시
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select value={selectedMinute} onValueChange={setSelectedMinute} disabled={disabled}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="분" />
            </SelectTrigger>
            <SelectContent>
              {minutes
                .filter((minute) => {
                  // maxDate가 있고 선택된 날짜가 maxDate와 같은 날이고 같은 시간인 경우
                  if (maxDate && selectedDate) {
                    const isSameDay = 
                      selectedDate.getFullYear() === maxDate.getFullYear() &&
                      selectedDate.getMonth() === maxDate.getMonth() &&
                      selectedDate.getDate() === maxDate.getDate();
                    
                    const isSameHour = parseInt(selectedHour) === maxDate.getHours();
                    
                    if (isSameDay && isSameHour) {
                      return parseInt(minute) <= maxDate.getMinutes();
                    }
                  }
                  return true;
                })
                .map((minute) => (
                  <SelectItem key={minute} value={minute}>
                    {minute}분
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

