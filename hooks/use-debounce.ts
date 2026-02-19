import { useEffect, useState, useRef, useMemo } from "react";

/**
 * Debounce hook
 * 
 * 값이 변경된 후 지정된 시간(ms) 동안 추가 변경이 없을 때만 값을 업데이트합니다.
 * 객체의 경우 JSON.stringify로 비교하여 무한 루프를 방지합니다.
 * 
 * @param value - 디바운스할 값
 * @param delay - 지연 시간 (밀리초)
 * @returns 디바운스된 값
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  // 객체를 문자열로 변환 (메모이제이션)
  const stringifiedValue = useMemo(() => {
    return typeof value === 'object' && value !== null 
      ? JSON.stringify(value)
      : String(value);
  }, [typeof value === 'object' && value !== null ? JSON.stringify(value) : value]);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [stringifiedValue, delay]);

  return debouncedValue;
}
