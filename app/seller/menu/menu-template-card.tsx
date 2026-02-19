"use client";

import { useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteMenuTemplate } from "./actions";
import { MenuTemplateForm } from "./menu-template-form";
import type { MenuTemplateData } from "@/services/menu-template";

interface MenuTemplateCardProps {
  template: MenuTemplateData;
  onDeleted: () => void;
  onEdited: () => void;
}

/**
 * 메뉴 템플릿 카드
 */
export function MenuTemplateCard({ template, onDeleted, onEdited }: MenuTemplateCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    const result = await deleteMenuTemplate(template.id);
    
    if (result.success) {
      onDeleted();
    }
    
    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-card">
        {/* 이미지 */}
        <div className="relative aspect-square bg-muted">
          {template.image_url ? (
            <img
              src={template.image_url}
              alt={template.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl">🍽️</span>
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{template.name}</h3>
              <p className="text-sm text-muted-foreground">
                {template.original_price.toLocaleString()}원
              </p>
              {template.weight_value && (
                <p className="text-xs text-muted-foreground">
                  {template.weight_value}{template.weight_unit}
                </p>
              )}
            </div>
            
            {/* 메뉴 버튼 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  수정
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {template.category && template.category !== '기타' && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {template.category}
              </span>
            )}
            {template.is_instant && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                바로 섭취
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 수정 다이얼로그 */}
      <MenuTemplateForm
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={() => {
          onEdited();
          setShowEditDialog(false);
        }}
        template={template}
      />

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메뉴 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{template.name}&rdquo; 메뉴를 삭제하시겠습니까?
              <br />
              삭제 후에는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

