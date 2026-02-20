/**
 * @file lib/constants/carbon.ts
 * @description 탄소 절감량 계산 관련 상수
 * 
 * 음식물 폐기 방지로 인한 CO2 절감량을 계산하기 위한 환산 계수입니다.
 * IPCC 및 환경부 기준을 참고하여 설정되었습니다.
 */

/**
 * 기본 CO2 환산 계수
 * 
 * 음식물 1g 폐기 시 발생하는 CO2 배출량입니다.
 * 즉, 음식물 1g을 구매하여 폐기를 방지하면 2.5g의 CO2를 절감한 것으로 계산합니다.
 * 
 * @constant
 * @type {number}
 * @default 2.5
 * 
 * @example
 * ```typescript
 * const foodWeight = 100; // 100g
 * const co2Saved = foodWeight * CO2_FACTOR; // 250g CO2 절감
 * ```
 */
export const CO2_FACTOR = 2.5;

/**
 * 카테고리별 CO2 환산 계수 (향후 확장용)
 * 
 * 음식물 카테고리별로 차등화된 CO2 환산 계수를 적용할 수 있습니다.
 * 현재는 default 값만 사용되며, 향후 상품 카테고리 기능이 추가되면
 * 빵류, 과일류, 채소류 등으로 세분화할 수 있습니다.
 * 
 * @constant
 * @type {Record<string, number>}
 * 
 * @example
 * ```typescript
 * // 향후 확장 예시
 * const CO2_FACTORS_BY_CATEGORY = {
 *   default: 2.5,
 *   bread: 2.5,    // 빵류
 *   fruit: 1.8,    // 과일류
 *   vegetable: 2.0, // 채소류
 *   meat: 3.5,     // 육류
 * };
 * 
 * const category = product.category || 'default';
 * const co2Factor = CO2_FACTORS_BY_CATEGORY[category];
 * const co2Saved = foodWeight * co2Factor;
 * ```
 */
export const CO2_FACTORS_BY_CATEGORY: Record<string, number> = {
  default: CO2_FACTOR,
  // 향후 카테고리별 계수 추가 시:
  // bread: 2.5,
  // fruit: 1.8,
  // vegetable: 2.0,
  // meat: 3.5,
};

/**
 * 특정 카테고리의 CO2 환산 계수를 가져옵니다.
 * 
 * @param category - 상품 카테고리 (선택사항)
 * @returns CO2 환산 계수 (g CO2 per g food)
 * 
 * @example
 * ```typescript
 * const factor = getCO2Factor('bread'); // 2.5
 * const factor = getCO2Factor(); // 2.5 (default)
 * ```
 */
export function getCO2Factor(category?: string): number {
  if (!category) {
    return CO2_FACTOR;
  }
  
  return CO2_FACTORS_BY_CATEGORY[category] || CO2_FACTOR;
}
