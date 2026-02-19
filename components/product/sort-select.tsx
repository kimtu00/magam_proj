"use client";

import { ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortOption = 
  | "newest"           // 최신순 (기본)
  | "discount_desc"    // 할인율 높은순
  | "discount_asc"     // 할인율 낮은순
  | "price_desc"       // 가격 높은순
  | "price_asc";       // 가격 낮은순

interface SortSelectProps {
  value: SortOption;
  onValueChange: (value: SortOption) => void;
}

/**
 * 상품 정렬 선택 컴포넌트
 *
 * 할인율, 가격에 따른 오름차순/내림차순 정렬을 선택할 수 있습니다.
 */
export function SortSelect({ value, onValueChange }: SortSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[160px] h-9">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4" />
          <SelectValue placeholder="정렬" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">
          <div className="flex items-center gap-2">
            <span>최신순</span>
          </div>
        </SelectItem>
        <SelectItem value="discount_desc">
          <div className="flex items-center gap-2">
            <ArrowDown className="h-4 w-4" />
            <span>할인율 높은순</span>
          </div>
        </SelectItem>
        <SelectItem value="discount_asc">
          <div className="flex items-center gap-2">
            <ArrowUp className="h-4 w-4" />
            <span>할인율 낮은순</span>
          </div>
        </SelectItem>
        <SelectItem value="price_desc">
          <div className="flex items-center gap-2">
            <ArrowDown className="h-4 w-4" />
            <span>가격 높은순</span>
          </div>
        </SelectItem>
        <SelectItem value="price_asc">
          <div className="flex items-center gap-2">
            <ArrowUp className="h-4 w-4" />
            <span>가격 낮은순</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}


