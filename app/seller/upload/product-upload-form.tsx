"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, usePathname } from "next/navigation";
import { Upload, X, Plus } from "lucide-react";
import Link from "next/link";
import { productFormSchema, type ProductFormData } from "./schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProduct } from "./actions";
import { getMenuTemplates } from "@/app/seller/menu/actions";
import type { MenuTemplateData } from "@/services/menu-template";
import { PredictionCard } from "@/components/seller/prediction-card";
import { useSellThroughPrediction } from "@/hooks/use-sell-through-prediction";

/**
 * 상품 등록 폼 컴포넌트
 *
 * 사장님이 상품을 등록하는 폼입니다.
 * - 이미지 업로드
 * - 메뉴명, 정가, 할인가, 픽업 시간 입력
 * - 바로 섭취 여부 선택
 */
export function ProductUploadForm({ storeId }: { storeId: string }) {
  // storeId는 향후 사용 예정 (현재는 getStore()로 가게 정보를 가져옴)
  void storeId;
  const router = useRouter();
  const pathname = usePathname();
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<MenuTemplateData[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("none");
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // 오늘 날짜 기본값 설정 (오늘 오후 9시)
  const getDefaultPickupDeadline = () => {
    const today = new Date();
    today.setHours(21, 0, 0, 0); // 오후 9시
    return today.toISOString();
  };

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      original_price: 0,
      discount_price: 0,
      quantity: 1,
      weight_value: undefined,
      weight_unit: "g",
      category: "기타",
      is_instant: false,
      pickup_deadline: getDefaultPickupDeadline(),
      image: undefined as any,
    },
  });

  const imageFile = form.watch("image");

  // Watch form values for real-time prediction using useWatch (prevents infinite loops)
  const category = useWatch({ control: form.control, name: "category", defaultValue: "기타" });
  const original_price = useWatch({ control: form.control, name: "original_price", defaultValue: 0 });
  const discount_price = useWatch({ control: form.control, name: "discount_price", defaultValue: 0 });
  const quantity = useWatch({ control: form.control, name: "quantity", defaultValue: 1 });
  const pickup_deadline = useWatch({ control: form.control, name: "pickup_deadline", defaultValue: "" });

  // Calculate deadline hours from pickup_deadline (memoized to prevent infinite loop)
  const deadline_hours = useMemo(() => {
    if (!pickup_deadline) return 0;
    const hours = (new Date(pickup_deadline).getTime() - Date.now()) / (1000 * 60 * 60);
    return Math.max(0, Math.round(hours * 10) / 10); // Round to 1 decimal place
  }, [pickup_deadline]);

  // Memoize prediction input to prevent infinite re-renders
  const predictionInput = useMemo(() => ({
    product_category: category || "기타",
    original_price: Number(original_price) || 0,
    discount_price: Number(discount_price) || 0,
    product_quantity: Number(quantity) || 0,
    deadline_hours: Number(deadline_hours) || 0,
  }), [category, original_price, discount_price, quantity, deadline_hours]);

  // Real-time sell-through prediction
  const { prediction, isLoading: isPredicting, error: predictionError, dataCount } = useSellThroughPrediction(predictionInput);

  // 메뉴 템플릿 로드
  useEffect(() => {
    async function loadTemplates() {
      setIsLoadingTemplates(true);
      const data = await getMenuTemplates();
      setTemplates(data);
      setIsLoadingTemplates(false);
    }
    loadTemplates();
  }, []);

  // 템플릿 선택 시 자동으로 폼 채우기
  useEffect(() => {
    if (selectedTemplateId && selectedTemplateId !== "none") {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        form.setValue("name", template.name);
        form.setValue("original_price", template.original_price);
        form.setValue("is_instant", template.is_instant);
        
        // 무게/용량 자동 채우기
        if (template.weight_value) {
          form.setValue("weight_value", template.weight_value);
        }
        if (template.weight_unit) {
          form.setValue("weight_unit", template.weight_unit as "g" | "kg");
        }
        
        // 카테고리 자동 채우기
        if (template.category) {
          form.setValue("category", template.category as "빵" | "도시락" | "음료" | "디저트" | "과일" | "채소" | "정육" | "수산물" | "반찬" | "기타");
        }
        
        // 이미지 URL이 있으면 미리보기 및 폼 값 설정
        if (template.image_url) {
          setPreview(template.image_url);
          form.setValue("image", template.image_url);
        }
      }
    } else if (selectedTemplateId === "none") {
      // "직접 입력" 선택 시 폼 초기화
      form.setValue("name", "");
      form.setValue("original_price", 0);
      form.setValue("is_instant", false);
      form.setValue("weight_value", undefined);
      form.setValue("weight_unit", "g");
      form.setValue("category", "기타");
      form.setValue("image", undefined as any);
      setPreview(null);
    }
  }, [selectedTemplateId, templates, form]);

  // 이미지 미리보기 (File이면 data URL로, URL 문자열이면 그대로 사용)
  useEffect(() => {
    if (imageFile instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    } else if (typeof imageFile === "string" && imageFile.length > 0) {
      setPreview(imageFile);
    } else {
      setPreview(null);
    }
  }, [imageFile]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // ProductFormData 객체를 FormData로 변환
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("original_price", data.original_price.toString());
      formData.append("discount_price", data.discount_price.toString());
      formData.append("quantity", data.quantity.toString());
      formData.append("is_instant", data.is_instant.toString());
      formData.append("pickup_deadline", data.pickup_deadline);

      // 무게/용량 정보
      if (data.weight_value) {
        formData.append("weight_value", data.weight_value.toString());
      }
      formData.append("weight_unit", data.weight_unit);

      // 카테고리
      formData.append("category", data.category);

      // 메뉴 템플릿 ID
      if (selectedTemplateId && selectedTemplateId !== "none") {
        formData.append("template_id", selectedTemplateId);
      }

      // 이미지 처리
      if (data.image instanceof File) {
        formData.append("image", data.image);
      } else if (selectedTemplateId && selectedTemplateId !== "none") {
        // 템플릿 이미지 URL 사용
        const template = templates.find((t) => t.id === selectedTemplateId);
        if (template?.image_url) {
          formData.append("image", template.image_url);
        }
      }

      const result = await createProduct(formData);

      if (!result.success) {
        setError((result as { success: false; error: string }).error);
        return;
      }

      // 성공 시 적절한 페이지로 이동 (레이아웃에 따라 분기)
      const isStoreAdmin = pathname.startsWith("/store-admin");
      router.push(isStoreAdmin ? "/store-admin/products" : "/seller/dashboard");
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
          {/* 메뉴 템플릿 선택 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">메뉴 선택 (선택사항)</label>
            {isLoadingTemplates ? (
              <p className="text-sm text-muted-foreground">메뉴 불러오는 중...</p>
            ) : templates.length > 0 ? (
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="메뉴를 선택하면 자동으로 입력됩니다" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">직접 입력</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.original_price.toLocaleString()}원)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  등록된 메뉴가 없습니다
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href="/seller/menu">
                    <Plus className="h-4 w-4 mr-2" />
                    메뉴 먼저 등록하기
                  </Link>
                </Button>
              </div>
            )}
          </div>

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
                            form.setValue("image", undefined as any);
                          }}
                        >
                          <X className="size-4" />
                        </Button>
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
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        field.onChange(1);
                      } else {
                        const numValue = parseInt(value, 10);
                        if (!isNaN(numValue) && numValue >= 1) {
                          field.onChange(numValue);
                        }
                      }
                    }}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  판매할 수량을 입력하세요 (최대 999개)
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

          {/* 카테고리 */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>카테고리</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="빵">🍞 빵</SelectItem>
                    <SelectItem value="도시락">🍱 도시락</SelectItem>
                    <SelectItem value="음료">🥤 음료</SelectItem>
                    <SelectItem value="디저트">🍰 디저트</SelectItem>
                    <SelectItem value="과일">🍎 과일</SelectItem>
                    <SelectItem value="채소">🥬 채소</SelectItem>
                    <SelectItem value="정육">🥩 정육</SelectItem>
                    <SelectItem value="수산물">🐟 수산물</SelectItem>
                    <SelectItem value="반찬">🍲 반찬</SelectItem>
                    <SelectItem value="기타">📦 기타</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  상품의 카테고리를 선택하세요 (데이터 분석용)
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

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

          {/* AI 소진율 예측 카드 */}
          {dataCount > 0 && dataCount < 1000 ? (
            /* 데이터 수집 중 안내만 표시 (예측 기능 비활성화) */
            <PredictionCard
              prediction={null}
              isLoading={false}
              error={null}
              dataCount={dataCount}
            />
          ) : dataCount >= 1000 && (category && original_price > 0 && discount_price > 0 && quantity > 0 && pickup_deadline) ? (
            /* 예측 기능 활성화 */
            <PredictionCard
              prediction={prediction}
              isLoading={isPredicting}
              error={predictionError}
              dataCount={dataCount}
            />
          ) : null}

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
              {isSubmitting ? "등록 중..." : "상품 등록"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

