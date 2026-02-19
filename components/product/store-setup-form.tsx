"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createStore } from "@/app/seller/actions";
import { AddressSearchInput } from "@/components/address/address-search-input";

/**
 * 가게 정보 등록 폼 스키마
 */
const storeFormSchema = z.object({
  name: z.string().min(1, "가게 이름을 입력해주세요.").max(100, "가게 이름은 100자 이하여야 합니다."),
  address: z.string().min(1, "가게 주소를 입력해주세요."),
  phone: z.string().optional(),
  image: z.instanceof(File).optional(),
  latitude: z.number(),
  longitude: z.number(),
});

type StoreFormData = z.infer<typeof storeFormSchema>;

/**
 * 가게 정보 등록 폼 컴포넌트
 *
 * 사장님이 최초 1회 가게 정보를 등록하는 폼입니다.
 */
export function StoreSetupForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      image: undefined,
      latitude: 0,
      longitude: 0,
    },
  });

  const imageFile = form.watch("image");

  // 이미지 미리보기
  useEffect(() => {
    if (imageFile && imageFile instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    } else {
      setPreview(null);
    }
  }, [imageFile]);

  const onSubmit = async (data: StoreFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // FormData 생성
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("address", data.address);
      if (data.phone) formData.append("phone", data.phone);
      if (data.image) formData.append("image", data.image);
      formData.append("latitude", data.latitude.toString());
      formData.append("longitude", data.longitude.toString());

      const result = await createStore(formData);

      if (!result.success) {
        setError((result as { success: false; error: string }).error || "가게 정보 등록에 실패했습니다.");
        return;
      }

      // 성공 시 페이지 새로고침 (서버 컴포넌트가 다시 렌더링되어 가게 정보 확인)
      router.refresh();
    } catch (err) {
      console.error("Error submitting store form:", err);
      setError("시스템 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">가게 정보 등록</h2>
        <p className="text-sm text-muted-foreground">
          상품을 등록하기 전에 가게 정보를 먼저 등록해주세요.
        </p>
      </div>

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
                <FormLabel>가게 이미지 (선택사항)</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {preview ? (
                      <div className="relative">
                        <img
                          src={preview}
                          alt="가게 이미지 미리보기"
                          className="w-full h-64 object-cover rounded-md border"
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

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>가게 이름 *</FormLabel>
                <FormControl>
                  <Input placeholder="예: 맛있는 떡볶이집" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>가게 주소 *</FormLabel>
                <FormControl>
                  <AddressSearchInput
                    value={field.value}
                    onAddressSelect={(address, latitude, longitude) => {
                      field.onChange(address);
                      form.setValue("latitude", latitude);
                      form.setValue("longitude", longitude);
                    }}
                    placeholder="주소를 검색해주세요"
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>가게 전화번호</FormLabel>
                <FormControl>
                  <Input placeholder="예: 031-123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "등록 중..." : "가게 정보 등록"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

