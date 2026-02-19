"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Save } from "lucide-react";
import { toast } from "sonner";

interface GradeConfig {
  id: number;
  grade_level: number;
  grade_name: string;
  grade_emoji: string | null;
  benefits_json: string[];
  is_active: boolean;
}

interface AppConfig {
  id: number;
  key: string;
  value: string;
  description: string | null;
}

export function BenefitsConfigTab() {
  const [configs, setConfigs] = useState<GradeConfig[]>([]);
  const [appConfigs, setAppConfigs] = useState<AppConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newBenefits, setNewBenefits] = useState<Record<number, string>>({});
  const [editedBenefits, setEditedBenefits] = useState<
    Record<number, string[]>
  >({});
  const [editedAppConfigs, setEditedAppConfigs] = useState<
    Record<string, string>
  >({});

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [configsRes, appConfigsRes] = await Promise.all([
        fetch("/api/admin/hero/config"),
        fetch("/api/admin/hero/app-config"),
      ]);

      if (!configsRes.ok || !appConfigsRes.ok) {
        throw new Error("데이터를 불러오는데 실패했습니다");
      }

      const [configsData, appConfigsData] = await Promise.all([
        configsRes.json(),
        appConfigsRes.json(),
      ]);

      setConfigs(configsData.data || []);
      setAppConfigs(appConfigsData.data || []);

      // Initialize edited benefits
      const initialBenefits: Record<number, string[]> = {};
      (configsData.data || []).forEach((config: GradeConfig) => {
        initialBenefits[config.id] = config.benefits_json || [];
      });
      setEditedBenefits(initialBenefits);

      // Initialize edited app configs
      const initialAppConfigs: Record<string, string> = {};
      (appConfigsData.data || []).forEach((config: AppConfig) => {
        initialAppConfigs[config.key] = config.value;
      });
      setEditedAppConfigs(initialAppConfigs);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("데이터를 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddBenefit = (configId: number) => {
    const newBenefit = newBenefits[configId]?.trim();
    if (!newBenefit) return;

    setEditedBenefits((prev) => ({
      ...prev,
      [configId]: [...(prev[configId] || []), newBenefit],
    }));
    setNewBenefits((prev) => ({ ...prev, [configId]: "" }));
  };

  const handleRemoveBenefit = (configId: number, benefit: string) => {
    setEditedBenefits((prev) => ({
      ...prev,
      [configId]: (prev[configId] || []).filter((b) => b !== benefit),
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Save grade benefits
      const gradeUpdatePromises = configs.map(async (config) => {
        const benefits = editedBenefits[config.id] || [];
        if (
          JSON.stringify(benefits) !== JSON.stringify(config.benefits_json)
        ) {
          const response = await fetch(`/api/admin/hero/config/${config.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ benefits_json: benefits }),
          });

          if (!response.ok) {
            throw new Error(`Failed to update ${config.grade_name}`);
          }
        }
      });

      // Save app configs
      const changedAppConfigs = appConfigs
        .filter(
          (config) => editedAppConfigs[config.key] !== config.value
        )
        .map((config) => ({
          key: config.key,
          value: editedAppConfigs[config.key],
        }));

      const appConfigPromise =
        changedAppConfigs.length > 0
          ? fetch("/api/admin/hero/app-config", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ configs: changedAppConfigs }),
            })
          : Promise.resolve({ ok: true });

      await Promise.all([...gradeUpdatePromises, appConfigPromise]);

      toast.success("혜택 설정이 저장되었습니다");
      fetchData();
    } catch (error) {
      console.error("Error saving benefits:", error);
      toast.error("혜택 설정 저장 중 오류가 발생했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* App Config Settings */}
      <Card>
        <CardHeader>
          <CardTitle>시스템 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {appConfigs.map((config) => (
            <div key={config.key} className="space-y-2">
              <Label htmlFor={config.key}>
                {config.description || config.key}
              </Label>
              <Input
                id={config.key}
                type="number"
                value={editedAppConfigs[config.key] || ""}
                onChange={(e) =>
                  setEditedAppConfigs((prev) => ({
                    ...prev,
                    [config.key]: e.target.value,
                  }))
                }
                placeholder="분 단위"
              />
              <p className="text-sm text-muted-foreground">
                현재 값: {config.value}분
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {/* Grade Benefits */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">등급별 혜택</h2>
          <Button onClick={handleSaveAll} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "저장 중..." : "모두 저장"}
          </Button>
        </div>

        {configs
          .filter((config) => config.is_active)
          .map((config) => (
            <Card key={config.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{config.grade_emoji}</span>
                  <span>{config.grade_name}</span>
                  <Badge variant="outline">레벨 {config.grade_level}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Benefit Tags */}
                <div className="flex flex-wrap gap-2">
                  {(editedBenefits[config.id] || []).map((benefit, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 px-3 py-1"
                    >
                      {benefit}
                      <button
                        onClick={() =>
                          handleRemoveBenefit(config.id, benefit)
                        }
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                {/* Add Benefit Input */}
                <div className="flex gap-2">
                  <Input
                    value={newBenefits[config.id] || ""}
                    onChange={(e) =>
                      setNewBenefits((prev) => ({
                        ...prev,
                        [config.id]: e.target.value,
                      }))
                    }
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddBenefit(config.id);
                      }
                    }}
                    placeholder="혜택 키 입력 (예: early_access_popular)"
                  />
                  <Button
                    onClick={() => handleAddBenefit(config.id)}
                    disabled={!newBenefits[config.id]?.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  현재 혜택 개수: {(editedBenefits[config.id] || []).length}개
                </p>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
