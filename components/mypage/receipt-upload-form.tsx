/**
 * @file components/mypage/receipt-upload-form.tsx
 * @description 영수증 업로드 폼 컴포넌트
 * 
 * Client Component (이미지 업로드 처리)
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ReceiptUploadForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일 검증
    if (!file.type.startsWith("image/")) {
      toast({
        title: "오류",
        description: "이미지 파일만 업로드할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    // 파일 크기 검증 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "오류",
        description: "파일 크기는 10MB 이하여야 합니다.",
        variant: "destructive",
      });
      return;
    }

    // 미리보기
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!previewUrl) {
      toast({
        title: "오류",
        description: "영수증 이미지를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // TODO: Supabase Storage에 이미지 업로드 로직
      // 현재는 임시로 base64 데이터를 그대로 사용
      const response = await fetch("/api/user/receipts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: previewUrl, // 실제로는 Storage URL 사용
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "제출 완료!",
          description: result.message || "영수증이 제출되었습니다.",
        });
        setPreviewUrl(null);
        router.refresh();
      } else {
        toast({
          title: "제출 실패",
          description: (result as { success: false; error: string }).error || "영수증 제출에 실패했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Receipt upload error:", error);
      toast({
        title: "오류",
        description: "영수증 제출 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          영수증 제출
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 파일 선택 */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            {previewUrl ? (
              <div className="space-y-3">
                <img
                  src={previewUrl}
                  alt="영수증 미리보기"
                  className="max-h-48 mx-auto rounded"
                />
                <label htmlFor="receipt-file" className="cursor-pointer">
                  <span className="text-sm text-primary hover:underline">
                    다른 이미지 선택
                  </span>
                  <input
                    id="receipt-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
            ) : (
              <label
                htmlFor="receipt-file"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  영수증 이미지를 선택하세요
                </span>
                <span className="text-xs text-muted-foreground">
                  JPG, PNG (최대 10MB)
                </span>
                <input
                  id="receipt-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            )}
          </div>

          {/* 제출 버튼 */}
          <Button
            type="submit"
            className="w-full"
            disabled={isUploading || !previewUrl}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                제출 중...
              </>
            ) : (
              "영수증 제출하기"
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            제출된 영수증은 관리자 확인 후 페이백이 지급됩니다.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
