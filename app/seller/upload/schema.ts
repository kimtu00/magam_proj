import { z } from "zod";

/**
 * 상품 등록 폼 스키마
 *
 * Zod를 사용한 폼 검증 스키마입니다.
 * react-hook-form과 함께 사용됩니다.
 */
export const productFormSchema = z
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
    category: z
      .enum(["빵", "도시락", "음료", "디저트", "과일", "채소", "정육", "수산물", "반찬", "기타"], {
        errorMap: () => ({ message: "카테고리를 선택해주세요." })
      })
      .default("기타"),
    is_instant: z.boolean().default(false),
    pickup_deadline: z
      .string()
      .min(1, "픽업 마감 시간을 선택해주세요.")
      .refine(
        (date) => {
          const selectedDate = new Date(date);
          const now = new Date();
          // 초와 밀리초를 제거하여 분 단위로만 비교
          selectedDate.setSeconds(0, 0);
          now.setSeconds(0, 0);
          return selectedDate > now;
        },
        {
          message: "픽업 마감 시간은 현재 시간보다 미래여야 합니다.",
        }
      ),
    image: z
      .union(
        [
          z
            .instanceof(File, { message: "이미지를 선택해주세요." })
            .refine(
              (file) => file.size <= 5 * 1024 * 1024,
              "파일 크기는 5MB를 초과할 수 없습니다."
            )
            .refine(
              (file) =>
                ["image/jpeg", "image/png", "image/webp"].includes(file.type),
              "JPEG, PNG, WebP 형식의 이미지만 업로드할 수 있습니다."
            ),
          z.string().min(1, "이미지를 선택해주세요.").url("이미지를 선택해주세요."),
        ],
        { errorMap: () => ({ message: "이미지를 선택해주세요." }) }
      ),
  })
  .refine(
    (data) => data.discount_price < data.original_price,
    {
      message: "할인가는 정가보다 작아야 합니다.",
      path: ["discount_price"],
    }
  );

export type ProductFormData = z.infer<typeof productFormSchema>;

