/**
 * @file components/shared/store-edit-form.tsx
 * @description 가게 정보 수정 폼 (seller/store-admin 공용)
 *
 * 주요 기능:
 * - 가게 이미지 업로드/삭제
 * - 가게 이름, 주소, 전화번호 수정
 * - 주소 검색 (Kakao Maps)
 *
 * @dependencies
 * - react-hook-form + zod: 폼 관리 및 유효성 검사
 * - AddressSearchInput: 주소 검색 컴포넌트
 * - onUpdate prop: 실제 저장 액션 (seller/store-admin 각각 주입)
 */

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { AddressSearchInput } from "@/components/address/address-search-input";
import type { StoreData } from "@/services/store";

const storeEditFormSchema = z.object({
  name: z
    .string()
    .min(1, "가게 이름을 입력해주세요.")
    .max(100, "가게 이름은 100자 이하여야 합니다."),
  address: z.string().min(1, "가게 주소를 입력해주세요."),
  phone: z.string().optional(),
  image: z.instanceof(File).optional(),
  latitude: z.number(),
  longitude: z.number(),
});

type StoreEditFormData = z.infer<typeof storeEditFormSchema>;

type UpdateStoreResult =
  | { success: true; store?: unknown }
  | { success: false; error: string };

interface StoreEditFormProps {
  store: StoreData;
  /** 가게 정보를 저장하는 서버 액션 (seller/store-admin에서 각각 주입) */
  onUpdate: (formData: FormData) => Promise<UpdateStoreResult>;
}

/**
 * 가게 정보 수정 폼 컴포넌트 (공용)
 *
 * seller 설정 페이지와 store-admin 프로필 페이지에서 공유합니다.
 * 실제 저장 액션은 onUpdate prop으로 외부에서 주입받습니다.
 */
export function StoreEditForm({ store, onUpdate }: StoreEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(store.image_url || null);
  const [deleteImage, setDeleteImage] = useState(false);

  const form = useForm<StoreEditFormData>({
    resolver: zodResolver(storeEditFormSchema),
    defaultValues: {
      name: store.name || "",
      address: store.address || "",
      phone: store.phone || "",
      image: undefined,
      latitude: store.latitude || 0,
      longitude: store.longitude || 0,
    },
  });

  const imageFile = form.watch("image");

  useEffect(() => {
    if (imageFile && imageFile instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setDeleteImage(false);
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  const onSubmit = async (data: StoreEditFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const formData = new FormData();
      formData.append("storeId", store.id);
      formData.append("name", data.name);
      formData.append("address", data.address);
      if (data.phone) formData.append("phone", data.phone);
      if (data.image) formData.append("image", data.image);
      if (deleteImage) formData.append("deleteImage", "true");
      formData.append("latitude", data.latitude.toString());
      formData.append("longitude", data.longitude.toString());

      const result = await onUpdate(formData);

      if (!result.success) {
        setError((result as { success: false; error: string }).error || "가게 정보 수정에 실패했습니다.");
        return;
      }

      setSuccessMessage("가게 정보가 성공적으로 수정되었습니다!");

      setTimeout(() => {
        router.refresh();
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      console.error("Error submitting store edit form:", err);
      setError("시스템 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="rounded-md bg-secondary border border-primary/20 p-3 text-sm text-primary">
          {successMessage}
        </div>
      )}

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
                    {preview && !deleteImage ? (
                      <div className="relative">
                        <img
                          src={preview}
                          alt="가게 이미지"
                          className="w-full h-64 object-cover rounded-md border"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "image/jpeg,image/png,image/webp";
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) {
                                  onChange(file);
                                }
                              };
                              input.click();
                            }}
                          >
                            변경
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              setPreview(null);
                              setDeleteImage(true);
                              form.setValue("image", undefined);
                            }}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
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
                              setDeleteImage(false);
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
            {isSubmitting ? "수정 중..." : "가게 정보 수정"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
