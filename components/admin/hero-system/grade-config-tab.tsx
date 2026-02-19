"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GradeConfigDialog } from "./grade-config-dialog";

interface GradeConfig {
  id: number;
  grade_level: number;
  grade_name: string;
  grade_emoji: string | null;
  required_pickups: number;
  required_weight_kg: number;
  condition_type: "OR" | "AND";
  benefits_json: string[];
  tree_image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function GradeConfigTab() {
  const [configs, setConfigs] = useState<GradeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<GradeConfig | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<GradeConfig | null>(
    null
  );

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/hero/config");
      if (!response.ok) {
        throw new Error("등급 설정을 불러오는데 실패했습니다");
      }
      const result = await response.json();
      setConfigs(result.data || []);
    } catch (error) {
      console.error("Error fetching configs:", error);
      toast.error("등급 설정을 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleEdit = (config: GradeConfig) => {
    setSelectedConfig(config);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedConfig(null);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!configToDelete) return;

    try {
      const response = await fetch(
        `/api/admin/hero/config/${configToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("등급 설정 삭제에 실패했습니다");
      }

      toast.success("등급 설정이 삭제되었습니다");
      fetchConfigs();
    } catch (error) {
      console.error("Error deleting config:", error);
      toast.error("등급 설정 삭제 중 오류가 발생했습니다");
    } finally {
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
    }
  };

  const handleDelete = (config: GradeConfig) => {
    setConfigToDelete(config);
    setDeleteDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>등급 설정 관리</CardTitle>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          등급 추가
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
        ) : configs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            등록된 등급 설정이 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">레벨</TableHead>
                  <TableHead>이모지</TableHead>
                  <TableHead>등급명</TableHead>
                  <TableHead>픽업 횟수</TableHead>
                  <TableHead>무게 (kg)</TableHead>
                  <TableHead>조건</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">
                      {config.grade_level}
                    </TableCell>
                    <TableCell className="text-2xl">
                      {config.grade_emoji || "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {config.grade_name}
                    </TableCell>
                    <TableCell>{config.required_pickups}</TableCell>
                    <TableCell>{config.required_weight_kg}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          config.condition_type === "AND"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {config.condition_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={config.is_active ? "default" : "destructive"}
                      >
                        {config.is_active ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(config)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(config)}
                        disabled={!config.is_active}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* 등급 설정 Dialog */}
        <GradeConfigDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          config={selectedConfig}
          onSuccess={fetchConfigs}
        />

        {/* 삭제 확인 Dialog */}
        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>등급 설정 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                <span className="font-semibold">
                  {configToDelete?.grade_name}
                </span>{" "}
                등급을 삭제하시겠습니까?
                <br />
                <br />
                <span className="text-destructive">
                  주의: 이 등급을 가진 기존 사용자에게 영향을 줄 수 있습니다.
                </span>
                <br />
                삭제하면 등급이 비활성화되며, 새로운 사용자는 이 등급을 달성할
                수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}>
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
