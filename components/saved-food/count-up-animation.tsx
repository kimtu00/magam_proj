/**
 * @file components/saved-food/count-up-animation.tsx
 * @description 숫자 카운트업 애니메이션 컴포넌트
 * 
 * 0부터 목표값까지 부드럽게 증가하는 애니메이션을 제공합니다.
 */

"use client";

import { useEffect, useState } from "react";

interface CountUpAnimationProps {
  /** 최종 목표 값 */
  targetValue: number;
  /** 애니메이션 지속 시간 (ms) */
  duration?: number;
  /** 소수점 자리수 */
  decimals?: number;
}

/**
 * 숫자 카운트업 애니메이션 컴포넌트
 * 
 * @example
 * ```tsx
 * <CountUpAnimation targetValue={350} duration={1000} />
 * ```
 */
export function CountUpAnimation({
  targetValue,
  duration = 1000,
  decimals = 0,
}: CountUpAnimationProps) {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    // 목표값이 0이면 애니메이션 없이 바로 0 표시
    if (targetValue === 0) {
      setCurrentValue(0);
      return;
    }

    // 시작 시간 기록
    const startTime = Date.now();
    const startValue = 0;
    const change = targetValue - startValue;

    // easeOutQuad 함수: 부드러운 감속 효과
    const easeOutQuad = (t: number): number => {
      return t * (2 - t);
    };

    // 애니메이션 프레임
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1); // 0 ~ 1

      // easing 적용
      const easedProgress = easeOutQuad(progress);
      const newValue = startValue + change * easedProgress;

      setCurrentValue(newValue);

      // 애니메이션이 끝나지 않았으면 다음 프레임 요청
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // 애니메이션 완료: 정확한 목표값으로 설정
        setCurrentValue(targetValue);
      }
    };

    // 애니메이션 시작
    const animationId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [targetValue, duration]);

  // 소수점 처리
  const displayValue = decimals > 0
    ? currentValue.toFixed(decimals)
    : Math.round(currentValue).toString();

  return <span>{displayValue}</span>;
}
