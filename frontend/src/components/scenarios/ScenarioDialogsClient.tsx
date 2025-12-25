import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useToast } from "../../hooks/use-toast";
import { Plus, Edit, Trash2, MessageSquare } from "lucide-react";
import { scenarioDialogApi } from "../../services/api";

interface ScenarioDialog {
  id: string;
  name: string;
  description?: string | null;
  prompt: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ScenarioFormData {
  name: string;
  description?: string;
  prompt: string;
  enabled: boolean;
  sortOrder: number;
}

export interface ScenarioDialogsClientProps {
  isInDialog?: boolean;
  onCreateButtonRef?: (openCreateDialog: () => void) => void;
}

export function ScenarioDialogsClient({
  isInDialog = false,
  onCreateButtonRef,
}: ScenarioDialogsClientProps) {
  const { toast: showToast } = useToast();
  const [scenarios, setScenarios] = useState<ScenarioDialog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ScenarioFormData>({
    defaultValues: {
      name: "",
      description: "",
      prompt: "",
      enabled: false,
      sortOrder: 0,
    },
  });

  const enabledValue = watch("enabled");

  // 加载场景对话列表
  const fetchScenarios = async () => {
    try {
      const result = await scenarioDialogApi.getScenarioDialogs();
      if (result.data) {
        setScenarios(result.data);
      }
    } catch (error: any) {
      showToast({
        title: "加载失败",
        description: error.message || "加载场景对话时发生错误",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  // 打开新建对话框
  const openCreateDialog = useCallback(() => {
    setEditingId(null);
    reset({
      name: "",
      description: "",
      prompt: "",
      enabled: false,
      sortOrder: scenarios.length,
    });
    setDialogOpen(true);
  }, [scenarios.length, reset]);

  // 暴露打开新建对话框的函数给父组件
  useEffect(() => {
    if (onCreateButtonRef) {
      onCreateButtonRef(openCreateDialog);
    }
  }, [onCreateButtonRef, openCreateDialog]);

  // 打开编辑对话框
  const openEditDialog = (scenario: ScenarioDialog) => {
    setEditingId(scenario.id);
    reset({
      name: scenario.name,
      description: scenario.description || "",
      prompt: scenario.prompt,
      enabled: scenario.enabled,
      sortOrder: scenario.sortOrder,
    });
    setDialogOpen(true);
  };

  // 提交表单
  const onSubmit = async (data: ScenarioFormData) => {
    try {
      if (editingId) {
        await scenarioDialogApi.updateScenarioDialog(editingId, data);
        showToast({
          title: "更新成功",
          description: "场景对话已更新",
        });
      } else {
        await scenarioDialogApi.createScenarioDialog(data);
        showToast({
          title: "创建成功",
          description: "场景对话已创建",
        });
      }

      setDialogOpen(false);
      fetchScenarios();
    } catch (error: any) {
      showToast({
        title: "操作失败",
        description: error.response?.data?.error || error.message || "操作时发生错误",
        variant: "destructive",
      });
    }
  };

  // 切换启用状态
  const toggleEnabled = async (id: string, enabled: boolean) => {
    try {
      await scenarioDialogApi.updateScenarioDialog(id, { enabled });
      showToast({
        title: "更新成功",
        description: enabled ? "场景对话已启用" : "场景对话已禁用",
      });

      // 更新列表
      await fetchScenarios();

      // 如果正在编辑该场景，同步更新表单状态
      if (editingId === id && dialogOpen) {
        setValue("enabled", enabled);
      }
    } catch (error: any) {
      showToast({
        title: "更新失败",
        description: error.response?.data?.error || error.message || "更新时发生错误",
        variant: "destructive",
      });
    }
  };

  // 打开删除确认对话框
  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  // 删除场景对话
  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await scenarioDialogApi.deleteScenarioDialog(deletingId);
      showToast({
        title: "删除成功",
        description: "场景对话已删除",
      });

      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchScenarios();
    } catch (error: any) {
      showToast({
        title: "删除失败",
        description: error.response?.data?.error || error.message || "删除时发生错误",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className={isInDialog ? "p-6" : "container max-w-6xl mx-auto p-4 sm:p-6 lg:p-8"}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={isInDialog ? "p-6" : "container max-w-6xl mx-auto p-4 sm:p-6 lg:p-8"}>
      <div className="space-y-6">
        {/* 标题栏 - 仅在非弹窗模式显示 */}
        {!isInDialog && (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">场景对话管理</h1>
              <p className="text-muted-foreground mt-2">
                管理笔记场景对话，启用后进入笔记时将自动弹出
              </p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              新建场景
            </Button>
          </div>
        )}

        {/* 弹窗模式下的新建按钮 */}
        {isInDialog && (
          <div className="flex justify-end">
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              新建场景
            </Button>
          </div>
        )}

        {/* 场景列表 */}
        {scenarios.length === 0 ? (
          <div className="bg-card border rounded-lg p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">暂无场景对话</h3>
            <p className="text-muted-foreground mb-4">
              创建场景对话，让 AI 在进入笔记时主动与您交流
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              创建第一个场景
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold truncate">{scenario.name}</h3>
                      <Switch
                        checked={scenario.enabled}
                        onCheckedChange={(checked) => toggleEnabled(scenario.id, checked)}
                      />
                    </div>
                    {scenario.description && (
                      <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                    )}
                    <div className="bg-muted rounded p-3 text-sm">
                      <p className="text-muted-foreground mb-1 text-xs font-medium">提示词：</p>
                      <p className="line-clamp-2">{scenario.prompt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(scenario)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(scenario.id)}
                      className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新建/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "编辑场景对话" : "新建场景对话"}</DialogTitle>
            <DialogDescription>配置场景对话的基本信息和提示词</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">场景名称 *</Label>
                <Input
                  id="name"
                  {...register("name", { required: "场景名称不能为空" })}
                  placeholder="例如：笔记助手、学习伙伴"
                  maxLength={100}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">场景描述</Label>
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="简短描述这个场景的用途"
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">提示词 *</Label>
                <Textarea
                  id="prompt"
                  {...register("prompt", { required: "提示词不能为空" })}
                  placeholder="描述 AI 应该如何与用户交流，例如：你是一个友好的笔记助手，当用户进入笔记时，主动询问他们今天想记录什么内容..."
                  rows={6}
                  className="resize-none"
                />
                {errors.prompt && (
                  <p className="text-sm text-destructive">{errors.prompt.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={enabledValue}
                  onCheckedChange={(checked) => setValue("enabled", checked)}
                />
                <Label htmlFor="enabled" className="cursor-pointer">
                  启用此场景对话
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">排序</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  {...register("sortOrder", { valueAsNumber: true })}
                  placeholder="数字越小越靠前"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>确定要删除这个场景对话吗？此操作无法撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
