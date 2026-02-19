/**
 * @file prediction.service.ts
 * @description 마감 소진율 예측 데이터 수집 서비스
 * 
 * 주요 기능:
 * 1. collectForProduct: 단일 상품의 학습 데이터 수집
 * 2. collectBatch: 마감된 상품들의 데이터 일괄 수집
 * 3. getStats: 수집된 학습 데이터 통계 조회
 * 
 * 핵심 로직:
 * - DB 함수 호출로 피처 계산 및 저장
 * - 소진율 = 판매된 수량 / 등록 수량
 * - 마감 지난 상품만 수집
 * 
 * @dependencies
 * - @/lib/supabase/service-role: RLS 우회 클라이언트
 * - ./prediction.types: 타입 정의
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  PredictionTrainingData,
  CollectionBatchResult,
  TrainingDataStats,
} from "./prediction.types";

export class PredictionService {
  /**
   * 단일 상품의 학습 데이터 수집
   * 
   * @param productId - 상품 ID
   * @returns 수집 성공 여부
   */
  static async collectForProduct(productId: string): Promise<boolean> {
    try {
      const supabase = getServiceRoleClient();

      console.log("📊 학습 데이터 수집 시작:", productId);

      // DB 함수 호출로 수집
      const { error } = await supabase.rpc("collect_training_data_for_product", {
        p_product_id: productId,
      });

      if (error) {
        console.error("학습 데이터 수집 실패:", error);
        return false;
      }

      console.log("✓ 학습 데이터 수집 완료:", productId);
      return true;
    } catch (error) {
      console.error("collectForProduct error:", error);
      return false;
    }
  }

  /**
   * 마감된 상품들의 학습 데이터 일괄 수집
   * 
   * @returns 수집 결과 (수집/스킵/에러 건수)
   */
  static async collectBatch(): Promise<CollectionBatchResult> {
    try {
      const supabase = getServiceRoleClient();

      console.log("📊 학습 데이터 일괄 수집 시작...");

      // DB 함수 호출
      const { data, error } = await supabase.rpc("collect_training_data_batch");

      if (error) {
        console.error("일괄 수집 실패:", error);
        throw error;
      }

      const result = (data as any)?.[0] || {
        collected_count: 0,
        skipped_count: 0,
        error_count: 0,
      };

      console.log("✓ 학습 데이터 일괄 수집 완료:", result);
      return result;
    } catch (error) {
      console.error("collectBatch error:", error);
      throw error;
    }
  }

  /**
   * 수집된 학습 데이터 통계 조회
   * 
   * @returns 학습 데이터 통계
   */
  static async getStats(): Promise<TrainingDataStats> {
    try {
      const supabase = getServiceRoleClient();

      // 전체 레코드 수 및 평균 소진율
      const { data: summary, error: summaryError } = await supabase
        .from("prediction_training_data")
        .select("sell_through_rate, recorded_at");

      if (summaryError) {
        throw summaryError;
      }

      const records = summary || [];
      const totalRecords = records.length;
      const avgSellThroughRate =
        totalRecords > 0
          ? records.reduce((sum, r) => sum + r.sell_through_rate, 0) / totalRecords
          : 0;

      // 카테고리별 분포
      const { data: categoryData } = await supabase
        .from("prediction_training_data")
        .select("product_category");

      const categoryCount: Record<string, number> = {};
      (categoryData || []).forEach((r) => {
        const cat = r.product_category || "알 수 없음";
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      // 시간대별 분포
      const { data: timeSlotData } = await supabase
        .from("prediction_training_data")
        .select("time_slot");

      const timeSlotCount: Record<string, number> = {};
      (timeSlotData || []).forEach((r) => {
        const slot = r.time_slot || "알 수 없음";
        timeSlotCount[slot] = (timeSlotCount[slot] || 0) + 1;
      });

      // 날짜 범위
      const dates = records
        .map((r) => new Date(r.recorded_at).getTime())
        .filter((t) => !isNaN(t));
      const earliest =
        dates.length > 0
          ? new Date(Math.min(...dates)).toISOString()
          : new Date().toISOString();
      const latest =
        dates.length > 0
          ? new Date(Math.max(...dates)).toISOString()
          : new Date().toISOString();

      return {
        total_records: totalRecords,
        avg_sell_through_rate: Math.round(avgSellThroughRate * 10000) / 10000,
        records_by_category: categoryCount,
        records_by_time_slot: timeSlotCount,
        date_range: {
          earliest,
          latest,
        },
      };
    } catch (error) {
      console.error("getStats error:", error);
      throw error;
    }
  }

  /**
   * 모든 학습 데이터 조회 (CSV 내보내기용)
   * 
   * @param limit - 최대 조회 건수 (기본값: 10000)
   * @returns 학습 데이터 배열
   */
  static async getAllTrainingData(
    limit: number = 10000
  ): Promise<PredictionTrainingData[]> {
    try {
      const supabase = getServiceRoleClient();

      const { data, error } = await supabase
        .from("prediction_training_data")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("getAllTrainingData error:", error);
      throw error;
    }
  }
}
