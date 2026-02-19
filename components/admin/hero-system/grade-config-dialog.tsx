"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const gradeConfigSchema = z.object({
  grade_level: z.number().int().min(0, "등급 레벨은 0 이상이어야 합니다"),
  grade_name: z.string().min(1, "등급 이름은 필수입니다"),
  grade_emoji: z.string().optional(),
  required_pickups: z.number().int().min(0, "픽업 횟수는 0 이상이어야 합니다"),
  required_weight_kg: z.number().min(0, "무게는 0 이상이어야 합니다"),
  condition_type: z.enum(["OR", "AND"], {
    required_error: "조건 타입은 필수입니다",
  }),
  tree_image_url: z.string().url("올바른 URL을 입력하세요").optional().or(z.literal("")),
});

type GradeConfigFormData = z.infer<typeof gradeConfigSchema>;

interface GradeConfig {
  id: number;
  grade_level: number;
  grade_name: string;
  grade_emoji: string | null;
  required_pickups: number;
  required_weight_kg: number;
  condition_type: "OR" | "AND";
  tree_image_url: string | null;
  is_active: boolean;
}

interface GradeConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: GradeConfig | null;
  onSuccess: () => void;
}

export function GradeConfigDialog({
  open,
  onOpenChange,
  config,
  onSuccess,
}: GradeConfigDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!config;

  const form = useForm<GradeConfigFormData>({
    resolver: zodResolver(gradeConfigSchema),
    defaultValues: {
      grade_level: 0,
      grade_name: "",
      grade_emoji: "",
      required_pickups: 0,
      required_weight_kg: 0,
      condition_type: "OR",
      tree_image_url: "",
    },
  });

  // Dialog가 열릴 때마다 form을 config 데이터로 reset
  useEffect(() => {
    if (open && config) {
      // 수정 모드: config 데이터로 form reset
      form.reset({
        grade_level: config.grade_level,
        grade_name: config.grade_name,
        grade_emoji: config.grade_emoji || "",
        required_pickups: config.required_pickups,
        required_weight_kg: config.required_weight_kg,
        condition_type: config.condition_type,
        tree_image_url: config.tree_image_url || "",
      });
    } else if (open && !config) {
      // 추가 모드: 빈 form으로 reset
      form.reset({
        grade_level: 0,
        grade_name: "",
        grade_emoji: "",
        required_pickups: 0,
        required_weight_kg: 0,
        condition_type: "OR",
        tree_image_url: "",
      });
    }
  }, [open, config, form]);

  const onSubmit = async (data: GradeConfigFormData) => {
    setIsSubmitting(true);

    try {
      const url = isEditMode
        ? `/api/admin/hero/config/${config.id}`
        : "/api/admin/hero/config";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          grade_emoji: data.grade_emoji || null,
          tree_image_url: data.tree_image_url || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "등급 설정 저장 실패");
      }

      toast.success(
        isEditMode ? "등급 설정이 수정되었습니다" : "등급 설정이 추가되었습니다"
      );
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving grade config:", error);
      toast.error(
        error instanceof Error ? error.message : "등급 설정 저장 중 오류가 발생했습니다"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "등급 설정 수정" : "등급 설정 추가"}
          </DialogTitle>
          <DialogDescription>
            히어로 등급의 조건과 정보를 설정합니다
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="grade_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>등급 레벨</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      disabled={isEditMode}
                    />
                  </FormControl>
                  <FormDescription>
                    등급의 순서를 나타내는 숫자 (수정 불가)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="grade_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>등급 이름</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="예: 새싹 히어로" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="grade_emoji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이모지</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="예: 🌱" maxLength={4} />
                  </FormControl>
                  <FormDescription>등급을 나타내는 이모지</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="required_pickups"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>필요 픽업 횟수</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="required_weight_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>필요 무게 (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="condition_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>조건 타입</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="조건 타입 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="OR">
                        OR - 픽업 횟수 또는 무게 중 하나만 만족
                      </SelectItem>
                      <SelectItem value="AND">
                        AND - 픽업 횟수와 무게 모두 만족
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    승급 조건 판정 방식
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tree_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>나무 이미지 URL (선택)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  <FormDescription>
                    등급을 나타내는 나무 이미지 URL
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "저장 중..."
                  : isEditMode
                  ? "수정"
                  : "추가"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
