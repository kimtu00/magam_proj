"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMenuTemplate, updateMenuTemplate } from "./actions";
import { uploadProductImage } from "@/lib/storage/upload-product-image";
import type { MenuTemplateData } from "@/services/menu-template";

/**
 * 메뉴 템플릿 폼 스키마
 */
const menuTemplateFormSchema = z.object({
  name: z.string().min(1, "메뉴명을 입력해주세요").max(100),
  original_price: z.number().min(1, "정가를 입력해주세요"),
  is_instant: z.boolean().default(false),
  weight_value: z.number().optional(),
  weight_unit: z.enum(["g", "kg", "ml", "L"]).default("g"),
  category: z.enum([
    "빵",
    "도시락",
    "음료",
    "디저트",
    "과일",
    "채소",
    "정육",
    "수산물",
    "반찬",
    "기타"
  ]).default("기타"),
  image: z.any().optional(),
});

type MenuTemplateFormData = z.infer<typeof menuTemplateFormSchema>;

interface MenuTemplateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  template?: MenuTemplateData; // 수정 모드용
}

/**
 * 메뉴 템플릿 추가/수정 폼
 */
export function MenuTemplateForm({
  open,
  onOpenChange,
  onSuccess,
  template,
}: MenuTemplateFormProps) {
  const isEditMode = !!template;
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<MenuTemplateFormData>({
    resolver: zodResolver(menuTemplateFormSchema),
    defaultValues: {
      name: template?.name || "",
      original_price: template?.original_price || 0,
      is_instant: template?.is_instant || false,
      weight_value: template?.weight_value || undefined,
      weight_unit: (template?.weight_unit as "g" | "kg" | "ml" | "L") || "g",
      category: (template?.category as "빵" | "도시락" | "음료" | "디저트" | "과일" | "채소" | "정육" | "수산물" | "반찬" | "기타") || "기타",
      image: undefined,
    },
  });

  const imageFile = form.watch("image");

  // 수정 모드일 때 기존 이미지 표시
  useEffect(() => {
    if (template?.image_url && !imageFile) {
      setPreview(template.image_url);
    }
  }, [template, imageFile]);

  // 이미지 미리보기
  useEffect(() => {
    if (imageFile && imageFile instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    } else if (!template?.image_url) {
      // 수정 모드가 아니거나 기존 이미지가 없을 때만 초기화
      setPreview(null);
    }
  }, [imageFile, template]);

  // 다이얼로그 닫을 때 폼 리셋
  useEffect(() => {
    if (!open) {
      form.reset({
        name: template?.name || "",
        original_price: template?.original_price || 0,
        is_instant: template?.is_instant || false,
        weight_value: template?.weight_value || undefined,
        weight_unit: (template?.weight_unit as "g" | "kg" | "ml" | "L") || "g",
        category: (template?.category as "빵" | "도시락" | "음료" | "디저트" | "과일" | "채소" | "정육" | "수산물" | "반찬" | "기타") || "기타",
        image: undefined,
      });
      setPreview(template?.image_url || null);
      setError(null);
    }
  }, [open, form, template]);

  const onSubmit = async (data: MenuTemplateFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // 1. 이미지 업로드 (새 이미지 파일이 있는 경우)
      let imageUrl: string | undefined = template?.image_url; // 기존 이미지 URL 유지
      
      if (data.image && data.image instanceof File) {
        const uploadResult = await uploadProductImage(data.image);
        
        if (!uploadResult.success || !uploadResult.url) {
          setError("이미지 업로드에 실패했습니다.");
          return;
        }
        
        imageUrl = uploadResult.url;
      }

      // 2. 메뉴 템플릿 생성 또는 수정
      const result = isEditMode
        ? await updateMenuTemplate(template.id, {
            name: data.name,
            original_price: data.original_price,
            is_instant: data.is_instant,
            weight_value: data.weight_value,
            weight_unit: data.weight_unit,
            category: data.category,
            image_url: imageUrl,
          })
        : await createMenuTemplate({
            name: data.name,
            original_price: data.original_price,
            is_instant: data.is_instant,
            weight_value: data.weight_value,
            weight_unit: data.weight_unit,
            category: data.category,
            image_url: imageUrl,
          });

      if (!result.success) {
        setError((result as { success: false; error: string }).error || `메뉴 템플릿 ${isEditMode ? '수정' : '생성'}에 실패했습니다.`);
        return;
      }

      // 3. 성공
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("시스템 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "메뉴 수정" : "메뉴 추가"}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "메뉴 정보를 수정하세요."
              : "자주 판매하는 메뉴를 등록하세요. 할인 상품 등록 시 빠르게 선택할 수 있습니다."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* 이미지 업로드 */}
              <FormField
                control={form.control}
                name="image"
                render={({ field: { onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>메뉴 이미지</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {preview ? (
                          <div className="relative">
                            <img
                              src={preview}
                              alt="메뉴 미리보기"
                              className="w-full h-48 object-cover rounded-md border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setPreview(null);
                                form.setValue("image", undefined);
                              }}
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-md cursor-pointer hover:bg-accent/50 transition-colors">
                            <div className="flex flex-col items-center justify-center">
                              <Upload className="size-8 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">
                                이미지 선택
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
                    <FormLabel>메뉴명 *</FormLabel>
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
                    <FormLabel>정가 (원) *</FormLabel>
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
                        조리 없이 바로 먹을 수 있는 메뉴
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {/* 무게/용량 */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="weight_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>무게/용량</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="예: 500"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value ? parseFloat(e.target.value) : undefined;
                            field.onChange(value);
                          }}
                          value={field.value || ""}
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="단위 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="g">g (그램)</SelectItem>
                          <SelectItem value="kg">kg (킬로그램)</SelectItem>
                          <SelectItem value="ml">ml (밀리리터)</SelectItem>
                          <SelectItem value="L">L (리터)</SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 제출 버튼 */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? `${isEditMode ? "수정" : "등록"} 중...` 
                    : `메뉴 ${isEditMode ? "수정" : "추가"}`
                  }
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

