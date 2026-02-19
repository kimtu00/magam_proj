/**
 * @file hooks/use-order-polling.ts
 * @description 주문 목록 30초 폴링 훅
 *
 * 주문 목록을 30초마다 자동으로 갱신하여 실시간 업데이트를 제공합니다.
 */

"use client";

import { useEffect, useRef } from "react";

interface UseOrderPollingOptions {
  interval?: number; // ms (기본 30초)
  enabled?: boolean; // 폴링 활성화 여부
  onPoll: () => void; // 폴링 시 실행할 함수
}

export function useOrderPolling({
  interval = 30000, // 30초
  enabled = true,
  onPoll,
}: UseOrderPollingOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // 폴링 시작
    intervalRef.current = setInterval(() => {
      onPoll();
    }, interval);

    // 클린업
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, onPoll]);

  // 수동 갱신 함수 제공
  const refresh = () => {
    onPoll();
  };

  return { refresh };
}
