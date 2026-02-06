import { useState } from "react";
import { Notebook } from "@shared/types";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import { cn } from "../../../lib/utils";

// macOS 风格的标签颜色
export const TAG_COLORS = [
  { name: "红色", value: "#FF3B30", label: "Red" },
  { name: "橙色", value: "#FF9500", label: "Orange" },
  { name: "黄色", value: "#FFCC00", label: "Yellow" },
  { name: "绿色", value: "#34C759", label: "Green" },
  { name: "蓝色", value: "#007AFF", label: "Blue" },
  { name: "紫色", value: "#AF52DE", label: "Purple" },
  { name: "灰色", value: "#8E8E93", label: "Gray" },
];

const NOTEBOOK_ICONS = ["📓", "📔", "📕", "📗", "📘", "📙", "📚", "📝", "📄", "📑"];

// 创建笔记本对话框
interface CreateNotebookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string | null;
  onSubmit: (
    name: string,
    description?: string,
    color?: string,
    icon?: string
  ) => void;
}

export function CreateNotebookDialog({
  open,
  onOpenChange,
  parentId,
  onSubmit,
}: CreateNotebookDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState("📓");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(
        name.trim(),
        description.trim() || undefined,
        selectedColor || undefined,
        selectedIcon
      );
      setName("");
      setDescription("");
      setSelectedColor(null);
      setSelectedIcon("📓");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{parentId ? "新建子笔记本" : "新建笔记本"}</DialogTitle>
          <DialogDescription>
            {parentId
              ? "在当前笔记本下创建一个子笔记本"
              : "创建一个新的笔记本来组织你的笔记"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="笔记本名称"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              autoFocus
              maxLength={100}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              描述（可选）
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="笔记本描述"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              maxLength={500}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">图标</label>
            <div className="flex gap-2 flex-wrap">
              {NOTEBOOK_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={cn(
                    "w-10 h-10 text-xl rounded-lg border-2 transition-all cursor-pointer",
                    selectedIcon === icon
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              标记颜色（可选）
            </label>
            <div className="flex gap-2 flex-wrap">
              {TAG_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() =>
                    setSelectedColor(
                      selectedColor === color.value ? null : color.value
                    )
                  }
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all cursor-pointer",
                    selectedColor === color.value
                      ? "border-gray-900 dark:border-gray-100 scale-110"
                      : "border-gray-300 dark:border-gray-600 hover:scale-105"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit">创建</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 编辑笔记本对话框
interface EditNotebookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebook: Notebook;
  onSubmit: (
    name: string,
    description?: string,
    color?: string,
    icon?: string
  ) => void;
}

export function EditNotebookDialog({
  open,
  onOpenChange,
  notebook,
  onSubmit,
}: EditNotebookDialogProps) {
  const [name, setName] = useState(notebook.name);
  const [description, setDescription] = useState(notebook.description || "");
  const [selectedColor, setSelectedColor] = useState<string | null>(
    notebook.color || null
  );
  const [selectedIcon, setSelectedIcon] = useState(notebook.icon || "📓");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(
        name.trim(),
        description.trim() || undefined,
        selectedColor || undefined,
        selectedIcon
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑笔记本</DialogTitle>
          <DialogDescription>
            修改笔记本的名称、描述、图标和标记
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="笔记本名称"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              autoFocus
              maxLength={100}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              描述（可选）
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="笔记本描述"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              maxLength={500}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">图标</label>
            <div className="flex gap-2 flex-wrap">
              {NOTEBOOK_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={cn(
                    "w-10 h-10 text-xl rounded-lg border-2 transition-all cursor-pointer",
                    selectedIcon === icon
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              标记颜色（可选）
            </label>
            <div className="flex gap-2 flex-wrap">
              {TAG_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() =>
                    setSelectedColor(
                      selectedColor === color.value ? null : color.value
                    )
                  }
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all cursor-pointer",
                    selectedColor === color.value
                      ? "border-gray-900 dark:border-gray-100 scale-110"
                      : "border-gray-300 dark:border-gray-600 hover:scale-105"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit">保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
