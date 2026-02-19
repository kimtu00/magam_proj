import { z } from "zod";

/**
 * 상품 수정 폼 스키마
 *
 * 이미지는 선택사항입니다 (기존 이미지 유지 가능).
 */
export const productEditFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "메뉴명을 입력해주세요.")
      .max(100, "메뉴명은 100자 이하여야 합니다."),
    original_price: z
      .number()
      .int("정가는 정수여야 합니다.")
      .min(1, "정가는 1원 이상이어야 합니다.")
      .max(1000000, "정가는 1,000,000원 이하여야 합니다."),
    discount_price: z
      .number()
      .int("할인가는 정수여야 합니다.")
      .min(1, "할인가는 1원 이상이어야 합니다.")
      .max(1000000, "할인가는 1,000,000원 이하여야 합니다."),
    quantity: z
      .number()
      .int("수량은 정수여야 합니다.")
      .min(1, "수량은 1개 이상이어야 합니다.")
      .max(999, "수량은 999개 이하여야 합니다."),
    weight_value: z
      .number()
      .min(0.01, "무게는 0보다 커야 합니다.")
      .max(99999, "무게가 너무 큽니다.")
      .optional(),
    weight_unit: z
      .enum(["g", "kg"], { 
        errorMap: () => ({ message: "단위를 선택해주세요." }) 
      })
      .default("g"),
    is_instant: z.boolean().default(false),
    pickup_deadline: z
      .string()
      .min(1, "픽업 마감 시간을 선택해주세요.")
      .refine(
        (date) => {
          const selectedDate = new Date(date);
          const now = new Date();
          return selectedDate > now;
        },
        {
          message: "픽업 마감 시간은 현재 시간보다 미래여야 합니다.",
        }
      ),
    image: z
      .union([
        z.instanceof(File, { message: "이미지를 선택해주세요." }),
        z.string(), // 기존 이미지 URL
      ])
      .optional()
      .refine(
        (file) => {
          if (!file) return true; // 선택사항이므로 없어도 됨
          if (typeof file === "string") return true; // 기존 이미지 URL
          return file.size <= 5 * 1024 * 1024; // 새 파일인 경우 크기 체크
        },
        "파일 크기는 5MB를 초과할 수 없습니다."
      )
      .refine(
        (file) => {
          if (!file) return true;
          if (typeof file === "string") return true; // 기존 이미지 URL
          return ["image/jpeg", "image/png", "image/webp"].includes(
            file.type
          );
        },
        "JPEG, PNG, WebP 형식의 이미지만 업로드할 수 있습니다."
      ),
  })
  .refine(
    (data) => data.discount_price < data.original_price,
    {
      message: "할인가는 정가보다 작아야 합니다.",
      path: ["discount_price"],
    }
  );

export type ProductEditFormData = z.infer<typeof productEditFormSchema>;

