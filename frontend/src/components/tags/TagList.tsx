import { useState, useEffect } from "react";
import { Tag } from "@shared/types";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { DeleteConfirmDialog } from "../common/DeleteConfirmDialog";
import { tagApi } from "../../services/api";
import { toast } from "../../hooks/use-toast";

interface TagListProps {
  selectedTagIds?: string[];
  onSelectTags: (tagIds: string[]) => void;
}

export function TagList({ selectedTagIds = [], onSelectTags }: TagListProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const result = await tagApi.getTags();
      if (result.data) {
        setTags(result.data || []);
      }
    } catch (error) {
      console.error("获取标签列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (name: string) => {
    try {
      const result = await tagApi.createTag({ name, color: getRandomColor() });
      if (result.data) {
        setTags([...tags, result.data]);
        setShowCreateForm(false);
        toast({
          title: "创建成功",
          description: "标签已创建",
        });
      }
    } catch (error: any) {
      toast({
        title: "创建失败",
        description: error.response?.data?.error || "创建标签失败",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTag = (tagId: string) => {
    setTagToDelete(tagId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!tagToDelete) return;

    try {
      setIsDeleting(true);
      await tagApi.deleteTag(tagToDelete);
      setTags(tags.filter((tag) => tag.id !== tagToDelete));
      onSelectTags(selectedTagIds.filter((id) => id !== tagToDelete));
      setDeleteDialogOpen(false);
      setTagToDelete(null);
      toast({
        title: "删除成功",
        description: "标签已删除",
      });
    } catch (error: any) {
      toast({
        title: "删除失败",
        description: error.response?.data?.error || "删除标签失败",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onSelectTags(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onSelectTags([...selectedTagIds, tagId]);
    }
  };

  const getRandomColor = () => {
    const colors = [
      "#ef4444", // red
      "#f59e0b", // amber
      "#10b981", // emerald
      "#3b82f6", // blue
      "#8b5cf6", // violet
      "#ec4899", // pink
      "#06b6d4", // cyan
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold">标签</h3>
        <Button
          size="sm"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="text-xs h-7 sm:h-8"
        >
          {showCreateForm ? "取消" : "新建"}
        </Button>
      </div>

      {showCreateForm && (
        <CreateTagForm onSubmit={handleCreateTag} onCancel={() => setShowCreateForm(false)} />
      )}

      {selectedTagIds.length > 0 && (
        <button
          onClick={() => onSelectTags([])}
          className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
        >
          清除筛选
        </button>
      )}

      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {tags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <div key={tag.id} className="group relative inline-flex items-center">
              <button
                onClick={() => handleToggleTag(tag.id)}
                className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
                style={isSelected && tag.color ? { backgroundColor: tag.color } : {}}
              >
                # {tag.name}
                {tag._count && tag._count.notes > 0 && (
                  <span className="ml-1 text-[10px] sm:text-xs opacity-75">
                    ({tag._count.notes})
                  </span>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTag(tag.id);
                }}
                className="absolute -top-1 -right-1 sm:opacity-0 sm:group-hover:opacity-100 bg-red-500 text-white rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center text-[10px] sm:text-xs transition-opacity cursor-pointer"
                title="删除标签"
              >
                ×
              </button>
            </div>
          );
        })}

        {tags.length === 0 && (
          <p className="text-gray-500 text-xs sm:text-sm">
            暂无标签，点击&quot;新建&quot;创建第一个标签
          </p>
        )}
      </div>

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        title="确认删除标签"
        description="确定要删除这个标签吗？此操作无法撤销。"
      />
    </div>
  );
}

interface CreateTagFormProps {
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

function CreateTagForm({ onSubmit, onCancel }: CreateTagFormProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      setName("");
    }
  };

  return (
    <Card className="p-2.5 sm:p-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="标签名称"
          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm dark:bg-gray-800 dark:border-gray-700"
          autoFocus
          maxLength={50}
          required
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="flex-1 text-xs h-7 sm:h-8">
            创建
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCancel}
            className="text-xs h-7 sm:h-8"
          >
            取消
          </Button>
        </div>
      </form>
    </Card>
  );
}

