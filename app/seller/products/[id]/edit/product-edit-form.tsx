"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { productEditFormSchema, type ProductEditFormData } from "./schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { updateProduct } from "./actions";
import type { ProductData } from "@/app/seller/actions";

/**
 * 상품 수정 폼 컴포넌트
 *
 * 사장님이 상품을 수정하는 폼입니다.
 * - 기존 상품 정보를 초기값으로 설정
 * - 이미지는 선택사항 (기존 이미지 유지 가능)
 * - 메뉴명, 정가, 할인가, 픽업 시간 수정 가능
 * - 바로 섭취 여부 수정 가능
 */
export function ProductEditForm({
  product,
  redirectPath = "/seller/dashboard",
}: {
  product: ProductData;
  redirectPath?: string;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(product.image_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNewImage, setHasNewImage] = useState(false);

  const form = useForm<ProductEditFormData>({
    resolver: zodResolver(productEditFormSchema),
    defaultValues: {
      name: product.name ?? "",
      original_price: product.original_price ?? 0,
      discount_price: product.discount_price ?? 0,
      quantity: product.quantity ?? 1,
      weight_value: product.weight_value ?? undefined,
      weight_unit: product.weight_unit ?? "g",
      is_instant: product.is_instant ?? false,
      pickup_deadline: product.pickup_deadline ?? "",
      image: product.image_url || undefined,
    },
  });

  const imageFile = form.watch("image");

  // 이미지 미리보기
  useEffect(() => {
    if (imageFile && imageFile instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setHasNewImage(true);
      };
      reader.readAsDataURL(imageFile);
    } else if (typeof imageFile === "string") {
      setPreview(imageFile);
      setHasNewImage(false);
    } else {
      setPreview(null);
      setHasNewImage(false);
    }
  }, [imageFile]);

  const onSubmit = async (data: ProductEditFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const result = await updateProduct(product.id, data);

      if (!result.success) {
        setError("error" in result ? result.error : "상품 수정에 실패했습니다.");
        return;
      }

      // 성공 시 이동
      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("시스템 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 이미지 업로드 */}
          <FormField
            control={form.control}
            name="image"
            render={({ field: { onChange, ...field } }) => (
              <FormItem>
                <FormLabel>상품 이미지</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {preview ? (
                      <div className="relative">
                        <img
                          src={preview}
                          alt="상품 미리보기"
                          className="w-full h-64 object-cover rounded-md border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setPreview(null);
                            setHasNewImage(false);
                            form.setValue("image", undefined);
                          }}
                        >
                          <X className="size-4" />
                        </Button>
                        {!hasNewImage && (
                          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            기존 이미지
                          </div>
                        )}
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-md cursor-pointer hover:bg-accent/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="size-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            이미지를 선택하거나 드래그하세요
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPEG, PNG, WebP (최대 5MB)
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            (선택사항 - 기존 이미지를 유지하려면 비워두세요)
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onChange(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 메뉴명 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>메뉴명</FormLabel>
                <FormControl>
                  <Input placeholder="예: 떡볶이 세트" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 정가 */}
          <FormField
            control={form.control}
            name="original_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>정가 (원)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="예: 15000"
                    {...field}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10) || 0;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 할인가 */}
          <FormField
            control={form.control}
            name="discount_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>할인가 (원)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="예: 10000"
                    {...field}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10) || 0;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 수량 */}
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>수량</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="999"
                    placeholder="예: 10"
                    {...field}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10) || 1;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  현재 재고: {product.quantity}개 (수량은 증가만 가능합니다)
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 무게 */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="weight_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>무게 (선택사항)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="예: 250"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? undefined : Number(val));
                      }}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight_unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>단위</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="g">g (그램)</SelectItem>
                      <SelectItem value="kg">kg (킬로그램)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 바로 섭취 여부 */}
          <FormField
            control={form.control}
            name="is_instant"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="cursor-pointer">
                    바로 섭취 가능
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    조리 없이 바로 먹을 수 있는 상품인 경우 체크하세요
                  </p>
                </div>
              </FormItem>
            )}
          />

          {/* 픽업 마감 시간 */}
          <FormField
            control={form.control}
            name="pickup_deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>픽업 마감 시간</FormLabel>
                <FormControl>
                  <DateTimePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) => {
                      field.onChange(date ? date.toISOString() : "");
                    }}
                    minDate={new Date()}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 제출 버튼 */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "수정 중..." : "상품 수정"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

