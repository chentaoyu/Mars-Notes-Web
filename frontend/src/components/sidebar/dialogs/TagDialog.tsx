import { useState } from "react";
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
import { TAG_COLORS } from "./NotebookDialogs";

// 创建标签对话框
interface CreateTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, color?: string) => void;
}

export function CreateTagDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateTagDialogProps) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(
    TAG_COLORS[0].value
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), selectedColor || undefined);
      setName("");
      setSelectedColor(TAG_COLORS[0].value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建标签</DialogTitle>
          <DialogDescription>创建一个新的标签来分类你的笔记</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="标签名称"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              autoFocus
              maxLength={50}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">颜色</label>
            <div className="flex gap-2 flex-wrap">
              {TAG_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
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
