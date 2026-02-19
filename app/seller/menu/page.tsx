"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MenuTemplateForm } from "./menu-template-form";
import { MenuTemplateCard } from "./menu-template-card";
import { getMenuTemplates } from "./actions";
import type { MenuTemplateData } from "@/services/menu-template";
import { PageHeader } from "@/components/shared/page-header";

/**
 * 메뉴 관리 페이지
 *
 * 사장님이 자주 판매하는 메뉴를 관리합니다.
 */
export default function MenuManagementPage() {
  const [templates, setTemplates] = useState<MenuTemplateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // 메뉴 목록 로드
  const loadTemplates = async () => {
    setIsLoading(true);
    const data = await getMenuTemplates();
    setTemplates(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="메뉴 관리"
        description="자주 판매하는 메뉴를 등록하세요"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            메뉴 추가
          </Button>
        }
      />

      {/* 메뉴 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">메뉴를 불러오는 중...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <span className="text-3xl">🍽️</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">메뉴가 없습니다</h3>
          <p className="text-sm text-muted-foreground mb-4">
            자주 판매하는 메뉴를 등록하면<br />
            할인 상품 등록이 더 쉬워집니다
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            첫 메뉴 추가하기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <MenuTemplateCard
              key={template.id}
              template={template}
              onDeleted={loadTemplates}
              onEdited={loadTemplates}
            />
          ))}
        </div>
      )}

      {/* 메뉴 추가 폼 */}
      <MenuTemplateForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={loadTemplates}
      />
    </div>
  );
}

